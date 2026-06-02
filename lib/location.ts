export interface LocationOption {
  label: string
  suburb: string
  lat: number
  lng: number
}

export const CORK_LOCATIONS: LocationOption[] = [
  { label: 'Cork City Centre', suburb: 'Cork City Centre', lat: 51.8985, lng: -8.4756 },
  { label: 'Douglas', suburb: 'Douglas', lat: 51.8765, lng: -8.4361 },
  { label: 'Ballincollig', suburb: 'Ballincollig', lat: 51.8883, lng: -8.5867 },
  { label: 'Carrigaline', suburb: 'Carrigaline', lat: 51.8111, lng: -8.3917 },
  { label: 'Midleton', suburb: 'Midleton', lat: 51.9143, lng: -8.1725 },
  { label: 'Cobh', suburb: 'Cobh', lat: 51.8503, lng: -8.2947 },
  { label: 'Glanmire', suburb: 'Glanmire', lat: 51.9194, lng: -8.3972 },
  { label: 'Bishopstown', suburb: 'Bishopstown', lat: 51.8847, lng: -8.5333 },
  { label: 'Wilton', suburb: 'Wilton', lat: 51.8936, lng: -8.5108 },
  { label: 'Mahon', suburb: 'Mahon', lat: 51.8961, lng: -8.4033 },
  { label: 'Blackrock', suburb: 'Blackrock', lat: 51.9019, lng: -8.4011 },
  { label: 'Carrigrohane', suburb: 'Carrigrohane', lat: 51.8958, lng: -8.5708 },
  { label: 'Montenotte', suburb: 'Montenotte', lat: 51.9036, lng: -8.4611 },
  { label: 'Togher', suburb: 'Togher', lat: 51.8769, lng: -8.4783 },
  { label: "Turner's Cross", suburb: "Turner's Cross", lat: 51.8761, lng: -8.4683 },
  { label: "Sunday's Well", suburb: "Sunday's Well", lat: 51.9047, lng: -8.4867 },
  { label: "St. Luke's", suburb: "St. Luke's", lat: 51.9008, lng: -8.4656 },
  { label: 'The Lough', suburb: 'The Lough', lat: 51.8886, lng: -8.4869 },
  { label: 'Cork Airport', suburb: 'Cork Airport', lat: 51.8413, lng: -8.4911 },
  { label: 'Mayfield', suburb: 'Mayfield', lat: 51.9108, lng: -8.4311 },
  { label: 'Tivoli', suburb: 'Tivoli', lat: 51.9072, lng: -8.4056 },
  { label: 'Little Island', suburb: 'Little Island', lat: 51.9008, lng: -8.3539 },
  { label: 'Passage West', suburb: 'Passage West', lat: 51.8736, lng: -8.3536 },
  { label: 'Ringaskiddy', suburb: 'Ringaskiddy', lat: 51.8311, lng: -8.3236 },
]

export function searchLocations(query: string): LocationOption[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return []

  const matches = CORK_LOCATIONS.filter(
    (loc) =>
      loc.label.toLowerCase().includes(normalized) ||
      loc.suburb.toLowerCase().includes(normalized)
  )

  return matches.slice(0, 10)
}
