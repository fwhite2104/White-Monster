'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useGeolocation } from '@/hooks/use-geolocation'
import { useHasMapRealEstate } from '@/hooks/use-has-map-realestate'
import { CORK_CENTER, DEFAULT_RADIUS_KM, getRetailerColor } from '@/lib/constants'
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
import { ReportPriceCard } from '@/components/dashboard/ReportPriceCard'
import { ItemComparisonView } from '@/components/dashboard/ItemComparisonView'
import { BottomTabNav, type TabKey } from '@/components/dashboard/BottomTabNav'
import { SavingsBar } from '@/components/dashboard/SavingsBar'
import { FirstVisitScreen } from '@/components/dashboard/FirstVisitScreen'
import { StoreMapBlock } from '@/components/map/StoreMapBlock'
import {
  LocationDeniedState,
  LocationTimeoutState,
  LocationUnavailableState,
  NoResultsState,
  ApiErrorState,
  StaleDataWarning,
} from '@/components/dashboard/StateScreens'
import { formatDistance } from '@/lib/geo'

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

  const lat = Number.isFinite(location?.lat) ? location!.lat : CORK_CENTER.lat
  const lng = Number.isFinite(location?.lng) ? location!.lng : CORK_CENTER.lng

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
    fetchData()
  }, [fetchData])

  const storesWithDistance = stores.map((s) => {
    const price = prices.find((p) => p.store_id === s.id)
    return {
      ...s,
      distance: price?.distance ?? 0,
    }
  })

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
    setActiveTab('search')
  }, [])

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

        {(activeTab === 'list' || activeTab === 'deals') && (
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

            {activeTab === 'list' && !loading && !error && prices.length > 0 && (
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

            {!loading && !error && (
              <LastUpdated date={lastUpdated} />
            )}

            {activeTab === 'list' && !loading && !error && prices.length > 0 && (
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

            {activeTab === 'deals' && !loading && !error && prices.length > 0 && (
              <ItemComparisonView
                prices={prices}
                userLat={location?.lat}
                userLng={location?.lng}
              />
            )}
          </>
        )}

        {activeTab === 'stores' && (
          <>
            {!loading && !error && stores.length > 0 && (
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
              />
            )}

            {!loading && !error && storesWithDistance.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground px-1">
                  Stores ({storesWithDistance.length})
                </h3>
                <div className="space-y-1">
                  {storesWithDistance.map((store) => {
                    const price = prices.find((p) => p.store_id === store.id)
                    const isHighlighted = highlightedStoreId === store.id
                    return (
                      <button
                        key={store.id}
                        type="button"
                        onClick={() => handleMarkerClick(store.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                          isHighlighted
                            ? 'bg-primary/10 ring-1 ring-primary/30'
                            : 'bg-card/50 hover:bg-card/80 ring-1 ring-foreground/5'
                        }`}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: getRetailerColor(store.retailer) }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {store.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {store.suburb || store.retailer}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          {price && (
                            <p className="text-sm font-semibold text-foreground">
                              €{Number(price.price).toFixed(2)}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatDistance(store.distance)}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
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
          />
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
    </div>
  )
}