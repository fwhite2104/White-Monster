'use client'

import * as Dialog from "@radix-ui/react-dialog"
import { X, MapPin, ExternalLink } from "lucide-react"
import { RetailerBadge } from "./RetailerBadge"
import { formatPackSize, getPackCount } from "@/lib/constants"
import type { Price } from "@/lib/types"

interface PriceDetailSheetProps {
  price: Price | null
  open: boolean
  onClose: () => void
  onReportPrice: () => void
}

export function PriceDetailSheet({ price, open, onClose, onReportPrice }: PriceDetailSheetProps) {
  if (!price) return null

  const store = price.stores
  const product = price.products
  const numericPrice = Number(price.price)
  const perCan = price.per_can_price ?? numericPrice / getPackCount(product?.pack_size ?? 'single')
  const drsDeposit = price.drs_deposit ?? 0
  const updatedAt = price.scraped_at ? new Date(price.scraped_at).toLocaleDateString() : 'Unknown'

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed inset-x-0 bottom-0 lg:inset-y-0 lg:right-0 lg:left-auto lg:w-[400px] max-h-[85vh] lg:max-h-none rounded-t-2xl lg:rounded-none bg-background border-t lg:border-l lg:border-t-0 border-border p-5 shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom lg:data-[state=closed]:slide-out-to-right lg:data-[state=open]:slide-in-from-right"
          aria-describedby="price-detail-description"
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold">Price details</Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="p-2 rounded-full hover:bg-muted"
                aria-label="Close details"
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </div>

          <p id="price-detail-description" className="sr-only">
            Detailed information about this Monster Energy price.
          </p>

          <div className="space-y-4">
            <div>
              <RetailerBadge retailer={store?.retailer ?? 'other'} />
              <h2 className="mt-1 text-xl font-semibold">{store?.name ?? 'Unknown store'}</h2>
              <p className="text-sm text-muted-foreground">
                {store?.address && <span>{store.address}</span>}
                {store?.suburb && <span>, {store.suburb}</span>}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {((price.distance ?? 0) / 1000).toFixed(1)} km away
              </p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Price</span>
                <span className="price-lg text-2xl font-bold">€{numericPrice.toFixed(2)}</span>
              </div>
              {product?.pack_size && product.pack_size !== 'single' && (
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-sm text-muted-foreground">Per can</span>
                  <span className="price-lg text-lg">€{perCan.toFixed(2)}</span>
                </div>
              )}
              {drsDeposit > 0 && (
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-sm text-muted-foreground">DRS deposit</span>
                  <span className="text-sm">€{drsDeposit.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-sm text-muted-foreground">Pack size</span>
                <span className="text-sm">{formatPackSize(product?.pack_size ?? 'single')}</span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-sm text-muted-foreground">Variant</span>
                <span className="text-sm">{product?.name ?? 'Monster Energy'}</span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-sm text-muted-foreground">Source</span>
                <span className="text-sm capitalize">{price.source.replace('_', ' ')}</span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-sm text-muted-foreground">Last updated</span>
                <span className="text-sm">{updatedAt}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={onReportPrice}
                className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium"
              >
                Report a price at this store
              </button>
              {store?.lat && store?.lng && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-card border border-border font-medium"
                >
                  <MapPin className="size-4" />
                  Open in Maps
                  <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
