'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { RETAILERS } from '@/lib/constants'

interface PriceHistoryChartProps {
  variant: string
  retailer?: string
  days?: 7 | 30 | 90
  className?: string
}

interface HistoryPoint {
  date: string
  price: number
  retailer: string
}

interface HistoryStats {
  min: number | null
  max: number | null
  avg: number | null
  dataPoints: number
}

export function PriceHistoryChart({
  variant,
  retailer,
  days = 30,
  className,
}: PriceHistoryChartProps) {
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [stats, setStats] = useState<HistoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const params = new URLSearchParams({ variant, days: String(days) })
    if (retailer) params.set('retailer', retailer)

    fetch(`/api/prices/history?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (!cancelled) {
          setHistory(data.history ?? [])
          setStats(data.stats ?? null)
          setError(null)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load')
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [variant, retailer, days])

  const retailerColors = useMemo(() => {
    const map: Record<string, string> = {}
    for (const r of RETAILERS) {
      map[r.value] = r.color
    }
    return map
  }, [])

  const uniqueRetailers = useMemo(
    () => [...new Set(history.map((h) => h.retailer))],
    [history]
  )

  if (loading) {
    return (
      <div className={className}>
        <div className="h-[200px] animate-pulse rounded-md bg-muted" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={className}>
        <p className="text-sm text-muted-foreground">Failed to load price history.</p>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className={className}>
        <p className="text-sm text-muted-foreground">No price history available.</p>
      </div>
    )
  }

  const chartData = history.map((h) => ({
    date: h.date,
    ...Object.fromEntries(uniqueRetailers.map((r) => [r, h.retailer === r ? h.price : null])),
  }))

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            tickFormatter={(v: string) => v.slice(5)}
            stroke="rgba(255, 255, 255, 0.1)"
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            tickFormatter={(v: number) => `€${v.toFixed(2)}`}
            width={50}
            stroke="rgba(255, 255, 255, 0.1)"
          />
          <Tooltip
            formatter={(value) => [`€${Number(value).toFixed(2)}`, '']}
            labelFormatter={(label) => String(label)}
            contentStyle={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0.5rem',
              color: 'var(--foreground)',
            }}
            labelStyle={{ color: 'var(--muted-foreground)' }}
          />
          {uniqueRetailers.map((r, idx) => (
            <Line
              key={r}
              type="monotone"
              dataKey={r}
              stroke={idx === 0 ? 'var(--color-primary)' : retailerColors[r] ?? 'var(--color-muted-foreground)'}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: 'var(--color-secondary)', stroke: 'var(--background)', strokeWidth: 2 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {stats && stats.dataPoints > 0 && (
        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
          <span className="price-xs">Low: €{stats.min?.toFixed(2)}</span>
          <span className="price-xs">Avg: €{stats.avg?.toFixed(2)}</span>
          <span className="price-xs">High: €{stats.max?.toFixed(2)}</span>
          <span>{stats.dataPoints} data points</span>
        </div>
      )}
    </div>
  )
}
