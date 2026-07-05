'use client'

import { useState } from 'react'
import { Store, MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CONVENIENCE_RETAILERS } from '@/lib/convenience-stores'

interface StoreRegistrationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userLat: number
  userLng: number
}

export function StoreRegistrationForm({ open, onOpenChange, userLat, userLng }: StoreRegistrationFormProps) {
  const [name, setName] = useState('')
  const [retailer, setRetailer] = useState('')
  const [address, setAddress] = useState('')
  const [suburb, setSuburb] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/stores/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          retailer,
          address,
          suburb: suburb || undefined,
          lat: userLat,
          lng: userLng,
          storeType: 'convenience',
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
        setName('')
        setRetailer('')
        setAddress('')
        setSuburb('')
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
            <Store className="h-4 w-4" />
            Register a Store
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-3">
              <Store className="h-6 w-6 text-green-400" />
            </div>
            <p className="text-sm font-medium">Store submitted for review!</p>
            <p className="text-xs text-muted-foreground mt-1">We&apos;ll verify the details shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Store Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. SPAR Cork City"
                required
                className="mt-1 w-full h-9 px-3 rounded-lg bg-card ring-1 ring-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-[#22c55e]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Retailer</label>
              <select
                value={retailer}
                onChange={(e) => setRetailer(e.target.value)}
                required
                className="mt-1 w-full h-9 px-3 rounded-lg bg-card ring-1 ring-border text-sm focus:outline-none focus:ring-[#22c55e]"
              >
                <option value="">Select retailer</option>
                {CONVENIENCE_RETAILERS.map((r) => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 12 Patrick Street"
                required
                className="mt-1 w-full h-9 px-3 rounded-lg bg-card ring-1 ring-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-[#22c55e]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Suburb (optional)</label>
              <input
                type="text"
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                placeholder="e.g. Douglas"
                className="mt-1 w-full h-9 px-3 rounded-lg bg-card ring-1 ring-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-[#22c55e]"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>Using your current location ({userLat.toFixed(4)}, {userLng.toFixed(4)})</span>
            </div>

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Store className="h-4 w-4 mr-2" />
              )}
              Submit Registration
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
