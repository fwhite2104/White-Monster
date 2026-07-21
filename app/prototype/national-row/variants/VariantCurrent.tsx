// PROTOTYPE variant — throwaway. Control: uses the REAL, unmodified PriceCard and BestPriceBanner.
// This is today's misleading presentation: national anchor row with Cork coords + "Cork City" suburb + 0.0 km.

import { PriceCard } from "@/components/app/PriceCard"
import { BestPriceBanner } from "@/components/app/BestPriceBanner"
import type { Price, Product } from "@/lib/types"

export function VariantCurrent({
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
          State: no physical Tesco in radius &middot; national anchor surfaces with Cork coords (TODAY&rsquo;S BEHAVIOUR)
        </p>
        <h2 className="text-sm font-medium text-muted-foreground">Best Price banner</h2>
        <BestPriceBanner price={national} />
        <h2 className="text-sm font-medium text-muted-foreground">Price card</h2>
        <PriceCard price={national} isBest />
      </section>

      <section className="space-y-3 pt-4 border-t border-border">
        <p className="text-xs font-mono text-muted-foreground">
          For comparison: a physical Tesco in radius (1.2 km away)
        </p>
        <PriceCard price={physical} />
      </section>
    </div>
  )
}