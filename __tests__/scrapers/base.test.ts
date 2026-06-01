import { describe, it, expect } from 'vitest'

function detectPackSize(productName: string): string {
  const lowered = productName.toLowerCase()
  const fourPackPatterns = [
    /\b4\s*pack\b/,
    /\b4\s*x\s*/,
    /\b4x\b/,
    /\b4\s*×/,
    /\b4\s*pc\b/,
    /\b4\s*pk\b/,
    /\b4\s*can\b/,
    /\bfour\s*pack\b/,
    /\bmultipack\b/,
    /\bmulti\s*pack\b/,
    /\b4\s*\*\s*/,
  ]
  for (const pattern of fourPackPatterns) {
    if (pattern.test(lowered)) return '4_pack'
  }
  const singlePatterns = [
    /\bsingle\b/,
    /\b1\s*x\s*/,
    /\b1x\b/,
    /\b1\s*can\b/,
    /\b1\s*pack\b/,
    /\bone\s*can\b/,
  ]
  for (const pattern of singlePatterns) {
    if (pattern.test(lowered)) return 'single'
  }
  if (/\b500ml\b|\b500\s*ml\b/.test(lowered)) {
    if (/\b[2-9]\s*x\s*\d+\s*ml/.test(lowered)) return '4_pack'
    return 'single'
  }
  return 'unknown'
}

function extractVariant(productName: string): string {
  const lowered = productName.toLowerCase()
  if (lowered.includes('zero sugar') || lowered.includes('white zero')) return 'zero_sugar'
  if (lowered.includes('ultra white') && !lowered.includes('ultra rosa') && !lowered.includes('ultra paradise')) return 'ultra_white'
  if (lowered.includes('ultra rosa') || lowered.includes('rosa')) return 'ultra_rosa'
  if (lowered.includes('ultra paradise') || lowered.includes('paradise')) return 'ultra_paradise'
  return 'zero_sugar'
}

describe('detectPackSize', () => {
  it('detects 4-pack products', () => {
    expect(detectPackSize('Monster Ultra White 4 Pack')).toBe('4_pack')
    expect(detectPackSize('White Monster Zero Sugar 4pk')).toBe('4_pack')
    expect(detectPackSize('Monster Energy 4x250ml')).toBe('4_pack')
    expect(detectPackSize('Monster Multipack 4 Pack')).toBe('4_pack')
  })
  it('detects single can products', () => {
    expect(detectPackSize('White Monster Zero Sugar 500ml')).toBe('single')
    expect(detectPackSize('Monster Ultra White 250ml')).toBe('unknown')
  })
  it('returns unknown for ambiguous products', () => {
    expect(detectPackSize('Monster Energy Drink')).toBe('unknown')
  })
  it('does NOT match 4.99 as 4-pack', () => {
    expect(detectPackSize('Monster Ultra White €4.99')).toBe('unknown')
  })
})

describe('extractVariant', () => {
  it('identifies zero_sugar variant', () => {
    expect(extractVariant('White Monster Zero Sugar 250ml')).toBe('zero_sugar')
    expect(extractVariant('Monster Zero Sugar')).toBe('zero_sugar')
  })
  it('identifies ultra_white variant', () => {
    expect(extractVariant('Monster Ultra White 500ml')).toBe('ultra_white')
  })
  it('identifies ultra_rosa variant', () => {
    expect(extractVariant('Monster Ultra Rosa 250ml')).toBe('ultra_rosa')
  })
  it('identifies ultra_paradise variant', () => {
    expect(extractVariant('Monster Ultra Paradise')).toBe('ultra_paradise')
  })
  it('defaults to zero_sugar for unknown', () => {
    expect(extractVariant('Monster Energy Drink')).toBe('zero_sugar')
  })
})
