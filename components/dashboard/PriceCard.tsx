'use client'

import { useState, useCallback, useMemo } from 'react'
import { useAnimatedNumber } from '@/hooks/use-animated-number'
import { motion, useReducedMotion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, Share2, User, Bot, MoreHorizontal, CirclePlus, Bell, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { getDistance } from 'geolib'
import { CORK_CENTER, getPackCount, formatPackSize, getRetailerColor } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { getTimeAgo } from '@/lib/geo'
import { PriceAlertDialog } from '@/components/dashboard/PriceAlertDialog'
import { FavoriteButton } from '@/components/dashboard/FavoriteButton'
import { DrsBreakdown } from '@/components/dashboard/DrsBreakdown'
import { ClubcardBadge } from '@/components/dashboard/ClubcardBadge'
import type { Price } from '@/lib/types'

interface PriceCardProps {
  price: Price
  isCheapest?: boolean
  userLat?: number
  userLng?: number
  onHover?: () => void
  onReportPrice?: (storeId: string) => void
}

function getVariantLabel(product: { variant?: string; pack_size?: string }): string {
  const variantName = product.variant
    ? product.variant.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : ''
  const packLabel = formatPackSize(product.pack_size ?? '')
  return [variantName, packLabel].filter(Boolean).join(' · ')
}

function formatPerCanPrice(price: Price): string | null {
  const count = getPackCount(price.products?.pack_size ?? 'single')
  if (count <= 1) return null
  return Number(price.per_can_price ?? Number(price.price) / count).toFixed(2)
}

export function PriceCard({ price, isCheapest, userLat, userLng, onHover, onReportPrice }: PriceCardProps) {
  const shouldReduceMotion = useReducedMotion()
  const [alertOpen, setAlertOpen] = useState(false)
  const lat = Number.isFinite(userLat) ? (userLat as number) : CORK_CENTER.lat
  const lng = Number.isFinite(userLng) ? (userLng as number) : CORK_CENTER.lng
  const store = price.stores ?? { name: 'Unknown', retailer: 'other', lat: 0, lng: 0, suburb: '', address: '' }
  const product = price.products ?? { name: 'Unknown Product', variant: 'unknown', pack_size: 'single' }
  const retailerColor = getRetailerColor(store.retailer)
  const isUserReported = price.source === 'user_upload' || price.source === 'user_reported'

  const distance = useMemo(
    () =>
      getDistance(
        { latitude: lat, longitude: lng },
        { latitude: store.lat, longitude: store.lng }
      ),
    [lat, lng, store.lat, store.lng]
  )

  const variantLabel = getVariantLabel(product)
  const perCanDisplay = formatPerCanPrice(price)

  const handleShare = useCallback(() => {
    const canPrice = perCanDisplay ? ` (€${perCanDisplay}/can)` : ''
    const text = `Found ${product.name} for €${Number(price.price).toFixed(2)}${canPrice} at ${store.name}!`
    navigator.clipboard.writeText(text)
  }, [perCanDisplay, product.name, price.price, store.name])

  const handleReport = useCallback(() => {
    onReportPrice?.(price.store_id)
  }, [onReportPrice, price.store_id])

  const hasDrs = price.drs_deposit !== undefined && price.drs_deposit > 0
  const hasClubcard = price.has_clubcard_pricing && price.clubcard_price != null
  const isConvenienceStore = 'store_type' in store && (store.store_type === 'convenience' || store.store_type === 'petrol_station')

  const animatedPrice = useAnimatedNumber(Number(price.price))

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={shouldReduceMotion ? {} : { boxShadow: 'var(--shadow-md)' }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      onMouseEnter={onHover}
      className="relative"
    >
      <Card
        className={
          isCheapest
            ? 'relative bg-card ring-1 ring-primary/20 overflow-hidden border-l-[2px] card-shadow-md'
            : 'relative bg-card ring-1 ring-foreground/8 hover:ring-foreground/15 overflow-hidden transition-[ring-color] duration-200 border-l-[2px] card-shadow-sm hover:card-shadow-md'
        }
        style={{ borderLeftColor: `${retailerColor}99` }}
      >

        <CardContent className="ps-5 pe-4 py-4">
          {/* Row 1: Price + Actions */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span
                  className={cn(
                    'text-price-lg price-hero leading-none',
                    isCheapest ? 'text-primary' : 'text-foreground',
                  )}
                >
                  €{animatedPrice}
                </span>
                {perCanDisplay && (
                  <span className="text-price-sm text-muted-foreground tabular-nums">
                    €{perCanDisplay}/can
                  </span>
                )}
                {isCheapest && (
                  <motion.div
                    initial={shouldReduceMotion ? false : { scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <Badge variant="success" className="text-xs px-1.5 py-0 font-semibold tracking-wide uppercase">
                      Best Price
                    </Badge>
                  </motion.div>
                )}
              </div>

              {/* DRS sub-line */}
              {hasDrs && (
                <DrsBreakdown totalPrice={Number(price.price)} packSize={product.pack_size} className="mt-1" />
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-0.5 shrink-0 -mr-1">
              {onReportPrice ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 text-muted-foreground hover:text-foreground"
                        aria-label="More actions"
                      />
                    }
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={4}>
                    <DropdownMenuItem onClick={handleShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleReport}>
                      <CirclePlus className="h-4 w-4 mr-2" />
                      Report better price
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAlertOpen(true)}>
                      <Bell className="h-4 w-4 mr-2" />
                      Set price alert
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={handleShare}
                  aria-label="Share price"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
              <FavoriteButton productId={price.product_id} storeId={price.store_id} className="mt-0" />
            </div>
          </div>

          {/* Row 2: Store name + location */}
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="text-sm font-medium truncate">{store.name}</span>
            {store.suburb && (
              <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                · {store.suburb}
              </span>
            )}
            <span className="ml-auto shrink-0 inline-flex items-center gap-1 text-xs tabular-nums px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {(distance / 1000).toFixed(1)} km
            </span>
          </div>

          {/* Row 3: Clubcard pricing (if applicable) */}
          {hasClubcard && (
            <div className="mt-2.5 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-500/8 border border-blue-500/15">
              <ClubcardBadge />
              <span className="text-sm font-semibold text-blue-400 tabular-nums">
                €{Number(price.clubcard_price).toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground line-through">
                €{Number(price.price).toFixed(2)}
              </span>
              <span className="text-xs text-blue-400/80 ml-auto">
                Save €{(Number(price.price) - Number(price.clubcard_price)).toFixed(2)}
              </span>
            </div>
          )}

          {/* Row 4: Metadata badges + timestamp */}
          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
            {isConvenienceStore && (
              <Badge variant="info" className="text-xs h-5 gap-1 bg-amber-500/12 text-amber-400 ring-1 ring-amber-500/15">
                <Store className="h-2.5 w-2.5" />
                {store.store_type === 'petrol_station' ? 'Petrol Station' : 'Convenience'}
              </Badge>
            )}
            {variantLabel && (
              <Badge variant="outline" className="border-foreground/10 text-xs h-5 font-normal">
                {variantLabel}
              </Badge>
            )}
            <Badge
              variant={isUserReported ? 'info' : 'outline'}
              className="text-xs h-5 gap-1 font-normal"
            >
              {isUserReported ? (
                <User className="h-2.5 w-2.5" />
              ) : (
                <Bot className="h-2.5 w-2.5" />
              )}
              {isUserReported ? 'User' : 'Auto'}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto tabular-nums">
              <Clock className="h-3 w-3" />
              {getTimeAgo(price.scraped_at)}
            </span>
          </div>
        </CardContent>
      </Card>

      <PriceAlertDialog
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        onCreated={() => setAlertOpen(false)}
        variant={product.variant}
      />
    </motion.div>
  )
}
