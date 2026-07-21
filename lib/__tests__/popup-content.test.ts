import { describe, it, expect } from 'vitest'
import { buildPopupContent } from '@/components/map/StoreMapBlock'

describe('buildPopupContent', () => {
  const baseMarker = {
    id: 'store-1',
    retailer: 'tesco',
    name: 'Tesco Cork City',
    address: 'Paul Street, Cork',
    suburb: 'Cork City Centre',
    lat: 51.8985,
    lng: -8.4756,
    distance: 1200,
    price: 3.99,
    per_can_price: 3.99,
    drs_deposit: 0,
    clubcard_price: null,
    has_clubcard_pricing: false,
    pack_size: 'single',
    source_type: 'per_store' as const,
  }

  it('includes store name and address', () => {
    const html = buildPopupContent(baseMarker)
    expect(html).toContain('Tesco Cork City')
    expect(html).toContain('Paul Street, Cork')
    expect(html).toContain('Cork City Centre')
  })

  it('includes distance in km', () => {
    const html = buildPopupContent(baseMarker)
    expect(html).toContain('1.2 km')
  })

  it('includes formatted price', () => {
    const html = buildPopupContent(baseMarker)
    expect(html).toContain('€3.99')
  })

  it('includes per-can price for multipacks', () => {
    const marker = { ...baseMarker, price: 5.50, per_can_price: 1.375, pack_size: '4_pack' }
    const html = buildPopupContent(marker)
    expect(html).toContain('€5.50')
    // toFixed(2) rounds to 2 decimal places
    expect(html).toContain('€1.38/can')
  })

  it('omits per-can price for singles', () => {
    const html = buildPopupContent(baseMarker)
    expect(html).not.toContain('/can')
  })

  it('includes DRS deposit badge when present', () => {
    const marker = { ...baseMarker, drs_deposit: 0.60 }
    const html = buildPopupContent(marker)
    expect(html).toContain('DRS deposit')
    expect(html).toContain('€0.60')
  })

  it('omits DRS badge when zero', () => {
    const html = buildPopupContent(baseMarker)
    expect(html).not.toContain('DRS deposit')
  })

  it('includes clubcard pricing when available', () => {
    const marker = { ...baseMarker, clubcard_price: 3.50, has_clubcard_pricing: true }
    const html = buildPopupContent(marker)
    expect(html).toContain('Clubcard')
    expect(html).toContain('€3.50')
  })

  it('omits clubcard pricing when unavailable', () => {
    const html = buildPopupContent(baseMarker)
    expect(html).not.toContain('Clubcard')
  })

  it('includes Google Maps directions link', () => {
    const html = buildPopupContent(baseMarker)
    expect(html).toContain('Open in Google Maps')
    expect(html).toContain(`destination=${baseMarker.lat},${baseMarker.lng}`)
  })

  it('handles missing address gracefully', () => {
    const marker = { ...baseMarker, address: '', suburb: '' }
    const html = buildPopupContent(marker)
    expect(html).toContain('Ireland')
  })
})
