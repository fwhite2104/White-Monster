'use client'

import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { useQueryStates, parseAsString, parseAsInteger } from 'nuqs'
import { DEFAULT_RADIUS_KM } from '@/lib/constants'
import type { Price } from '@/lib/types'

const priceParams = {
  variant: parseAsString.withDefault('zero_sugar'),
  pack_size: parseAsString.withDefault('4_pack'),
  sort: parseAsString.withDefault('price'),
  radius: parseAsInteger.withDefault(DEFAULT_RADIUS_KM),
}

interface UsePriceQueryOptions {
  lat: number
  lng: number
}

interface UsePriceQueryReturn {
  prices: Price[]
  loading: boolean
  error: string | null
  radius: number
  sort: string
  variant: string
  packSize: string
  setRadius: (r: number) => void
  setSort: (s: string) => void
  setVariant: (v: string) => void
  setPackSize: (p: string) => void
  refetch: () => Promise<void>
  bestPrice: Price | null
}

type State = {
  prices: Price[]
  loading: boolean
  error: string | null
}

type Action =
  | { type: 'start' }
  | { type: 'success'; prices: Price[] }
  | { type: 'error'; error: string }
  | { type: 'done' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'start':
      return { ...state, loading: true, error: null }
    case 'success':
      return { ...state, prices: action.prices }
    case 'error':
      return { ...state, error: action.error }
    case 'done':
      return { ...state, loading: false }
    default:
      return state
  }
}

export function usePriceQuery({ lat, lng }: UsePriceQueryOptions): UsePriceQueryReturn {
  const [filters, setFilters] = useQueryStates(priceParams)
  const [state, dispatch] = useReducer(reducer, {
    prices: [],
    loading: true,
    error: null,
  })

  const runFetch = useCallback(
    async (signal?: AbortSignal) => {
      dispatch({ type: 'start' })

      try {
        const res = await fetch(
          `/api/prices?lat=${lat}&lng=${lng}&radius=${filters.radius}&variant=${filters.variant}&sort=${filters.sort}&pack_size=${filters.pack_size}`,
          { signal }
        )

        if (!res.ok) throw new Error('Failed to fetch prices')

        const data = await res.json()
        dispatch({ type: 'success', prices: data.prices || [] })
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          dispatch({ type: 'error', error: 'Request timed out. Please try again.' })
        } else {
          dispatch({ type: 'error', error: err instanceof Error ? err.message : 'Something went wrong' })
        }
      } finally {
        dispatch({ type: 'done' })
      }
    },
    [lat, lng, filters.radius, filters.variant, filters.sort, filters.pack_size]
  )

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)

    runFetch(controller.signal).finally(() => clearTimeout(timer))

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [runFetch])

  const refetch = useCallback(async () => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    try {
      await runFetch(controller.signal)
    } finally {
      clearTimeout(timer)
    }
  }, [runFetch])

  const setFilter = useCallback(
    (key: keyof typeof filters, value: string | number) => {
      setFilters({ [key]: value })
    },
    [setFilters]
  )

  const bestPrice = useMemo(() => {
    if (state.prices.length === 0) return null
    return [...state.prices].sort((a, b) => Number(a.price) - Number(b.price))[0]
  }, [state.prices])

  return {
    prices: state.prices,
    loading: state.loading,
    error: state.error,
    radius: filters.radius,
    sort: filters.sort,
    variant: filters.variant,
    packSize: filters.pack_size,
    setRadius: (r) => setFilter('radius', r),
    setSort: (s) => setFilter('sort', s),
    setVariant: (v) => setFilter('variant', v),
    setPackSize: (p) => setFilter('pack_size', p),
    refetch,
    bestPrice,
  }
}
