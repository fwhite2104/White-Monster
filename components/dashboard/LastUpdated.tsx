'use client'

import { getTimeAgo } from '@/lib/geo'

interface LastUpdatedProps {
  date: string | null
}

export function LastUpdated({ date }: LastUpdatedProps) {
  if (!date) return null
  return (
    <span className="text-xs text-muted-foreground">
      Last updated: {getTimeAgo(date)}
    </span>
  )
}
