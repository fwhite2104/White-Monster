"use client"

import { useState } from "react"
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
import type { Price } from "@/lib/types"

const StoreMap = dynamic(
  () => import("@/components/app/StoreMap").then((m) => m.StoreMap),
  { ssr: false, loading: () => <div className="h-[300px] md:h-[400px] rounded-xl bg-muted shimmer-bar" /> }
)

export default function HomePage() {
  const { location } = useGeolocation()
  const {
    prices,
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
    lat: location?.lat ?? 51.8985,
    lng: location?.lng ?? -8.4756,
  })
  const [selectedPrice, setSelectedPrice] = useState<Price | null>(null)
  const [reportOpen, setReportOpen] = useState(false)

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

      <main className="max-w-7xl mx-auto px-4">
        <BestPriceBanner price={bestPrice} />

        <PriceList
          prices={prices}
          loading={loading}
          error={error}
          bestPrice={bestPrice}
          onSelectPrice={setSelectedPrice}
          onRetry={refetch}
        />

        {!loading && !error && prices.length > 0 && (
          <section className="pb-4" aria-label="Store locations">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Store locations</h2>
            <StoreMap
              prices={prices}
              userLat={location?.lat ?? 51.8985}
              userLng={location?.lng ?? -8.4756}
              radiusKm={radius}
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
        lat={location?.lat ?? 51.8985}
        lng={location?.lng ?? -8.4756}
      />

      <ReportPriceFab onClick={() => setReportOpen(true)} />
    </div>
  )
}
