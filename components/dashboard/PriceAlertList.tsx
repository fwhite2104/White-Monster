'use client'

import { useEffect, useState, useCallback } from 'react'
import { MONSTER_VARIANTS } from '@/lib/constants'

interface Alert {
  id: string
  variant: string
  target_price: number
  pack_size: string
  created_at: string
}

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('monster_cork_session_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('monster_cork_session_id', id)
  }
  return id
}

export function PriceAlertList() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAlerts = useCallback(async () => {
    const sessionId = getSessionId()
    if (!sessionId) return

    try {
      const res = await fetch(`/api/alerts?session_id=${sessionId}`)
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.alerts ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  async function handleDelete(id: string) {
    const sessionId = getSessionId()
    await fetch(`/api/alerts?id=${id}&session_id=${sessionId}`, { method: 'DELETE' })
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading alerts...</div>
  }

  if (alerts.length === 0) {
    return <div className="text-sm text-muted-foreground">No active price alerts.</div>
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => {
        const label = MONSTER_VARIANTS.find((v) => v.value === alert.variant)?.label ?? alert.variant
        return (
          <div
            key={alert.id}
            className="flex items-center justify-between rounded-md border border-border px-3 py-2"
          >
            <div className="text-sm">
              <span className="font-medium">{label}</span>
              <span className="text-muted-foreground ml-2">
                ≤ €{alert.target_price.toFixed(2)}
              </span>
            </div>
            <button
              onClick={() => handleDelete(alert.id)}
              className="text-xs text-destructive hover:underline"
            >
              Remove
            </button>
          </div>
        )
      })}
    </div>
  )
}
