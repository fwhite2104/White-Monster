'use client'

import { useState, useEffect, useCallback, useMemo, useRef, startTransition } from 'react'
import { DEFAULT_RADIUS_KM } from '@/lib/constants'
import type { Price, Store } from '@/lib/types'

interface UsePriceQueryOptions {
  lat: number
  lng: number
}

interface UsePriceQueryReturn {
  prices: Price[]
  stores: Store[]
  loading: boolean
  error: string | null
  lastUpdated: string | null
  radius: number
  setRadius: (r: number) => void
  sort: string
  setSort: (s: string) => void
  variant: string
  setVariant: (v: string) => void
  packSize: string
  setPackSize: (p: string) => void
  fetchData: (signal?: AbortSignal) => Promise<void>
  storesWithDistance: (Store & { distance: number })[]
  bestPrice: Price | null
  nextBestPrice: Price | null
}

export function usePriceQuery({ lat, lng }: UsePriceQueryOptions): UsePriceQueryReturn {
  const [prices, setPrices] = useState<Price[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [radius, setRadius] = useState(DEFAULT_RADIUS_KM)
  const [sort, setSort] = useState('price')
  const [variant, setVariant] = useState('zero_sugar')
  const [packSize, setPackSize] = useState('all')

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    const [pricesRes, storesRes] = await Promise.all([
      fetch(
        `/api/prices?lat=${lat}&lng=${lng}&radius=${radius}&variant=${variant}&sort=${sort}&pack_size=${packSize}`,
        { signal }
      ),
      fetch(`/api/stores?lat=${lat}&lng=${lng}&radius=${radius}`, { signal }),
    ])

    if (!pricesRes.ok) throw new Error('Failed to fetch prices')
    if (!storesRes.ok) throw new Error('Failed to fetch stores')

    const pricesData = await pricesRes.json()
    const storesData = await storesRes.json()

    setPrices(pricesData.prices || [])
    setStores(storesData.stores || [])

    if ((pricesData.prices || []).length > 0) {
      const scraped = pricesData.prices.find(
        (p: { scraped_at: string | null }) => p.scraped_at != null
      )
      setLastUpdated(scraped?.scraped_at ?? null)
    }
  }, [lat, lng, radius, sort, variant, packSize])

  const onFetchRef = useRef<(signal: AbortSignal) => Promise<void>>(
    null as unknown as (signal: AbortSignal) => Promise<void>
  )

  useEffect(() => {
    onFetchRef.current = async (signal: AbortSignal) => {
      setLoading(true)
      setError(null)
      try {
        await fetchData(signal)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          setError('Request timed out. Please try again.')
        } else {
          setError(err instanceof Error ? err.message : 'Something went wrong')
        }
      } finally {
        setLoading(false)
      }
    }
  }, [fetchData])

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    startTransition(() => {
      onFetchRef.current(controller.signal)
    })
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [fetchData])

  const storesWithDistance = useMemo(
    () =>
      stores.map((s) => {
        const price = prices.find((p) => p.store_id === s.id)
        return { ...s, distance: price?.distance ?? 0 }
      }),
    [stores, prices]
  )

  const bestPrice = prices.length > 0 ? prices[0] : null
  const nextBestPrice = prices.length > 1 ? prices[1] : null

  return {
    prices,
    stores,
    loading,
    error,
    lastUpdated,
    radius,
    setRadius,
    sort,
    setSort,
    variant,
    setVariant,
    packSize,
    setPackSize,
    fetchData,
    storesWithDistance,
    bestPrice,
    nextBestPrice,
  }
}
