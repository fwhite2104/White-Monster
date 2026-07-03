'use client'

import { useState, useCallback, useId } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog'
import { useGeolocation } from '@/hooks/use-geolocation'
import { RETAILERS, CORK_CENTER, MONSTER_VARIANTS, PACK_SIZES, getPackCount, formatPackSize } from '@/lib/constants'

const CORK_STORES = [
  'Centra Wilton',
  'Centra Douglas',
  'Centra Ballincollig',
  'Centra Blackpool',
  'Centra Mayfield',
  'SuperValu Wilton',
  'SuperValu Douglas',
  'SuperValu Ballincollig',
  'SuperValu Bishopstown',
  'SuperValu Carrigaline',
  'SuperValu Midleton',
  'SuperValu Cobh',
  'Tesco Wilton',
  'Tesco Douglas',
  'Tesco Ballincollig',
  'Tesco Blackpool',
  'Tesco Mahon Point',
  'Tesco Carrigaline',
  'Dunnes Stores Wilton',
  'Dunnes Stores Douglas',
  'Dunnes Stores Blackpool',
  'Dunnes Stores Mahon Point',
  'Dunnes Stores Ballincollig',
  'Dunnes Stores Midleton',
  'Dunnes Stores Carrigaline',
  'Lidl Wilton',
  'Lidl Douglas',
  'Lidl Blackpool',
  'Lidl Ballincollig',
  'Lidl Mayfield',
  'Lidl Mahon',
  'Aldi Wilton',
  'Aldi Douglas',
  'Aldi Blackpool',
  'Aldi Ballincollig',
  'Aldi Mayfield',
  'Aldi Mahon Point',
]

