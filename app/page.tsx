'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useGeolocation } from '@/hooks/use-geolocation'
import { CORK_CENTER, DEFAULT_FILTERS } from '@/lib/constants'
import type { Store } from '@/lib/types'
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
import { DataFreshnessBanner } from '@/components/dashboard/DataFreshnessBanner'
import { ReportPriceCard } from '@/components/dashboard/ReportPriceCard'
import { ItemComparisonView } from '@/components/dashboard/ItemComparisonView'
import { BottomTabNav, type TabKey } from '@/components/dashboard/BottomTabNav'

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
import { WeeklyDealsBanner } from '@/components/dashboard/WeeklyDealsBanner'
import { Card } from '@/components/ui/card'

export default function Home() {
  const geo = useGeolocation()
  const { location, status, locationLabel, requestLocation, setManualLocation } = geo

  const lat = Number.isFinite(location?.lat) ? location!.lat : CORK_CENTER.lat
  const lng = Number.isFinite(location?.lng) ? location!.lng : CORK_CENTER.lng

  const {
    prices, stores, loading, error, lastUpdated,
    radius, setRadius, sort, setSort, variant, setVariant,
    packSize, setPackSize, refetch,
    storesWithDistance, bestPrice, nextBestPrice, maxSavings,
    freshnessStatus, freshnessTimeAgo,
  } = usePriceQuery({ lat, lng })

  const [showUploadForm, setShowUploadForm] = useState(false)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [highlightedStoreId, setHighlightedStoreId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('list')
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [reportStoreName, setReportStoreName] = useState<string | undefined>(undefined)
  const [reportPromptShown, setReportPromptShown] = useState(false)
  const [firstVisitDismissed, setFirstVisitDismissed] = useState(false)

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
    setFirstVisitDismissed(true)
    setActiveTab('search')
  }, [])

  const handleSearchInputRef = useCallback((ref: HTMLInputElement | null) => {
    searchInputRef.current = ref
  }, [])

  const handleSelectLocation = useCallback(
    (lat: number, lng: number, label: string) => {
      setManualLocation(lat, lng, label)
      setActiveTab('list')
    },
    [setManualLocation],
  )

  useEffect(() => {
    if (activeTab !== 'search') return
    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const handler = () => {
      if (mediaQuery.matches && searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }
    // Initial check
    if (mediaQuery.matches && searchInputRef.current) {
      searchInputRef.current.focus()
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [activeTab])

  const handleExpandRadius = useCallback(() => {
    setRadius(Math.min(radius + 10, 50))
  }, [radius, setRadius])

  const handleResetFilters = useCallback(() => {
    setSort(DEFAULT_FILTERS.sort)
    setVariant(DEFAULT_FILTERS.variant)
    setPackSize(DEFAULT_FILTERS.packSize)
    setRadius(DEFAULT_FILTERS.radius)
  }, [setSort, setVariant, setPackSize, setRadius])

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
          onManualSearch={handleOpenManualSearch}
          onReportPrice={() => setShowUploadForm(true)}
        />
        <Footer />
      </div>
    )
  }

  const mapContent = (stores.length > 0 || loading) && (
    <aside className="hidden lg:block lg:col-span-5 xl:col-span-4 h-full">
      <div className="sticky top-20 h-[calc(100vh-6rem)]">
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
      </div>
    </aside>
  )

  return (
    <div className="min-h-full flex flex-col">
      <Header onReportPrice={() => setShowUploadForm(true)} />

      <main
        id="main-content"
        className="flex-1 max-w-7xl mx-auto w-full px-4 pt-4 pb-24 md:pb-6 md:pt-6"
      >
        <LocationBanner
          status={status}
          locationLabel={locationLabel}
          onRetry={handleRetryLocation}
          onManualSearch={handleOpenManualSearch}
          onSelectLocation={handleSelectLocation}
          openManual={activeTab === 'search'}
          onInputRef={handleSearchInputRef}
        />

        {location?.source === 'default' && (
          <div className="rounded-xl bg-muted/40 border border-border px-4 py-2.5 flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            Showing prices near Cork city center — results may not reflect your location
            <button
              onClick={handleOpenManualSearch}
              className="text-primary hover:underline ml-1"
            >
              Set location
            </button>
          </div>
        )}

        <DataFreshnessBanner status={freshnessStatus} timeAgo={freshnessTimeAgo} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          <div className="lg:col-span-7 xl:col-span-8 space-y-4 md:space-y-6">
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

            {(activeTab === 'list' || activeTab === 'deals') && prices.length === 0 && (
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
              <div role="tabpanel" id="tabpanel-list" aria-labelledby="tab-list">
                {!loading && !error && (
                  <>
                    {bestPrice && nextBestPrice && (Number(nextBestPrice.price) - Number(bestPrice.price)) > 0 && (
                      <BestDealBanner
                        bestPrice={bestPrice}
                        nextBestPrice={nextBestPrice}
                        totalPrices={prices.length}
                        maxSavings={maxSavings}
                      />
                    )}
                    <HeroCard
                      bestPrice={bestPrice}
                      nextBestPrice={nextBestPrice}
                      totalResults={prices.length}
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
                  <ApiErrorState message={error} onRetry={refetch} onReportPrice={() => setShowUploadForm(true)} />
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
                      onWidenRadius={handleExpandRadius}
                      reportPromptShown={reportPromptShown}
                      onReportPromptSeen={() => setReportPromptShown(true)}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'deals' && (
              <div role="tabpanel" id="tabpanel-deals" aria-labelledby="tab-deals">
                {!loading && !error && (
                  <>
                    {bestPrice && nextBestPrice && (Number(nextBestPrice.price) - Number(bestPrice.price)) > 0 && (
                      <BestDealBanner
                        bestPrice={bestPrice}
                        nextBestPrice={nextBestPrice}
                        totalPrices={prices.length}
                        maxSavings={maxSavings}
                      />
                    )}
                    <HeroCard
                      bestPrice={bestPrice}
                      nextBestPrice={nextBestPrice}
                      totalResults={prices.length}
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
                  <ApiErrorState message={error} onRetry={refetch} onReportPrice={() => setShowUploadForm(true)} />
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
              </div>
            )}

            {activeTab === 'stores' && (
              <div role="tabpanel" id="tabpanel-stores" aria-labelledby="tab-stores">
                {loading && (
                  <div className="space-y-4">
                    <LoadingSkeleton variant="hero" />
                    <LoadingSkeleton variant="card" count={3} />
                  </div>
                )}

                {!loading && error && (
                  <ApiErrorState message={error} onRetry={refetch} onReportPrice={() => setShowUploadForm(true)} />
                )}

                {!loading && !error && stores.length === 0 && (
                  <NoResultsState
                    filters={{ variant, packSize, radius }}
                    onResetFilters={handleResetFilters}
                    onExpandRadius={handleExpandRadius}
                    onReportPrice={() => setShowUploadForm(true)}
                  />
                )}

                {!loading && !error && stores.length > 0 && (
                  <div className="space-y-3">
                    {stores.slice(0, 10).map((store) => (
                      <Card key={store.id} className="bg-card ring-1 ring-foreground/8 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{store.name}</p>
                            {store.suburb && <p className="text-xs text-muted-foreground">{store.suburb}</p>}
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums capitalize">
                            {store.retailer}
                          </span>
                        </div>
                      </Card>
                    ))}
                    {stores.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{stores.length - 10} more stores
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {mapContent}
        </div>

        {!loading && !error && stores.length > 0 && (
          <div className="lg:hidden mt-4 space-y-3">
            {(activeTab === 'stores' || activeTab === 'list' || activeTab === 'deals') && (
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
            {(activeTab !== 'stores' && activeTab !== 'list' && activeTab !== 'deals') && (
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
          </div>
        )}
      </main>

      <Footer />

      <BottomTabNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onReportPrice={() => setShowUploadForm(true)}
        onFilterToggle={() => setFilterDrawerOpen(true)}
        isLocating={status === 'requesting'}
        activeFilterCount={activeFilterCount}
      />

      <StoreUploadForm
        onSuccess={refetch}
        externalOpen={showUploadForm}
        onExternalOpenChange={handleUploadFormOpenChange}
        prefillStoreName={reportStoreName}
      />
    </div>
  )
}
