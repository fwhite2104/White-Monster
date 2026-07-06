"use client"

import { useState } from "react"
import { CirclePlus } from "lucide-react"
import { useGeolocation } from "@/hooks/use-geolocation"
import { usePriceQuery } from "@/hooks/use-price-query"
import { Header } from "@/components/app/Header"
import { LocationSection } from "@/components/app/LocationSection"
import { BestDealBanner } from "@/components/app/BestDealBanner"
import { FilterBar } from "@/components/app/FilterBar"
import { PriceList } from "@/components/app/PriceList"
import { PriceDetailView } from "@/components/app/PriceDetailView"
import { ReportPriceModal } from "@/components/app/ReportPriceModal"
import type { Price } from "@/lib/types"

export default function HomePage() {
  const { location } = useGeolocation()
  const {
    prices,
    loading,
    error,
    bestPrice,
    nextBestPrice,
    radius,
    setRadius,
    sort,
    setSort,
    variant,
    setVariant,
    packSize,
    setPackSize,
    refetch,
  } = usePriceQuery({
    lat: location?.lat ?? 51.8985,
    lng: location?.lng ?? -8.4756,
  })

  const [selectedPrice, setSelectedPrice] = useState<Price | null>(null)
  const [reportModalOpen, setReportModalOpen] = useState(false)

  const handleSelectPrice = (price: Price) => {
    setSelectedPrice(price)
  }

  const handleCloseDetail = () => {
    setSelectedPrice(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <LocationSection />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_480px]">
        <div className="flex flex-col">
          {bestPrice && <BestDealBanner bestPrice={bestPrice} nextBestPrice={nextBestPrice} />}

          <FilterBar
            sort={sort}
            setSort={setSort}
            variant={variant}
            setVariant={setVariant}
            packSize={packSize}
            setPackSize={setPackSize}
            radius={radius}
            setRadius={setRadius}
          />

          <PriceList
            prices={prices}
            loading={loading}
            error={error}
            bestPrice={bestPrice}
            onSelectPrice={handleSelectPrice}
            onRetry={refetch}
          />
        </div>

        {/* Desktop detail panel */}
        <div className="hidden lg:block sticky top-0 h-screen overflow-y-auto border-l border-border">
          {selectedPrice ? (
            <PriceDetailView
              price={selectedPrice}
              open={true}
              onClose={handleCloseDetail}
              onReportPrice={() => setReportModalOpen(true)}
              userLat={location?.lat}
              userLng={location?.lng}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-8 text-center">
              Select a price to view details
            </div>
          )}
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setReportModalOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-50 size-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
        aria-label="Report a price"
      >
        <CirclePlus className="size-6" />
      </button>

      <ReportPriceModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        prefillStoreName={selectedPrice?.stores?.name}
      />

      {/* Mobile detail sheet */}
      {selectedPrice && (
        <div className="lg:hidden">
          <PriceDetailView
            price={selectedPrice}
            open={!!selectedPrice}
            onClose={handleCloseDetail}
            onReportPrice={() => setReportModalOpen(true)}
            userLat={location?.lat}
            userLng={location?.lng}
          />
        </div>
      )}
    </div>
  )
}
