'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Store, Search, List, Tag, CirclePlus, Loader2 } from 'lucide-react'
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
  icon: React.ComponentType<{ className?: string }>
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
        whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}
        onClick={onReportPrice}
        className={cn(
          'fixed bottom-20 right-5 z-50',
          'flex items-center justify-center',
          'size-14 rounded-full',
          'bg-primary text-primary-foreground shadow-lg',
          'hover:bg-primary/90 active:bg-primary/80',
          'transition-colors',
          'md:hidden'
        )}
        aria-label="Report a price"
      >
        <CirclePlus className="size-6" />
      </motion.button>

      <motion.div
        initial={shouldReduceMotion ? false : { y: 20, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-40',
          'bg-card/95 backdrop-blur-md border-t border-border',
          'md:hidden'
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-stretch justify-around pt-1 pb-1">
          {tabs.map(({ key, icon: Icon, label }) => {
            const isActive = activeTab === key

            return (
              <button
                key={key}
                onClick={() => handleTabClick(key)}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-0.5',
                  'min-w-[44px] min-h-[44px] px-3 py-1',
                  'rounded-xl text-[10px] font-medium',
                  'transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                  key === 'stores' && isLocating && 'pointer-events-none opacity-50'
                )}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative">
                  {key === 'stores' && isLocating ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Icon className={cn('size-5', isActive && 'fill-primary/20')} />
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-primary"
                      transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                    />
                  )}
                </div>
                <span className="truncate max-w-[64px]">{label}</span>
                {key === 'list' && activeFilterCount > 0 && (
                  <Badge
                    variant="default"
                    className="absolute -top-0.5 -right-0.5 size-4 min-w-4 px-1 text-[9px] leading-none"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </button>
            )
          })}
        </div>
      </motion.div>
    </>
  )
}
