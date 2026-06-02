'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { MapPin, ChevronRight, CirclePlus, Scan, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

const EASE_OUT = [0.23, 1, 0.32, 1] as const
const DURATION_BASE = 0.45
const DURATION_STAGGER = 0.06

function staggerDelay(index: number) {
  return 0.12 + index * DURATION_STAGGER
}

export function FirstVisitScreen({
  onRequestLocation,
  onManualSearch,
  onReportPrice,
}: {
  onRequestLocation: () => void
  onManualSearch: () => void
  onReportPrice?: () => void
}) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden px-4 py-16">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="absolute top-0 left-0 w-px h-40 bg-gradient-to-b from-transparent via-[color:var(--color-brand-glow)] to-transparent opacity-60" />
      <div className="absolute bottom-0 right-0 w-px h-40 bg-gradient-to-t from-transparent via-[color:var(--color-brand-glow)] to-transparent opacity-60" />
      <div className="absolute top-24 right-0 h-px w-32 bg-gradient-to-l from-transparent via-[color:var(--color-brand-glow)] to-transparent opacity-40" />
      <div className="absolute bottom-24 left-0 h-px w-32 bg-gradient-to-r from-transparent via-[color:var(--color-brand-glow)] to-transparent opacity-40" />

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: DURATION_BASE, ease: EASE_OUT }}
        className="relative z-10 flex flex-col items-center text-center max-w-lg"
      >
        <motion.div
          initial={shouldReduceMotion ? false : { scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{
            duration: 0.35,
            delay: staggerDelay(0),
            ease: EASE_OUT,
          }}
          className="h-[3px] w-12 rounded-full mb-6 origin-center"
          style={{ background: 'var(--color-primary)' }}
        />

        <motion.h1
          initial={shouldReduceMotion ? false : { opacity: 0, y: 18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: DURATION_BASE,
            delay: staggerDelay(1),
            ease: EASE_OUT,
          }}
          className="text-[2rem] sm:text-4xl md:text-5xl font-bold tracking-[-0.03em] text-foreground leading-[1.08]"
        >
          Find the cheapest{' '}
          <span className="text-primary">Monster</span>
          <br />
          near you
        </motion.h1>

        <motion.p
          initial={shouldReduceMotion ? false : { opacity: 0, y: 14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: DURATION_BASE,
            delay: staggerDelay(2),
            ease: EASE_OUT,
          }}
          className="mt-4 text-sm sm:text-base text-muted-foreground max-w-sm leading-relaxed"
        >
          Live prices from every Cork store — Tesco, Dunnes, SuperValu, Lidl, Aldi and more
        </motion.p>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: DURATION_BASE,
            delay: staggerDelay(3),
            ease: EASE_OUT,
          }}
          className="mt-8 w-full sm:w-auto"
        >
          <Button
            size="lg"
            onClick={onRequestLocation}
            className="w-full sm:w-auto min-h-[52px] px-8 text-[15px] font-semibold gap-2.5 rounded-xl shadow-[0_0_24px_var(--color-brand-glow)]"
          >
            <MapPin className="h-5 w-5" />
            Find nearby prices
          </Button>
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: DURATION_BASE,
            delay: staggerDelay(4),
            ease: EASE_OUT,
          }}
          className="mt-4"
        >
          <button
            onClick={onManualSearch}
            className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px]"
          >
            Or search by area
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </motion.div>

        {onReportPrice && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: DURATION_BASE,
              delay: staggerDelay(5),
              ease: EASE_OUT,
            }}
            className="mt-5 w-full sm:w-auto"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={onReportPrice}
              className="w-full sm:w-auto min-h-[44px] px-6 gap-2 text-sm rounded-lg border-border hover:border-primary/40 hover:bg-[color:var(--color-brand-muted)]"
            >
              <CirclePlus className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Report a Price</span>
            </Button>
          </motion.div>
        )}

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: DURATION_BASE,
            delay: staggerDelay(6),
            ease: EASE_OUT,
          }}
          className="mt-7 flex items-center gap-3 text-[11px] text-muted-foreground/70"
        >
          <span className="inline-flex items-center gap-1.5">
            <Scan className="h-3.5 w-3.5" />
            Automated checks
          </span>
          <span className="h-3 w-px bg-border" />
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Community reports
          </span>
        </motion.div>
      </motion.div>
    </div>
  )
}
