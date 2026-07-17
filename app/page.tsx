"use client"

import { useState } from "react"
import { Header } from "@/components/app/Header"
import { LocationSection } from "@/components/app/LocationSection"
import { BestPriceBanner } from "@/components/app/BestPriceBanner"
import { PriceList } from "@/components/app/PriceList"
import { useGeolocation } from "@/hooks/use-geolocation"
import { usePriceQuery } from "@/hooks/use-price-query"
import type { Price } from "@/lib/types"

export default function HomePage() {
  const { location } = useGeolocation()
  const { prices, loading, error, bestPrice, refetch } = usePriceQuery({
    lat: location?.lat ?? 51.8985,
    lng: location?.lng ?? -8.4756,
  })
  const [selectedPrice, setSelectedPrice] = useState<Price | null>(null)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <LocationSection />

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
    </div>
  )
}
