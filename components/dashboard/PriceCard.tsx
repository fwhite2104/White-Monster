'use client'

import { useState, useCallback } from 'react'
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
import { CORK_CENTER, getRetailerColor } from '@/lib/constants'
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
  const packLabel = product.pack_size === '4_pack' ? '4-pack'
    : product.pack_size === 'single' ? 'Single can'
    : product.pack_size ?? ''
  return [variantName, packLabel].filter(Boolean).join(' · ')
}

function formatPerCanPrice(price: Price): string | null {
  if (price.products?.pack_size !== '4_pack') return null
  return Number(price.per_can_price ?? Number(price.price) / 4).toFixed(2)
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

  const distance = getDistance(
    { latitude: lat, longitude: lng },
    { latitude: store.lat, longitude: store.lng }
  )

  const variantLabel = getVariantLabel(product)
  const perCanDisplay = formatPerCanPrice(price)

  const handleShare = useCallback(() => {
    const canPrice = perCanDisplay ? ` (€${perCanDisplay}/can)` : ''
    const text = `Found ${product.name} for €${Number(price.price).toFixed(2)}${canPrice} at ${store.name}!`
    navigator.clipboard.writeText(`${text} ${window.location.href}`)
  }, [perCanDisplay, product.name, price.price, store.name])

  const handleReport = useCallback(() => {
    onReportPrice?.(price.store_id)
  }, [onReportPrice, price.store_id])

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
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
        <CardContent className="p-0 min-h-[80px]">
          <div
            className="h-1 w-full rounded-t-[var(--radius)]"
            style={{ backgroundColor: retailerColor }}
          />

          <div className="px-4 py-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span
                  className="text-[1.65rem] font-bold tracking-tight leading-none tabular-nums"
                  style={{ color: isCheapest ? 'oklch(0.72 0.22 145)' : undefined }}
                >
                  €{Number(price.price).toFixed(2)}
                </span>
                {perCanDisplay && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    (€{perCanDisplay}/can)
                  </span>
                )}
                {price.drs_deposit !== undefined && price.drs_deposit > 0 && (
                  <DrsBreakdown totalPrice={Number(price.price)} packSize={product.pack_size} />
                )}
                {price.has_clubcard_pricing && price.clubcard_price != null && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <ClubcardBadge />
                    <span className="text-sm font-semibold text-blue-400 tabular-nums">
                      €{Number(price.clubcard_price).toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground line-through">
                      €{Number(price.price).toFixed(2)}
                    </span>
                    <span className="text-xs text-blue-400">
                      Save €{(Number(price.price) - Number(price.clubcard_price)).toFixed(2)}
                    </span>
                  </div>
                )}
                {isCheapest && (
                  <motion.div
                    initial={shouldReduceMotion ? false : { scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <Badge variant="success" className="text-xs px-1.5 py-0 font-semibold">
                      Best Price
                    </Badge>
                  </motion.div>
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-sm font-medium truncate">{store.name}</span>
                {store.suburb && (
                  <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                    · {store.suburb}
                  </span>
                )}
                <span className="text-xs text-muted-foreground ml-auto shrink-0 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {(distance / 1000).toFixed(1)} km
                </span>
              </div>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {'store_type' in store && (store.store_type === 'convenience' || store.store_type === 'petrol_station') && (
                  <Badge variant="info" className="text-xs h-5 gap-1 bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20">
                    <Store className="h-2.5 w-2.5" />
                    {store.store_type === 'petrol_station' ? 'Petrol Station' : 'Convenience Store'}
                  </Badge>
                )}
                {variantLabel && (
                  <Badge variant="outline" className="border-foreground/15 text-xs h-5">
                    {variantLabel}
                  </Badge>
                )}
                <Badge
                  variant={isUserReported ? 'info' : 'outline'}
                  className="text-xs h-5 gap-1"
                >
                  {isUserReported ? (
                    <User className="h-2.5 w-2.5" />
                  ) : (
                    <Bot className="h-2.5 w-2.5" />
                  )}
                  {isUserReported ? 'User reported' : 'Auto'}
                </Badge>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {getTimeAgo(price.scraped_at)}
                </span>
              </div>
            </div>

            {onReportPrice ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-lg"
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
                size="icon-lg"
                className="h-11 w-11 shrink-0 mt-0.5 text-muted-foreground hover:text-foreground"
                onClick={handleShare}
                aria-label="Share price"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            )}
            <FavoriteButton productId={price.product_id} storeId={price.store_id} />
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
