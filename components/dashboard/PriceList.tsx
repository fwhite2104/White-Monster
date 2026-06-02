'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { SearchX, ChevronDown, ChevronUp } from 'lucide-react'
import { PriceCard } from './PriceCard'
import type { Price } from '@/lib/types'

const INITIAL_DISPLAY_COUNT = 3

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
  onStoreHover,
}: PriceListProps) {
  const shouldReduceMotion = useReducedMotion()
  const [showAll, setShowAll] = useState(false)

  const totalCount = prices.length
  const hiddenCount = Math.max(0, totalCount - INITIAL_DISPLAY_COUNT)
  const displayedPrices = showAll ? prices : prices.slice(0, INITIAL_DISPLAY_COUNT)

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
    <div className="space-y-3" role="list" aria-label="Price results">
      {displayedPrices.map((price, index) => (
        <motion.div
          key={price.id}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: showAll ? 0 : index * 0.06,
            duration: 0.35,
            ease: 'easeOut',
          }}
          role="listitem"
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

      {hiddenCount > 0 && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: showAll ? 0 : INITIAL_DISPLAY_COUNT * 0.06, duration: 0.3 }}
        >
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            aria-expanded={showAll}
            aria-controls="price-list"
            className="group w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-border bg-muted/30 hover:bg-muted/50 text-sm text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer"
          >
            {showAll ? (
              <>
                <ChevronUp className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
                <span>Show less</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5" />
                <span>
                  Show {hiddenCount} more {hiddenCount === 1 ? 'deal' : 'deals'}
                </span>
              </>
            )}
          </button>
        </motion.div>
      )}
    </div>
  )
}
