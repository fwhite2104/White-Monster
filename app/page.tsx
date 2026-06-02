'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { MapPin, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/shared/Header'
import { Footer } from '@/components/shared/Footer'
import { RadiusFilter } from '@/components/dashboard/RadiusFilter'
import { SortControls } from '@/components/dashboard/SortControls'
import { PriceList } from '@/components/dashboard/PriceList'
import { StoreUploadForm } from '@/components/dashboard/StoreUploadForm'
import { LastUpdated } from '@/components/dashboard/LastUpdated'
import { BestDealBanner } from '@/components/dashboard/BestDealBanner'
import { PriceChart } from '@/components/dashboard/PriceChart'
import { LoadingSkeleton } from '@/components/dashboard/LoadingSkeleton'
import StoreMap from '@/components/map'
import { useGeolocation } from '@/hooks/use-geolocation'
import { CORK_CENTER, DEFAULT_RADIUS_KM } from '@/lib/constants'
import type { Price, Store } from '@/lib/types'

export default function Home() {
  const shouldReduceMotion = useReducedMotion()
  const { location, loading: geoLoading, error: geoError, requestLocation } = useGeolocation()
  const [prices, setPrices] = useState<Price[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [radius, setRadius] = useState(DEFAULT_RADIUS_KM)
  const [sort, setSort] = useState('price')
  const [variant, setVariant] = useState('zero_sugar')
  const [packSize, setPackSize] = useState('all')
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
        // radius defaults to DEFAULT_RADIUS_KM (10km) from constants
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
  const maxPrice = prices.length > 0 ? Math.max(...prices.map((p) => Number(p.price))) : 0
  const savings = bestPrice && maxPrice > 0 ? maxPrice - Number(bestPrice.price) : 0

  return (
    <div className="min-h-full flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between" aria-label="Price filters">
          <div className="flex-1 w-full sm:w-auto">
            <RadiusFilter value={radius} onChange={setRadius} />
          </div>
          <SortControls
            sort={sort}
            onSortChange={setSort}
            variant={variant}
            onVariantChange={setVariant}
            packSize={packSize}
            onPackSizeChange={setPackSize}
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

        {!loading && !error && bestPrice && (
          <BestDealBanner
            bestPrice={bestPrice}
            totalPrices={prices.length}
            savings={savings}
          />
        )}

        <div aria-label="Store map">
          <StoreMap
            stores={storesWithDistance}
            userLocation={location}
            highlightedStoreId={highlightedStoreId}
          />
        </div>

        {!loading && !error && prices.length > 2 && (
          <PriceChart prices={prices} />
        )}

        {loading ? (
          <LoadingSkeleton count={4} />
        ) : error ? (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 space-y-4"
          >
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <p className="text-lg font-medium text-destructive">{error}</p>
              <Button variant="outline" onClick={fetchData} className="mt-3">
                Retry
              </Button>
            </div>
          </motion.div>
        ) : (
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
    </div>
  )
}
