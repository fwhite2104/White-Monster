'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Plus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getTimeAgo } from '@/lib/geo'

function LocationDeniedSVG() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="32" cy="24" r="8" stroke="var(--color-primary)" strokeWidth="2.5" opacity="0.6" />
      <path d="M32 4C20.954 4 12 12.954 12 24c0 14 20 36 20 36s20-22 20-36C52 12.954 43.046 4 32 4z" stroke="var(--color-primary)" strokeWidth="2.5" fill="none" opacity="0.4" />
      <line x1="16" y1="12" x2="48" y2="52" stroke="var(--color-destructive)" strokeWidth="3" strokeLinecap="round" />
      <line x1="48" y1="12" x2="16" y2="52" stroke="var(--color-destructive)" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

function LocationTimeoutSVG() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="32" cy="32" r="24" stroke="var(--color-secondary)" strokeWidth="2.5" opacity="0.4" />
      <circle cx="32" cy="32" r="20" stroke="var(--color-secondary)" strokeWidth="1.5" opacity="0.2" />
      <line x1="32" y1="32" x2="32" y2="18" stroke="var(--color-secondary)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="32" x2="42" y2="38" stroke="var(--color-secondary)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <circle cx="32" cy="32" r="2.5" fill="var(--color-secondary)" />
      <path d="M50 14l-4 4M54 18l-4 4" stroke="var(--color-destructive)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}

function LocationUnavailableSVG() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M32 4C20.954 4 12 12.954 12 24c0 14 20 36 20 36s20-22 20-36C52 12.954 43.046 4 32 4z" stroke="var(--color-muted-foreground)" strokeWidth="2.5" fill="none" opacity="0.3" />
      <circle cx="32" cy="24" r="8" stroke="var(--color-muted-foreground)" strokeWidth="2" opacity="0.2" />
      <text x="32" y="30" textAnchor="middle" fill="var(--color-secondary)" fontSize="18" fontWeight="700" fontFamily="system-ui">?</text>
    </svg>
  )
}

function NoResultsSVG() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="26" cy="26" r="14" stroke="var(--color-muted-foreground)" strokeWidth="2.5" opacity="0.4" />
      <line x1="36" y1="36" x2="52" y2="52" stroke="var(--color-muted-foreground)" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      <line x1="20" y1="20" x2="32" y2="32" stroke="var(--color-destructive)" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      <line x1="32" y1="20" x2="20" y2="32" stroke="var(--color-destructive)" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  )
}

function ApiErrorSVG() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M32 8L4 56h56L32 8z" stroke="var(--color-destructive)" strokeWidth="2.5" fill="none" opacity="0.5" />
      <line x1="32" y1="24" x2="32" y2="40" stroke="var(--color-destructive)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="48" r="2" fill="var(--color-destructive)" />
    </svg>
  )
}

function NetworkErrorSVG() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M8 40c0-13.255 10.745-24 24-24s24 10.745 24 24" stroke="var(--color-destructive)" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
      <path d="M16 40c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="var(--color-destructive)" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
      <path d="M24 40c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="var(--color-destructive)" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      <circle cx="32" cy="40" r="3" fill="var(--color-destructive)" />
      <line x1="12" y1="12" x2="52" y2="52" stroke="var(--color-destructive)" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  )
}

function StateScreen({
  illustration,
  title,
  subtitle,
  children,
}: {
  illustration: React.ReactNode
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
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 mb-6">
        {illustration}
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
      illustration={<LocationDeniedSVG />}
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
      illustration={<LocationTimeoutSVG />}
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
      illustration={<LocationUnavailableSVG />}
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
      illustration={<NoResultsSVG />}
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

  return (
    <StateScreen
      illustration={isNetworkError ? <NetworkErrorSVG /> : <ApiErrorSVG />}
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
      className="flex items-center gap-3 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 px-4 py-3"
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
