"use client"

import { MapPin, Loader2, Pin } from "lucide-react"
import { useGeolocation } from "@/hooks/use-geolocation"
import { Button } from "@/components/ui/button"

export function LocationSection() {
  const { loading, locationLabel, requestLocation } = useGeolocation()

  const handleUseMyLocation = () => {
    requestLocation()
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex items-center gap-2 text-sm">
        <Pin className="size-4 text-primary" />
        <span className="text-muted-foreground">{locationLabel}</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleUseMyLocation}
        disabled={loading}
        className="ml-auto"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Getting location...
          </>
        ) : (
          <>
            <MapPin className="size-4" />
            Use my location
          </>
        )}
      </Button>
    </div>
  )
}
