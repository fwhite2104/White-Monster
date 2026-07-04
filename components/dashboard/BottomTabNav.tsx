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
  isLocating: boolean
  activeFilterCount: number
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
  isLocating,
  activeFilterCount,
}: BottomTabNavProps) {
  const shouldReduceMotion = useReducedMotion()

  const handleTabClick = (tab: TabKey) => {
    if (tab === 'list' && tab === activeTab) {
      onFilterToggle()
      return
    }
    onTabChange(tab)
  }

  return (
    <>
      <div
        className="fixed bottom-24 right-5 z-[var(--z-fab)] md:hidden"
      >
        <motion.button
          initial={shouldReduceMotion ? false : { scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', duration: 0.35, bounce: 0.1 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
          onClick={onReportPrice}
          className={cn(
            'flex flex-col items-center justify-center gap-0.5',
            'size-16 min-h-[56px] min-w-[56px] rounded-full',
            'bg-primary text-primary-foreground',
            'shadow-[0_4px_24px_var(--color-brand-glow)]',
          )}
          aria-label="Report a price"
        >
          <CirclePlus className="size-7" />
          <span className="text-xs font-medium uppercase tracking-wide">Report</span>
        </motion.button>
      </div>

      <motion.div
        initial={shouldReduceMotion ? false : { y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-[var(--z-chrome)]',
          'bg-card/95 backdrop-blur-xl border-t border-border',
          'md:hidden'
        )}
      >
        <nav
          className="flex items-stretch justify-around px-1 pt-1.5 pb-safe overflow-x-hidden"
          role="tablist"
          aria-label="Main navigation"
        >
          {tabs.map(({ key, icon: Icon, label }) => {
            const isActive = activeTab === key

            return (
              <button
                key={key}
                onClick={() => handleTabClick(key)}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-0.5',
                  'flex-1 min-h-[56px] px-1 py-1.5',
                  'rounded-xl text-xs tracking-wide font-normal',
                  'transition-colors duration-200',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground',
                  key === 'stores' && isLocating && 'pointer-events-none opacity-50'
                )}
                id={`tab-${key}`}
                aria-controls={`tabpanel-${key}`}
                role="tab"
                aria-label={label}
                aria-selected={isActive}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-x-1 inset-y-0.5 rounded-xl bg-[color:var(--color-brand-surface)]"
                    transition={shouldReduceMotion
                      ? { duration: 0 }
                      : { type: 'spring', duration: 0.4, bounce: 0.08 }
                    }
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
                      className="absolute -top-1.5 -right-2 size-3.5 min-w-3.5 px-0 text-xs leading-none rounded-full flex items-center justify-center"
                    >
                      {activeFilterCount}
                    </Badge>
                  )}
                </div>
                <span className={`relative z-10 truncate max-w-[56px] ${isActive ? 'font-medium' : 'font-normal'}`}>{label}</span>
              </button>
            )
          })}
        </nav>
      </motion.div>
    </>
  )
}
