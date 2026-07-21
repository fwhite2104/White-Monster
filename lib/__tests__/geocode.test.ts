import { describe, it, expect } from 'vitest'
import { parseGeocodeResponse } from '../geocode'

describe('parseGeocodeResponse', () => {
  it('returns empty array for empty input', () => {
    expect(parseGeocodeResponse([])).toEqual([])
  })

  it('parses Nominatim response items', () => {
    const data = [
      {
        lat: '51.8969',
        lon: '-8.4863',
        display_name: 'Cork, County Cork, Munster, Ireland',
        type: 'city',
        category: 'place',
      },
      {
        lat: '51.8985',
        lon: '-8.4756',
        display_name: 'Cork City Centre, Cork, Ireland',
        type: 'suburb',
        category: 'place',
      },
    ]
    const result = parseGeocodeResponse(data)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      lat: 51.8969,
      lng: -8.4863,
      displayName: 'Cork, County Cork, Munster, Ireland',
      type: 'city',
    })
    expect(result[1]).toEqual({
      lat: 51.8985,
      lng: -8.4756,
      displayName: 'Cork City Centre, Cork, Ireland',
      type: 'suburb',
    })
  })

  it('handles null/undefined input', () => {
    expect(parseGeocodeResponse(null)).toEqual([])
    expect(parseGeocodeResponse(undefined)).toEqual([])
  })

  it('parses Eircode-style queries', () => {
    const data = [
      {
        lat: '51.895',
        lon: '-8.47',
        display_name: 'T12 X3RT, Cork, Ireland',
        type: 'postcode',
        category: 'place',
      },
    ]
    const result = parseGeocodeResponse(data)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('postcode')
    expect(result[0].displayName).toContain('T12')
  })
})
