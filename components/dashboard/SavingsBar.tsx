'use client'

import { useState, useMemo } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { X, TrendingDown, MapPin } from 'lucide-react'
import type { Price } from '@/lib/types'

interface SavingsBarProps {
  prices: Price[]
}

export function SavingsBar({ prices }: SavingsBarProps) {
  const [dismissed, setDismissed] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  const savings = useMemo(() => {
    if (prices.length < 2) return null
    const cheapest = prices[0]
    const mostExpensive = prices[prices.length - 1]
    const diff = Number(mostExpensive.price) - Number(cheapest.price)
    if (diff <= 0) return null
    const cheapestProduct = cheapest.products ?? { pack_size: 'single' }
    return {
      amount: diff,
      storeName: cheapest.stores?.name ?? 'Unknown',
      cheapestPrice: Number(cheapest.price),
      mostExpensivePrice: Number(mostExpensive.price),
      cheapestPerCan: cheapestProduct.pack_size === '4_pack'
        ? Number(cheapest.per_can_price ?? Number(cheapest.price) / 4).toFixed(2)
        : null,
    }
  }, [prices])

  return (
    <AnimatePresence>
      {savings && !dismissed && (
        <motion.div
          initial={shouldReduceMotion ? undefined : { y: 64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={shouldReduceMotion ? undefined : { y: 64, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={[
            'fixed left-0 right-0 z-30',
            'bottom-[68px] md:bottom-0',
            'bg-gradient-to-r from-primary/90 via-primary/85 to-primary/90',
            'backdrop-blur-md',
            'border-t border-primary/20',
            'shadow-lg',
          ].join(' ')}
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          role="status"
          aria-live="polite"
        >
          <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-foreground/15 shrink-0">
                <TrendingDown className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-primary-foreground leading-tight">
                  You could save{' '}
                  <span className="text-base">€{savings.amount.toFixed(2)}</span>
                </p>
                <p className="text-[11px] text-primary-foreground/70 leading-tight mt-0.5 flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      Best price at {savings.storeName} (€{savings.cheapestPrice.toFixed(2)})
                      {savings.cheapestPerCan && (
                        <span className="text-primary-foreground/50"> · €{savings.cheapestPerCan}/can</span>
                      )}
                    </span>
                </p>
              </div>
            </div>

            <motion.button
              whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
              onClick={() => setDismissed(true)}
              className={[
                'flex items-center justify-center',
                'h-8 w-8 rounded-full shrink-0',
                'bg-primary-foreground/10 hover:bg-primary-foreground/20',
                'text-primary-foreground/80 hover:text-primary-foreground',
                'transition-colors',
              ].join(' ')}
              aria-label="Dismiss savings bar"
            >
              <X className="h-4 w-4" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
