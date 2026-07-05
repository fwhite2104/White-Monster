'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { MapPin, Loader2, AlertTriangle, Navigation, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { searchLocations, type LocationOption } from '@/lib/location'

interface LocationBannerProps {
  status: 'idle' | 'requesting' | 'success' | 'denied' | 'timeout' | 'unavailable' | 'error'
  locationLabel: string
  onRetry: () => void
  onManualSearch: () => void
  onSelectLocation?: (lat: number, lng: number, label: string) => void
  openManual?: boolean
  onInputRef?: (ref: HTMLInputElement | null) => void
}

export function LocationBanner({
  status,
  locationLabel,
  onRetry,
  onManualSearch,
  onSelectLocation,
  openManual,
  onInputRef,
}: LocationBannerProps) {
  const shouldReduceMotion = useReducedMotion()
  const [showManual, setShowManual] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Track the search tab: open the panel on entry, collapse it on exit so it
    // doesn't linger above the List/Stores views. Manual toggles within a tab
    // still work because this only runs when openManual changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setShowManual(Boolean(openManual))
  }, [openManual])

  useEffect(() => {
    onInputRef?.(inputRef.current)
  }, [onInputRef, showManual])

  const suggestions = useMemo(() => searchLocations(query), [query])

  const handleSuggestionClick = useCallback(
    (loc: LocationOption) => {
      if (onSelectLocation) {
        onSelectLocation(loc.lat, loc.lng, loc.label)
      } else {
        onManualSearch()
      }
      setShowManual(false)
      setQuery('')
    },
    [onManualSearch, onSelectLocation]
  )

  const statusConfig = {
    idle: {
      icon: <MapPin className="h-4 w-4" />,
      text: 'Find prices near you',
      showCta: true,
      ctaLabel: 'Use my location',
      ctaAction: onRetry,
    },
    requesting: {
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      text: 'Finding your location...',
      showCta: false,
      ctaLabel: '',
      ctaAction: () => {},
    },
    success: {
      icon: <Navigation className="h-4 w-4" />,
      text: locationLabel || 'Using current location',
      showCta: false,
      ctaLabel: '',
      ctaAction: () => {},
    },
    denied: {
      icon: <AlertTriangle className="h-4 w-4" />,
      text: 'Location access denied',
      showCta: true,
      ctaLabel: 'Search by area',
      ctaAction: () => setShowManual(true),
    },
    timeout: {
      icon: <AlertTriangle className="h-4 w-4" />,
      text: 'Location timed out',
      showCta: true,
      ctaLabel: 'Try again',
      ctaAction: onRetry,
    },
    unavailable: {
      icon: <MapPin className="h-4 w-4" />,
      text: 'Location unavailable',
      showCta: true,
      ctaLabel: 'Search by area',
      ctaAction: () => setShowManual(true),
    },
    error: {
      icon: <AlertTriangle className="h-4 w-4" />,
      text: locationLabel || 'Location error',
      showCta: true,
      ctaLabel: 'Retry',
      ctaAction: onRetry,
    },
  }

  const config = statusConfig[status]
  const isSuccess = status === 'success'
  const isError = status !== 'idle' && status !== 'requesting' && status !== 'success'

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="space-y-3"
    >
      <div
        className={cn(
          'flex items-center gap-3 rounded-xl px-4 py-3 border border-[#1e293b]',
          isSuccess && 'bg-primary/5 ring-primary/15 card-shadow-sm border-l-2 border-primary',
          isError && 'bg-destructive/5 ring-destructive/15',
          status === 'idle' && 'bg-card',
          status === 'requesting' && 'bg-card'
        )}
      >
        <div
          className={cn(
            'flex items-center justify-center size-8 rounded-lg shrink-0',
            isSuccess && 'bg-primary/15',
            isError && 'bg-destructive/15',
            status === 'idle' && 'bg-muted/50',
            status === 'requesting' && 'bg-primary/15'
          )}
        >
          <span
            className={cn(
              isSuccess && 'text-primary',
              isError && 'text-destructive',
              status === 'idle' && 'text-muted-foreground',
              status === 'requesting' && 'text-primary'
            )}
          >
            {config.icon}
          </span>
        </div>

        <p
          className={cn(
            'flex-1 min-w-0 text-sm font-medium',
            isSuccess && 'text-foreground',
            isError && 'text-destructive',
            status === 'idle' && 'text-foreground',
            status === 'requesting' && 'text-muted-foreground'
          )}
        >
          {config.text}
        </p>

        {config.showCta && (
          <Button
            variant={isError ? 'outline' : 'default'}
            size="sm"
            className="h-11 px-3 shrink-0 min-w-[44px]"
            onClick={config.ctaAction}
          >
            {config.ctaLabel}
          </Button>
        )}

        {status === 'idle' && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-11 w-11 shrink-0"
            onClick={() => setShowManual((v) => !v)}
            aria-label="Search by area"
          >
            <Search className="h-4 w-4" />
          </Button>
        )}

        {isError && status !== 'denied' && status !== 'unavailable' && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-11 w-11 shrink-0"
            onClick={() => setShowManual((v) => !v)}
            aria-label="Search by area"
          >
            <Search className="h-4 w-4" />
          </Button>
        )}
      </div>

      {status === 'requesting' && !shouldReduceMotion && (
        <div className="flex justify-center">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-primary"
            animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      )}

      {showManual && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="space-y-2"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search Cork areas..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 pl-9 pr-9 bg-card"
              aria-label="Search for a location in Cork"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 8).map((loc) => (
              <button
                key={loc.label}
                onClick={() => handleSuggestionClick(loc)}
                className="inline-flex items-center gap-1.5 h-11 px-3 rounded-lg bg-card border border-[#1e293b] hover:ring-primary/30 hover:bg-primary/5 transition-all duration-200 text-sm text-foreground"
              >
                <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                {loc.suburb}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
