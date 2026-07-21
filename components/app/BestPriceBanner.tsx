import type { Price } from "@/lib/types"

interface BestPriceBannerProps {
  price: Price | null
}

export function BestPriceBanner({ price }: BestPriceBannerProps) {
  if (!price) return null

  const store = price.stores
  const numericPrice = Number(price.price)
  const isNationwide = !Number.isFinite(price.distance ?? 0)

  return (
    <div className="mb-4 p-4 rounded-xl bg-primary/10 border border-primary/20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-primary uppercase tracking-wide">Best Price</p>
          <h2 className="mt-0.5 font-semibold">{store?.name ?? 'Unknown store'}</h2>
          <p className="text-xs text-muted-foreground">
            {isNationwide ? 'Nationwide' : (store?.suburb ?? store?.address ?? 'Ireland')}
          </p>
        </div>
        <div className="text-right">
          <div className="price-lg text-2xl font-bold text-primary">
            €{numericPrice.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">per {price.products?.pack_size === 'single' ? 'can' : price.products?.pack_size ? price.products.pack_size.replace('_', '-') : 'can'}</p>
        </div>
      </div>
    </div>
  )
}
