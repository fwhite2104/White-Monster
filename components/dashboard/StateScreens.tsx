'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { MapPinOff, Clock, MapPin, SearchX, AlertTriangle, WifiOff, Plus, AlertCircle } from 'lucide-react'
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
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--color-brand-surface)] mb-5">
        <Icon className={`h-7 w-7 ${iconColor}`} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-6">{subtitle}</p>
      <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
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
      iconColor="text-muted-foreground"
      title="Location access denied"
      subtitle="Search for your area below to find nearby Monster prices"
    >
      <div className="w-full max-w-sm space-y-2">
        <p className="text-xs text-muted-foreground">
          To re-enable location access, click the lock icon in your browser&apos;s address bar and allow location access.
        </p>
        <Button
          variant="outline"
          size="lg"
          onClick={onRetry}
          className="w-full min-h-[44px]"
        >
          Try again
        </Button>
        <Button
          variant="default"
          size="lg"
          onClick={onManualSearch}
          className="w-full min-h-[44px]"
        >
          Search by area
        </Button>
      </div>
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
      title="Location request timed out"
      subtitle="This can happen indoors or with poor GPS signal. Search for your area below to find nearby prices."
    >
      <div className="w-full max-w-sm space-y-2">
        <Button
          variant="outline"
          size="lg"
          onClick={onRetry}
          className="w-full min-h-[44px]"
        >
          Try again
        </Button>
        <Button
          variant="default"
          size="lg"
          onClick={onManualSearch}
          className="w-full min-h-[44px]"
        >
          Search by area
        </Button>
      </div>
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
      title="Location unavailable"
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
  onReportPrice,
}: {
  filters: { variant: string; packSize: string; radius: number }
  onResetFilters: () => void
  onExpandRadius: () => void
  onReportPrice?: () => void
}) {
  const subtitle =
    filters.variant || filters.packSize
      ? `No ${filters.variant ? filters.variant.replace('_', ' ') : ''} Monster found within ${filters.radius}km`
      : `No prices found within ${filters.radius}km`

  return (
    <StateScreen
      icon={SearchX}
      iconColor="text-muted-foreground"
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
      {onReportPrice && (
        <Button
          variant="ghost"
          size="lg"
          onClick={onReportPrice}
          className="min-h-[44px] min-w-[44px] text-primary gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Be the first to report a price
        </Button>
      )}
    </StateScreen>
  )
}

export function ApiErrorState({
  message,
  onRetry,
  onReportPrice,
}: {
  message: string
  onRetry: () => void
  onReportPrice?: () => void
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
      {onReportPrice && (
        <Button
          variant="ghost"
          size="lg"
          onClick={onReportPrice}
          className="min-h-[44px] min-w-[44px] text-primary gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Report a price
        </Button>
      )}
    </StateScreen>
  )
}

export function StaleDataWarning({
  lastUpdated,
  onReportPrice,
}: {
  lastUpdated: string | null
  onReportPrice?: () => void
}) {
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
      className="flex items-center gap-3 rounded-xl bg-[color:var(--color-brand-surface)] border border-primary/15 px-4 py-3"
    >
      <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
      <span className="text-sm text-amber-200 flex-1">
        Prices were last updated {getTimeAgo(lastUpdated)}
      </span>
      {onReportPrice && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReportPrice}
          className="h-11 text-xs text-primary gap-1 shrink-0"
        >
          <Plus className="h-3 w-3" />
          Report a fresh price
        </Button>
      )}
    </motion.div>
  )
}
