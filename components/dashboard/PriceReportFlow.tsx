'use client'

import { useState } from 'react'
import { Tag, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatPackSize } from '@/lib/constants'
import type { Store, Product } from '@/lib/types'

interface PriceReportFlowProps {
  store: Store
  products: Product[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PriceReportFlow({ store, products, open, onOpenChange }: PriceReportFlowProps) {
  const [selectedProduct, setSelectedProduct] = useState('')
  const [price, setPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/stores/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store.id,
          productId: selectedProduct,
          price: parseFloat(price),
          notes: notes || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit.')
      }

      setSuccess(true)
      setTimeout(() => {
        onOpenChange(false)
        setSuccess(false)
        setSelectedProduct('')
        setPrice('')
        setNotes('')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Report Price — {store.name}
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-3">
              <Tag className="h-6 w-6 text-green-400" />
            </div>
            <p className="text-sm font-medium">Price reported!</p>
            <p className="text-xs text-muted-foreground mt-1">Thank you for contributing.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Product</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                required
                className="mt-1 w-full h-9 px-3 rounded-lg bg-card ring-1 ring-foreground/10 text-sm focus:outline-none focus:ring-primary/30"
              >
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatPackSize(p.pack_size)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Price (€)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="99.99"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 2.49"
                required
                className="mt-1 w-full h-9 px-3 rounded-lg bg-card ring-1 ring-foreground/10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. on special offer"
                className="mt-1 w-full h-9 px-3 rounded-lg bg-card ring-1 ring-foreground/10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-primary/30"
              />
            </div>

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Tag className="h-4 w-4 mr-2" />
              )}
              Submit Price Report
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
