"use client"

import { useState, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import { Header } from "@/components/app/Header"
import { LocationSection } from "@/components/app/LocationSection"
import { BestPriceBanner } from "@/components/app/BestPriceBanner"
import { FilterBar } from "@/components/app/FilterBar"
import { PriceList } from "@/components/app/PriceList"
import { PriceDetailSheet } from "@/components/app/PriceDetailSheet"
import { ReportPriceModal, ReportPriceFab } from "@/components/app/ReportPriceModal"
import { useGeolocation } from "@/hooks/use-geolocation"
import { usePriceQuery } from "@/hooks/use-price-query"
import { DEFAULT_CENTER } from "@/lib/constants"
import type { Price, StoreMarker } from "@/lib/types"

const StoreMap = dynamic(
  () => import("@/components/map/StoreMapBlock").then((m) => m.StoreMapBlock),
  { ssr: false, loading: () => <div className="h-[300px] md:h-[400px] rounded-xl bg-muted shimmer-bar" /> }
)

export default function HomePage() {
  const { location, setManualLocation } = useGeolocation()

  const userLat = useMemo(() => location?.lat ?? DEFAULT_CENTER.lat, [location?.lat])
  const userLng = useMemo(() => location?.lng ?? DEFAULT_CENTER.lng, [location?.lng])

  const {
    prices,
    nationalSummaries,
    loading,
    error,
    bestPrice,
    refetch,
    radius,
    setRadius,
    sort,
    setSort,
    variant,
    setVariant,
    packSize,
    setPackSize,
  } = usePriceQuery({
    lat: userLat,
    lng: userLng,
  })
  const storeMarkers = useMemo(() => {
    const seen = new Set<string>()
    const markers: StoreMarker[] = []

    for (const p of prices) {
      if (!seen.has(p.store_id) && p.stores?.lat && p.stores?.lng) {
        seen.add(p.store_id)
        markers.push({
          id: p.store_id,
          retailer: p.stores.retailer,
          name: p.stores.name,
          lat: p.stores.lat,
          lng: p.stores.lng,
        })
      }
    }

    for (const s of nationalSummaries) {
      for (const loc of s.store_locations) {
        if (!seen.has(loc.id) && loc.lat !== null && loc.lng !== null) {
          seen.add(loc.id)
          markers.push({
            id: loc.id,
            retailer: s.retailer,
            name: loc.name,
            lat: loc.lat,
            lng: loc.lng,
          })
        }
      }
    }

    return markers
  }, [prices, nationalSummaries])

  const [selectedPrice, setSelectedPrice] = useState<Price | null>(null)
  const [reportOpen, setReportOpen] = useState(false)

  const handleSharePrice = useCallback(async (price: Price) => {
    const storeName = price.stores?.name ?? 'Unknown Store'
    const productName = price.products?.name ?? 'Monster'
    const perCan = price.per_can_price ? ` (€${Number(price.per_can_price).toFixed(2)}/can)` : ''
    const text = `Found ${productName} for €${Number(price.price).toFixed(2)}${perCan} at ${storeName}!`

    if (navigator.share) {
      await navigator.share({ text, url: window.location.href })
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(`${text} ${window.location.href}`)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <LocationSection />

      <FilterBar
        variant={variant}
        setVariant={setVariant}
        packSize={packSize}
        setPackSize={setPackSize}
        sort={sort}
        setSort={setSort}
        radius={radius}
        setRadius={setRadius}
      />

      <main id="main-content" className="max-w-7xl mx-auto px-4">
        <BestPriceBanner price={bestPrice} />

        <PriceList
          prices={prices}
          nationalSummaries={nationalSummaries}
          loading={loading}
          error={error}
          bestPrice={bestPrice}
          onSelectPrice={setSelectedPrice}
          onRetry={refetch}
          onShare={handleSharePrice}
        />

        {!loading && !error && storeMarkers.length > 0 && (
          <section className="pb-4" aria-label="Store locations">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Store locations</h2>
            <StoreMap
              markers={storeMarkers}
              userLat={userLat}
              userLng={userLng}
              radiusKm={radius}
              userAccuracy={location?.accuracy}
              onLocationSelect={setManualLocation}
            />
          </section>
        )}
      </main>

      <PriceDetailSheet
        price={selectedPrice}
        open={!!selectedPrice}
        onClose={() => setSelectedPrice(null)}
        onReportPrice={() => setReportOpen(true)}
      />

      <ReportPriceModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        prefillStoreName={selectedPrice?.stores?.name}
        lat={userLat}
        lng={userLng}
      />

      <ReportPriceFab onClick={() => setReportOpen(true)} />
    </div>
  )
}
