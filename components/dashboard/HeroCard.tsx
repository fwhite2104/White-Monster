'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { MapPin, TrendingDown, CirclePlus, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getRetailerColor } from '@/lib/constants'
import { formatDistance, getFreshnessLabel } from '@/lib/geo'
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
  const packLabel = product.pack_size === '4_pack' ? '4-pack'
    : product.pack_size === 'single' ? 'Single can'
    : product.pack_size ?? ''
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
        <Card className="bg-card ring-1 ring-foreground/10">
          <CardContent className="p-6 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
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
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const store = bestPrice.stores ?? { name: 'Unknown Store', retailer: 'other', suburb: '', lat: 0, lng: 0 }
  const product = bestPrice.products ?? { name: 'Monster', variant: 'unknown', pack_size: 'single' }
  const retailerColor = getRetailerColor(store.retailer)
  const distance = typeof bestPrice.distance === 'number' ? bestPrice.distance : 0
  const perCanPrice = product.pack_size === '4_pack'
    ? Number(bestPrice.per_can_price ?? Number(bestPrice.price) / 4).toFixed(2)
    : null
  const savings = nextBestPrice ? Number(nextBestPrice.price) - Number(bestPrice.price) : null
  const variantLabel = getVariantLabel(product)
  const freshness = getFreshnessLabel(bestPrice.scraped_at)

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      <Card className="relative overflow-hidden bg-[oklch(0.72_0.22_145/0.04)] border border-[oklch(0.72_0.22_145/0.2)]">
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
          style={{ backgroundColor: `${retailerColor}99` }}
          aria-hidden="true"
        />

        <CardContent className="relative p-3 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center md:gap-6">
            <div className="flex items-baseline gap-2 md:flex-col md:gap-1">
              <motion.p
                className="text-3xl sm:text-5xl font-bold text-primary tracking-tight tabular-nums [font-variant-numeric:slashed-zero] [font-family:var(--font-display)]"
                initial={shouldReduceMotion ? false : { scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', duration: 0.5, bounce: 0.2, delay: 0.1 }}
              >
                €{Number(bestPrice.price).toFixed(2)}
              </motion.p>
              {perCanPrice && (
                <span className="text-xs text-muted-foreground md:text-sm">
                  (€{perCanPrice}/can)
                </span>
              )}
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium md:text-sm">
                best price
              </span>
            </div>

            <div className="hidden md:block w-px h-16 bg-foreground/10" />

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
                <Badge variant="outline" className="border-foreground/15 text-xs">
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
                  <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-lg px-3 py-2">
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-sm font-medium tabular-nums">
                      Save €{savings.toFixed(2)} vs next cheapest
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-2 pt-2 sm:mt-3 sm:pt-3 border-t border-foreground/10 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {totalResults} price{totalResults !== 1 ? 's' : ''} found nearby
            </p>
            {onReportPrice && (
              <Button onClick={onReportPrice} variant="outline" size="sm" className="gap-1.5 text-xs h-10 px-3">
                <CirclePlus className="size-3.5" />
                Report a Price
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
