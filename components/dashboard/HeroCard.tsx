'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { MapPin, TrendingDown, CirclePlus, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getRetailerColor, getPackCount, formatPackSize } from '@/lib/constants'
import { formatDistance, getFreshnessLabel } from '@/lib/geo'
import { useAnimatedNumber } from '@/hooks/use-animated-number'
import type { Price } from '@/lib/types'

interface HeroCardProps {
  bestPrice: Price | null
  nextBestPrice: Price | null
  totalResults: number
  userLat?: number
  userLng?: number
  onReportPrice?: () => void
}

function getVariantLabel(product: { variant?: string; pack_size?: string; size_ml?: number }): string {
  const variantName = product.variant
    ? product.variant.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : ''
  const packLabel = formatPackSize(product.pack_size ?? '')
  return [variantName, packLabel].filter(Boolean).join(' · ')
}

export function HeroCard({ bestPrice, nextBestPrice, totalResults, onReportPrice }: HeroCardProps) {
  const shouldReduceMotion = useReducedMotion()

  if (!bestPrice) {
    return (
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      >
        <div className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
            <MapPin className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="text-base font-medium text-foreground">
              No prices found nearby
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Try expanding your search radius or checking back later.
            </p>
          </div>
          {onReportPrice && (
            <Button onClick={onReportPrice} variant="default" size="lg" className="mt-2">
              <CirclePlus className="size-4 mr-2" />
              Be the first to report a price
            </Button>
          )}
        </div>
      </motion.div>
    )
  }

  const store = bestPrice.stores ?? { name: 'Unknown Store', retailer: 'other', suburb: '', lat: 0, lng: 0 }
  const product = bestPrice.products ?? { name: 'Monster', variant: 'unknown', pack_size: 'single' }
  const retailerColor = getRetailerColor(store.retailer)
  const distance = typeof bestPrice.distance === 'number' ? bestPrice.distance : 0
  const count = getPackCount(product.pack_size ?? 'single')
  const perCanPrice = count > 1 ? (bestPrice.per_can_price ? Number(bestPrice.per_can_price).toFixed(2) : (Number(bestPrice.price) / count).toFixed(2)) : null
  const savings = nextBestPrice ? Number(nextBestPrice.price) - Number(bestPrice.price) : null
  const variantLabel = getVariantLabel(product)
  const freshness = getFreshnessLabel(bestPrice.scraped_at)

  const animatedPrice = useAnimatedNumber(Number(bestPrice.price))

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      <div
        className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 20% 30%, oklch(0.72 0.22 145 / 0.12), transparent 70%), rgba(255,255,255,0.03)',
        }}
      >
        <div className="relative p-3 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center md:gap-6">
            {/* Price + icon cluster */}
            <div className="flex items-center gap-3 md:flex-col md:items-baseline md:gap-1">
              {/* Energy bolt SVG mark */}
              <motion.div
                className="hidden md:flex items-center justify-center size-10 rounded-lg bg-primary/10 shrink-0"
                initial={shouldReduceMotion ? false : { scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" fill="oklch(0.72 0.22 145)" opacity="0.9" />
                </svg>
              </motion.div>
              <div>
                <motion.p
                  className="text-price-hero price-hero text-primary"
                  initial={shouldReduceMotion ? false : { scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', duration: 0.5, bounce: 0.2, delay: 0.1 }}
                >
                  €{animatedPrice}
                </motion.p>
                {perCanPrice && (
                  <span className="text-price-sm text-muted-foreground">
                    (€{perCanPrice}/can)
                  </span>
                )}
                <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
                  best price
                </span>
              </div>
            </div>

            <div className="hidden md:block w-px h-16 bg-white/10" />

            <div className="flex-1 space-y-1.5 mt-2 md:mt-0 md:space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: retailerColor }}
                />
                <p className="text-base font-medium text-foreground truncate">
                  at {store.name}
                </p>
                {store.suburb && (
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    · {store.suburb}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {formatDistance(distance)}
                </span>
                <span
                  className={`flex items-center gap-1 text-xs ${
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

              {variantLabel && (
                <Badge variant="outline" className="border-white/10 text-xs">
                  {variantLabel}
                </Badge>
              )}
            </div>

            <AnimatePresence mode="wait">
              {savings !== null && savings > 0 && (
                <motion.div
                  key={savings.toFixed(2)}
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.9, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', duration: 0.4, bounce: 0.15, delay: 0.2 }}
                  className="mt-3 md:mt-0"
                >
                  <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary rounded-lg px-3 py-2">
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-sm font-medium tabular-nums">
                      Save €{savings.toFixed(2)} vs next cheapest
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-2 pt-2 sm:mt-3 sm:pt-3 border-t border-white/10 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {totalResults} price{totalResults !== 1 ? 's' : ''} found nearby
            </p>
            {onReportPrice && (
              <Button onClick={onReportPrice} variant="outline" size="sm" className="gap-1.5 text-xs h-11 px-3">
                <CirclePlus className="size-3.5" />
                Report a Price
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
