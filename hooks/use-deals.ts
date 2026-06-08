'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Deal } from '@/lib/deals'

const DEALS_CACHE_KEY = 'monster_cork_deals'
const DEALS_CACHE_TTL_MS = 5 * 60 * 1000

interface CachedDeals {
  deals: Deal[]
  fetchedAt: number
}

export function useDeals(retailer?: string) {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDeals = useCallback(async (forceRefresh = false): Promise<Deal[]> => {
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(DEALS_CACHE_KEY)
        if (cached) {
          const parsed: CachedDeals = JSON.parse(cached)
          if (Date.now() - parsed.fetchedAt < DEALS_CACHE_TTL_MS) {
            return parsed.deals
          }
        }
      } catch {
        // ignore cache errors
      }
    }

    const params = new URLSearchParams()
    if (retailer) params.set('retailer', retailer)

    const res = await fetch(`/api/deals?${params.toString()}`)
    if (!res.ok) {
      throw new Error(`Failed to fetch deals: ${res.status}`)
    }

    const data = await res.json()
    const fetchedDeals = data.deals ?? []

    try {
      localStorage.setItem(DEALS_CACHE_KEY, JSON.stringify({
        deals: fetchedDeals,
        fetchedAt: Date.now(),
      }))
    } catch {
      // ignore
    }

    return fetchedDeals
  }, [retailer])

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const fetchedDeals = await loadDeals()
        if (!cancelled) {
          setDeals(fetchedDeals)
          setError(null)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch deals')
          setLoading(false)
        }
      }
    }

    init()

    return () => { cancelled = true }
  }, [loadDeals])

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const fetchedDeals = await loadDeals(true)
      setDeals(fetchedDeals)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch deals')
    } finally {
      setLoading(false)
    }
  }, [loadDeals])

  return { deals, loading, error, refresh }
}
