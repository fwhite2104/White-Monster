'use client'

import { useState, useEffect, useCallback, useMemo, useRef, startTransition } from 'react'
import { DEFAULT_RADIUS_KM } from '@/lib/constants'
import { getTimeAgo } from '@/lib/geo'
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
  freshnessStatus: 'fresh' | 'stale' | 'outdated'
  freshnessTimeAgo: string
  radius: number
  setRadius: (r: number) => void
  sort: string
  setSort: (s: string) => void
  variant: string
  setVariant: (v: string) => void
  packSize: string
  setPackSize: (p: string) => void
  refetch: () => Promise<void>
  storesWithDistance: (Store & { distance: number })[]
  bestPrice: Price | null
  nextBestPrice: Price | null
  maxSavings: { amount: number; packSize: string } | null
}

export function usePriceQuery({ lat, lng }: UsePriceQueryOptions): UsePriceQueryReturn {
  const [prices, setPrices] = useState<Price[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [freshnessStatus, setFreshnessStatus] = useState<'fresh' | 'stale' | 'outdated'>('fresh')
  const [freshnessTimeAgo, setFreshnessTimeAgo] = useState('')
  const [radius, setRadius] = useState(DEFAULT_RADIUS_KM)
  const [sort, setSort] = useState('price')
  const [variant, setVariant] = useState('zero_sugar')
  const [packSize, setPackSize] = useState('4_pack')

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

    const scrapedAt = pricesData.meta?.last_scraped_at ?? null
    setLastUpdated(scrapedAt)

    if (scrapedAt) {
      const hours = (Date.now() - new Date(scrapedAt).getTime()) / (1000 * 60 * 60)
      if (hours >= 168) {
        setFreshnessStatus('outdated')
        setFreshnessTimeAgo(getTimeAgo(scrapedAt))
      } else if (hours >= 48) {
        setFreshnessStatus('stale')
        setFreshnessTimeAgo(getTimeAgo(scrapedAt))
      } else {
        setFreshnessStatus('fresh')
        setFreshnessTimeAgo('')
      }
    } else {
      setFreshnessStatus('fresh')
      setFreshnessTimeAgo('')
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

  // Safe manual refetch — manages loading/error state and never throws,
  // unlike raw fetchData (used by retry buttons and post-submit refresh)
  const refetch = useCallback(async () => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    try {
      await onFetchRef.current(controller.signal)
    } finally {
      clearTimeout(timer)
    }
  }, [])

  const storesWithDistance = useMemo(
    () =>
      stores.map((s) => {
        const price = prices.find((p) => p.store_id === s.id)
        return { ...s, distance: price?.distance ?? 0 }
      }),
    [stores, prices]
  )

  // Cheapest prices regardless of the active sort order (sort may be distance/name)
  const pricesByPrice = useMemo(
    () => [...prices].sort((a, b) => Number(a.price) - Number(b.price)),
    [prices]
  )
  const bestPrice = pricesByPrice.length > 0 ? pricesByPrice[0] : null
  const nextBestPrice = pricesByPrice.length > 1 ? pricesByPrice[1] : null

  const maxSavings = useMemo(() => {
    if (pricesByPrice.length < 2) return null
    const byPack = new Map<string, Price[]>()
    for (const p of pricesByPrice) {
      const ps = p.products?.pack_size ?? 'single'
      const list = byPack.get(ps) ?? []
      list.push(p)
      byPack.set(ps, list)
    }
    let best: { amount: number; packSize: string } | null = null
    for (const [ps, list] of byPack) {
      if (list.length < 2) continue
      const cheapest = Number(list[0].price)
      const mostExpensive = Number(list[list.length - 1].price)
      const diff = mostExpensive - cheapest
      if (diff > 0 && (!best || diff > best.amount)) {
        best = { amount: diff, packSize: ps }
      }
    }
    return best
  }, [pricesByPrice])

  return {
    prices,
    stores,
    loading,
    error,
    lastUpdated,
    freshnessStatus,
    freshnessTimeAgo,
    radius,
    setRadius,
    sort,
    setSort,
    variant,
    setVariant,
    packSize,
    setPackSize,
    refetch,
    storesWithDistance,
    bestPrice,
    nextBestPrice,
    maxSavings,
  }
}
