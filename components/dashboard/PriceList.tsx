'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { AlertCircle, SearchX } from 'lucide-react'
import { PriceCard } from './PriceCard'
import type { Price } from '@/lib/types'

interface PriceListProps {
  prices: Price[]
  userLat?: number
  userLng?: number
  highlightedStoreId?: string | null
  onStoreHover?: (storeId: string | null) => void
}

export function PriceList({
  prices,
  userLat,
  userLng,
  highlightedStoreId,
  onStoreHover,
}: PriceListProps) {
  const shouldReduceMotion = useReducedMotion()

  if (prices.length === 0) {
    return (
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 space-y-4"
      >
        <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
          <SearchX className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <p className="text-lg font-medium text-foreground">No prices found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try increasing the radius or reporting a price.
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-3">
      {prices.map((price, index) => (
        <motion.div
          key={price.id}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.06, duration: 0.35, ease: 'easeOut' }}
        >
          <PriceCard
            price={price}
            isCheapest={index === 0}
            userLat={userLat}
            userLng={userLng}
            onHover={() => onStoreHover?.(price.store_id)}
          />
        </motion.div>
      ))}
    </div>
  )
}
