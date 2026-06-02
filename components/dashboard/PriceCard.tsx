'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getDistance } from 'geolib'
import { CORK_CENTER, getRetailerColor } from '@/lib/constants'
import { getTimeAgo } from '@/lib/geo'
import type { Price } from '@/lib/types'

interface PriceCardProps {
  price: Price
  isCheapest?: boolean
  userLat?: number
  userLng?: number
  onHover?: () => void
}

function getVariantLabel(product: { variant?: string; pack_size?: string }): string {
  const variantName = product.variant
    ? product.variant.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : ''
  const packLabel = product.pack_size === '4_pack' ? '4-pack'
    : product.pack_size === 'single' ? 'Single can'
    : product.pack_size ?? ''
  return [variantName, packLabel].filter(Boolean).join(' · ')
}

function formatPerCanPrice(price: Price): string | null {
  if (price.products?.pack_size !== '4_pack') return null
  return Number(price.per_can_price ?? Number(price.price) / 4).toFixed(2)
}

export function PriceCard({ price, isCheapest, userLat, userLng, onHover }: PriceCardProps) {
  const shouldReduceMotion = useReducedMotion()
  const lat = userLat ?? CORK_CENTER.lat
  const lng = userLng ?? CORK_CENTER.lng
  const store = price.stores ?? { name: 'Unknown', retailer: 'other', lat: 0, lng: 0, suburb: '', address: '' }
  const product = price.products ?? { name: 'Unknown Product', variant: 'unknown', pack_size: 'single' }
  const retailerColor = getRetailerColor(store.retailer)

  const distance = getDistance(
    { latitude: lat, longitude: lng },
    { latitude: store.lat, longitude: store.lng }
  )

  const variantLabel = getVariantLabel(product)
  const perCanDisplay = formatPerCanPrice(price)

  const handleShare = () => {
    const canPrice = perCanDisplay ? ` (€${perCanDisplay}/can)` : ''
    const text = `Found ${product.name} for €${Number(price.price).toFixed(2)}${canPrice} at ${store.name}!`
    navigator.clipboard.writeText(`${text} ${window.location.href}`)
  }

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={shouldReduceMotion ? {} : { scale: 1.01, y: -2 }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      onMouseEnter={onHover}
      className="relative"
    >
      {isCheapest && (
        <motion.div
          className="absolute -inset-[1px] rounded-[calc(var(--radius-xl)+1px)] opacity-60"
          style={{
            background: `linear-gradient(135deg, ${retailerColor}, oklch(0.7 0.25 145), ${retailerColor})`,
          }}
          animate={shouldReduceMotion ? {} : { opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <Card
        className={
          isCheapest
            ? 'relative bg-card ring-1 ring-primary/30'
            : 'relative bg-card ring-1 ring-foreground/10 hover:ring-foreground/20'
        }
      >
        <CardContent className="p-4 min-h-[88px] flex items-center">
          <div className="flex items-center gap-4 w-full">
            <div
              className="self-stretch w-1 rounded-full shrink-0"
              style={{ backgroundColor: retailerColor }}
            />

            <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
              <div className="flex items-baseline gap-2">
                <p
                  className="text-2xl font-bold tracking-tight"
                  style={{ color: isCheapest ? 'oklch(0.7 0.25 145)' : undefined }}
                >
                  €{Number(price.price).toFixed(2)}
                </p>
                {perCanDisplay && (
                  <span className="text-xs text-muted-foreground">
                    (€{perCanDisplay}/can)
                  </span>
                )}
                {isCheapest && (
                  <motion.div
                    initial={shouldReduceMotion ? false : { scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5">
                      Best Price
                    </Badge>
                  </motion.div>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-sm text-muted-foreground row-span-2 self-center">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{(distance / 1000).toFixed(1)} km</span>
              </div>

              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: retailerColor }}
                />
                <span className="text-sm font-medium truncate">at {store.name}</span>
                {store.suburb && (
                  <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                    · {store.suburb}
                  </span>
                )}
              </div>

              <div className="col-span-2 flex items-center gap-3 mt-1">
                {variantLabel && (
                  <Badge variant="outline" className="border-foreground/15 text-[11px] h-5">
                    {variantLabel}
                  </Badge>
                )}
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {price.source === 'user_upload' ? 'User reported' : 'Auto'} · {getTimeAgo(price.scraped_at)}
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 shrink-0"
              onClick={handleShare}
              aria-label="Share price"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
