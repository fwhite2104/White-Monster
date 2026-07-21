// PROTOTYPE variant B — throwaway. A small "Nationwide" ribbon above the price content, card layout otherwise intact.
// Heavier than A — the ribbon lives ABOVE the retailer badge/name row, adding one extra visual row.

import { RetailerBadge } from "@/components/app/RetailerBadge"
import { formatPackSize } from "@/lib/constants"
import type { Price, Product } from "@/lib/types"

export function VariantRibbon({
  national,
  physical,
  product: _product,
}: {
  national: Price
  physical: Price
  product: Product
}) {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="text-xs font-mono text-muted-foreground">
          State: no physical Tesco in radius &middot; national row surfaces with a ribbon above the card content
        </p>
        <h2 className="text-sm font-medium text-muted-foreground">Price card (Variant B)</h2>
        <NullCoordPriceCardB price={national} isBest />
      </section>

      <section className="space-y-3 pt-4 border-t border-border">
        <p className="text-xs font-mono text-muted-foreground">
          For comparison: a physical Tesco (no ribbon, normal km display)
        </p>
        <NullCoordPriceCardB price={physical} />
      </section>
    </div>
  )
}

function NullCoordPriceCardB({ price, isBest }: { price: Price; isBest?: boolean }) {
  const store = price.stores
  const product = price.products
  const numericPrice = Number(price.price)
  const perCan = price.per_can_price ?? numericPrice
  const packSize = product?.pack_size ?? "single"

  const isNational =
    (store?.lat === 0 || store?.lat == null) &&
    (store?.lng === 0 || store?.lng == null) &&
    (store?.suburb ?? "").toLowerCase().includes("national")

  return (
    <button
      data-testid="price-card-b"
      className="w-full text-left rounded-xl card-shadow-sm bg-card hover:bg-card/80 hover:border-primary/20 transition-all overflow-hidden"
      aria-label={`${store?.name ?? "Unknown store"}: ${product?.name ?? "Monster"} for €${numericPrice.toFixed(2)}`}
    >
      {isNational && (
        <div className="px-4 py-1.5 bg-primary/15 text-primary text-xs font-medium uppercase tracking-wide">
          Available nationwide &mdash; shown when no local store in radius
        </div>
      )}
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <RetailerBadge retailer={store?.retailer ?? "other"} />
            <h3 className="mt-1 font-medium truncate">{store?.name ?? "Unknown store"}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {store?.suburb ?? store?.address ?? "Nationwide"}
              {!isNational && <> · {((price.distance ?? 0) / 1000).toFixed(1)} km</>}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="price-lg text-lg font-semibold text-foreground">
              €{numericPrice.toFixed(2)}
            </div>
            {packSize !== "single" && perCan > 0 && perCan !== numericPrice && (
              <div className="text-xs text-muted-foreground">
                €{perCan.toFixed(2)} per can · {formatPackSize(packSize)}
              </div>
            )}
            {packSize === "single" && (
              <div className="text-xs text-muted-foreground">{formatPackSize(packSize)}</div>
            )}
          </div>
        </div>
        {isBest && (
          <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
            Best Price
          </div>
        )}
      </div>
    </button>
  )
}