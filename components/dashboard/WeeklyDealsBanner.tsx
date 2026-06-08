'use client'

import { useDeals } from '@/hooks/use-deals'
import { DealCard } from '@/components/dashboard/DealCard'
import { Flame } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

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
        <h2 className="text-sm font-semibold">This Week&apos;s Deals</h2>
        <span className="text-xs text-muted-foreground">{deals.length} active</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
        {deals.slice(0, 5).map((deal) => (
          <div key={deal.id} className="min-w-[260px] max-w-[300px] shrink-0">
            <DealCard deal={deal} />
          </div>
        ))}
      </div>
    </motion.section>
  )
}
