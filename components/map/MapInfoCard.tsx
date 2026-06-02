'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
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
    <AnimatePresence>
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={
          shouldReduceMotion
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.95, transition: { duration: 0.15, ease } }
        }
        transition={{ duration: 0.25, ease }}
        className={`
          fixed bottom-20 left-4 right-4 z-40
          md:absolute md:bottom-full md:left-1/2 md:-translate-x-1/2 md:mb-3
          md:w-72 md:max-w-72
        `}
      >
        <div
          className="
            hidden md:block
            absolute top-full left-1/2 -translate-x-1/2
            w-0 h-0
            border-l-[6px] border-l-transparent
            border-r-[6px] border-r-transparent
            border-t-[6px] border-t-card
          "
        />

        <div className="rounded-xl bg-card ring-1 ring-foreground/10 p-4 shadow-lg">
          <Button
            variant="ghost"
            size="icon-xs"
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </Button>

          <div
            className="h-1 w-full rounded-full mb-3"
            style={{ backgroundColor: retailerColor }}
          />

          <div className="min-w-0">
            <div className="flex items-start gap-2">
              <span className="text-sm font-semibold truncate min-w-0 flex-1">
                {store.name}
              </span>
            </div>

            <span className="text-xs text-muted-foreground mt-0.5 block truncate">
              {store.retailer}
            </span>

            {store.address && (
              <span className="text-xs text-muted-foreground/70 mt-0.5 block truncate">
                {store.address}
              </span>
            )}
          </div>

          {price !== undefined && (
            <div className="flex items-baseline gap-2 mt-2.5">
              <span
                className="text-xl font-bold tracking-tight leading-none tabular-nums"
                style={{ color: 'oklch(0.72 0.22 145)' }}
              >
                {'\u20AC'}{Number(price).toFixed(2)}
              </span>
              {isCheapest && (
                  <motion.div
                    initial={shouldReduceMotion ? false : { scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                  >
                  <Badge variant="success" className="text-[10px] px-1.5 py-0 font-semibold">
                    Best Price
                  </Badge>
                </motion.div>
              )}
            </div>
          )}

          {store.distance !== undefined && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span>{formatDistance(store.distance)}</span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3 gap-1.5"
            onClick={() => onReportPrice(store.id)}
          >
            <CirclePlus className="h-3.5 w-3.5" />
            Report Price for this Store
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
