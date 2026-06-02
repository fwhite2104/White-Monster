'use client'

import { Clock } from 'lucide-react'
import { getTimeAgo } from '@/lib/geo'

interface LastUpdatedProps {
  date: string | null
}

export function LastUpdated({ date }: LastUpdatedProps) {
  if (!date) return null
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Clock className="h-3 w-3" />
      Updated {getTimeAgo(date)}
    </span>
  )
}
