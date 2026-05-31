'use client'

import { useState, useEffect, useCallback } from 'react'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/shared/Header'
import { Footer } from '@/components/shared/Footer'
import { RadiusFilter } from '@/components/dashboard/RadiusFilter'
import { SortControls } from '@/components/dashboard/SortControls'
import { PriceList } from '@/components/dashboard/PriceList'
import { StoreUploadForm } from '@/components/dashboard/StoreUploadForm'
import { LastUpdated } from '@/components/dashboard/LastUpdated'
import StoreMap from '@/components/map'
import { useGeolocation } from '@/hooks/use-geolocation'
import { CORK_CENTER, DEFAULT_RADIUS_KM } from '@/lib/constants'
import type { Price, Store } from '@/lib/types'

export default function Home() {
  const { location, loading: geoLoading, error: geoError, requestLocation } = useGeolocation()
  const [prices, setPrices] = useState<Price[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [radius, setRadius] = useState(DEFAULT_RADIUS_KM)
  const [sort, setSort] = useState('price')
  const [variant, setVariant] = useState('zero_sugar')
  const [highlightedStoreId, setHighlightedStoreId] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const lat = location?.lat ?? CORK_CENTER.lat
  const lng = location?.lng ?? CORK_CENTER.lng

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [pricesRes, storesRes] = await Promise.all([
        fetch(
          `/api/prices?lat=${lat}&lng=${lng}&radius=${radius}&variant=${variant}&sort=${sort}`
        ),
        fetch(`/api/stores?lat=${lat}&lng=${lng}&radius=${radius}`),
      ])

      if (!pricesRes.ok) throw new Error('Failed to fetch prices')
      if (!storesRes.ok) throw new Error('Failed to fetch stores')

      const pricesData = await pricesRes.json()
      const storesData = await storesRes.json()

      setPrices(pricesData.prices || [])
      setStores(storesData.stores || [])
      if (pricesData.prices?.length > 0) {
        setLastUpdated(pricesData.prices[0].scraped_at)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [lat, lng, radius, sort, variant])

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

  return (
    <div className="min-h-full flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 w-full sm:w-auto">
            <RadiusFilter value={radius} onChange={setRadius} />
          </div>
          <SortControls
            sort={sort}
            onSortChange={setSort}
            variant={variant}
            onVariantChange={setVariant}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={requestLocation}
            disabled={geoLoading}
          >
            <MapPin className="h-4 w-4 mr-1" />
            {geoLoading ? 'Locating...' : location ? 'Update Location' : 'Use My Location'}
          </Button>
          {geoError && <span className="text-xs text-destructive">{geoError}</span>}
          {location && (
            <span className="text-xs text-muted-foreground">
              {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </span>
          )}
          <div className="ml-auto flex items-center gap-3">
            <LastUpdated date={lastUpdated} />
            <StoreUploadForm onSuccess={fetchData} />
          </div>
        </div>

        <StoreMap
          stores={storesWithDistance}
          userLocation={location}
          highlightedStoreId={highlightedStoreId}
        />

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">
            <p>{error}</p>
            <Button variant="outline" onClick={fetchData} className="mt-3">
              Retry
            </Button>
          </div>
        ) : (
          <PriceList
            prices={prices}
            userLat={location?.lat}
            userLng={location?.lng}
            highlightedStoreId={highlightedStoreId}
            onStoreHover={setHighlightedStoreId}
          />
        )}
      </main>

      <Footer />
    </div>
  )
}
