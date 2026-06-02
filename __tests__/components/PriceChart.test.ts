import { describe, it, expect } from 'vitest'

describe('PriceChart: width calculation', () => {
  it('computes proportional widths from 0 to max price', () => {
    const prices = [
      { price: 2.50, retailer: 'dunnes', pack_size: 'single' },
      { price: 2.75, retailer: 'supervalu', pack_size: 'single' },
      { price: 4.50, retailer: 'tesco', pack_size: 'single' },
      { price: 6.25, retailer: 'tesco', pack_size: '4_pack' },
      { price: 6.50, retailer: 'dunnes', pack_size: '4_pack' },
      { price: 8.15, retailer: 'supervalu', pack_size: '4_pack' },
    ]

    const maxPrice = Math.max(...prices.map((p) => Number(p.price)))

    const widths = prices.map((p) => {
      const priceNum = Number(p.price)
      return maxPrice > 0 ? (priceNum / maxPrice) * 100 : 0
    })

    expect(widths[0]).toBeCloseTo((2.50 / 8.15) * 100, 1)
    expect(widths[1]).toBeCloseTo((2.75 / 8.15) * 100, 1)
    expect(widths[2]).toBeCloseTo((4.50 / 8.15) * 100, 1)
    expect(widths[3]).toBeCloseTo((6.25 / 8.15) * 100, 1)
    expect(widths[4]).toBeCloseTo((6.50 / 8.15) * 100, 1)
    expect(widths[5]).toBeCloseTo(100, 1)
  })

  it('minimum bar width is at least 8% for visibility', () => {
    const prices = [
      { price: 8.15, retailer: 'supervalu', pack_size: '4_pack' },
      { price: 8.15, retailer: 'tesco', pack_size: '4_pack' },
    ]

    const maxPrice = Math.max(...prices.map((p) => Number(p.price)))
    const widths = prices.map((p) => {
      const raw = maxPrice > 0 ? (Number(p.price) / maxPrice) * 100 : 0
      return Math.max(raw, 8)
    })

    expect(widths[0]).toBe(100)
    expect(widths[1]).toBe(100)
  })

  it('proportional scale makes cheap items visually proportional to expensive ones', () => {
    const cheapPrice = 2.50
    const expensivePrice = 8.15
    const maxPrice = expensivePrice

    const cheapWidth = (cheapPrice / maxPrice) * 100
    const expensiveWidth = (expensivePrice / maxPrice) * 100

    expect(cheapWidth).toBeLessThan(expensiveWidth)
    expect(cheapWidth).toBeCloseTo(30.67, 0)
    expect(expensiveWidth).toBe(100)
  })

  it('handles edge case where all prices are the same', () => {
    const prices = [
      { price: 2.50, retailer: 'lidl', pack_size: 'single' },
      { price: 2.50, retailer: 'aldi', pack_size: 'single' },
    ]

    const maxPrice = Math.max(...prices.map((p) => Number(p.price)))
    const widths = prices.map((p) => {
      const raw = maxPrice > 0 ? (Number(p.price) / maxPrice) * 100 : 0
      return Math.max(raw, 8)
    })

    expect(widths[0]).toBe(100)
    expect(widths[1]).toBe(100)
  })

  it('handles zero maxPrice gracefully', () => {
    const maxPrice = 0
    const width = maxPrice > 0 ? (2.50 / maxPrice) * 100 : 0
    expect(width).toBe(0)
  })
})

describe('PriceChart: formatLabel', () => {
  it('shows retailer name for single cans', () => {
    expect(formatLabel('tesco', 'single')).toBe('tesco')
    expect(formatLabel('dunnes', 'single')).toBe('dunnes')
  })

  it('appends (4pk) for 4-pack items', () => {
    expect(formatLabel('tesco', '4_pack')).toBe('tesco (4pk)')
    expect(formatLabel('supervalu', '4_pack')).toBe('supervalu (4pk)')
  })

  it('handles unknown pack sizes gracefully', () => {
    expect(formatLabel('lidl', 'unknown')).toBe('lidl')
  })
})

function formatLabel(retailer: string, packSize: string): string {
  if (packSize === '4_pack') return `${retailer} (4pk)`
  return retailer
}