'use client'

import { motion } from 'framer-motion'
import { X, MapPin, Package } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getRetailerColor } from '@/lib/constants'
import type { Price, Product, Store } from '@/lib/types'

interface ScanResultProps {
  product: Product
  prices: Array<Price & { stores?: Store }>
  onClose: () => void
}

export function ScanResult({ product, prices, onClose }: ScanResultProps) {
  const sorted = [...prices].sort((a, b) => Number(a.price) - Number(b.price))
  const best = sorted[0] ?? null

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="fixed inset-0 z-[var(--z-overlay)] bg-background overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon-lg" onClick={onClose} aria-label="Close scan results">
          <X className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{product.name}</h2>
          <p className="text-xs text-muted-foreground">
            {product.variant.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            {' · '}
            {product.size_ml}ml
            {product.pack_size === '4_pack' && ' · 4-pack'}
          </p>
        </div>
        {best && (
          <Badge variant="success" className="text-sm px-2 py-1 shrink-0">
            Best: €{Number(best.price).toFixed(2)}
          </Badge>
        )}
      </div>

      {/* Product info */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              width={64}
              height={64}
              className="w-16 h-16 rounded-lg object-cover bg-muted"
              unoptimized
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">
              Found {sorted.length} price{sorted.length !== 1 ? 's' : ''} nearby
            </p>
            {best?.stores && (
              <p className="text-sm mt-1">
                Best price at <strong>{best.stores.name}</strong>
                {best.stores.suburb && <span className="text-muted-foreground"> · {best.stores.suburb}</span>}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Price list */}
      {sorted.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-1">No prices found nearby</p>
          <p className="text-sm text-muted-foreground/70">
            Try expanding your search radius or check again later.
          </p>
        </div>
      ) : (
        <div className="px-4 py-3 space-y-2">
          {sorted.map((price, idx) => {
            const store = price.stores ?? { name: 'Unknown', retailer: 'other', suburb: '' }
            const retailerColor = getRetailerColor(store.retailer)
            const isBest = idx === 0

            return (
              <div
                key={price.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isBest ? 'border-primary/30 bg-primary/5' : 'border-border'
                }`}
              >
                <div
                  className="w-1 h-10 rounded-full shrink-0"
                  style={{ backgroundColor: retailerColor }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-lg font-bold tabular-nums ${isBest ? 'text-primary' : ''}`}>
                      €{Number(price.price).toFixed(2)}
                    </span>
                    {isBest && (
                      <Badge variant="success" className="text-xs px-1.5 py-0">
                        Best Price
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {store.name}
                    {store.suburb && <span> · {store.suburb}</span>}
                  </p>
                </div>
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            )
          })}
        </div>
      )}

      {/* Bottom action */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border px-4 py-3 pb-safe">
        <Button onClick={onClose} className="w-full h-11" variant="outline">
          Scan Another
        </Button>
      </div>
    </motion.div>
  )
}
