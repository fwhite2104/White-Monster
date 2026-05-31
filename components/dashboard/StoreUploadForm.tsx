'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useGeolocation } from '@/hooks/use-geolocation'
import { RETAILERS } from '@/lib/constants'

export function StoreUploadForm({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false)
  const { location, error: geoError, requestLocation } = useGeolocation()
  const [formData, setFormData] = useState({
    storeName: '',
    retailer: 'other',
    price: '',
    productName: 'White Monster Zero Sugar',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    const priceVal = parseFloat(formData.price)
    if (isNaN(priceVal) || priceVal < 1 || priceVal > 50) {
      setSubmitError('Price must be between EUR 1 and EUR 50')
      return
    }

    if (!location) {
      setSubmitError('Location is required. Please enable location access.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName: formData.storeName,
          retailer: formData.retailer,
          price: priceVal,
          productName: formData.productName,
          notes: formData.notes,
          lat: location.lat,
          lng: location.lng,
        }),
      })

      if (response.ok) {
        setOpen(false)
        setFormData({
          storeName: '',
          retailer: 'other',
          price: '',
          productName: 'White Monster Zero Sugar',
          notes: '',
        })
        onSuccess?.()
      } else {
        const data = await response.json()
        setSubmitError(data.error || 'Failed to submit')
      }
    } catch {
      setSubmitError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" size="sm">
          Report a Price
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report a White Monster Price</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Store Name</Label>
            <Input
              placeholder="e.g., Centra Wilton"
              value={formData.storeName}
              onChange={(e) =>
                setFormData({ ...formData, storeName: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label>Retailer</Label>
            <Select
              value={formData.retailer}
              onValueChange={(v) => v && setFormData({ ...formData, retailer: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RETAILERS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Price (EUR)</Label>
            <Input
              type="number"
              step="0.01"
              min="1"
              max="50"
              placeholder="2.50"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              required
            />
          </div>

          {!location && (
            <Button
              type="button"
              variant="secondary"
              onClick={requestLocation}
              className="w-full"
            >
              Enable Location
            </Button>
          )}
          {geoError && (
            <p className="text-xs text-destructive">{geoError}</p>
          )}
          {location && (
            <p className="text-xs text-muted-foreground">
              Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </p>
          )}

          {submitError && (
            <p className="text-sm text-destructive">{submitError}</p>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Price'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
