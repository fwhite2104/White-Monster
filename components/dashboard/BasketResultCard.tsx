'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin } from 'lucide-react'
import { getRetailerColor } from '@/lib/constants'
import type { StoreAllocation } from '@/lib/basket-types'

interface BasketResultCardProps {
  allocation: StoreAllocation
  isBest?: boolean
}

export function BasketResultCard({ allocation, isBest }: BasketResultCardProps) {
  const shouldReduceMotion = useReducedMotion()
  const retailerColor = getRetailerColor(allocation.retailer)

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card
        className={
          isBest
            ? 'relative bg-card ring-1 ring-primary/30 overflow-hidden'
            : 'relative bg-card ring-1 ring-foreground/10 overflow-hidden'
        }
      >
        <div className="h-1 w-full" style={{ backgroundColor: retailerColor }} />

        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold truncate">{allocation.store_name}</span>
                {isBest && (
                  <Badge variant="success" className="text-[10px] px-1.5 py-0 font-semibold">
                    Best
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {(allocation.distance / 1000).toFixed(1)} km
                </span>
              </div>

              <div className="mt-2 space-y-1">
                {allocation.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {item.quantity}x {item.variant.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      {item.pack_size === '4_pack' ? ' 4-pack' : ''}
                    </span>
                    <span className="tabular-nums font-medium">
                      €{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-foreground/10">
                <span className="text-xs text-muted-foreground">Subtotal</span>
                <span className="text-sm font-bold tabular-nums">
                  €{allocation.subtotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
