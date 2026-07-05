'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, useReducedMotion, useInView, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MonsterCanIcon } from '@/components/ui/MonsterCanIcon'
import { PriceCard } from './PriceCard'
import { ReportPriceCard } from '@/components/dashboard/ReportPriceCard'
import type { Price } from '@/lib/types'

const INITIAL_DISPLAY_COUNT = 3
const REPORT_PROMPT_INSERT_INDEX = 5

interface PriceListProps {
  prices: Price[]
  userLat?: number
  userLng?: number
  highlightedStoreId?: string | null
  onStoreHover?: (storeId: string | null) => void
  onReportPrice?: () => void
  onWidenRadius?: () => void
  reportPromptShown?: boolean
  onReportPromptSeen?: () => void
}

export function PriceList({
  prices,
  userLat,
  userLng,
  onStoreHover,
  onReportPrice,
  onWidenRadius,
  reportPromptShown,
  onReportPromptSeen,
}: PriceListProps) {
  const shouldReduceMotion = useReducedMotion()
  const [showAll, setShowAll] = useState(false)
  const reportCardRef = useRef<HTMLDivElement>(null)
  const reportCardInView = useInView(reportCardRef, { once: true, amount: 0.3 })

  const totalCount = prices.length
  const hiddenCount = Math.max(0, totalCount - INITIAL_DISPLAY_COUNT)
  const displayedPrices = showAll ? prices : prices.slice(0, INITIAL_DISPLAY_COUNT)

  const shouldShowReportCard =
    onReportPrice &&
    displayedPrices.length > REPORT_PROMPT_INSERT_INDEX &&
    !reportPromptShown

  const handleReportPromptInView = useCallback(() => {
    if (onReportPromptSeen) {
      onReportPromptSeen()
    }
  }, [onReportPromptSeen])

  useEffect(() => {
    if (reportCardInView) {
      handleReportPromptInView()
    }
  }, [reportCardInView, handleReportPromptInView])

  if (prices.length === 0) {
    return (
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col items-center justify-center text-center py-16 px-6 gap-5"
      >
        {/* Monster can SVG */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
          aria-hidden="true"
        >
          <MonsterCanIcon className="opacity-30" />
        </motion.div>

        <div className="flex flex-col gap-1.5">
          <p className="text-base font-semibold text-foreground">No prices found in this area</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            No Monster deals spotted nearby. Try widening your search.
          </p>
        </div>

        {onWidenRadius && (
          <Button
            variant="outline"
            size="sm"
            onClick={onWidenRadius}
            className="gap-2"
          >
            Widen search radius
          </Button>
        )}
      </motion.div>
    )
  }

  const items: React.ReactNode[] = []

  displayedPrices.forEach((price, index) => {
    if (shouldShowReportCard && index === REPORT_PROMPT_INSERT_INDEX) {
      items.push(
        <motion.div
          key="report-price-card-inline"
          ref={reportCardRef}
          initial={shouldReduceMotion ? false : { scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: showAll ? 0 : REPORT_PROMPT_INSERT_INDEX * 0.05,
            duration: 0.3,
            ease: [0.23, 1, 0.32, 1],
          }}
          layout
          role="listitem"
          className="sm:col-span-2"
        >
          <ReportPriceCard
            onReportPrice={onReportPrice}
            variant="inline"
          />
        </motion.div>
      )
    }

    items.push(
      <motion.div
        key={price.id}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97 }}
        transition={{
          delay: showAll ? 0 : index * 0.05,
          duration: 0.3,
          ease: [0.23, 1, 0.32, 1],
        }}
        layout
        role="listitem"
      >
        <PriceCard
          price={price}
          isCheapest={index === 0}
          userLat={userLat}
          userLng={userLng}
          onHover={() => onStoreHover?.(price.store_id)}
        />
      </motion.div>
    )
  })

  return (
    <div id="price-list">
      {/* 2-column grid on sm+ screens, single column on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="list" aria-label="Price results">
        <AnimatePresence mode="popLayout">
          {items}
        </AnimatePresence>
      </div>

      {hiddenCount > 0 && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: showAll ? 0 : INITIAL_DISPLAY_COUNT * 0.05, duration: 0.3 }}
          className="sm:col-span-2"
        >
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            aria-expanded={showAll}
            aria-controls="price-list"
            className="group w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#1e293b] bg-card hover:bg-[#0f172a] text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer hover:border-[#334155]"
          >
            {showAll ? (
              <>
                <ChevronUp className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
                <span>Show less</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5" />
                <span>
                  Show {hiddenCount} more {hiddenCount === 1 ? 'deal' : 'deals'}
                </span>
              </>
            )}
          </button>
        </motion.div>
      )}
    </div>
  )
}
