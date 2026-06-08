'use client'

import { CLUBCARD_INFO } from '@/lib/clubcard'

interface ClubcardBadgeProps {
  className?: string
}

export function ClubcardBadge({ className }: ClubcardBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 ${className ?? ''}`}
      title={CLUBCARD_INFO.description}
    >
      Clubcard
    </span>
  )
}
