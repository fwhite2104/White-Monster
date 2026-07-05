'use client'

import { Badge } from '@/components/ui/badge'
import { DEAL_TYPE_LABELS, DEAL_TYPE_COLORS } from '@/lib/deals'
import type { Deal } from '@/lib/deals'

interface DealBadgeProps {
  dealType: Deal['deal_type']
  className?: string
}

export function DealBadge({ dealType, className }: DealBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`text-xs h-5 font-semibold ${DEAL_TYPE_COLORS[dealType] ?? 'bg-muted text-muted-foreground'} ${className ?? ''}`}
    >
      {DEAL_TYPE_LABELS[dealType] ?? dealType}
    </Badge>
  )
}

interface SavingBadgeProps {
  savingsPercent: number
  className?: string
}

export function SavingBadge({ savingsPercent, className }: SavingBadgeProps) {
  return (
    <Badge
      variant="success"
      className={`text-xs h-5 font-bold ${className ?? ''}`}
    >
      {savingsPercent}% OFF
    </Badge>
  )
}
