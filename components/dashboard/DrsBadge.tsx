'use client'

import { DRS_INFO } from '@/lib/drs'

interface DrsBadgeProps {
  deposit: number
  className?: string
}

export function DrsBadge({ deposit, className }: DrsBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] text-green-400 font-medium ${className ?? ''}`}
      title={DRS_INFO.description}
    >
      <span>€{deposit.toFixed(2)} DRS refundable</span>
    </span>
  )
}
