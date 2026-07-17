'use client'

import * as Dialog from "@radix-ui/react-dialog"
import { X, CirclePlus } from "lucide-react"
import { useState } from "react"
import { MONSTER_VARIANTS, PACK_SIZES, formatPackSize } from "@/lib/constants"

interface ReportPriceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prefillStoreName?: string
}

export function ReportPriceModal({ open, onOpenChange, prefillStoreName }: ReportPriceModalProps) {
  const [storeName, setStoreName] = useState(prefillStoreName ?? '')
  const [variant, setVariant] = useState('zero_sugar')
  const [packSize, setPackSize] = useState('single')
  const [price, setPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const reset = () => {
    setStoreName(prefillStoreName ?? '')
    setVariant('zero_sugar')
    setPackSize('single')
    setPrice('')
    setNotes('')
    setSubmitError(null)
    setSubmitSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      const numericPrice = Number.parseFloat(price)
      if (Number.isNaN(numericPrice) || numericPrice <= 0) {
        throw new Error('Please enter a valid price')
      }
      if (!storeName.trim()) {
        throw new Error('Please enter a store name')
      }

      const res = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_name: storeName.trim(),
          variant,
          pack_size: packSize,
          price: numericPrice,
          notes: notes.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to submit price')
      }

      setSubmitSuccess(true)
      setTimeout(() => {
        onOpenChange(false)
        reset()
      }, 1500)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md rounded-2xl bg-background border border-border p-5 shadow-2xl outline-none"
          aria-describedby="report-price-description"
          data-testid="report-price-modal"
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold">Report a price</Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 rounded-full hover:bg-muted" aria-label="Close">
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <p id="report-price-description" className="sr-only">
            Report a Monster Energy price you saw in a store.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="store-name" className="block text-sm font-medium mb-1">
                Store name
              </label>
              <input
                id="store-name"
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Tesco Cork City"
                className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="variant" className="block text-sm font-medium mb-1">
                  Variant
                </label>
                <select
                  id="variant"
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {MONSTER_VARIANTS.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="pack-size" className="block text-sm font-medium mb-1">
                  Pack size
                </label>
                <select
                  id="pack-size"
                  value={packSize}
                  onChange={(e) => setPackSize(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {PACK_SIZES.map((p) => (
                    <option key={p} value={p}>
                      {formatPackSize(p)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium mb-1">
                Price (€)
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="2.50"
                className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-1">
                Notes (optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Clubcard price, expiry date"
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}
            {submitSuccess && (
              <p className="text-sm text-primary">Price reported successfully!</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit price'}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function ReportPriceFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 size-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
      aria-label="Report a price"
      data-testid="report-fab"
    >
      <CirclePlus className="size-6" />
    </button>
  )
}
