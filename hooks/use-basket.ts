'use client'

import { useState, useCallback } from 'react'
import type { BasketItem, BasketResult } from '@/lib/basket-types'
import { MAX_BASKET_ITEMS } from '@/lib/basket-types'

const BASKET_STORAGE_KEY = 'monster_cork_basket'

function loadBasket(): BasketItem[] {
  try {
    const stored = localStorage.getItem(BASKET_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length <= MAX_BASKET_ITEMS) {
        return parsed
      }
    }
  } catch {}
  return []
}

function saveBasket(items: BasketItem[]) {
  try {
    localStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(items))
  } catch {}
}

export function useBasket() {
  const [items, setItems] = useState<BasketItem[]>(loadBasket)
  const [result, setResult] = useState<BasketResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addItem = useCallback((item: BasketItem) => {
    setItems((prev) => {
      if (prev.length >= MAX_BASKET_ITEMS) return prev

      const existing = prev.find(
        (i) => i.variant === item.variant && i.pack_size === item.pack_size
      )

      let next: BasketItem[]
      if (existing) {
        next = prev.map((i) =>
          i.variant === item.variant && i.pack_size === item.pack_size
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      } else {
        next = [...prev, item]
      }

      saveBasket(next)
      return next
    })
  }, [])

  const removeItem = useCallback((variant: string, packSize: string) => {
    setItems((prev) => {
      const next = prev.filter(
        (i) => !(i.variant === variant && i.pack_size === packSize)
      )
      saveBasket(next)
      return next
    })
  }, [])

  const updateQuantity = useCallback((variant: string, packSize: string, quantity: number) => {
    setItems((prev) => {
      const next = prev.map((i) =>
        i.variant === variant && i.pack_size === packSize ? { ...i, quantity } : i
      ).filter((i) => i.quantity > 0)
      saveBasket(next)
      return next
    })
  }, [])

  const clearBasket = useCallback(() => {
    setItems([])
    setResult(null)
    saveBasket([])
  }, [])

  const optimise = useCallback(async (lat: number, lng: number, radius: number) => {
    if (items.length === 0) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/basket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, lat, lng, radius }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to optimise basket')
      }

      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimise basket')
    } finally {
      setLoading(false)
    }
  }, [items])

  return {
    items,
    result,
    loading,
    error,
    addItem,
    removeItem,
    updateQuantity,
    clearBasket,
    optimise,
    canAddMore: items.length < MAX_BASKET_ITEMS,
  }
}
