'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Store, Search, List, Tag, CirclePlus, Loader2, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
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
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored === 'true') setCollapsed(true)
  }, [])

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  const handleTabClick = (tab: TabKey) => {
    if (tab === 'list' && tab === activeTab) {
      onFilterToggle()
      return
    }
    onTabChange(tab)
  }

  const springTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, duration: 0.4, bounce: 0.08 }

  return (
    <>
      {/* Mobile: Report FAB */}
      <div className="fixed bottom-24 right-5 z-[var(--z-fab)] md:hidden">
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

      {/* Mobile: Bottom tab bar */}
      <motion.div
        initial={shouldReduceMotion ? false : { y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-[var(--z-chrome)]',
          'backdrop-blur-xl bg-white/5 border-t border-white/10',
          'md:hidden',
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
                  isActive ? 'text-primary' : 'text-muted-foreground',
                  key === 'stores' && isLocating && 'pointer-events-none opacity-50',
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
                    className="absolute inset-x-1 inset-y-0.5 rounded-xl bg-white/[0.07]"
                    transition={springTransition}
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
                <span className={`relative z-10 truncate max-w-[56px] ${isActive ? 'font-medium' : 'font-normal'}`}>
                  {label}
                </span>
              </button>
            )
          })}
        </nav>
      </motion.div>

      {/* Desktop: Side-rail nav */}
      <motion.aside
        initial={shouldReduceMotion ? false : { x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className={cn(
          'hidden md:flex fixed left-3 top-1/2 -translate-y-1/2 z-[var(--z-chrome)]',
          'flex-col items-center gap-2 p-3 rounded-2xl',
          'backdrop-blur-xl bg-white/5 border border-white/10',
          'shadow-[0_0_40px_rgba(34,197,94,0.06)]',
          'transition-[width] duration-300 ease-out',
          collapsed ? 'w-[60px]' : 'w-[180px]',
        )}
        role="tablist"
        aria-label="Main navigation"
        aria-orientation="vertical"
      >
        <button
          onClick={toggleCollapsed}
          className={cn(
            'flex items-center justify-center size-8 rounded-lg',
            'text-muted-foreground hover:text-foreground hover:bg-white/10 border-border',
            'transition-colors duration-200 shrink-0',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>

        <div className="w-full h-px bg-white/10" />

        {tabs.map(({ key, icon: Icon, label }) => {
          const isActive = activeTab === key
          return (
            <button
              key={key}
              onClick={() => handleTabClick(key)}
              className={cn(
                'relative flex items-center gap-3 w-full rounded-xl',
                'transition-colors duration-200',
                collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
                isActive
                  ? 'text-primary bg-white/[0.07] shadow-[0_0_12px_rgba(34,197,94,0.08)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.05]',
                key === 'stores' && isLocating && 'pointer-events-none opacity-50',
              )}
              id={`tab-${key}`}
              aria-controls={`tabpanel-${key}`}
              role="tab"
              aria-label={label}
              aria-selected={isActive}
            >
              <div className="relative shrink-0">
                {key === 'stores' && isLocating ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Icon className="size-5" />
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
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span
                    key="label"
                    initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, width: 0 }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    className="text-sm font-medium truncate overflow-hidden whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )
        })}

        <div className="w-full h-px bg-white/10" />

        <motion.button
          whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
          onClick={onReportPrice}
          className={cn(
            'flex items-center gap-3 w-full rounded-xl',
            'bg-primary text-primary-foreground',
            'shadow-[0_2px_16px_var(--color-brand-glow)]',
            'transition-colors duration-200',
            collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
          )}
          aria-label="Report a price"
        >
          <CirclePlus className="size-5 shrink-0" />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                key="report-label"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, width: 0 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className="text-sm font-medium truncate overflow-hidden whitespace-nowrap"
              >
                Report
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.aside>
    </>
  )
}
