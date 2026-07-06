'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { X, MapPin, Share2, Flag, Bell, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type Price } from '@/lib/types'
import { getRetailerColor, getPackCount, formatPackSize } from '@/lib/constants'
import { calculateDistance, formatDistance } from '@/lib/geo'
import { splitPrice } from '@/lib/drs'
import { DrsBreakdown } from './DrsBreakdown'
import { ClubcardBadge } from './ClubcardBadge'
import { FavoriteButton } from './FavoriteButton'
import { PriceAlertDialog } from './PriceAlertDialog'
import { StoreUploadForm } from './StoreUploadForm'

const MapLibreMap = dynamic(() => import('@/components/map/MapLibreMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[240px] w-full rounded-lg bg-muted shimmer-bar" />
  ),
})

interface PriceDetailPanelProps {
  price: Price | null
  open: boolean
  onClose: () => void
  userLat?: number
  userLng?: number
}

const panelVariants = {
  hidden: { x: '100%' },
  visible: { x: 0 },
  exit: { x: '100%' },
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

const staggerContainer = {
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

const staggerItem = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
}

export function PriceDetailPanel({
  price,
  open,
  onClose,
  userLat,
  userLng,
}: PriceDetailPanelProps) {
  const shouldReduceMotion = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const [uploadOpen, setUploadOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)

  // Focus trap + Escape key
  useEffect(() => {
    if (!open) return

    requestAnimationFrame(() => closeButtonRef.current?.focus())

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const handleShare = useCallback(async () => {
    if (!price?.stores || !price?.products) return

    const text = `${price.products.name} at ${price.stores.name} — €${price.price.toFixed(2)}`

    try {
      await navigator.clipboard.writeText(text)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    } catch {
      // Clipboard API not available
    }
  }, [price])

  if (!price?.stores || !price?.products) return null

  const store = price.stores
  const product = price.products
  const retailerColor = getRetailerColor(store.retailer)
  const packCount = getPackCount(product.pack_size)
  const isMultipack = packCount > 1

  // Distance
  let distanceLabel: string | null = null
  if (userLat != null && userLng != null) {
    distanceLabel = formatDistance(calculateDistance(userLat, userLng, store.lat, store.lng))
  } else if (price.distance != null) {
    distanceLabel = formatDistance(price.distance * 1000)
  }

  // Price breakdown
  const { base_price, drs_deposit } =
    price.base_price != null && price.drs_deposit != null
      ? { base_price: price.base_price, drs_deposit: price.drs_deposit }
      : splitPrice(price.price, product.pack_size)

  const clubcardSavings =
    price.clubcard_price != null ? price.price - price.clubcard_price : 0

  const isNational = !store.address && !store.suburb

  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.3, ease: [0.23, 1, 0.32, 1] as const }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — mobile only */}
          <motion.div
            className="fixed inset-0 z-[var(--z-overlay)] bg-black/50 lg:hidden"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={transition}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="price-detail-header"
            className={cn(
              'fixed z-[var(--z-dialog)] bg-card border border-border',
              'bottom-0 right-0 h-[85vh] w-full max-w-md rounded-t-2xl',
              'overflow-y-auto scrollbar-none pb-safe',
              'lg:static lg:h-auto lg:max-h-[calc(100vh-4rem)] lg:rounded-2xl',
            )}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={transition}
          >
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={transition}
              className="flex flex-col h-full"
            >
              {/* Header */}
              <motion.div
                variants={staggerItem}
                className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-border bg-card/95 backdrop-blur-sm"
              >
                <div
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: retailerColor }}
                  aria-hidden="true"
                />
                <h2
                  id="price-detail-header"
                  className="flex-1 text-sm font-semibold truncate capitalize"
                >
                  {store.retailer}
                </h2>
                <FavoriteButton
                  productId={product.id}
                  storeId={store.id}
                  className="shrink-0"
                />
                <Button
                  ref={closeButtonRef}
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <X className="size-4" />
                </Button>
              </motion.div>

              {/* Content */}
              <div className="flex-1 px-4 py-4 flex flex-col gap-5">
                {/* Product info */}
                <motion.div variants={staggerItem} className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {formatPackSize(product.pack_size)}
                  </p>
                  <h3 className="text-base font-semibold text-foreground leading-tight">
                    {product.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {product.size_ml}ml
                    {isMultipack && ` · ${packCount} cans`}
                  </p>
                </motion.div>

                {/* Price breakdown */}
                <motion.div variants={staggerItem} className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="price-hero text-[var(--text-price-hero)] text-foreground">
                      €{price.price.toFixed(2)}
                    </span>
                    {price.has_clubcard_pricing && <ClubcardBadge />}
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Product price</span>
                      <span className="price-base text-foreground">
                        €{base_price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>DRS deposit ({packCount} × €0.15)</span>
                      <span className="price-base text-green-400">
                        +€{drs_deposit.toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-border pt-1.5" />
                  </div>

                  {price.has_clubcard_pricing && price.clubcard_price != null && (
                    <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-400 font-medium">
                          Clubcard price
                        </span>
                        <span className="price-md text-foreground">
                          €{price.clubcard_price.toFixed(2)}
                        </span>
                      </div>
                      {clubcardSavings > 0 && (
                        <p className="text-xs text-blue-300">
                          Save €{clubcardSavings.toFixed(2)} with Clubcard
                        </p>
                      )}
                    </div>
                  )}

                  {isMultipack && price.per_can_price != null && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Per can</span>
                      <span className="price-base text-foreground">
                        €{price.per_can_price.toFixed(2)}
                      </span>
                    </div>
                  )}
                </motion.div>

                {/* Store info */}
                <motion.div variants={staggerItem} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {store.name}
                      </p>
                      {(store.suburb || store.address) && (
                        <p className="text-xs text-muted-foreground truncate">
                          {[store.suburb, store.address].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {isNational && (
                        <p className="text-xs text-muted-foreground italic">
                          National price
                        </p>
                      )}
                    </div>
                  </div>
                  {distanceLabel && (
                    <div className="flex items-center gap-2 text-sm">
                      <Navigation className="size-3.5 text-muted-foreground" />
                      <span className="text-primary font-medium tabular-nums">
                        {distanceLabel} away
                      </span>
                    </div>
                  )}
                </motion.div>

                {/* Mini map */}
                <motion.div
                  variants={staggerItem}
                  className="rounded-lg overflow-hidden border border-border"
                >
                  <MapLibreMap
                    stores={[{
                      id: store.id,
                      name: store.name,
                      retailer: store.retailer,
                      address: store.address,
                      lat: store.lat,
                      lng: store.lng,
                    }]}
                    userLocation={
                      userLat != null && userLng != null
                        ? { lat: userLat, lng: userLng }
                        : null
                    }
                    selectedStoreId={store.id}
                    className="h-[240px]"
                  />
                </motion.div>

                {/* DRS breakdown detail */}
                <motion.div variants={staggerItem}>
                  <DrsBreakdown
                    totalPrice={price.price}
                    packSize={product.pack_size}
                    className="rounded-lg bg-muted/50 px-3 py-2"
                  />
                </motion.div>
              </div>

              {/* Actions footer */}
              <motion.div
                variants={staggerItem}
                className="sticky bottom-0 border-t border-border bg-card/95 backdrop-blur-sm px-4 py-3 flex gap-2"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => setUploadOpen(true)}
                >
                  <Flag className="size-3.5" />
                  Report price
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => setAlertOpen(true)}
                >
                  <Bell className="size-3.5" />
                  Alert
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleShare}
                >
                  <Share2 className="size-3.5" />
                  {shareCopied ? 'Copied!' : 'Share'}
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Report price modal */}
          <StoreUploadForm
            externalOpen={uploadOpen}
            onExternalOpenChange={setUploadOpen}
            prefillStoreName={store.name}
          />

          {/* Price alert dialog */}
          <PriceAlertDialog
            variant={product.variant}
            open={alertOpen}
            onClose={() => setAlertOpen(false)}
            onCreated={() => setAlertOpen(false)}
          />
        </>
      )}
    </AnimatePresence>
  )
}
