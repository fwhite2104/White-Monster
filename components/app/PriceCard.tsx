"use client"

import { MapPin, ShoppingBag, CreditCard } from "lucide-react"
import type { Price } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { getRetailerColor, formatPackSize } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface PriceCardProps {
  price: Price
  isBestDeal?: boolean
  onClick?: () => void
}

export function PriceCard({ price, isBestDeal, onClick }: PriceCardProps) {
  const retailerColor = getRetailerColor(price.stores?.retailer ?? "")
  const perCanPrice = price.per_can_price ?? Number(price.price)
  const packSize = price.products?.pack_size ?? "single"

  return (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-all hover:border-primary/50 active:scale-[0.99]",
        isBestDeal && "ring-1 ring-primary/30 border-primary/50"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="size-2 rounded-full shrink-0"
              style={{ backgroundColor: retailerColor }}
            />
            <span className="text-xs text-muted-foreground capitalize">
              {price.stores?.retailer ?? "Unknown"}
            </span>
          </div>

          <p className="font-medium truncate">{price.stores?.name ?? "Unknown store"}</p>

          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
            {price.distance !== undefined && (
              <>
                <MapPin className="size-3 shrink-0" />
                <span>{price.distance.toFixed(1)} km</span>
                <span>·</span>
              </>
            )}
            <ShoppingBag className="size-3 shrink-0" />
            <span>{price.products?.variant.replace(/_/g, " ") ?? "Unknown"}</span>
            <span>·</span>
            <span>{formatPackSize(packSize)}</span>
          </div>

          <div className="flex items-center gap-1.5 mt-2">
            {price.drs_deposit != null && price.drs_deposit > 0 && (
              <Badge variant="secondary" className="text-xs">
                +€{price.drs_deposit.toFixed(2)} DRS
              </Badge>
            )}
            {price.has_clubcard_pricing && (
              <Badge variant="secondary" className="text-xs">
                <CreditCard className="size-3 mr-0.5" />
                Clubcard
              </Badge>
            )}
            <Badge variant="outline" className="text-xs capitalize">
              {price.source === "user_upload" || price.source === "user_reported" ? "user" : "scraper"}
            </Badge>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-price-lg font-mono font-bold tabular-nums">
            €{Number(price.price).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground font-mono tabular-nums">
            €{perCanPrice.toFixed(2)}/can
          </p>
        </div>
      </div>
    </Card>
  )
}
