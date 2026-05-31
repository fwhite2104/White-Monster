'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getDistance } from 'geolib'
import { CORK_CENTER } from '@/lib/constants'
import type { Price } from '@/lib/types'

interface PriceCardProps {
  price: Price
  isCheapest?: boolean
  userLat?: number
  userLng?: number
  onHover?: () => void
}

export function PriceCard({ price, isCheapest, userLat, userLng, onHover }: PriceCardProps) {
  const lat = userLat ?? CORK_CENTER.lat
  const lng = userLng ?? CORK_CENTER.lng
  const store = price.stores!
  const product = price.products!

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
    <Card
      className={isCheapest ? 'border-primary border-2' : ''}
      onMouseEnter={onHover}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{store.name}</h3>
            <p className="text-sm text-muted-foreground">{store.suburb}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {(distance / 1000).toFixed(1)} km away
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              EUR {Number(price.price).toFixed(2)}
            </p>
            {isCheapest && (
              <Badge className="bg-primary text-primary-foreground mt-1">
                Best Price
              </Badge>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center mt-3 pt-3 border-t">
          <Badge variant="outline">{store.retailer}</Badge>
          <span className="text-xs text-muted-foreground">
            {price.source === 'user_upload' ? 'User reported' : 'Auto-scraped'} &middot; {timeAgo}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
