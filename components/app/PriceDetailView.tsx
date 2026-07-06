"use client"

import { useState } from "react"
import { MapPin, CreditCard, CircleAlert } from "lucide-react"
import type { Price } from "@/lib/types"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DrsBreakdown } from "@/components/shared/DrsBreakdown"
import { FavoriteButton } from "@/components/shared/FavoriteButton"
import { PriceAlertDialog } from "@/components/shared/PriceAlertDialog"
import { formatPackSize } from "@/lib/constants"
import { formatDistance } from "@/lib/geo"
import dynamic from "next/dynamic"

const MapAsync = dynamic(
  () => import("@/components/map/MapMiniBlock").then((m) => m.MapMiniBlock),
  { ssr: false, loading: () => <div className="h-64 bg-muted animate-pulse rounded-lg" /> }
)

interface PriceDetailViewProps {
  price: Price | null
  open: boolean
  onClose: () => void
  onReportPrice?: () => void
  userLat?: number
  userLng?: number
}

export function PriceDetailView({ price, open, onClose, onReportPrice, userLat, userLng }: PriceDetailViewProps) {
  const [alertDialogOpen, setAlertDialogOpen] = useState(false)

  if (!price) return null

  const store = price.stores
  const product = price.products
  const perCanPrice = price.per_can_price ?? Number(price.price)
  const packSize = product?.pack_size ?? "single"
  const variant = product?.variant ?? "zero_sugar"

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2 pr-6">
            <Badge variant="outline" className="capitalize">
              {store?.retailer ?? "Unknown"}
            </Badge>
          </div>
          <SheetTitle className="text-left">{store?.name ?? "Unknown store"}</SheetTitle>
          <SheetDescription className="text-left">
            {store?.address ? `${store.address}, ${store.suburb ?? ""}` : "National price"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-mono font-bold tabular-nums">
              €{Number(price.price).toFixed(2)}
            </span>
            <span className="text-muted-foreground font-mono tabular-nums">
              €{perCanPrice.toFixed(2)}/can
            </span>
          </div>

          {price.drs_deposit != null && price.drs_deposit > 0 && (
            <DrsBreakdown totalPrice={Number(price.price)} packSize={packSize} />
          )}

          {price.has_clubcard_pricing && price.clubcard_price != null && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <CreditCard className="size-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Clubcard price</p>
                <p className="text-xs text-muted-foreground">
                  €{Number(price.clubcard_price).toFixed(2)} with Clubcard
                </p>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <h3 className="font-medium">{product?.name ?? "Unknown product"}</h3>
            <p className="text-sm text-muted-foreground">
              {product?.variant.replace(/_/g, " ")} · {formatPackSize(packSize)}
            </p>
          </div>

          {price.distance !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {formatDistance(price.distance * 1000)} away
              </span>
            </div>
          )}

          {store && (
            <MapAsync
              store={store}
              userLocation={userLat && userLng ? { lat: userLat, lng: userLng } : null}
              height={280}
              className="rounded-lg overflow-hidden"
            />
          )}

          <div className="text-xs text-muted-foreground">
            Source: <span className="capitalize">{price.source.replace(/_/g, " ")}</span>
          </div>
        </div>

        <SheetFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onReportPrice} className="flex-1">
            <CircleAlert className="size-4 mr-2" />
            Report a price
          </Button>
          <PriceAlertDialog
            variant={variant}
            open={alertDialogOpen}
            onClose={() => setAlertDialogOpen(false)}
            onCreated={() => setAlertDialogOpen(false)}
          />
          <Button variant="outline" onClick={() => setAlertDialogOpen(true)} className="flex-1">
            Set alert
          </Button>
          {product?.id && <FavoriteButton productId={product.id} storeId={store?.id} />}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
