'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useGeolocation } from '@/hooks/use-geolocation'
import { useHasMapRealEstate } from '@/hooks/use-has-map-realestate'
import { CORK_CENTER, DEFAULT_RADIUS_KM } from '@/lib/constants'
import type { Price, Store, Product } from '@/lib/types'
import { usePriceQuery } from '@/hooks/use-price-query'
import { Header } from '@/components/shared/Header'
import { Footer } from '@/components/shared/Footer'
import { HeroCard } from '@/components/dashboard/HeroCard'
import { BestDealBanner } from '@/components/dashboard/BestDealBanner'
import { FilterDrawer } from '@/components/dashboard/FilterDrawer'
import { PriceList } from '@/components/dashboard/PriceList'
import { LoadingSkeleton } from '@/components/dashboard/LoadingSkeleton'
import { LastUpdated } from '@/components/dashboard/LastUpdated'
import { StoreUploadForm } from '@/components/dashboard/StoreUploadForm'
import { LocationBanner } from '@/components/dashboard/LocationBanner'
import { ReportPriceCard } from '@/components/dashboard/ReportPriceCard'
import { ItemComparisonView } from '@/components/dashboard/ItemComparisonView'
import { BottomTabNav, type TabKey } from '@/components/dashboard/BottomTabNav'
import { SavingsBar } from '@/components/dashboard/SavingsBar'
import { FirstVisitScreen } from '@/components/dashboard/FirstVisitScreen'
import { MapErrorBoundary } from '@/components/shared/MapErrorBoundary'
import {
  LocationDeniedState,
  LocationTimeoutState,
  LocationUnavailableState,
  NoResultsState,
  ApiErrorState,
  StaleDataWarning,
} from '@/components/dashboard/StateScreens'
import { MapPin } from 'lucide-react'
import { StoreMapBlock } from '@/components/map/StoreMapBlock'
import { ScanButton } from '@/components/dashboard/ScanButton'
import { ScanResult } from '@/components/dashboard/ScanResult'
import { WeeklyDealsBanner } from '@/components/dashboard/WeeklyDealsBanner'

import { AiAssistant } from '@/components/dashboard/AiAssistant'

