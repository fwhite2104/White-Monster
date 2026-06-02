'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { X, MapPin, CirclePlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getRetailerColor } from '@/lib/constants'

interface MapInfoCardStore {
  id: string
  name: string
  retailer: string
  address?: string
  distance?: number
}

interface MapInfoCardProps {
  store: MapInfoCardStore
  price?: number
  isCheapest?: boolean
  onReportPrice: (storeId: string) => void
  onClose: () => void
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m away`
  const km = meters / 1000
  return `${km.toFixed(1)} km away`
}

export function MapInfoCard({
  store,
  price,
  isCheapest,
  onReportPrice,
  onClose,
}: MapInfoCardProps) {
  const shouldReduceMotion = useReducedMotion()
  const retailerColor = getRetailerColor(store.retailer)

  const ease = [0.23, 1, 0.32, 1] as const

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease }}
      className="bg-card border-t border-border px-4 pt-3 pb-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: retailerColor }}
            />
            <span className="text-sm font-semibold truncate">{store.name}</span>
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span className="capitalize">{store.retailer}</span>
            {store.distance !== undefined && (
              <>
                <span>&middot;</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {formatDistance(store.distance)}
                </span>
              </>
            )}
          </div>

          {price !== undefined && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-lg font-bold tabular-nums text-primary">
                &euro;{Number(price).toFixed(2)}
              </span>
              {isCheapest && (
                <Badge variant="success" className="text-[10px] px-1.5 py-0 font-semibold">
                  Best Price
                </Badge>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="shrink-0 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full mt-3 gap-1.5"
        onClick={() => onReportPrice(store.id)}
      >
        <CirclePlus className="h-3.5 w-3.5" />
        {price !== undefined ? 'Report better price' : 'Report Price for this Store'}
      </Button>
    </motion.div>
  )
}
