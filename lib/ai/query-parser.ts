export type Intent = 'cheapest' | 'compare' | 'deals' | 'flavours' | 'volume' | 'help'

export interface ParsedQuery {
  intent: Intent
  variant?: string
  packSize?: 'single' | '4_pack' | 'all'
  retailer?: string
  quantity?: number
  sort?: 'price' | 'distance'
  raw: string
}

const VARIANT_KEYWORDS: Record<string, string[]> = {
  zero_sugar: ['zero sugar', 'white monster', 'white', 'ultra white'],
  ultra_white: ['ultra white', 'white ultra'],
  ultra_rosa: ['ultra rosa', 'rosa', 'pink'],
  ultra_paradise: ['ultra paradise', 'paradise'],
  ultra_gold: ['ultra gold', 'gold'],
  ultra_violet: ['ultra violet', 'violet', 'purple'],
  ultra_peachy_keen: ['ultra peachy', 'peachy'],
  lando_norris: ['lando', 'lando norris'],
  mango_loco: ['mango loco', 'mango'],
  pipeline_punch: ['pipeline punch', 'pipeline'],
  assault: ['assault'],
  khaotic: ['khaotic'],
  viking_berry: ['viking berry', 'viking'],
  juice_monster_apple: ['juice monster apple', 'juice apple', 'apple'],
  hydro_watermelon: ['hydro watermelon', 'watermelon', 'hydro'],
  rehab_lemon_tea: ['rehab lemon', 'lemon tea', 'lemon'],
  rehab_green_tea: ['rehab green', 'green tea'],
}

const RETAILER_KEYWORDS: Record<string, string[]> = {
  tesco: ['tesco'],
  dunnes: ['dunnes', 'dunnes stores'],
  supervalu: ['supervalu', 'super valu'],
  lidl: ['lidl'],
  aldi: ['aldi'],
  centra: ['centra'],
  spar: ['spar'],
}

function matchVariant(text: string): string | undefined {
  const lower = text.toLowerCase()
  for (const [value, keywords] of Object.entries(VARIANT_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return value
    }
  }
  if (lower.includes('zero') || lower.includes('sugar free')) return 'zero_sugar'
  return undefined
}

function matchRetailer(text: string): string | undefined {
  const lower = text.toLowerCase()
  for (const [value, keywords] of Object.entries(RETAILER_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return value
    }
  }
  return undefined
}

function matchPackSize(text: string): 'single' | '4_pack' | 'all' {
  const lower = text.toLowerCase()
  if (lower.includes('4-pack') || lower.includes('4 pack') || lower.includes('multipack') || lower.includes('multipack')) return '4_pack'
  if (lower.includes('single') || lower.includes('can')) return 'single'
  return 'all'
}

function matchQuantity(text: string): number | undefined {
  const lower = text.toLowerCase()
  const numMatch = lower.match(/(\d+)\s*(cans?|packs?|items?)?/)
  if (numMatch) return parseInt(numMatch[1], 10)
  if (lower.includes('ten')) return 10
  if (lower.includes('five')) return 5
  return undefined
}

export function parseQuery(raw: string): ParsedQuery {
  const lower = raw.toLowerCase()

  let intent: Intent = 'cheapest'

  if (lower.includes('compare') || lower.includes('vs') || lower.includes('versus')) {
    intent = 'compare'
  } else if (lower.includes('deal') || lower.includes('offer') || lower.includes('promotion') || lower.includes('special')) {
    intent = 'deals'
  } else if (lower.includes('flavour') || lower.includes('flavor') || lower.includes('available') || lower.includes('what')) {
    intent = 'flavours'
  } else if (lower.includes('how much') || lower.includes('cost') || lower.includes('spend') || lower.includes('budget')) {
    intent = 'volume'
  } else if (lower.includes('help') || lower.includes('what can')) {
    intent = 'help'
  }

  const variant = matchVariant(raw)
  const packSize = matchPackSize(raw)
  const retailer = matchRetailer(raw)
  const quantity = matchQuantity(raw)

  let sort: 'price' | 'distance' = 'price'
  if (lower.includes('near') || lower.includes('closest') || lower.includes('nearest')) {
    sort = 'distance'
  }

  return { intent, variant, packSize, retailer, quantity, sort, raw }
}
