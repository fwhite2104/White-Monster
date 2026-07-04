'use client'

import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Sparkles, Tag } from 'lucide-react'
import { getDistance } from 'geolib'
import { CORK_CENTER, getPackCount, formatPackSize, getRetailerColor } from '@/lib/constants'
import { formatDistance } from '@/lib/geo'
import type { Price } from '@/lib/types'

interface ItemComparisonViewProps {
  prices: Price[]
  userLat?: number
  userLng?: number
}

interface GroupedPrices {
  variant: string
  prices: Price[]
}

function formatVariantLabel(variant: string): string {
  return variant
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function getPerCanPrice(price: Price): number | null {
  const count = getPackCount(price.products?.pack_size ?? 'single')
  if (count <= 1) return null
  return Number(price.per_can_price ?? Number(price.price) / count)
}

function PriceStoreCard({
  price,
  isCheapest,
  userLat,
  userLng,
  index,
}: {
  price: Price
  isCheapest: boolean
  userLat?: number
  userLng?: number
  index: number
}) {
  const shouldReduceMotion = useReducedMotion()
  const lat = Number.isFinite(userLat) ? (userLat as number) : CORK_CENTER.lat
  const lng = Number.isFinite(userLng) ? (userLng as number) : CORK_CENTER.lng
  const store = price.stores ?? { name: 'Unknown', retailer: 'other', lat: 0, lng: 0, suburb: '' }
  const retailerColor = getRetailerColor(store.retailer)

  const distance = getDistance(
    { latitude: lat, longitude: lng },
    { latitude: store.lat, longitude: store.lng }
  )

  const perCan = getPerCanPrice(price)

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: 'easeOut' }}
      whileHover={shouldReduceMotion ? {} : { y: -3, scale: 1.02 }}
      className="shrink-0 min-w-0"
    >
      <Card
        className={
          isCheapest
            ? 'w-44 md:w-52 bg-card ring-1 ring-primary/30 relative overflow-visible'
            : 'w-44 md:w-52 bg-card ring-1 ring-foreground/10 hover:ring-foreground/20 relative overflow-visible'
        }
      >
        {isCheapest && (
          <motion.div
            initial={shouldReduceMotion ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: index * 0.05 + 0.1 }}
            className="absolute -top-2 -right-2 z-10"
          >
            <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 gap-1 shadow-lg shadow-primary/20">
              <Sparkles className="h-2.5 w-2.5" />
              Best Price
            </Badge>
          </motion.div>
        )}

        <CardContent className="p-3 md:p-4">
          <div
            className="h-1 w-full rounded-full mb-3"
            style={{ backgroundColor: retailerColor }}
          />

          <div className="flex items-baseline gap-1 mb-1">
            <span
              className={`text-xl md:text-2xl font-bold tracking-tight ${
                isCheapest ? 'text-primary' : ''
              }`}
            >
              €{Number(price.price).toFixed(2)}
            </span>
            {perCan !== null && (
              <span className="text-xs md:text-xs text-muted-foreground">
                (€{perCan.toFixed(2)}/can)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mb-2">
            <span
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: retailerColor }}
            />
            <span className="text-xs font-medium truncate text-foreground/90">
              {store.name}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {formatDistance(distance)}
            </span>
            {price.products?.pack_size && (
              <Badge variant="outline" className="border-foreground/15 text-xs h-4 px-1.5">
                <Tag className="h-2.5 w-2.5 mr-0.5" />
                {formatPackSize(price.products?.pack_size ?? '')}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function ItemComparisonView({
  prices,
  userLat,
  userLng,
}: ItemComparisonViewProps) {
  const shouldReduceMotion = useReducedMotion()

  const grouped = useMemo<GroupedPrices[]>(() => {
    const map = new Map<string, Price[]>()

    for (const price of prices) {
      const variant = price.products?.variant ?? 'unknown'
      if (!map.has(variant)) {
        map.set(variant, [])
      }
      map.get(variant)!.push(price)
    }

    return Array.from(map.entries())
      .map(([variant, variantPrices]) => ({
        variant,
        prices: variantPrices.sort(
          (a, b) => Number(a.price) - Number(b.price)
        ),
      }))
      .sort((a, b) => a.variant.localeCompare(b.variant))
  }, [prices])

  if (prices.length === 0) return null

  return (
    <div className="space-y-6 md:space-y-8" role="region" aria-label="Price comparison by variant">
      {grouped.map((group, groupIndex) => (
        <motion.section
          key={group.variant}
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: groupIndex * 0.08, duration: 0.35 }}
        >
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            <div className="h-6 w-1 rounded-full bg-primary/60" />
            <h3 className="text-base md:text-lg font-semibold text-foreground tracking-tight">
              {formatVariantLabel(group.variant)}
            </h3>
            <span className="text-xs text-muted-foreground">
              ({group.prices.length} store{group.prices.length !== 1 ? 's' : ''})
            </span>
          </div>

          <div className="flex md:flex-wrap gap-3 overflow-x-auto pt-2 -mt-2 pb-2 md:pb-0 scrollbar-none -mx-1 px-1 md:mx-0 md:px-0 md:pt-0 md:-mt-0 md:[mask-image:none] [mask-image:linear-gradient(to_right,black_calc(100%-3rem),transparent)]">
            {group.prices.map((price, idx) => (
              <PriceStoreCard
                key={price.id}
                price={price}
                isCheapest={idx === 0}
                userLat={userLat}
                userLng={userLng}
                index={idx}
              />
            ))}
          </div>
        </motion.section>
      ))}
    </div>
  )
}
