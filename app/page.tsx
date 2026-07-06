'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { useGeolocation } from '@/hooks/use-geolocation'
import { CORK_CENTER, DEFAULT_FILTERS } from '@/lib/constants'
import type { Price } from '@/lib/types'
import { usePriceQuery } from '@/hooks/use-price-query'
import { Header } from '@/components/shared/Header'
import { Footer } from '@/components/shared/Footer'
import { BestDealSlimBanner } from '@/components/dashboard/BestDealSlimBanner'
import { FilterBar } from '@/components/dashboard/FilterBar'
import { PriceDetailPanel } from '@/components/dashboard/PriceDetailPanel'
import { PriceList } from '@/components/dashboard/PriceList'
import { LoadingSkeleton } from '@/components/dashboard/LoadingSkeleton'
import { LastUpdated } from '@/components/dashboard/LastUpdated'
import { StoreUploadForm } from '@/components/dashboard/StoreUploadForm'
import { LocationBanner } from '@/components/dashboard/LocationBanner'
import { DataFreshnessBanner } from '@/components/dashboard/DataFreshnessBanner'
import { ReportPriceCard } from '@/components/dashboard/ReportPriceCard'

import { FirstVisitScreen } from '@/components/dashboard/FirstVisitScreen'
import {
  LocationDeniedState,
  LocationTimeoutState,
  LocationUnavailableState,
  NoResultsState,
  ApiErrorState,
  StaleDataWarning,
} from '@/components/dashboard/StateScreens'
import { MapPin } from 'lucide-react'

