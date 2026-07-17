"use client"

import { useState } from "react"
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

      <main className="max-w-7xl mx-auto">
        <BestPriceBanner price={bestPrice} />

        <PriceList
          prices={prices}
          loading={loading}
          error={error}
          bestPrice={bestPrice}
          onSelectPrice={setSelectedPrice}
          onRetry={refetch}
        />
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
      />

      <ReportPriceFab onClick={() => setReportOpen(true)} />
    </div>
  )
}
