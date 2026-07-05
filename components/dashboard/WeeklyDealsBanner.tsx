'use client'

import { useDeals } from '@/hooks/use-deals'
import { DealCard } from '@/components/dashboard/DealCard'
import { Flame } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

const gridVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] as const },
  },
}

export function WeeklyDealsBanner() {
  const { deals, loading } = useDeals()
  const shouldReduceMotion = useReducedMotion()

  if (loading || deals.length === 0) return null

  return (
    <motion.section
      initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <Flame className="h-4 w-4 text-orange-400" />
        <h2 className="text-heading-sm font-semibold">This Week&apos;s Deals</h2>
        <span className="text-xs text-muted-foreground">{deals.length} active</span>
      </div>

      <motion.div
        className="flex gap-3 overflow-x-auto scrollbar-none pb-2"
        style={{ scrollSnapType: 'x mandatory' }}
        variants={shouldReduceMotion ? undefined : gridVariants}
        initial={shouldReduceMotion ? false : 'hidden'}
        animate={shouldReduceMotion ? false : 'show'}
      >
        {deals.slice(0, 9).map((deal) => (
          <motion.div
            key={deal.id}
            variants={shouldReduceMotion ? undefined : cardVariants}
            className="shrink-0 w-[280px] sm:w-[320px]"
            style={{ scrollSnapAlign: 'start' }}
          >
            <DealCard deal={deal} />
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  )
}
