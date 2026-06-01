'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { RETAILERS } from '@/lib/constants'
import type { Price } from '@/lib/types'

interface PriceChartProps {
  prices: Price[]
  maxItems?: number
}

function getRetailerColor(retailer: string): string {
  const found = RETAILERS.find((r) => r.value === retailer.toLowerCase())
  return found?.color ?? '#6B7280'
}

export function PriceChart({ prices, maxItems = 8 }: PriceChartProps) {
  const shouldReduceMotion = useReducedMotion()
  const sorted = [...prices].sort((a, b) => Number(a.price) - Number(b.price)).slice(0, maxItems)

  if (sorted.length < 2) return null

  const maxPrice = Math.max(...sorted.map((p) => Number(p.price)))
  const minPrice = Math.min(...sorted.map((p) => Number(p.price)))
  const priceRange = maxPrice - minPrice || 1

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-xl bg-card ring-1 ring-foreground/10 p-4"
    >
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        Price Comparison
      </h3>

      <div className="space-y-2">
        {sorted.map((price, index) => {
          const store = price.stores!
          const priceNum = Number(price.price)
          const heightPercent = ((priceNum - minPrice) / priceRange) * 60 + 40
          const retailerColor = getRetailerColor(store.retailer)
          const isCheapest = index === 0

          return (
            <motion.div
              key={price.id}
              initial={shouldReduceMotion ? false : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="flex items-center gap-3"
            >
              <div className="w-20 sm:w-24 shrink-0">
                <span className="text-xs font-medium truncate block">{store.retailer}</span>
              </div>

              <div className="flex-1 h-6 bg-muted/30 rounded-full overflow-hidden relative">
                <motion.div
                  className="h-full rounded-full relative"
                  style={{ backgroundColor: retailerColor }}
                  initial={shouldReduceMotion ? false : { width: 0 }}
                  animate={{ width: `${heightPercent}%` }}
                  transition={{ duration: 0.6, delay: index * 0.05, ease: 'easeOut' }}
                >
                  {isCheapest && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ boxShadow: `0 0 8px ${retailerColor}80` }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.div>

                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium">
                  EUR {priceNum.toFixed(2)}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <span className="text-xs text-muted-foreground">Cheapest</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-muted" />
          <span className="text-xs text-muted-foreground">
            Range: EUR {minPrice.toFixed(2)} - EUR {maxPrice.toFixed(2)}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
