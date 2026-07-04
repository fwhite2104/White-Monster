'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tag, MapPin } from 'lucide-react'
import { getRetailerColor } from '@/lib/constants'
import { DealBadge, SavingBadge } from '@/components/dashboard/DealBadge'
import { DealExpiryTimer } from '@/components/dashboard/DealExpiryTimer'
import type { Deal } from '@/lib/deals'

interface DealCardProps {
  deal: Deal
}

export function DealCard({ deal }: DealCardProps) {
  const shouldReduceMotion = useReducedMotion()
  const retailerColor = getRetailerColor(deal.retailer)

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
    >
      <Card className="relative bg-card ring-1 ring-foreground/10 hover:ring-foreground/20 overflow-hidden card-shadow-sm hover:card-shadow-md">
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: retailerColor }}
        />

        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DealBadge dealType={deal.deal_type} />
                <SavingBadge savingsPercent={deal.savings_percent} />
              </div>

              <h3 className="text-sm font-semibold mt-1.5 truncate">{deal.title}</h3>

              {deal.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{deal.description}</p>
              )}

              <div className="flex items-baseline gap-2 mt-2 flex-wrap">
                <span className="text-price-lg price-hero text-primary">
                  €{Number(deal.deal_price).toFixed(2)}
                </span>
                <span className="text-xs text-muted-foreground line-through tabular-nums">
                  €{Number(deal.original_price).toFixed(2)}
                </span>
                {deal.min_quantity > 1 && (
                  <span className="text-xs text-muted-foreground">
                    (min {deal.min_quantity})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 mt-2">
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {deal.retailer.charAt(0).toUpperCase() + deal.retailer.slice(1)}
                </span>
                <DealExpiryTimer validUntil={deal.valid_until} />
              </div>

              {deal.products && deal.products.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
                  {deal.products.slice(0, 3).map((p) => (
                    <Badge key={p.id} variant="outline" className="text-xs h-4 border-foreground/15">
                      {p.name}
                    </Badge>
                  ))}
                  {deal.products.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{deal.products.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
