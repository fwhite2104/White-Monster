'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { TrendingDown, MapPin, Store } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getRetailerColor } from '@/lib/constants'
import type { Price } from '@/lib/types'

interface BestDealBannerProps {
  bestPrice: Price
  nextBestPrice?: Price | null
  totalPrices: number
  /** @deprecated Use nextBestPrice instead */
  savings?: number
}

export function BestDealBanner({ bestPrice, nextBestPrice, totalPrices, savings: legacySavings }: BestDealBannerProps) {
  const shouldReduceMotion = useReducedMotion()
  const store = bestPrice.stores ?? { name: 'Unknown Store', retailer: 'other', suburb: '' }
  const product = bestPrice.products ?? { name: 'Unknown Product' }
  const retailerColor = getRetailerColor(store.retailer ?? 'other')
  const perCanPrice = bestPrice.products?.pack_size === '4_pack'
    ? Number(bestPrice.per_can_price ?? Number(bestPrice.price) / 4).toFixed(2)
    : null
  const savings = nextBestPrice
    ? Number(nextBestPrice.price) - Number(bestPrice.price)
    : legacySavings ?? null

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="relative overflow-hidden rounded-2xl"
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `linear-gradient(135deg, ${retailerColor}, oklch(0.7 0.25 145), ${retailerColor})`,
        }}
      />

      <div
        className="absolute inset-0 rounded-2xl opacity-40"
        style={{
          boxShadow: `0 0 30px ${retailerColor}40, inset 0 0 30px ${retailerColor}20`,
        }}
      />

      <div className="relative bg-gradient-to-br from-card/95 via-card/90 to-card/95 backdrop-blur-sm rounded-2xl ring-1 ring-foreground/10 p-4 sm:p-5 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-center gap-2">
              <motion.div
                animate={shouldReduceMotion ? {} : { rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
              >
                <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </motion.div>
              <span className="text-xs sm:text-sm font-medium text-primary uppercase tracking-wider">
                Best Deal Found
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
              <span className="text-primary">
                €{Number(bestPrice.price).toFixed(2)}
              </span>
              {perCanPrice && (
                <span className="text-muted-foreground text-sm sm:text-base md:text-lg font-normal ml-2">
                  (€{perCanPrice}/can)
                </span>
              )}
              <span className="text-muted-foreground text-sm sm:text-base md:text-lg font-normal ml-2">
                for {product.name}
              </span>
            </h2>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <span className="text-xs sm:text-sm font-medium">{store.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <span className="text-xs sm:text-sm text-muted-foreground">{store.suburb}</span>
              </div>
              <Badge
                variant="outline"
                className="border-foreground/20"
                style={{ borderColor: `${retailerColor}60` }}
              >
                <span
                  className="mr-1.5 h-2 w-2 rounded-full inline-block"
                  style={{ backgroundColor: retailerColor }}
                />
                {store.retailer}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-4 md:flex-col md:items-end">
            {savings !== null && savings > 0 && (
              <div className="text-right">
                <p className="text-[10px] sm:text-xs text-muted-foreground">You save up to</p>
                <p className="text-lg sm:text-xl font-bold text-primary">
                  €{savings.toFixed(2)}
                </p>
              </div>
            )}
            <div className="text-right">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Prices found</p>
              <p className="text-lg sm:text-xl font-bold text-foreground">{totalPrices}</p>
            </div>
          </div>
        </div>

        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5"
          style={{ background: `linear-gradient(90deg, transparent, ${retailerColor}, transparent)` }}
          initial={shouldReduceMotion ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
        />
      </div>
    </motion.div>
  )
}
