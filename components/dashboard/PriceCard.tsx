'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, Tag, Share2, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getDistance } from 'geolib'
import { CORK_CENTER, RETAILERS } from '@/lib/constants'
import type { Price } from '@/lib/types'

interface PriceCardProps {
  price: Price
  isCheapest?: boolean
  userLat?: number
  userLng?: number
  onHover?: () => void
}

function getRetailerColor(retailer: string): string {
  const found = RETAILERS.find((r) => r.value === retailer.toLowerCase())
  return found?.color ?? '#6B7280'
}

export function PriceCard({ price, isCheapest, userLat, userLng, onHover }: PriceCardProps) {
  const shouldReduceMotion = useReducedMotion()
  const lat = userLat ?? CORK_CENTER.lat
  const lng = userLng ?? CORK_CENTER.lng
  const store = price.stores!
  const product = price.products!
  const retailerColor = getRetailerColor(store.retailer)

  const distance = getDistance(
    { latitude: lat, longitude: lng },
    { latitude: store.lat, longitude: store.lng }
  )

  const timeAgo = (() => {
    const diff = Date.now() - new Date(price.scraped_at).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  })()

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={shouldReduceMotion ? {} : { scale: 1.01, y: -2 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
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
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}

      <Card
        className={
          isCheapest
            ? 'relative bg-card ring-1 ring-primary/30'
            : 'relative bg-card ring-1 ring-foreground/10 hover:ring-foreground/20'
        }
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: retailerColor }}
                />
                <h3 className="font-semibold truncate">{store.name}</h3>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{store.suburb}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {(distance / 1000).toFixed(1)} km away
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-2xl font-bold" style={{ color: isCheapest ? 'oklch(0.7 0.25 145)' : undefined }}>
                EUR {Number(price.price).toFixed(2)}
              </p>
              {isCheapest && (
                <motion.div
                  initial={shouldReduceMotion ? false : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <Badge className="bg-primary text-primary-foreground mt-1">
                    Best Price
                  </Badge>
                </motion.div>
              )}
              <div className="flex items-center gap-1 mt-2">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                  const text = `Found ${product.name} for EUR ${Number(price.price).toFixed(2)} at ${store.retailer}!`
                  navigator.clipboard.writeText(`${text} ${window.location.href}`)
                }}>
                  <Share2 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => alert('Price alert feature coming soon!')}>
                  <Bell className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/50">
            <Badge
              variant="outline"
              className="border-foreground/20"
              style={{ borderColor: `${retailerColor}50` }}
            >
              <span
                className="mr-1.5 h-2 w-2 rounded-full inline-block"
                style={{ backgroundColor: retailerColor }}
              />
              {store.retailer}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {price.source === 'user_upload' ? 'User reported' : 'Auto-scraped'} &middot; {timeAgo}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
