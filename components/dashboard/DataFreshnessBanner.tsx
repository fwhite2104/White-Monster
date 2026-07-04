'use client'

import { AlertCircle } from 'lucide-react'

interface DataFreshnessBannerProps {
  status: 'fresh' | 'stale' | 'outdated'
  timeAgo: string
}

export function DataFreshnessBanner({ status, timeAgo }: DataFreshnessBannerProps) {
  if (status === 'fresh') return null

  if (status === 'outdated') {
    return (
      <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 flex items-center gap-2 text-sm">
        <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
        <span className="text-red-200">
          Price data is outdated · Updated {timeAgo}
        </span>
        <a
          href="/api/health"
          target="_blank"
          rel="noopener noreferrer"
          className="text-red-400 underline underline-offset-2 ml-1 hover:text-red-300"
        >
          Debug
        </a>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 flex items-center gap-2 text-sm">
      <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
      <span className="text-amber-200">
        Prices may be outdated · Updated {timeAgo}
      </span>
    </div>
  )
}
