'use client'

import { useState, useMemo } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { X, TrendingDown, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPackCount } from '@/lib/constants'
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
    const count = getPackCount(cheapestProduct.pack_size)
    return {
      amount: diff,
      storeName: cheapest.stores?.name ?? 'Unknown',
      cheapestPrice: Number(cheapest.price),
      mostExpensivePrice: Number(mostExpensive.price),
      cheapestPerCan: count > 1 ? (cheapest.per_can_price ? Number(cheapest.per_can_price).toFixed(2) : (Number(cheapest.price) / count).toFixed(2)) : null,
    }
  }, [prices])

  return (
    <AnimatePresence>
      {savings && !dismissed && (
        <motion.div
          initial={shouldReduceMotion ? undefined : { y: 64, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={shouldReduceMotion ? undefined : { y: 64, opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] } }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className={cn(
            'fixed left-0 right-0 z-[var(--z-bar)]',
            'bottom-20 md:bottom-0',
            'bg-primary/95',
            'backdrop-blur-md',
            'border-t border-primary-dark/30',
            'shadow-[0_-4px_20px_oklch(0.72_0.22_145_/_0.2)]',
            'pb-safe'
          )}
          role="status"
          aria-live="polite"
        >
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center justify-center size-7 rounded-full bg-primary-foreground/15 shrink-0">
                <TrendingDown className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-primary-foreground leading-tight">
                  You could save{' '}
                  <span className="text-base">{'\u20AC'}{savings.amount.toFixed(2)}</span>
                </p>
                <p className="text-xs text-primary-foreground/70 leading-tight mt-0.5 flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      Best price at {savings.storeName} ({'\u20AC'}{savings.cheapestPrice.toFixed(2)})
                      {savings.cheapestPerCan && (
                        <span className="text-primary-foreground/50"> {'\u00B7'} {'\u20AC'}{savings.cheapestPerCan}/can</span>
                      )}
                    </span>
                </p>
              </div>
            </div>

            <motion.button
              whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
              onClick={() => setDismissed(true)}
              className={cn(
                'flex items-center justify-center',
                'size-8 rounded-full shrink-0',
                'bg-primary-foreground/10 hover:bg-primary-foreground/20',
                'text-primary-foreground/80 hover:text-primary-foreground',
                'transition-colors duration-200'
              )}
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
