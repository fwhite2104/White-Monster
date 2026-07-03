'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { TrendingDown, MapPin, Store, Database, Users, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getRetailerColor, getPackCount } from '@/lib/constants'
import { getFreshnessLabel } from '@/lib/geo'
import type { Price } from '@/lib/types'

interface BestDealBannerProps {
  bestPrice: Price
  nextBestPrice?: Price | null
  totalPrices: number
  maxSavings?: { amount: number; packSize: string } | null
  /** @deprecated Use nextBestPrice instead */
  savings?: number
}

export function BestDealBanner({ bestPrice, nextBestPrice, totalPrices, maxSavings, savings: legacySavings }: BestDealBannerProps) {
  const shouldReduceMotion = useReducedMotion()
  const store = bestPrice.stores ?? { name: 'Unknown Store', retailer: 'other', suburb: '' }
  const product = bestPrice.products ?? { name: 'Unknown Product' }
  const retailerColor = getRetailerColor(store.retailer ?? 'other')
  const count = getPackCount(bestPrice.products?.pack_size ?? 'single')
  const perCanPrice = count > 1 ? Number(bestPrice.per_can_price ?? Number(bestPrice.price) / count).toFixed(2) : null
  const savings = nextBestPrice
    ? Number(nextBestPrice.price) - Number(bestPrice.price)
    : legacySavings ?? null
  const freshness = getFreshnessLabel(bestPrice.scraped_at)

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="relative overflow-hidden rounded-xl border border-[oklch(0.72_0.22_145/0.2)] bg-[oklch(0.72_0.22_145/0.04)]"
    >
      <div className="p-4 sm:p-5 md:p-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center size-8 rounded-lg bg-primary/15">
              <TrendingDown className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                Best Deal Found
              </p>
              <p className="text-xs text-muted-foreground">
                {totalPrices} price{totalPrices !== 1 ? 's' : ''} compared
              </p>
            </div>
          </div>

          {bestPrice.source === 'user_upload' || bestPrice.source === 'user_reported' ? (
            <Badge variant="outline" className="border-primary/20 text-primary/80 gap-1 text-xs">
              <Users className="h-3 w-3" />
              Community
            </Badge>
          ) : (
            <Badge variant="outline" className="border-muted/20 text-muted-foreground gap-1 text-xs">
              <Database className="h-3 w-3" />
              Scraped
            </Badge>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
          <div className="flex-1 space-y-2 min-w-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
              <span className="text-primary tabular-nums [font-variant-numeric:slashed-zero]">
                {'€'}{Number(bestPrice.price).toFixed(2)}
              </span>
              {perCanPrice && (
                <span className="text-muted-foreground text-sm sm:text-base md:text-lg font-normal ml-2 tabular-nums">
                  ({'€'}{perCanPrice}/can)
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
              {store.suburb && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  <span className="text-xs sm:text-sm text-muted-foreground">{store.suburb}</span>
                </div>
              )}
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

            {/* Freshness indicator */}
            <span
              className={`inline-flex items-center gap-1 text-xs ${
                freshness.status === 'stale'
                  ? 'text-destructive/70'
                  : freshness.status === 'yesterday'
                    ? 'text-yellow-400/70'
                    : 'text-muted-foreground'
              }`}
            >
              {freshness.status === 'stale' && (
                <AlertTriangle className="h-3 w-3 shrink-0" />
              )}
              {freshness.label}
            </span>
          </div>

          {/* Animated savings figure */}
          <AnimatePresence mode="wait">
            {maxSavings && maxSavings.amount > 0 && (
              <motion.div
                key={maxSavings.amount.toFixed(2)}
                initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.85, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
                className="flex items-center gap-4 md:flex-col md:items-end"
              >
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">You could save up to</p>
                  <p className="text-lg sm:text-xl font-bold text-primary tabular-nums [font-variant-numeric:slashed-zero]">
                    {'€'}{maxSavings.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                    on {maxSavings.packSize !== 'single' ? 'multipacks' : 'single cans'}
                  </p>
                </div>
              </motion.div>
            )}
            {savings !== null && savings > 0 && !maxSavings && (
              <motion.div
                key={savings.toFixed(2)}
                initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.85, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
              >
                <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-lg px-3 py-2">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-sm font-medium tabular-nums">
                    Save {'€'}{savings.toFixed(2)} vs next cheapest
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
