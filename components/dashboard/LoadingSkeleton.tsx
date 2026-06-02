'use client'

import { motion } from 'framer-motion'

interface LoadingSkeletonProps {
  count?: number
  variant?: 'card' | 'hero' | 'filter'
}

function CardSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="relative overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10"
    >
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-5 w-32 rounded-md bg-muted/80 shimmer-bar" />
            <div className="h-4 w-24 rounded-md bg-muted/60 shimmer-bar" />
          </div>
          <div className="space-y-2 text-right">
            <div className="h-8 w-24 rounded-md bg-muted/80 shimmer-bar" />
            <div className="h-5 w-20 rounded-full bg-muted/60 shimmer-bar" />
          </div>
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-border/50">
          <div className="h-5 w-16 rounded-full bg-muted/60 shimmer-bar" />
          <div className="h-3 w-28 rounded-md bg-muted/40 shimmer-bar" />
        </div>
      </div>
    </motion.div>
  )
}

function HeroSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 p-5 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-muted/80 shimmer-bar" />
            <div className="h-4 w-28 rounded-md bg-muted/80 shimmer-bar" />
          </div>
          <div className="h-10 w-24 rounded-md bg-muted/80 shimmer-bar" />
          <div className="flex items-center gap-3 flex-wrap">
            <div className="h-4 w-32 rounded-md bg-muted/60 shimmer-bar" />
            <div className="h-4 w-20 rounded-md bg-muted/60 shimmer-bar" />
            <div className="h-5 w-16 rounded-full bg-muted/60 shimmer-bar" />
          </div>
        </div>
        <div className="flex items-center gap-4 sm:flex-col sm:items-end">
          <div className="space-y-1 text-right">
            <div className="h-3 w-16 rounded-md bg-muted/40 shimmer-bar" />
            <div className="h-6 w-16 rounded-md bg-muted/60 shimmer-bar" />
          </div>
          <div className="space-y-1 text-right">
            <div className="h-3 w-16 rounded-md bg-muted/40 shimmer-bar" />
            <div className="h-6 w-12 rounded-md bg-muted/60 shimmer-bar" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function FilterSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-20 shrink-0 rounded-full bg-muted/60 shimmer-bar"
          />
        ))}
      </div>
      <div className="flex items-center gap-4">
        <div className="h-4 w-12 rounded-md bg-muted/60 shimmer-bar" />
        <div className="h-2 flex-1 rounded-full bg-muted/40 shimmer-bar" />
        <div className="h-6 w-14 rounded-full bg-muted/60 shimmer-bar" />
      </div>
    </motion.div>
  )
}

export function LoadingSkeleton({ count = 4, variant = 'card' }: LoadingSkeletonProps) {
  if (variant === 'hero') {
    return <HeroSkeleton />
  }

  if (variant === 'filter') {
    return <FilterSkeleton />
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} index={i} />
      ))}
    </div>
  )
}
