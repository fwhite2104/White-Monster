'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { MapPin, SlidersHorizontal, CirclePlus, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StickyBarProps {
  onReportPrice: () => void
  onFilterToggle: () => void
  onLocationRequest: () => void
  locationLabel: string
  isLocating: boolean
  activeFilterCount: number
}

function abbreviateLabel(label: string, maxLen = 20): string {
  if (label.length <= maxLen) return label
  return label.slice(0, maxLen - 1) + '\u2026'
}

export function StickyBar({
  onReportPrice,
  onFilterToggle,
  onLocationRequest,
  locationLabel,
  isLocating,
  activeFilterCount,
}: StickyBarProps) {
  const shouldReduceMotion = useReducedMotion()

  const actions = [
    {
      key: 'location',
      icon: isLocating ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <MapPin className="h-5 w-5" />
      ),
      label: isLocating
        ? 'Locating\u2026'
        : locationLabel
          ? abbreviateLabel(locationLabel)
          : 'Use location',
      onClick: onLocationRequest,
      ariaLabel: isLocating ? 'Finding your location' : 'Use my location',
      disabled: isLocating,
    },
    {
      key: 'filters',
      icon: <SlidersHorizontal className="h-5 w-5" />,
      label: 'Filters',
      onClick: onFilterToggle,
      ariaLabel: `Filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`,
      badge: activeFilterCount > 0 ? activeFilterCount : undefined,
    },
    {
      key: 'report',
      icon: <CirclePlus className="h-5 w-5" />,
      label: 'Report Price',
      onClick: onReportPrice,
      ariaLabel: 'Report a price',
    },
  ]

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'bg-card/95 backdrop-blur-md border-t border-border',
        'md:hidden'
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch justify-around px-2 pt-2 pb-2">
        {actions.map((action) => (
          <motion.button
            key={action.key}
            whileTap={shouldReduceMotion ? {} : { scale: 0.92 }}
            onClick={action.onClick}
            disabled={action.disabled}
            className={cn(
              'relative flex flex-col items-center justify-center gap-1',
              'min-w-[44px] min-h-[44px] px-3 py-1.5',
              'rounded-xl text-xs font-medium',
              'text-muted-foreground hover:text-foreground',
              'transition-colors',
              'disabled:opacity-50 disabled:pointer-events-none'
            )}
            aria-label={action.ariaLabel}
          >
            {action.icon}
            <span className="truncate max-w-[72px]">{action.label}</span>
            {action.badge !== undefined && (
              <Badge
                variant="default"
                className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[9px] leading-none"
              >
                {action.badge}
              </Badge>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
