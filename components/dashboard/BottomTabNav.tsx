'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Store, Search, List, Tag, CirclePlus, Loader2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type TabKey = 'stores' | 'search' | 'list' | 'deals'

interface BottomTabNavProps {
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
  onReportPrice: () => void
  onFilterToggle: () => void
  onLocationRequest: () => void
  isLocating: boolean
  activeFilterCount: number
  locationLabel: string
}

const tabs: {
  key: TabKey
  icon: LucideIcon
  label: string
}[] = [
  { key: 'stores', icon: Store, label: 'Stores' },
  { key: 'search', icon: Search, label: 'Search' },
  { key: 'list', icon: List, label: 'List' },
  { key: 'deals', icon: Tag, label: 'Deals' },
]

export function BottomTabNav({
  activeTab,
  onTabChange,
  onReportPrice,
  onFilterToggle,
  onLocationRequest,
  isLocating,
  activeFilterCount,
}: BottomTabNavProps) {
  const shouldReduceMotion = useReducedMotion()

  const handleTabClick = (tab: TabKey) => {
    if (tab === 'list' && tab === activeTab) {
      onFilterToggle()
      return
    }
    if (tab === 'stores') {
      onLocationRequest()
    }
    onTabChange(tab)
  }

  return (
    <>
      <motion.button
        initial={shouldReduceMotion ? false : { scale: 0.8, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        whileTap={shouldReduceMotion ? {} : { scale: 0.88 }}
        onClick={onReportPrice}
        className={cn(
          'fixed bottom-20 right-5 z-50',
          'flex items-center justify-center',
          'size-14 rounded-full',
          'bg-primary text-primary-foreground',
          'shadow-[0_4px_20px_oklch(0.72_0.22_145_/_0.35)]',
          'hover:shadow-[0_4px_28px_oklch(0.72_0.22_145_/_0.5)]',
          'active:bg-primary-dark',
          'transition-shadow',
          'md:hidden'
        )}
        aria-label="Report a price"
      >
        <CirclePlus className="size-6" />
      </motion.button>

      <motion.div
        initial={shouldReduceMotion ? false : { y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-40',
          'bg-card/95 backdrop-blur-xl border-t border-border',
          'md:hidden'
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <nav className="flex items-stretch justify-around px-1 pt-1 pb-1" aria-label="Main navigation">
          {tabs.map(({ key, icon: Icon, label }) => {
            const isActive = activeTab === key

            return (
              <button
                key={key}
                onClick={() => handleTabClick(key)}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1',
                  'w-16 min-h-[52px] px-1 py-1.5',
                  'rounded-xl text-[10px] font-medium tracking-wide',
                  'transition-colors duration-200',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground',
                  key === 'stores' && isLocating && 'pointer-events-none opacity-50'
                )}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-x-1 top-0.5 bottom-0.5 rounded-lg bg-primary/10"
                    transition={{ type: 'spring', duration: 0.5, bounce: 0.15 }}
                  />
                )}

                <div className="relative z-10">
                  {key === 'stores' && isLocating ? (
                    <Loader2 className="size-[22px] animate-spin" />
                  ) : (
                    <Icon className="size-[22px]" />
                  )}
                  {key === 'list' && activeFilterCount > 0 && (
                    <Badge
                      variant="default"
                      className="absolute -top-1.5 -right-2 size-3.5 min-w-3.5 px-0 text-[8px] leading-none rounded-full flex items-center justify-center"
                    >
                      {activeFilterCount}
                    </Badge>
                  )}
                </div>
                <span className="relative z-10 truncate max-w-[56px]">{label}</span>
              </button>
            )
          })}
        </nav>
      </motion.div>
    </>
  )
}
