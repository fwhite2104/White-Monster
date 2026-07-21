// PROTOTYPE variant C — throwaway. National rows are NOT cards; they appear in a separate "National prices" panel.
// Heaviest visual change — splits the national and physical price lists into two visual zones.

import { RetailerBadge } from "@/components/app/RetailerBadge"
import { formatPackSize } from "@/lib/constants"
import type { Price, Product } from "@/lib/types"

export function VariantOffMap({
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
          State: no physical Tesco in radius &middot; national row appears in a separate &ldquo;National prices&rdquo; panel, not as a card
        </p>
        <NationalPanel prices={[national]} />
      </section>

      <section className="space-y-3 pt-4 border-t border-border">
        <p className="text-xs font-mono text-muted-foreground">
          For comparison: a physical Tesco in radius renders as a normal card
        </p>
        <PhysicalCardC price={physical} />
      </section>
    </div>
  )
}

// A compact panel — one row per national retailer. No distance, no km, no marker on the map.
function NationalPanel({ prices }: { prices: Price[] }) {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-wide text-primary flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
        National prices
        <span className="text-muted-foreground normal-case font-normal tracking-normal">
          &mdash; shown when no local store of this retailer is in radius
        </span>
      </h3>
      <ul className="divide-y divide-border/50">
        {prices.map((p) => {
          const store = p.stores
          const product = p.products
          const numericPrice = Number(p.price)
          const perCan = p.per_can_price ?? numericPrice
          return (
            <li key={p.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0 flex-1">
                <RetailerBadge retailer={store?.retailer ?? "other"} />
                <p className="mt-0.5 text-sm font-medium truncate">
                  {(store?.retailer ?? "retailer").charAt(0).toUpperCase() + (store?.retailer ?? "retailer").slice(1)} nationwide
                </p>
                {product?.pack_size && product.pack_size !== "single" && (
                  <p className="text-xs text-muted-foreground">
                    {formatPackSize(product.pack_size)} · €{perCan.toFixed(2)} per can
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="price-lg text-lg font-semibold">€{numericPrice.toFixed(2)}</span>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function PhysicalCardC({ price }: { price: Price }) {
  const store = price.stores
  const product = price.products
  const numericPrice = Number(price.price)
  const perCan = price.per_can_price ?? numericPrice
  const packSize = product?.pack_size ?? "single"

  return (
    <button
      data-testid="price-card-c"
      className="w-full text-left px-4 py-3 rounded-xl card-shadow-sm bg-card hover:bg-card/80 hover:border-primary/20 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <RetailerBadge retailer={store?.retailer ?? "other"} />
          <h3 className="mt-1 font-medium truncate">{store?.name ?? "Unknown store"}</h3>
          <p className="text-xs text-muted-foreground truncate">
            {store?.suburb ?? store?.address ?? "Cork"} · {((price.distance ?? 0) / 1000).toFixed(1)} km
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
        </div>
      </div>
    </button>
  )
}