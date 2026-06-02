'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, useReducedMotion, useInView, AnimatePresence } from 'framer-motion'
import { SearchX, ChevronDown, ChevronUp } from 'lucide-react'
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
  reportPromptShown?: boolean
  onReportPromptSeen?: () => void
}

export function PriceList({
  prices,
  userLat,
  userLng,
  onStoreHover,
  onReportPrice,
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
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 space-y-4"
      >
        <div className="mx-auto w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center">
          <SearchX className="h-7 w-7 text-muted-foreground" />
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">No prices found</p>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">
            Try increasing the radius or reporting a price.
          </p>
        </div>
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
    <div className="space-y-2.5 sm:space-y-3" role="list" aria-label="Price results">
      <AnimatePresence mode="popLayout">
        {items}
      </AnimatePresence>

      {hiddenCount > 0 && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: showAll ? 0 : INITIAL_DISPLAY_COUNT * 0.05, duration: 0.3 }}
        >
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            aria-expanded={showAll}
            aria-controls="price-list"
            className="group w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border bg-muted/30 hover:bg-muted/50 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
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
