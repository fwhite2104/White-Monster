import { describe, it, expect } from 'vitest'
import { buildQuery, parseOverpassResponse } from '../overpass'
import type { OverpassElement } from '../overpass'

describe('buildQuery', () => {
  const lat = 51.8985
  const lng = -8.4756
  const radius = 1500

  it('builds a category query with tag filter', () => {
    const q = buildQuery(lat, lng, radius, '["shop"]')
    expect(q).toContain('[out:json][timeout:15]')
    expect(q).toContain('["shop"]')
    expect(q).toContain('(around:1500,51.8985,-8.4756)')
    expect(q).toContain('out center tags 80')
  })

  it('builds a name search query with regex escaping', () => {
    const q = buildQuery(lat, lng, radius, '', 'Tesco')
    expect(q).toContain('[~"^(name|brand)$"~"Tesco",i]')
    expect(q).toContain('out center tags 50')
  })

  it('escapes regex special characters in search term', () => {
    const q = buildQuery(lat, lng, radius, '', 'Dunnes (Cork)')
    expect(q).toContain('Dunnes \\(Cork\\)')
  })

  it('queries both nodes and ways', () => {
    const q = buildQuery(lat, lng, radius, '["shop"]')
    expect(q).toContain('node["shop"]')
    expect(q).toContain('way["shop"]')
  })

  it('handles empty search string by falling back to tag filter', () => {
    const q = buildQuery(lat, lng, radius, '["amenity"]', '')
    expect(q).toContain('["amenity"]')
    expect(q).not.toContain('name|brand')
  })

  it('handles multiple category filters', () => {
    const q = buildQuery(lat, lng, radius, '["amenity"~"restaurant|cafe|pub"]')
    expect(q).toContain('["amenity"~"restaurant|cafe|pub"]')
  })
})

describe('parseOverpassResponse', () => {
  it('returns empty array for empty elements', () => {
    expect(parseOverpassResponse({ elements: [] as any })).toEqual([])
  })

  it('returns empty array for null input', () => {
    expect(parseOverpassResponse(null)).toEqual([])
  })

  it('returns empty array for undefined input', () => {
    expect(parseOverpassResponse(undefined)).toEqual([])
  })

  it('parses a node with tags', () => {
    const data = {
      elements: [
        {
          type: 'node',
          id: 324575995,
          lat: 51.8928,
          lon: -8.4926,
          tags: {
            name: 'Siopa Dó',
            shop: 'convenience',
            'addr:housenumber': '12',
            'addr:street': 'Main Street',
            'addr:city': 'Cork',
            phone: '+353 21 1234567',
          },
        },
      ],
    }
    const result = parseOverpassResponse(data)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      id: 'node/324575995',
      name: 'Siopa Dó',
      lat: 51.8928,
      lng: -8.4926,
      category: 'shop',
      subcategory: 'convenience',
      address: '12 Main Street Cork',
      phone: '+353 21 1234567',
    })
  })

  it('parses a way with center coordinates', () => {
    const data = {
      elements: [
        {
          type: 'way',
          id: 123456,
          center: { lat: 51.9, lon: -8.47 },
          tags: {
            name: 'Tesco Extra',
            shop: 'supermarket',
            'addr:street': 'Park Road',
          },
        },
      ],
    }
    const result = parseOverpassResponse(data)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('way/123456')
    expect(result[0].lat).toBe(51.9)
    expect(result[0].lng).toBe(-8.47)
    expect(result[0].subcategory).toBe('supermarket')
    expect(result[0].address).toBe('Park Road')
  })

  it('uses brand or operator name when name tag is missing', () => {
    const data = {
      elements: [
        {
          type: 'node',
          id: 1,
          lat: 51.9,
          lon: -8.47,
          tags: { brand: 'Lidl', shop: 'supermarket' },
        },
        {
          type: 'node',
          id: 2,
          lat: 51.9,
          lon: -8.47,
          tags: { operator: 'Dunnes Stores', shop: 'supermarket' },
        },
      ],
    }
    const result = parseOverpassResponse(data)
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('Lidl')
    expect(result[1].name).toBe('Dunnes Stores')
  })

  it('skips elements without a name, brand, or operator', () => {
    const data = {
      elements: [
        {
          type: 'node',
          id: 3,
          lat: 51.9,
          lon: -8.47,
          tags: { shop: 'supermarket' },
        },
      ],
    }
    const result = parseOverpassResponse(data)
    expect(result).toHaveLength(0)
  })

  it('skips elements without coordinates', () => {
    const data = {
      elements: [
        {
          type: 'node',
          id: 4,
          tags: { name: 'Ghost', shop: 'supermarket' },
        },
      ],
    }
    const result = parseOverpassResponse(data)
    expect(result).toHaveLength(0)
  })

  it('deduplicates by id', () => {
    const data = {
      elements: [
        { type: 'node', id: 1, lat: 51.9, lon: -8.47, tags: { name: 'Duplicate', shop: 'supermarket' } },
        { type: 'node', id: 1, lat: 51.9, lon: -8.47, tags: { name: 'Duplicate', shop: 'supermarket' } },
      ],
    }
    const result = parseOverpassResponse(data)
    expect(result).toHaveLength(1)
  })

  it('determines category from amenity tag', () => {
    const data = {
      elements: [
        {
          type: 'node',
          id: 5,
          lat: 51.9,
          lon: -8.47,
          tags: { name: 'The Pub', amenity: 'pub' },
        },
      ],
    }
    const result = parseOverpassResponse(data)
    expect(result[0].category).toBe('amenity')
    expect(result[0].subcategory).toBe('pub')
  })

  it('determines category from leisure tag', () => {
    const data = {
      elements: [
        {
          type: 'node',
          id: 6,
          lat: 51.9,
          lon: -8.47,
          tags: { name: 'The Park', leisure: 'park' },
        },
      ],
    }
    const result = parseOverpassResponse(data)
    expect(result[0].category).toBe('leisure')
    expect(result[0].subcategory).toBe('park')
  })

  it('falls back to "other" category for unknown tags', () => {
    const data = {
      elements: [
        {
          type: 'node',
          id: 7,
          lat: 51.9,
          lon: -8.47,
          tags: { name: 'Something', foo: 'bar' },
        },
      ],
    }
    const result = parseOverpassResponse(data)
    expect(result[0].category).toBe('other')
    expect(result[0].subcategory).toBe('unknown')
  })

  it('builds partial address from available parts', () => {
    const data = {
      elements: [
        {
          type: 'node',
          id: 8,
          lat: 51.9,
          lon: -8.47,
          tags: { name: 'Shop', shop: 'convenience', 'addr:street': 'High Street' },
        },
      ],
    }
    const result = parseOverpassResponse(data)
    expect(result[0].address).toBe('High Street')
  })

  it('omits address field when no address tags exist', () => {
    const data = {
      elements: [
        {
          type: 'node',
          id: 9,
          lat: 51.9,
          lon: -8.47,
          tags: { name: 'Shop', shop: 'convenience' },
        },
      ],
    }
    const result = parseOverpassResponse(data)
    expect(result[0].address).toBeUndefined()
  })
})
