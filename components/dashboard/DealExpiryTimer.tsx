'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { getHoursRemaining } from '@/lib/deals'

interface DealExpiryTimerProps {
  validUntil: string
  className?: string
}

export function DealExpiryTimer({ validUntil, className }: DealExpiryTimerProps) {
  const [hoursRemaining, setHoursRemaining] = useState(() => getHoursRemaining(validUntil))

  useEffect(() => {
    const interval = setInterval(() => {
      setHoursRemaining(getHoursRemaining(validUntil))
    }, 60 * 1000)
    return () => clearInterval(interval)
  }, [validUntil])

  if (hoursRemaining <= 0) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] text-red-400 font-medium ${className ?? ''}`}>
        <Clock className="h-3 w-3" />
        Expired
      </span>
    )
  }

  if (hoursRemaining < 24) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] text-orange-400 font-medium ${className ?? ''}`}>
        <Clock className="h-3 w-3" />
        {hoursRemaining}h left
      </span>
    )
  }

  const days = Math.ceil(hoursRemaining / 24)
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] text-muted-foreground ${className ?? ''}`}>
      <Clock className="h-3 w-3" />
      {days}d left
    </span>
  )
}
