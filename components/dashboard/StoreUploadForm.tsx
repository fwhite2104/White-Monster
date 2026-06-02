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
import { RETAILERS, CORK_CENTER, MONSTER_VARIANTS } from '@/lib/constants'

export function StoreUploadForm({ onSuccess, externalOpen, onExternalOpenChange }: { onSuccess?: () => void; externalOpen?: boolean; onExternalOpenChange?: (open: boolean) => void }) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = onExternalOpenChange ?? setInternalOpen
  const { location, error: geoError, requestLocation } = useGeolocation()
  const [formData, setFormData] = useState({
    storeName: '',
    retailer: 'other',
    price: '',
    variant: 'zero_sugar',
    packSize: 'single',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    const priceVal = parseFloat(formData.price)
    if (isNaN(priceVal)) {
      setSubmitError('Price must be a valid number')
      return
    }
    if (formData.packSize === '4_pack' && (priceVal < 3 || priceVal > 20)) {
      setSubmitError('4-pack price must be between €3 and €20')
      return
    }
    if (formData.packSize === 'single' && (priceVal < 0.5 || priceVal > 5)) {
      setSubmitError('Single can price must be between €0.50 and €5.00')
      return
    }

    const lat = location?.lat ?? CORK_CENTER.lat
    const lng = location?.lng ?? CORK_CENTER.lng

    const variantLabel = MONSTER_VARIANTS.find(v => v.value === formData.variant)?.label ?? 'White Monster Zero Sugar'
    const suffix = formData.packSize === '4_pack' ? ' 4-Pack' : ''
    const productName = `${variantLabel}${suffix}`

    setSubmitting(true)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    try {
      const response = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          storeName: formData.storeName,
          retailer: formData.retailer,
          price: priceVal,
          productName,
          variant: formData.variant,
          packSize: formData.packSize,
          notes: formData.notes,
          lat,
          lng,
        }),
      })

      if (response.ok) {
        setSubmitted(true)
        setOpen(false)
        setFormData({
          storeName: '',
          retailer: 'other',
          price: '',
          variant: 'zero_sugar',
          packSize: 'single',
          notes: '',
        })
        onSuccess?.()
      } else {
        const data = await response.json()
        setSubmitError(data.error || 'Failed to submit')
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setSubmitError('Request timed out. Please try again.')
      } else {
        setSubmitError('Network error. Please try again.')
      }
    } finally {
      clearTimeout(timeout)
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setSubmitted(false) }}>
      <DialogTrigger>
        <Button variant="outline" size="sm" aria-label="Report a price for a Monster Energy drink">
          Report a Price
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report a Monster Price</DialogTitle>
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
            <Label>Variant</Label>
            <Select
              value={formData.variant}
              onValueChange={(v) => v && setFormData({ ...formData, variant: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONSTER_VARIANTS.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Pack Size</Label>
            <Select
              value={formData.packSize}
              onValueChange={(v) => v && setFormData({ ...formData, packSize: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Can</SelectItem>
                <SelectItem value="4_pack">4-Pack</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Price (EUR)</Label>
            <Input
              type="number"
              step="0.01"
              min={formData.packSize === '4_pack' ? 3 : 0.5}
              max={formData.packSize === '4_pack' ? 20 : 5}
              placeholder={formData.packSize === '4_pack' ? '6.50' : '2.50'}
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.packSize === '4_pack'
                ? 'Enter the total 4-pack price (typically €5–€9)'
                : 'Enter the price per single can (typically €1.50–€3)'}
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={requestLocation}
            className="w-full"
          >
            {location ? 'Update Location' : 'Use My Location'}
          </Button>
          {geoError && (
            <p className="text-xs text-destructive">{geoError}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {location
              ? `Location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
              : `Default: Cork City (${CORK_CENTER.lat}, ${CORK_CENTER.lng})`}
          </p>

          {submitError && (
            <p className="text-sm text-destructive">{submitError}</p>
          )}

          <Button type="submit" className="w-full" disabled={submitting || submitted}>
            {submitting ? 'Submitting...' : 'Submit Price'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}