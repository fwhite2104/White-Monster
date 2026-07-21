// PROTOTYPE variant A — throwaway. "Nationwide" badge replaces the km distance.
// Ponytail-laziest: one `if national` branch in the location line, swap "X km" → "Nationwide". No ribbon, no new layout.

import { RetailerBadge } from "@/components/app/RetailerBadge"
import { formatPackSize } from "@/lib/constants"
import type { Price, Product } from "@/lib/types"

export function VariantBadge({
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
          State: no physical Tesco in radius &middot; national row surfaces as &ldquo;Nationwide&rdquo; (no km, no Cork fallback)
        </p>
        <h2 className="text-sm font-medium text-muted-foreground">Price card (Variant A)</h2>
        <NullCoordPriceCardA price={national} isBest />
      </section>

      <section className="space-y-3 pt-4 border-t border-border">
        <p className="text-xs font-mono text-muted-foreground">
          For comparison: a physical Tesco in radius (km shown as normal)
        </p>
        <NullCoordPriceCardA price={physical} />
      </section>
    </div>
  )
}

// Local copy of PriceCard that detects null coords (lat === 0 && lng === 0 && suburb === "Ireland (national)")
// and renders "Nationwide" where today the card shows `${suburb ?? address ?? 'Cork'} · ${km.toFixed(1)} km`.
// This is the structural diff the build would land:
//   const isNational = (store?.lat === 0 || store?.lat == null) && (store?.lng === 0 || store?.lng == null)
//     ? (store?.suburb ?? "").includes("national")
//     : false
// In real build, lat/lng are null — prototype uses 0 as the de-facto convention (matches createNationalPriceFromSummary).
function NullCoordPriceCardA({ price, isBest }: { price: Price; isBest?: boolean }) {
  const store = price.stores
  const product = price.products
  const numericPrice = Number(price.price)
  const perCan = price.per_can_price ?? numericPrice
  const packSize = product?.pack_size ?? "single"

  const isNational =
    (store?.lat === 0 || store?.lat == null) &&
    (store?.lng === 0 || store?.lng == null) &&
    (store?.suburb ?? "").toLowerCase().includes("national")

  const locationLabel = isNational
    ? "Nationwide"
    : `${store?.suburb ?? store?.address ?? "Cork"} · ${((price.distance ?? 0) / 1000).toFixed(1)} km`

  return (
    <button
      data-testid="price-card-a"
      className="w-full text-left px-4 py-3 rounded-xl card-shadow-sm bg-card hover:bg-card/80 hover:border-primary/20 transition-all"
      aria-label={`${store?.name ?? "Unknown store"}: ${product?.name ?? "Monster"} for €${numericPrice.toFixed(2)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <RetailerBadge retailer={store?.retailer ?? "other"} />
          <h3 className="mt-1 font-medium truncate">{store?.name ?? "Unknown store"}</h3>
          <p className="text-xs text-muted-foreground truncate">
            {isNational ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium uppercase tracking-wide text-[10px]">
                Nationwide
              </span>
            ) : (
              locationLabel
            )}
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
    </button>
  )
}