'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { MapPinOff, Clock, MapPin, SearchX, AlertTriangle, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getTimeAgo } from '@/lib/geo'

function StateScreen({
  icon: Icon,
  iconColor = 'text-muted-foreground',
  title,
  subtitle,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  iconColor?: string
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.93, transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] } }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-6">
        <Icon className={`h-8 w-8 ${iconColor}`} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-8">{subtitle}</p>
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        {children}
      </div>
    </motion.div>
  )
}

export function LocationDeniedState({
  onRetry,
  onManualSearch,
}: {
  onRetry: () => void
  onManualSearch: () => void
}) {
  return (
    <StateScreen
      icon={MapPinOff}
      title="Location access was denied"
      subtitle="Enable location in your browser settings, or search by area below"
    >
      <Button
        variant="outline"
        size="lg"
        onClick={onRetry}
        className="min-h-[44px] min-w-[44px]"
      >
        Try again
      </Button>
      <Button
        variant="default"
        size="lg"
        onClick={onManualSearch}
        className="min-h-[44px] min-w-[44px]"
      >
        Search by area
      </Button>
    </StateScreen>
  )
}

export function LocationTimeoutState({
  onRetry,
  onManualSearch,
}: {
  onRetry: () => void
  onManualSearch: () => void
}) {
  return (
    <StateScreen
      icon={Clock}
      iconColor="text-amber-500"
      title="Couldn't find your location"
      subtitle="It took too long to get your location. This can happen indoors or with poor GPS."
    >
      <Button
        variant="outline"
        size="lg"
        onClick={onRetry}
        className="min-h-[44px] min-w-[44px]"
      >
        Try again
      </Button>
      <Button
        variant="default"
        size="lg"
        onClick={onManualSearch}
        className="min-h-[44px] min-w-[44px]"
      >
        Search by area
      </Button>
    </StateScreen>
  )
}

export function LocationUnavailableState({
  onManualSearch,
}: {
  onManualSearch: () => void
}) {
  return (
    <StateScreen
      icon={MapPin}
      iconColor="text-muted-foreground"
      title="Location not available"
      subtitle="Your device doesn't support location services"
    >
      <Button
        variant="default"
        size="lg"
        onClick={onManualSearch}
        className="min-h-[44px] min-w-[44px]"
      >
        Search by area
      </Button>
    </StateScreen>
  )
}

export function NoResultsState({
  filters,
  onResetFilters,
  onExpandRadius,
}: {
  filters: { variant: string; packSize: string; radius: number }
  onResetFilters: () => void
  onExpandRadius: () => void
}) {
  const subtitle =
    filters.variant || filters.packSize
      ? `No ${filters.variant ? filters.variant.replace('_', ' ') : ''} Monster found within ${filters.radius}km`
      : `No prices found within ${filters.radius}km`

  return (
    <StateScreen
      icon={SearchX}
      title="No Monster found nearby"
      subtitle={subtitle}
    >
      <Button
        variant="default"
        size="lg"
        onClick={onExpandRadius}
        className="min-h-[44px] min-w-[44px]"
      >
        Expand search area
      </Button>
      <Button
        variant="outline"
        size="lg"
        onClick={onResetFilters}
        className="min-h-[44px] min-w-[44px]"
      >
        Reset filters
      </Button>
    </StateScreen>
  )
}

export function ApiErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  const isNetworkError = message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch')
  const Icon = isNetworkError ? WifiOff : AlertTriangle

  return (
    <StateScreen
      icon={Icon}
      iconColor="text-destructive"
      title="Something went wrong"
      subtitle={isNetworkError ? 'Check your connection and try again' : message}
    >
      <Button
        variant="outline"
        size="lg"
        onClick={onRetry}
        className="min-h-[44px] min-w-[44px]"
      >
        Try again
      </Button>
    </StateScreen>
  )
}

export function StaleDataWarning({ lastUpdated }: { lastUpdated: string | null }) {
  const shouldReduceMotion = useReducedMotion()

  if (!lastUpdated) return null

  const timeAgo = getTimeAgo(lastUpdated)
  const isStale = timeAgo.includes('d') && parseInt(timeAgo) >= 1

  if (!isStale) return null

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-200"
    >
      <Clock className="h-4 w-4 shrink-0 text-amber-400" />
      <span>
        Prices were last updated {getTimeAgo(lastUpdated)}
      </span>
    </motion.div>
  )
}