export function StoreUploadForm({ onSuccess, externalOpen, onExternalOpenChange, prefillStoreName }: { onSuccess?: () => void; externalOpen?: boolean; onExternalOpenChange?: (open: boolean) => void; prefillStoreName?: string }) {
  const shouldReduceMotion = useReducedMotion()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = onExternalOpenChange ?? setInternalOpen
  const { location, error: geoError, requestLocation } = useGeolocation()
  const formId = useId()
  const [formData, setFormData] = useState({
    storeName: '',
    retailer: 'other',
    price: '',
    variant: 'zero_sugar',
    packSize: 'single',
    notes: '',
  })
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const [prevOpen, setPrevOpen] = useState(open)
  const [prevPrefill, setPrevPrefill] = useState(prefillStoreName)

  if (open && prefillStoreName) {
    if (!prevOpen || prefillStoreName !== prevPrefill) {
      setFormData(prev => ({ ...prev, storeName: prefillStoreName }))
    }
  }
  if (open !== prevOpen) setPrevOpen(open)
  if (prefillStoreName !== prevPrefill) setPrevPrefill(prefillStoreName)

  const markTouched = useCallback((field: string) => {
    setTouched(prev => new Set(prev).add(field))
  }, [])

  const priceVal = parseFloat(formData.price)
  const packCount = getPackCount(formData.packSize)
  const perCanMin = 0.5
  const perCanMax = 2.0
  const priceValid = formData.price === '' ? null : (
    !isNaN(priceVal) && priceVal >= perCanMin * packCount && priceVal <= perCanMax * packCount
  )
  const storeNameValid = formData.storeName.trim().length >= 3 ? true : formData.storeName === '' ? null : false

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (isNaN(priceVal)) {
      setSubmitError('Price must be a valid number')
      markTouched('price')
      return
    }
    const count = getPackCount(formData.packSize)
    if (priceVal < perCanMin * count || priceVal > perCanMax * count) {
      setSubmitError(`Price must be between €${(perCanMin * count).toFixed(2)} and €${(perCanMax * count).toFixed(2)} for ${formatPackSize(formData.packSize)}`)
      markTouched('price')
      return
    }

    const lat = location != null && Number.isFinite(location.lat) ? location.lat : CORK_CENTER.lat
    const lng = location != null && Number.isFinite(location.lng) ? location.lng : CORK_CENTER.lng

    const variantLabel = MONSTER_VARIANTS.find(v => v.value === formData.variant)?.label ?? 'White Monster Zero Sugar'
    const suffix = formData.packSize !== 'single' ? ` ${formatPackSize(formData.packSize)}` : ''
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
        setFormData({
          storeName: '',
          retailer: 'other',
          price: '',
          variant: 'zero_sugar',
          packSize: 'single',
          notes: '',
        })
        setTouched(new Set())
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

  const handleDialogClose = useCallback((v: boolean) => {
    setOpen(v)
    if (v) {
      setSubmitted(false)
      setSubmitError(null)
      setTouched(new Set())
    }
  }, [setOpen])

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      {externalOpen === undefined && (
        <DialogTrigger>
          <Button variant="outline" size="sm" aria-label="Report a price for a Monster Energy drink">
            Report a Price
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className={submitted ? 'sm:max-w-md' : undefined}>
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-col items-center justify-center py-10 gap-4 text-center"
            >
              <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
                <svg
                  className="size-7 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <div>
                <DialogTitle className="text-lg mb-1">Thanks — your price is pending review</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  It will appear in the list once verified by our community.
                </p>
              </div>
              <DialogFooter>
                <DialogClose>
                  <Button variant="outline">Done</Button>
                </DialogClose>
              </DialogFooter>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={shouldReduceMotion ? false : { opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <DialogHeader>
                <DialogTitle>Report a Monster Price</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor={`${formId}-store`}>Store Name</Label>
                  <div className="relative">
                    <Input
                      id={`${formId}-store`}
                      list={`${formId}-store-suggestions`}
                      placeholder="e.g., Centra Wilton"
                      value={formData.storeName}
                      onChange={(e) =>
                        setFormData({ ...formData, storeName: e.target.value })
                      }
                      onBlur={() => markTouched('storeName')}
                      className={
                        touched.has('storeName') && storeNameValid === false
                          ? 'border-destructive pr-9'
                          : touched.has('storeName') && storeNameValid === true
                            ? 'border-primary pr-9'
                            : undefined
                      }
                      required
                    />
                    {touched.has('storeName') && storeNameValid !== null && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        {storeNameValid ? (
                          <svg className="size-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        ) : (
                          <svg className="size-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        )}
                      </span>
                    )}
                    <datalist id={`${formId}-store-suggestions`}>
                      {CORK_STORES.map((store) => (
                        <option key={store} value={store} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <Label htmlFor={`${formId}-retailer`}>Retailer</Label>
                  <Select
                    items={Object.fromEntries(RETAILERS.map((r) => [r.value, r.label]))}
                    value={formData.retailer}
                    onValueChange={(v) => v && setFormData({ ...formData, retailer: v })}
                  >
                    <SelectTrigger id={`${formId}-retailer`}>
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
                  <Label htmlFor={`${formId}-variant`}>Variant</Label>
                  <Select
                    items={Object.fromEntries(MONSTER_VARIANTS.map((v) => [v.value, v.label]))}
                    value={formData.variant}
                    onValueChange={(v) => v && setFormData({ ...formData, variant: v })}
                  >
                    <SelectTrigger id={`${formId}-variant`}>
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
                  <Label htmlFor={`${formId}-packsize`}>Pack Size</Label>
                  <Select
                    items={Object.fromEntries(PACK_SIZES.map((s) => [s, formatPackSize(s)]))}
                    value={formData.packSize}
                    onValueChange={(v) => v && setFormData({ ...formData, packSize: v })}
                  >
                    <SelectTrigger id={`${formId}-packsize`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PACK_SIZES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {formatPackSize(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor={`${formId}-price`}>Price (EUR)</Label>
                  <div className="relative">
                    <Input
                      id={`${formId}-price`}
                      type="number"
                      step="0.01"
                      min={perCanMin * packCount}
                      max={perCanMax * packCount}
                      placeholder={(packCount * 1.5).toFixed(2)}
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      onBlur={() => markTouched('price')}
                      className={
                        touched.has('price') && priceValid === false
                          ? 'border-destructive pr-9'
                          : touched.has('price') && priceValid === true
                            ? 'border-primary pr-9'
                            : undefined
                      }
                      required
                    />
                    {touched.has('price') && priceValid !== null && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        {priceValid ? (
                          <svg className="size-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        ) : (
                          <svg className="size-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {packCount > 1
                      ? `Enter the total ${formatPackSize(formData.packSize).toLowerCase()} price (€${(perCanMin * packCount).toFixed(2)}–€${(perCanMax * packCount).toFixed(2)})`
                      : 'Enter the price per single can (€0.50–€2.00)'}
                  </p>
                </div>

                <div>
                  <Label htmlFor={`${formId}-notes`}>Notes <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                  <Textarea
                    id={`${formId}-notes`}
                    placeholder="e.g., Found at the back of the chiller, on special offer"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="min-h-[60px] resize-none text-sm"
                    rows={2}
                  />
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

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    'Submit Price'
                  )}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}