export default function Home() {
  const geo = useGeolocation()
  const { location, status, locationLabel, requestLocation, setManualLocation } = geo

  const lat = Number.isFinite(location?.lat) ? location!.lat : CORK_CENTER.lat
  const lng = Number.isFinite(location?.lng) ? location!.lng : CORK_CENTER.lng

  const {
    prices, stores, loading, error, lastUpdated,
    radius, setRadius, sort, setSort, variant, setVariant,
    packSize, setPackSize, fetchData,
    storesWithDistance, bestPrice, nextBestPrice,
  } = usePriceQuery({ lat, lng })

  const [showUploadForm, setShowUploadForm] = useState(false)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [highlightedStoreId, setHighlightedStoreId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('list')
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [reportStoreName, setReportStoreName] = useState<string | undefined>(undefined)
  const [reportPromptShown, setReportPromptShown] = useState(false)
  const [scanResult, setScanResult] = useState<{ product: Product; prices: Array<Price & { stores?: Store }> } | null>(null)

  const hasMapRealEstate = useHasMapRealEstate()
  const showMap = hasMapRealEstate || activeTab === 'stores'

  const selectedStorePrice = useMemo(() => {
    if (!selectedStore) return undefined
    const p = prices.find((pr) => pr.store_id === selectedStore.id)
    return p ? Number(p.price) : undefined
  }, [selectedStore, prices])

  const isSelectedCheapest = selectedStore
    ? bestPrice?.store_id === selectedStore.id
    : false

  const handleRetryLocation = useCallback(() => {
    requestLocation()
  }, [requestLocation])

  const handleOpenManualSearch = useCallback(() => {
    requestLocation()
  }, [requestLocation])

  const handleSearchInputRef = useCallback((ref: HTMLInputElement | null) => {
    searchInputRef.current = ref
  }, [])

  useEffect(() => {
    if (activeTab === 'search' && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [activeTab])

  const handleExpandRadius = useCallback(() => {
    setRadius(Math.min(radius + 10, 50))
  }, [radius, setRadius])

  const handleResetFilters = useCallback(() => {
    setSort('price')
    setVariant('zero_sugar')
    setPackSize('all')
    setRadius(DEFAULT_RADIUS_KM)
  }, [])

  const handleMarkerClick = useCallback(
    (storeId: string) => {
      const store = storesWithDistance.find((s) => s.id === storeId)
      if (store) setSelectedStore(store)
    },
    [storesWithDistance],
  )

  const handleMapInfoReportPrice = useCallback(
    (storeId: string) => {
      const store = storesWithDistance.find((s) => s.id === storeId)
      if (store) {
        setReportStoreName(store.name)
        setShowUploadForm(true)
      }
      setSelectedStore(null)
    },
    [storesWithDistance],
  )

  const handleUploadFormOpenChange = useCallback((open: boolean) => {
    setShowUploadForm(open)
    if (!open) {
      setReportStoreName(undefined)
    }
  }, [])

  const activeFilterCount = useMemo(
    () =>
      [
        sort !== 'price',
        variant !== 'zero_sugar',
        packSize !== 'all',
        radius !== DEFAULT_RADIUS_KM,
      ].filter(Boolean).length,
    [sort, variant, packSize, radius],
  )

  if (status === 'idle' && location?.source === 'default') {
    return (
      <div className="min-h-full flex flex-col">
        <Header onReportPrice={() => setShowUploadForm(true)} />
        <FirstVisitScreen
          onRequestLocation={requestLocation}
          onManualSearch={handleOpenManualSearch}
          onReportPrice={() => setShowUploadForm(true)}
        />
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-full flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>

      <Header onReportPrice={() => setShowUploadForm(true)} />

      <main id="main-content" className="flex-1 max-w-7xl mx-auto w-full px-4 pt-4 pb-24 md:pb-6 md:pt-6 space-y-4 md:space-y-6">
        <LocationBanner
          status={status}
          locationLabel={locationLabel}
          onRetry={handleRetryLocation}
          onManualSearch={handleOpenManualSearch}
          onSelectLocation={setManualLocation}
          openManual={activeTab === 'search'}
          onInputRef={handleSearchInputRef}
        />

        {(activeTab === 'list' || activeTab === 'deals') && (
          <FilterDrawer
            sort={sort}
            onSortChange={setSort}
            variant={variant}
            onVariantChange={setVariant}
            packSize={packSize}
            onPackSizeChange={setPackSize}
            radius={radius}
            onRadiusChange={setRadius}
            open={filterDrawerOpen}
            onOpenChange={setFilterDrawerOpen}
          />
        )}

        {(activeTab === 'list' || activeTab === 'deals') && (
          <StaleDataWarning lastUpdated={lastUpdated} onReportPrice={() => setShowUploadForm(true)} />
        )}

        {(activeTab === 'list' || activeTab === 'deals') && (
          <>
            {status === 'denied' && (
              <LocationDeniedState
                onRetry={handleRetryLocation}
                onManualSearch={handleOpenManualSearch}
              />
            )}
            {status === 'timeout' && !loading && (
              <LocationTimeoutState
                onRetry={handleRetryLocation}
                onManualSearch={handleOpenManualSearch}
              />
            )}
            {status === 'unavailable' && !loading && (
              <LocationUnavailableState onManualSearch={handleOpenManualSearch} />
            )}
          </>
        )}

        {activeTab === 'list' && (
          <>
            {!loading && !error && (
              <>
                {bestPrice && nextBestPrice && (Number(nextBestPrice.price) - Number(bestPrice.price)) > 0 && (
                  <BestDealBanner
                    bestPrice={bestPrice}
                    nextBestPrice={nextBestPrice}
                    totalPrices={prices.length}
                  />
                )}
                <HeroCard
                  bestPrice={bestPrice}
                  nextBestPrice={nextBestPrice}
                  totalResults={prices.length}
                  userLat={location?.lat}
                  userLng={location?.lng}
                  onReportPrice={() => setShowUploadForm(true)}
                />
              </>
            )}

            {!loading && !error && prices.length > 0 && (
              <ReportPriceCard onReportPrice={() => setShowUploadForm(true)} variant="desktop" />
            )}

            {!loading && !error && (
              <WeeklyDealsBanner />
            )}

            {loading && (
              <div className="space-y-4">
                <LoadingSkeleton variant="hero" />
                <LoadingSkeleton variant="card" count={3} />
              </div>
            )}

            {!loading && error && (
              <ApiErrorState message={error} onRetry={fetchData} onReportPrice={() => setShowUploadForm(true)} />
            )}

            {!loading && !error && prices.length === 0 && status === 'success' && (
              <NoResultsState
                filters={{ variant, packSize, radius }}
                onResetFilters={handleResetFilters}
                onExpandRadius={handleExpandRadius}
                onReportPrice={() => setShowUploadForm(true)}
              />
            )}

            {!loading && !error && (
              <LastUpdated date={lastUpdated} />
            )}

            {!loading && !error && prices.length > 0 && (
              <div aria-live="polite" aria-atomic="true" aria-label="Price results">
                <PriceList
                  prices={prices}
                  userLat={location?.lat}
                  userLng={location?.lng}
                  highlightedStoreId={highlightedStoreId}
                  onStoreHover={setHighlightedStoreId}
                  onReportPrice={() => setShowUploadForm(true)}
                  reportPromptShown={reportPromptShown}
                  onReportPromptSeen={() => setReportPromptShown(true)}
                />
              </div>
            )}
          </>
        )}

        {activeTab === 'deals' && (
          <>
            {!loading && !error && (
              <>
                {bestPrice && nextBestPrice && (Number(nextBestPrice.price) - Number(bestPrice.price)) > 0 && (
                  <BestDealBanner
                    bestPrice={bestPrice}
                    nextBestPrice={nextBestPrice}
                    totalPrices={prices.length}
                  />
                )}
                <HeroCard
                  bestPrice={bestPrice}
                  nextBestPrice={nextBestPrice}
                  totalResults={prices.length}
                  userLat={location?.lat}
                  userLng={location?.lng}
                  onReportPrice={() => setShowUploadForm(true)}
                />
              </>
            )}

            {loading && (
              <div className="space-y-4">
                <LoadingSkeleton variant="hero" />
                <LoadingSkeleton variant="card" count={3} />
              </div>
            )}

            {!loading && error && (
              <ApiErrorState message={error} onRetry={fetchData} onReportPrice={() => setShowUploadForm(true)} />
            )}

            {!loading && !error && prices.length > 0 && (
              <ItemComparisonView
                prices={prices}
                userLat={location?.lat}
                userLng={location?.lng}
              />
            )}

            {!loading && !error && prices.length === 0 && status === 'success' && (
              <NoResultsState
                filters={{ variant, packSize, radius }}
                onResetFilters={handleResetFilters}
                onExpandRadius={handleExpandRadius}
                onReportPrice={() => setShowUploadForm(true)}
              />
            )}

            {!loading && !error && (
              <LastUpdated date={lastUpdated} />
            )}
          </>
        )}

        {activeTab === 'stores' && (
          <>
            {!loading && !error && stores.length > 0 && (
              <MapErrorBoundary>
                <StoreMapBlock
                  stores={storesWithDistance}
                  userLocation={location ? { lat: location.lat, lng: location.lng } : undefined}
                  highlightedStoreId={highlightedStoreId}
                  onMarkerClick={handleMarkerClick}
                  selectedStore={selectedStore}
                  selectedStorePrice={selectedStorePrice}
                  isSelectedCheapest={isSelectedCheapest}
                  onReportPrice={handleMapInfoReportPrice}
                  onClose={() => setSelectedStore(null)}
                  lat={lat}
                  lng={lng}
                  cheapestStoreId={bestPrice?.store_id ?? null}
                />
              </MapErrorBoundary>
            )}

            {!loading && !error && stores.length > 0 && (
              <a
                href={`https://www.google.com/maps?q=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors min-h-[56px]"
                aria-label={`Open map showing location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`}
              >
                <MapPin className="size-5 shrink-0 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Open in Maps</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {lat.toFixed(4)}, {lng.toFixed(4)}
                  </p>
                </div>
                <svg
                  className="size-4 shrink-0 text-muted-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            )}

            {loading && (
              <div className="space-y-4">
                <LoadingSkeleton variant="hero" />
                <LoadingSkeleton variant="card" count={3} />
              </div>
            )}

            {!loading && error && (
              <ApiErrorState message={error} onRetry={fetchData} onReportPrice={() => setShowUploadForm(true)} />
            )}
          </>
        )}

        {!loading && !error && stores.length > 0 && hasMapRealEstate && activeTab !== 'stores' && (
          <MapErrorBoundary>
            <StoreMapBlock
              stores={storesWithDistance}
              userLocation={location ? { lat: location.lat, lng: location.lng } : undefined}
              highlightedStoreId={highlightedStoreId}
              onMarkerClick={handleMarkerClick}
              selectedStore={selectedStore}
              selectedStorePrice={selectedStorePrice}
              isSelectedCheapest={isSelectedCheapest}
              onReportPrice={handleMapInfoReportPrice}
              onClose={() => setSelectedStore(null)}
              lat={lat}
              lng={lng}
              cheapestStoreId={bestPrice?.store_id ?? null}
            />
          </MapErrorBoundary>
        )}

        {!loading && !error && stores.length > 0 && !showMap && (
          <a
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors min-h-[56px]"
            aria-label={`Open map showing location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`}
          >
            <MapPin className="size-5 shrink-0 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Open in Maps</p>
              <p className="text-xs text-muted-foreground truncate">
                {lat.toFixed(4)}, {lng.toFixed(4)}
              </p>
            </div>
            <svg
              className="size-4 shrink-0 text-muted-foreground"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}
      </main>

      <SavingsBar prices={prices} />

      <Footer />

      <BottomTabNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onReportPrice={() => setShowUploadForm(true)}
        onFilterToggle={() => setFilterDrawerOpen(true)}
        locationLabel={locationLabel}
        isLocating={status === 'requesting'}
        activeFilterCount={activeFilterCount}
      />

      <StoreUploadForm
        onSuccess={fetchData}
        externalOpen={showUploadForm}
        onExternalOpenChange={handleUploadFormOpenChange}
        prefillStoreName={reportStoreName}
      />

      {activeTab !== 'stores' && !scanResult && (
        <ScanButton
          onScanResult={(result) => setScanResult({ product: result.product as Product, prices: result.prices as Array<Price & { stores?: Store }> })}
          userLat={lat}
          userLng={lng}
          radius={radius}
        />
      )}

      {activeTab !== 'stores' && !scanResult && (
        <AiAssistant lat={lat} lng={lng} radius={radius} />
      )}

      {scanResult && (
        <ScanResult
          product={scanResult.product}
          prices={scanResult.prices}
          onClose={() => setScanResult(null)}
        />
      )}
    </div>
  )
}