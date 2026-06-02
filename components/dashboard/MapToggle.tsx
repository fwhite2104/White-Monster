'use client'

import { type ReactNode } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Map, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MapToggleProps {
  showMap: boolean
  onToggle: () => void
  storeCount: number
  children: ReactNode
}

export function MapToggle({ showMap, onToggle, storeCount, children }: MapToggleProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="md:hidden">
      <Button
        variant="outline"
        size="sm"
        className="h-11 px-4 w-full rounded-xl gap-2 text-sm font-medium"
        onClick={onToggle}
        aria-expanded={showMap}
        aria-label={showMap ? 'Hide map' : `View ${storeCount} stores on map`}
      >
        <Map className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">
          {showMap ? 'Hide map' : `View ${storeCount} store${storeCount !== 1 ? 's' : ''} on map`}
        </span>
        <motion.span
          animate={{ rotate: showMap ? 180 : 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
          className="shrink-0"
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.span>
      </Button>

      <AnimatePresence initial={false}>
        {showMap && (
          <motion.div
            key="map-container"
            initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-2">
              <div className="rounded-xl overflow-hidden ring-1 ring-border" style={{ maxHeight: '50vh' }}>
                {children}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