export default function Home() {
  const geo = useGeolocation()
  const { location, status, locationLabel, requestLocation, setManualLocation } = geo

  const lat = Number.isFinite(location?.lat) ? location!.lat : CORK_CENTER.lat
  const lng = Number.isFinite(location?.lng) ? location!.lng : CORK_CENTER.lng

  const {
    prices, loading, error, lastUpdated,
    radius, setRadius, sort, setSort, variant, setVariant,
    packSize, setPackSize, refetch,
    bestPrice, nextBestPrice,
    freshnessStatus, freshnessTimeAgo,
  } = usePriceQuery({ lat, lng })

  const [showUploadForm, setShowUploadForm] = useState(false)
  const [selectedPrice, setSelectedPrice] = useState<Price | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [reportStoreName, setReportStoreName] = useState<string | undefined>(undefined)
  const [reportPromptShown, setReportPromptShown] = useState(false)
  const [firstVisitDismissed, setFirstVisitDismissed] = useState(false)

  const handleRetryLocation = useCallback(() => {
    requestLocation()
  }, [requestLocation])

  const handleSearchInputRef = useCallback((ref: HTMLInputElement | null) => {
    searchInputRef.current = ref
  }, [])

  const handleExpandRadius = useCallback(() => {
    setRadius(Math.min(radius + 10, 50))
  }, [radius, setRadius])

  const handleResetFilters = useCallback(() => {
    setSort(DEFAULT_FILTERS.sort)
    setVariant(DEFAULT_FILTERS.variant)
    setPackSize(DEFAULT_FILTERS.packSize)
    setRadius(DEFAULT_FILTERS.radius)
  }, [setSort, setVariant, setPackSize, setRadius])

  const handlePriceClick = useCallback((price: Price) => {
    setSelectedPrice(price)
  }, [])

  const handleUploadFormOpenChange = useCallback((open: boolean) => {
    setShowUploadForm(open)
    if (!open) {
      setReportStoreName(undefined)
    }
  }, [])

  const activeFilterCount = useMemo(
    () =>
      [
        sort !== DEFAULT_FILTERS.sort,
        variant !== DEFAULT_FILTERS.variant,
        packSize !== DEFAULT_FILTERS.packSize,
        radius !== DEFAULT_FILTERS.radius,
      ].filter(Boolean).length,
    [sort, variant, packSize, radius],
  )

  if (status === 'idle' && location?.source === 'default' && !firstVisitDismissed) {
    return (
      <div className="min-h-full flex flex-col">
        <Header onReportPrice={() => setShowUploadForm(true)} />
        <FirstVisitScreen
          onRequestLocation={requestLocation}
          onManualSearch={() => setFirstVisitDismissed(true)}
          onReportPrice={() => setShowUploadForm(true)}
        />
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-full flex flex-col">
      <Header onReportPrice={() => setShowUploadForm(true)} />

      <main
        id="main-content"
        className="flex-1 max-w-7xl mx-auto w-full px-4 pt-4 pb-24 lg:pb-6 lg:pt-6 space-y-3"
      >
        {/* Location */}
        <LocationBanner
          status={status}
          locationLabel={locationLabel}
          onRetry={handleRetryLocation}
          onManualSearch={() => setFirstVisitDismissed(true)}
          onSelectLocation={(lat, lng, label) => {
            setManualLocation(lat, lng, label)
          }}
          openManual={false}
          onInputRef={handleSearchInputRef}
        />

        {/* Default location warning */}
        {location?.source === 'default' && (
          <div className="rounded-xl bg-muted/40 border border-border px-4 py-2.5 flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            Showing prices near Cork city center — results may not reflect your location
            <button onClick={() => setFirstVisitDismissed(true)} className="text-primary hover:underline ml-1">
              Set location
            </button>
          </div>
        )}

        <DataFreshnessBanner status={freshnessStatus} timeAgo={freshnessTimeAgo} />

        {/* Slim best deal banner */}
        {bestPrice && !loading && !error && (
          <BestDealSlimBanner bestPrice={bestPrice} nextBestPrice={nextBestPrice} />
        )}

        {/* Inline filter bar */}
        <FilterBar
          sort={sort}
          onSortChange={setSort}
          variant={variant}
          onVariantChange={setVariant}
          packSize={packSize}
          onPackSizeChange={setPackSize}
          radius={radius}
          onRadiusChange={setRadius}
          activeFilterCount={activeFilterCount}
          onReset={handleResetFilters}
        />

        {/* Stale data warning */}
        {!loading && !error && <StaleDataWarning lastUpdated={lastUpdated} onReportPrice={() => setShowUploadForm(true)} />}

        {/* Empty / error states */}
        {prices.length === 0 && !loading && (
          <>
            {status === 'denied' && <LocationDeniedState onRetry={handleRetryLocation} onManualSearch={() => setFirstVisitDismissed(true)} />}
            {status === 'timeout' && !loading && <LocationTimeoutState onRetry={handleRetryLocation} onManualSearch={() => setFirstVisitDismissed(true)} />}
            {status === 'unavailable' && !loading && <LocationUnavailableState onManualSearch={() => setFirstVisitDismissed(true)} />}
            {status === 'success' && <NoResultsState filters={{ variant, packSize, radius }} onResetFilters={handleResetFilters} onExpandRadius={handleExpandRadius} onReportPrice={() => setShowUploadForm(true)} />}
          </>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            <LoadingSkeleton variant="hero" />
            <LoadingSkeleton variant="card" count={3} />
          </div>
        )}

        {/* Error */}
        {!loading && error && <ApiErrorState message={error} onRetry={refetch} onReportPrice={() => setShowUploadForm(true)} />}

        {/* Price list — desktop: lg:grid with detail panel | mobile: single col + panel */}
        {!loading && !error && prices.length > 0 && (
          <>
            {/* Mobile: report price card */}
            <ReportPriceCard onReportPrice={() => setShowUploadForm(true)} variant="desktop" />

            <div className="lg:grid lg:grid-cols-12 lg:gap-6">
              {/* Price list — full width on mobile, 8 cols on desktop */}
              <div className="lg:col-span-8 space-y-3">
                <div aria-live="polite" aria-atomic="true" aria-label="Price results">
                  <PriceList
                    prices={prices}
                    userLat={location?.lat}
                    userLng={location?.lng}
                    highlightedStoreId={null}
                    onStoreHover={() => {}}
                    onStoreClick={handlePriceClick}
                    onReportPrice={() => setShowUploadForm(true)}
                    onWidenRadius={handleExpandRadius}
                    reportPromptShown={reportPromptShown}
                    onReportPromptSeen={() => setReportPromptShown(true)}
                  />
                </div>
                <LastUpdated date={lastUpdated} />
              </div>

              {/* Detail panel — 4 cols desktop only */}
              <div className="hidden lg:block lg:col-span-4">
                <div className="sticky top-20">
                  <PriceDetailPanel
                    price={selectedPrice}
                    userLat={location?.lat}
                    userLng={location?.lng}
                    open={!!selectedPrice}
                    onClose={() => setSelectedPrice(null)}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />

      {/* Mobile detail panel — slide-over */}
      {!loading && !error && prices.length > 0 && (
        <PriceDetailPanel
          price={selectedPrice}
          userLat={location?.lat}
          userLng={location?.lng}
          open={!!selectedPrice}
          onClose={() => setSelectedPrice(null)}
        />
      )}

      <StoreUploadForm
        onSuccess={refetch}
        externalOpen={showUploadForm}
        onExternalOpenChange={handleUploadFormOpenChange}
        prefillStoreName={reportStoreName}
      />
    </div>
  )
}
