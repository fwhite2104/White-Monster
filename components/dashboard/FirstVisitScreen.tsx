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

/* Pure CSS particles — 20 floating dots with staggered animation */
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${(i * 37 + 13) % 100}%`,
  top: `${(i * 53 + 7) % 100}%`,
  size: 2 + (i % 3),
  delay: `${(i * 0.7) % 8}s`,
  duration: `${6 + (i % 5) * 2}s`,
}))

function ParticleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            background: p.id % 3 === 0
              ? 'oklch(0.72 0.22 145 / 0.5)'
              : p.id % 3 === 1
                ? 'oklch(0.78 0.18 195 / 0.4)'
                : 'rgba(255,255,255,0.3)',
            animation: `particle-float ${p.duration} ease-in-out ${p.delay} infinite`,
          }}
        />
      ))}
    </div>
  )
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
    <div className="relative min-h-[calc(100svh-4rem)] flex items-center justify-center overflow-hidden px-4 py-10">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 40%, oklch(0.72 0.22 145 / 0.06) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {!shouldReduceMotion && <ParticleField />}

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: DURATION_BASE, ease: EASE_OUT }}
        className="relative z-10 flex flex-col items-center text-center max-w-lg lg:max-w-xl rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 px-6 py-10 sm:px-10 sm:py-12"
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
          className="text-[2rem] sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.03em] text-foreground leading-[1.08]"
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
          className="mt-4 text-sm sm:text-base text-muted-foreground max-w-sm lg:max-w-md leading-relaxed"
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
          className="mt-8 w-full sm:w-auto sm:min-w-[260px]"
        >
          <Button
            size="lg"
            onClick={onRequestLocation}
            className="w-full sm:w-auto min-h-[52px] px-8 text-[15px] font-semibold gap-2.5 rounded-xl"
            style={{
              boxShadow: '0 0 24px oklch(0.72 0.22 145 / 0.4), 0 0 64px oklch(0.72 0.22 145 / 0.15)',
            }}
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
            className="mt-5 w-full sm:w-auto md:hidden"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={onReportPrice}
              className="w-full sm:w-auto min-h-[44px] px-6 gap-2 text-sm rounded-lg border-white/10 hover:border-primary/40 hover:bg-white/5"
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
          className="mt-7 flex items-center gap-3 text-xs text-muted-foreground/70"
        >
          <span className="inline-flex items-center gap-1.5">
            <Scan className="h-3.5 w-3.5" />
            Automated checks
          </span>
          <span className="h-3 w-px bg-white/10" />
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Community reports
          </span>
        </motion.div>
      </motion.div>
    </div>
  )
}
