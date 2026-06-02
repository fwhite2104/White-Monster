'use client'

import { useState, useEffect, useCallback } from 'react'
import { useGeolocation } from '@/hooks/use-geolocation'
import { CORK_CENTER, DEFAULT_RADIUS_KM } from '@/lib/constants'
import type { Price, Store } from '@/lib/types'
import { Header } from '@/components/shared/Header'
import { Footer } from '@/components/shared/Footer'
import { HeroCard } from '@/components/dashboard/HeroCard'
import { FilterDrawer } from '@/components/dashboard/FilterDrawer'
import { PriceList } from '@/components/dashboard/PriceList'
import { PriceChart } from '@/components/dashboard/PriceChart'
import { LoadingSkeleton } from '@/components/dashboard/LoadingSkeleton'
import { LastUpdated } from '@/components/dashboard/LastUpdated'
import { StoreUploadForm } from '@/components/dashboard/StoreUploadForm'
import { LocationBanner } from '@/components/dashboard/LocationBanner'
import { MapToggle } from '@/components/dashboard/MapToggle'
import { StickyBar } from '@/components/dashboard/StickyBar'
import { FirstVisitScreen } from '@/components/dashboard/FirstVisitScreen'
import {
  LocationDeniedState,
  LocationTimeoutState,
  LocationUnavailableState,
  NoResultsState,
  ApiErrorState,
  StaleDataWarning,
} from '@/components/dashboard/StateScreens'
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
  const [showMap, setShowMap] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [highlightedStoreId, setHighlightedStoreId] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const lat = location?.lat ?? CORK_CENTER.lat
  const lng = location?.lng ?? CORK_CENTER.lng

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

  const storesWithDistance = stores.map((s) => {
    const price = prices.find((p) => p.store_id === s.id)
    return {
      ...s,
      distance: price?.distance ?? 0,
    }
  })

  const bestPrice = prices.length > 0 ? prices[0] : null
  const nextBestPrice = prices.length > 1 ? prices[1] : null

  const handleRetryLocation = useCallback(() => {
    requestLocation()
  }, [requestLocation])

  const handleOpenManualSearch = useCallback(() => {
    requestLocation()
  }, [requestLocation])

  const handleExpandRadius = useCallback(() => {
    setRadius((prev) => Math.min(prev + 10, 50))
  }, [])

  const handleResetFilters = useCallback(() => {
    setSort('price')
    setVariant('zero_sugar')
    setPackSize('all')
    setRadius(DEFAULT_RADIUS_KM)
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
        <Header />
        <FirstVisitScreen
          onRequestLocation={requestLocation}
          onManualSearch={handleOpenManualSearch}
        />
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-full flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 pt-4 pb-24 md:pb-6 md:pt-6 space-y-4 md:space-y-6">
        <LocationBanner
          status={status}
          locationLabel={locationLabel}
          onRetry={handleRetryLocation}
          onManualSearch={handleOpenManualSearch}
          onSelectLocation={setManualLocation}
        />

        <FilterDrawer
          sort={sort}
          onSortChange={setSort}
          variant={variant}
          onVariantChange={setVariant}
          packSize={packSize}
          onPackSizeChange={setPackSize}
          radius={radius}
          onRadiusChange={setRadius}
        />

        <StaleDataWarning lastUpdated={lastUpdated} />

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

        {!loading && !error && (
          <HeroCard
            bestPrice={bestPrice}
            nextBestPrice={nextBestPrice}
            totalResults={prices.length}
            userLat={location?.lat}
            userLng={location?.lng}
          />
        )}

        {loading && (
          <div className="space-y-4">
            <LoadingSkeleton variant="hero" />
            <LoadingSkeleton variant="card" count={3} />
          </div>
        )}

        {!loading && error && (
          <ApiErrorState message={error} onRetry={fetchData} />
        )}

        {!loading && !error && prices.length === 0 && status === 'success' && (
          <NoResultsState
            filters={{ variant, packSize, radius }}
            onResetFilters={handleResetFilters}
            onExpandRadius={handleExpandRadius}
          />
        )}

        {!loading && !error && stores.length > 0 && (
          <>
            <div className="md:hidden">
              <MapToggle
                showMap={showMap}
                onToggle={() => setShowMap(!showMap)}
                storeCount={stores.length}
              >
                <StoreMap
                  stores={storesWithDistance}
                  userLocation={location ? { lat: location.lat, lng: location.lng } : undefined}
                  highlightedStoreId={highlightedStoreId}
                />
              </MapToggle>
            </div>
            <div className="hidden md:block" aria-label="Store map">
              <StoreMap
                stores={storesWithDistance}
                userLocation={location ? { lat: location.lat, lng: location.lng } : undefined}
                highlightedStoreId={highlightedStoreId}
              />
            </div>
          </>
        )}

        {!loading && !error && (
          <div className="flex items-center justify-between">
            <LastUpdated date={lastUpdated} />
            <div className="hidden md:block">
              <StoreUploadForm onSuccess={fetchData} />
            </div>
          </div>
        )}

        {!loading && !error && prices.length > 2 && (
          <div className="hidden md:block">
            <PriceChart prices={prices} />
          </div>
        )}

        {!loading && !error && prices.length > 0 && (
          <div aria-label="Price results">
            <PriceList
              prices={prices}
              userLat={location?.lat}
              userLng={location?.lng}
              highlightedStoreId={highlightedStoreId}
              onStoreHover={setHighlightedStoreId}
            />
          </div>
        )}
      </main>

      <Footer />

      <StickyBar
        onReportPrice={() => setShowUploadForm(true)}
        onFilterToggle={() => {}}
        onLocationRequest={requestLocation}
        locationLabel={locationLabel}
        isLocating={status === 'requesting'}
        activeFilterCount={activeFilterCount}
      />

      <StoreUploadForm
        onSuccess={fetchData}
        externalOpen={showUploadForm}
        onExternalOpenChange={setShowUploadForm}
      />
    </div>
  )
}