'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, Share2, User, Bot, MoreHorizontal, CirclePlus, Check, X } from 'lucide-react'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'error'>('idle')
  const menuRef = useRef<HTMLDivElement>(null)
  const lat = Number.isFinite(userLat) ? (userLat as number) : CORK_CENTER.lat
  const lng = Number.isFinite(userLng) ? (userLng as number) : CORK_CENTER.lng
  const store = price.stores ?? { name: 'Unknown', retailer: 'other', lat: 0, lng: 0, suburb: '', address: '' }
  const product = price.products ?? { name: 'Unknown Product', variant: 'unknown', pack_size: 'single' }
  const retailerColor = getRetailerColor(store.retailer)
  const isUserReported = price.source === 'user_upload'

  const distance = getDistance(
    { latitude: lat, longitude: lng },
    { latitude: store.lat, longitude: store.lng }
  )

  const variantLabel = getVariantLabel(product)
  const perCanDisplay = formatPerCanPrice(price)

  const handleShare = useCallback(async () => {
    const canPrice = perCanDisplay ? ` (€${perCanDisplay}/can)` : ''
    const text = `Found ${product.name} for €${Number(price.price).toFixed(2)}${canPrice} at ${store.name}!`

    try {
      if (navigator.share) {
        await navigator.share({ text, url: window.location.href })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${text} ${window.location.href}`)
        setShareState('copied')
        setTimeout(() => setShareState('idle'), 2000)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = `${text} ${window.location.href}`
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        setShareState('copied')
        setTimeout(() => setShareState('idle'), 2000)
      }
    } catch {
      setShareState('error')
      setTimeout(() => setShareState('idle'), 2000)
    }
    setMenuOpen(false)
  }, [perCanDisplay, product.name, price.price, store.name])

  const handleReport = useCallback(() => {
    onReportPrice?.(price.store_id)
    setMenuOpen(false)
  }, [onReportPrice, price.store_id])

  useEffect(() => {
    if (!menuOpen) return

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

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
                {isCheapest && (
                  <motion.div
                    initial={shouldReduceMotion ? false : { scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <Badge variant="success" className="text-[10px] px-1.5 py-0 font-semibold">
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
                {variantLabel && (
                  <Badge variant="outline" className="border-foreground/15 text-[11px] h-5">
                    {variantLabel}
                  </Badge>
                )}
                <Badge
                  variant={isUserReported ? 'info' : 'outline'}
                  className="text-[10px] h-5 gap-1"
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
              <div className="relative shrink-0 mt-0.5" ref={menuRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-foreground"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  aria-label="More actions"
                  aria-expanded={menuOpen}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>

                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -4, transition: { duration: 0.15, ease: [0.23, 1, 0.32, 1] } }}
                      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                      className="absolute right-0 top-full z-50 mt-1 bg-popover ring-1 ring-foreground/10 rounded-lg p-1 shadow-lg min-w-[180px]"
                    >
                      <button
                        type="button"
                        onClick={handleShare}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-muted text-left cursor-pointer"
                      >
                        {shareState === 'copied' ? (
                          <Check className="h-4 w-4 shrink-0 text-green-500" />
                        ) : shareState === 'error' ? (
                          <X className="h-4 w-4 shrink-0 text-red-500" />
                        ) : (
                          <Share2 className="h-4 w-4 shrink-0" />
                        )}
                        {shareState === 'copied' ? 'Copied!' : shareState === 'error' ? 'Failed' : 'Share'}
                      </button>
                      <button
                        type="button"
                        onClick={handleReport}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-muted text-left cursor-pointer"
                      >
                        <CirclePlus className="h-4 w-4 shrink-0" />
                        Report better price
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 mt-0.5 text-muted-foreground hover:text-foreground"
                onClick={handleShare}
                aria-label="Share price"
              >
                {shareState === 'copied' ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : shareState === 'error' ? (
                  <X className="h-4 w-4 text-red-500" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
