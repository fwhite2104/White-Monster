'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useGeolocation } from '@/hooks/use-geolocation'
import { useHasMapRealEstate } from '@/hooks/use-has-map-realestate'
import { CORK_CENTER, DEFAULT_RADIUS_KM } from '@/lib/constants'
import type { Price, Store } from '@/lib/types'
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
import { MapInfoCard } from '@/components/map/MapInfoCard'
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
import dynamic from 'next/dynamic'

const StoreMap = dynamic(() => import('@/components/map/StoreMap'), {
  ssr: false,
  loading: () => <div className="h-[300px] md:h-[400px] w-full bg-muted animate-pulse rounded-lg" />,
})

export default function Home() {
  const geo = useGeolocation()
  const { location, status, locationLabel, requestLocation, setManualLocation } = geo

  const [prices, setPrices] = useState<Price[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [radius, setRadius] = useState(DEFAULT_RADIUS_KM)
  const [sort, setSort] = useState('price')
  const [variant, setVariant] = useState('zero_sugar')
  const [packSize, setPackSize] = useState('all')
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [highlightedStoreId, setHighlightedStoreId] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('list')
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [reportStoreName, setReportStoreName] = useState<string | undefined>(undefined)
  const [reportPromptShown, setReportPromptShown] = useState(false)

  const hasMapRealEstate = useHasMapRealEstate()
  const showMap = hasMapRealEstate || activeTab === 'stores'

  const lat = useMemo(() => Number.isFinite(location?.lat) ? location!.lat : CORK_CENTER.lat, [location?.lat])
  const lng = useMemo(() => Number.isFinite(location?.lng) ? location!.lng : CORK_CENTER.lng, [location?.lng])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    try {
      const [pricesRes, storesRes] = await Promise.all([
        fetch(
          `/api/prices?lat=${lat}&lng=${lng}&radius=${radius}&variant=${variant}&sort=${sort}&pack_size=${packSize}`,
          { signal: controller.signal }
        ),
        fetch(`/api/stores?lat=${lat}&lng=${lng}&radius=${radius}`, {
          signal: controller.signal,
        }),
      ])

      if (!pricesRes.ok) throw new Error('Failed to fetch prices')
      if (!storesRes.ok) throw new Error('Failed to fetch stores')

      const pricesData = await pricesRes.json()
      const storesData = await storesRes.json()

      setPrices(pricesData.prices || [])
      setStores(storesData.stores || [])
      if (pricesData.prices?.length > 0) {
        const scraped = pricesData.prices.find((p: { scraped_at: string | null }) => p.scraped_at != null)
        setLastUpdated(scraped?.scraped_at ?? null)
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Request timed out. Please try again.')
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    } finally {
      clearTimeout(timeout)
      setLoading(false)
    }
  }, [lat, lng, radius, sort, variant, packSize])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  const storesWithDistance = useMemo(() => stores.map((s) => {
    const price = prices.find((p) => p.store_id === s.id)
    return {
      ...s,
      distance: price?.distance ?? 0,
    }
  }), [stores, prices])

  const bestPrice = prices.length > 0 ? prices[0] : null
  const nextBestPrice = prices.length > 1 ? prices[1] : null

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
    setRadius((prev) => Math.min(prev + 10, 50))
  }, [])

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

  const activeFilterCount = [
    sort !== 'price',
    variant !== 'zero_sugar',
    packSize !== 'all',
    radius !== DEFAULT_RADIUS_KM,
  ].filter(Boolean).length

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

      <main id="main-content" className="flex-1 max-w-6xl mx-auto w-full px-4 pt-4 pb-24 md:pb-6 md:pt-6 space-y-4 md:space-y-6">
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

            {!loading && !error && prices.length === 0 && status === 'idle' && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Enable location or search manually to find prices near you.</p>
              </div>
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
              <div className="relative overflow-hidden rounded-lg h-[400px]" aria-label="Store map">
                <MapErrorBoundary>
                  <StoreMap
                    stores={storesWithDistance}
                    userLocation={location ? { lat: location.lat, lng: location.lng } : undefined}
                    highlightedStoreId={highlightedStoreId}
                    cheapestStoreId={bestPrice?.store_id ?? null}
                    onMarkerClick={handleMarkerClick}
                  />
                </MapErrorBoundary>
                {selectedStore && (
                  <div className="absolute bottom-0 left-0 right-0 z-10">
                    <MapInfoCard
                      store={selectedStore}
                      price={selectedStorePrice}
                      isCheapest={isSelectedCheapest}
                      onReportPrice={handleMapInfoReportPrice}
                      onClose={() => setSelectedStore(null)}
                    />
                  </div>
                )}
              </div>
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
                <div className="h-[400px] w-full rounded-lg bg-muted animate-pulse" />
                <LoadingSkeleton variant="card" count={3} />
              </div>
            )}

            {!loading && error && (
              <ApiErrorState message={error} onRetry={fetchData} onReportPrice={() => setShowUploadForm(true)} />
            )}
          </>
        )}

        {!loading && !error && stores.length > 0 && hasMapRealEstate && activeTab !== 'stores' && (
          <div className="relative overflow-hidden rounded-lg h-[400px]" aria-label="Store map">
            <MapErrorBoundary>
              <StoreMap
                stores={storesWithDistance}
                userLocation={location ? { lat: location.lat, lng: location.lng } : undefined}
                highlightedStoreId={highlightedStoreId}
                cheapestStoreId={bestPrice?.store_id ?? null}
                onMarkerClick={handleMarkerClick}
              />
            </MapErrorBoundary>
            {selectedStore && (
              <div className="absolute bottom-0 left-0 right-0 z-10">
                <MapInfoCard
                  store={selectedStore}
                  price={selectedStorePrice}
                  isCheapest={isSelectedCheapest}
                  onReportPrice={handleMapInfoReportPrice}
                  onClose={() => setSelectedStore(null)}
                />
              </div>
            )}
          </div>
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

      {prices.length > 0 && <SavingsBar prices={prices} />}

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
    </div>
  )
}