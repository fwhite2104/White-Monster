'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { MapPin, Clock, TrendingDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getRetailerColor } from '@/lib/constants'
import { formatDistance, getTimeAgo } from '@/lib/geo'
import type { Price } from '@/lib/types'

interface HeroCardProps {
  bestPrice: Price | null
  nextBestPrice: Price | null
  totalResults: number
  userLat?: number
  userLng?: number
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

export function HeroCard({ bestPrice, nextBestPrice, totalResults }: HeroCardProps) {
  const shouldReduceMotion = useReducedMotion()

  if (!bestPrice) {
    return (
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <Card className="bg-card ring-1 ring-foreground/10">
          <CardContent className="p-6 text-center space-y-3">
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
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const store = bestPrice.stores ?? { name: 'Unknown Store', retailer: 'other', suburb: '', lat: 0, lng: 0 }
  const product = bestPrice.products ?? { name: 'Monster', variant: 'unknown', pack_size: 'single' }
  const retailerColor = getRetailerColor(store.retailer)
  const distance = typeof bestPrice.distance === 'number' ? bestPrice.distance : 0
  const savings = nextBestPrice ? Number(nextBestPrice.price) - Number(bestPrice.price) : null
  const variantLabel = getVariantLabel(product)

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Card className="relative overflow-hidden bg-card ring-1 ring-primary/30">
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
          style={{ backgroundColor: retailerColor }}
        />
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ background: `linear-gradient(135deg, ${retailerColor}40, transparent 60%)` }}
        />

        <CardContent className="relative p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center md:gap-6">
            <div className="flex items-baseline gap-3 md:flex-col md:gap-1">
              <motion.p
                className="text-4xl sm:text-5xl font-bold text-primary tracking-tight"
                initial={shouldReduceMotion ? false : { scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
              >
                €{Number(bestPrice.price).toFixed(2)}
              </motion.p>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium md:text-sm">
                best price
              </span>
            </div>

            <div className="hidden md:block w-px h-16 bg-foreground/10" />

            <div className="flex-1 space-y-2 mt-3 md:mt-0">
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
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  {getTimeAgo(bestPrice.scraped_at)}
                </span>
              </div>

              {variantLabel && (
                <Badge variant="outline" className="border-foreground/15 text-xs">
                  {variantLabel}
                </Badge>
              )}
            </div>

            {savings !== null && savings > 0 && (
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="mt-3 md:mt-0"
              >
                <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-lg px-3 py-2">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Save €{savings.toFixed(2)} vs next cheapest
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-foreground/10">
            <p className="text-xs text-muted-foreground">
              {totalResults} price{totalResults !== 1 ? 's' : ''} found nearby
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
