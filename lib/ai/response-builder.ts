import type { ParsedQuery } from '@/lib/ai/query-parser'
import type { Price } from '@/lib/types'
import { MONSTER_VARIANTS } from '@/lib/constants'

function getVariantLabel(variant?: string): string {
  if (!variant) return 'Monster'
  return MONSTER_VARIANTS.find((v) => v.value === variant)?.label ?? variant.replace(/_/g, ' ')
}

function formatPrice(p: number): string {
  return `€${p.toFixed(2)}`
}

function buildCheapestResponse(query: ParsedQuery, prices: Price[]): string {
  const variantLabel = getVariantLabel(query.variant)

  if (prices.length === 0) {
    return `Sorry, I couldn't find any ${variantLabel} prices nearby. Try expanding your search radius or checking back later.`
  }

  const sorted = [...prices].sort((a, b) => Number(a.price) - Number(b.price))
  const top3 = sorted.slice(0, 3)

  const lines = top3.map((p, i) => {
    const store = p.stores?.name ?? 'Unknown store'
    const suburb = p.stores?.suburb ? `, ${p.stores.suburb}` : ''
    const dist = p.distance != null ? ` · ${(p.distance / 1000).toFixed(1)} km` : ''
    const perCan = p.products?.pack_size === '4_pack' ? ` (${formatPrice(Number(p.per_can_price ?? Number(p.price) / 4))}/can)` : ''
    return `${i + 1}. **${store}**${suburb} — ${formatPrice(Number(p.price))}${perCan}${dist}`
  })

  const best = top3[0]
  const bestStore = best.stores?.name ?? 'Unknown'
  const saving = sorted.length > 1 ? Number(sorted[sorted.length - 1].price) - Number(best.price) : 0

  let response = `Here are the cheapest ${variantLabel} prices near you:\n\n${lines.join('\n')}`

  if (saving > 0) {
    response += `\n\nYou could save ${formatPrice(saving)} by choosing ${bestStore} over the most expensive option.`
  }

  if (query.packSize === '4_pack' || (best.products?.pack_size === '4_pack')) {
    response += `\n\nPer-can price shown in brackets for 4-packs.`
  }

  return response
}

function buildCompareResponse(query: ParsedQuery, prices: Price[]): string {
  if (prices.length === 0) {
    return `I couldn't find any prices to compare. Try a different search.`
  }

  const byStore = new Map<string, Price[]>()
  for (const p of prices) {
    const name = p.stores?.name ?? 'Unknown'
    if (!byStore.has(name)) byStore.set(name, [])
    byStore.get(name)!.push(p)
  }

  const variantLabel = getVariantLabel(query.variant)
  const lines: string[] = [`Comparing ${variantLabel} prices:\n`]

  const stores = Array.from(byStore.entries()).sort((a, b) => {
    const avgA = a[1].reduce((s, p) => s + Number(p.price), 0) / a[1].length
    const avgB = b[1].reduce((s, p) => s + Number(p.price), 0) / b[1].length
    return avgA - avgB
  })

  for (const [store, storePrices] of stores) {
    const minP = Math.min(...storePrices.map((p) => Number(p.price)))
    const maxP = Math.max(...storePrices.map((p) => Number(p.price)))
    const dist = storePrices[0].distance != null ? ` · ${(storePrices[0].distance / 1000).toFixed(1)} km` : ''
    const range = minP === maxP ? formatPrice(minP) : `${formatPrice(minP)} - ${formatPrice(maxP)}`
    lines.push(`• **${store}** — ${range}${dist}`)
  }

  return lines.join('\n')
}

function buildFlavoursResponse(prices: Price[]): string {
  const variants = new Set<string>()
  for (const p of prices) {
    if (p.products?.variant) variants.add(p.products.variant)
  }

  if (variants.size === 0) {
    return `I couldn't find any Monster variants available near you right now.`
  }

  const lines = Array.from(variants).map((v) => {
    const label = MONSTER_VARIANTS.find((mv) => mv.value === v)?.label ?? v.replace(/_/g, ' ')
    const count = prices.filter((p) => p.products?.variant === v).length
    return `• **${label}** — available at ${count} store${count !== 1 ? 's' : ''}`
  })

  return `Here are the Monster flavours available near you:\n\n${lines.join('\n')}\n\nWant to know the cheapest option for any of these? Just ask!`
}

function buildVolumeResponse(query: ParsedQuery, prices: Price[]): string {
  const qty = query.quantity ?? 10
  const variantLabel = getVariantLabel(query.variant)

  if (prices.length === 0) {
    return `I couldn't find prices for ${variantLabel} to calculate a ${qty}-can total.`
  }

  const cheapest = [...prices].sort((a, b) => Number(a.price) - Number(b.price))[0]
  const perCan = cheapest.products?.pack_size === '4_pack'
    ? Number(cheapest.per_can_price ?? Number(cheapest.price) / 4)
    : Number(cheapest.price)

  const total = perCan * qty
  const store = cheapest.stores?.name ?? 'Unknown store'

  return `For **${qty} cans** of ${variantLabel}:\n\n• At **${store}**: ${formatPrice(total)} (${formatPrice(perCan)}/can)\n\nThis is based on the cheapest per-can price near you. Prices may vary by store and pack size.`
}

function buildHelpResponse(): string {
  return `I'm Monster Cork's deal assistant! Here's what I can help with:\n\n• **"Cheapest zero sugar"** — Find the lowest prices\n• **"Compare Tesco vs Dunnes"** — Compare stores\n• **"Any deals this week?"** — Check promotions\n• **"What flavours are available?"** — Browse variants\n• **"How much for 10 cans?"** — Volume pricing\n\nJust type your question naturally!`
}

export function generateResponse(query: ParsedQuery, prices: Price[]): string {
  switch (query.intent) {
    case 'cheapest':
      return buildCheapestResponse(query, prices)
    case 'compare':
      return buildCompareResponse(query, prices)
    case 'deals':
      return buildCheapestResponse({ ...query, intent: 'cheapest' }, prices)
    case 'flavours':
      return buildFlavoursResponse(prices)
    case 'volume':
      return buildVolumeResponse(query, prices)
    case 'help':
      return buildHelpResponse()
    default:
      return buildCheapestResponse(query, prices)
  }
}
