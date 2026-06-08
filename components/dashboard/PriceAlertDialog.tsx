'use client'

import { useState } from 'react'
import { MONSTER_VARIANTS } from '@/lib/constants'

interface PriceAlertDialogProps {
  variant: string
  open: boolean
  onClose: () => void
  onCreated: () => void
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

export function PriceAlertDialog({ variant, open, onClose, onCreated }: PriceAlertDialogProps) {
  const [targetPrice, setTargetPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const variantLabel = MONSTER_VARIANTS.find((v) => v.value === variant)?.label ?? variant

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const price = parseFloat(targetPrice)
    if (!price || price <= 0 || price > 100) {
      setError('Enter a valid price between €0.01 and €100')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: getSessionId(),
          variant,
          target_price: price,
          pack_size: 'single',
          radius_km: 10,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to create alert')
      }

      onCreated()
      onClose()
      setTargetPrice('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-1">Set Price Alert</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Get notified when <strong>{variantLabel}</strong> drops below your target.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="target_price" className="block text-sm font-medium mb-1">
              Target Price (€)
            </label>
            <input
              id="target_price"
              type="number"
              step="0.01"
              min="0.01"
              max="100"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="e.g. 2.29"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm rounded-md border border-input hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
