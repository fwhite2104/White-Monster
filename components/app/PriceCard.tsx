import { RetailerBadge } from "./RetailerBadge"
import type { Price } from "@/lib/types"
import { formatPackSize } from "@/lib/constants"

interface PriceCardProps {
  price: Price
  isBest?: boolean
  onClick?: () => void
}

export function PriceCard({ price, isBest, onClick }: PriceCardProps) {
  const store = price.stores
  const product = price.products
  const numericPrice = Number(price.price)
  const perCan = price.per_can_price ?? numericPrice
  const packSize = product?.pack_size ?? 'single'

  return (
    <button
      onClick={onClick}
      data-testid="price-card"
      className="w-full text-left px-4 py-3 rounded-xl card-shadow-sm bg-card hover:bg-card/80 hover:border-primary/20 transition-all"
      aria-label={`${store?.name ?? 'Unknown store'}: ${product?.name ?? 'Monster'} for €${numericPrice.toFixed(2)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <RetailerBadge retailer={store?.retailer ?? 'other'} />
          <h3 className="mt-1 font-medium truncate">{store?.name ?? 'Unknown store'}</h3>
          <p className="text-xs text-muted-foreground truncate">
            {store?.suburb ?? store?.address ?? 'Cork'} · {((price.distance ?? 0) / 1000).toFixed(1)} km
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="price-lg text-lg font-semibold text-foreground">
            €{numericPrice.toFixed(2)}
          </div>
          {packSize !== 'single' && perCan > 0 && perCan !== numericPrice && (
            <div className="text-xs text-muted-foreground">
              €{perCan.toFixed(2)} per can · {formatPackSize(packSize)}
            </div>
          )}
          {packSize === 'single' && (
            <div className="text-xs text-muted-foreground">{formatPackSize(packSize)}</div>
          )}
        </div>
      </div>
      {isBest && (
        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
          Best Price
        </div>
      )}
    </button>
  )
}
