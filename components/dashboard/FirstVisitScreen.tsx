'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { MapPin, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function FirstVisitScreen({
  onRequestLocation,
  onManualSearch,
}: {
  onRequestLocation: () => void
  onManualSearch: () => void
}) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden px-4">
      <div
        className="absolute top-1/4 -left-32 h-64 w-64 rounded-full opacity-20 blur-3xl"
        style={{ background: 'oklch(0.7 0.25 145)' }}
      />
      <div
        className="absolute bottom-1/4 -right-32 h-64 w-64 rounded-full opacity-10 blur-3xl"
        style={{ background: 'oklch(0.7 0.25 145)' }}
      />

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-10 flex flex-col items-center text-center max-w-lg"
      >
        <motion.div
          initial={shouldReduceMotion ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="h-1 w-16 rounded-full mb-8"
          style={{ background: 'oklch(0.7 0.25 145)' }}
        />

        <motion.h1
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight"
        >
          Find the cheapest{' '}
          <span style={{ color: 'oklch(0.7 0.25 145)' }}>Monster</span>{' '}
          near you
        </motion.h1>

        <motion.p
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="mt-4 text-base sm:text-lg text-muted-foreground max-w-md"
        >
          Compare prices across Cork stores in seconds
        </motion.p>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="mt-8 w-full sm:w-auto"
        >
          <Button
            size="lg"
            onClick={onRequestLocation}
            className="w-full sm:w-auto min-h-[48px] px-8 text-base gap-2"
          >
            <MapPin className="h-5 w-5" />
            Find nearby prices
          </Button>
        </motion.div>

        <motion.p
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="mt-3 text-xs text-muted-foreground"
        >
          Uses your location to find deals nearby
        </motion.p>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="mt-6"
        >
          <button
            onClick={onManualSearch}
            className="group inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px]"
          >
            Or search by area
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
