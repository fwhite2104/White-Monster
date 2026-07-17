'use client'

import { useGeolocation } from "@/hooks/use-geolocation"
import { MapPin, Loader2, Crosshair } from "lucide-react"

export function LocationSection() {
  const { location, loading, error, locationLabel, requestLocation } = useGeolocation()

  const isGps = location?.source === 'gps'

  return (
    <section className="px-4 py-3 border-b border-border bg-card/30">
      <div className="max-w-7xl mx-auto flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 shrink-0">
            {loading ? (
              <Loader2 className="size-5 text-muted-foreground animate-spin" aria-hidden="true" />
            ) : isGps ? (
              <MapPin className="size-5 text-primary" aria-hidden="true" />
            ) : (
              <MapPin className="size-5 text-muted-foreground" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-medium">{locationLabel}</h2>
            {error && !loading && (
              <p className="text-xs text-destructive mt-1">{error}</p>
            )}
            {!error && !loading && !isGps && (
              <p className="text-xs text-muted-foreground mt-1">
                {location?.source === 'default' ? 'Enable location to see prices near you.' : 'Tap Locate me to refresh your position.'}
              </p>
            )}
          </div>
        </div>

        {!isGps && (
          <button
            onClick={requestLocation}
            disabled={loading}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground disabled:opacity-50"
            aria-label="Use my current location"
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Crosshair className="size-3.5" aria-hidden="true" />
            )}
            Locate me
          </button>
        )}
      </div>
    </section>
  )
}
