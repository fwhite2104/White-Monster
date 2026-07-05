'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  count?: number
  variant?: 'card' | 'hero' | 'filter'
}

function SkeletonBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-md bg-muted-foreground/10 shimmer-bar',
        className
      )}
    />
  )
}

function CardSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="overflow-hidden rounded-xl bg-card border border-border"
    >
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 space-y-2">
            <SkeletonBar className="h-5 w-32" />
            <SkeletonBar className="h-3.5 w-24 bg-[#1e293b]" />
          </div>
          <div className="space-y-2 text-right shrink-0">
            <SkeletonBar className="h-7 w-20 bg-primary/20" />
            <SkeletonBar className="h-5 w-16 rounded-full bg-[#1e293b]" />
          </div>
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-border">
          <SkeletonBar className="h-5 w-16 rounded-full" />
          <SkeletonBar className="h-3 w-28 bg-[#1e293b]" />
        </div>
      </div>
    </motion.div>
  )
}

function HeroSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="overflow-hidden rounded-xl bg-card border border-border p-5 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2.5">
            <SkeletonBar className="h-8 w-8 rounded-lg bg-primary/15" />
            <SkeletonBar className="h-4 w-28 bg-[#1e293b]" />
          </div>
          <SkeletonBar className="h-10 w-28" />
          <div className="flex items-center gap-3 flex-wrap">
            <SkeletonBar className="h-4 w-32 bg-[#1e293b]" />
            <SkeletonBar className="h-4 w-20 bg-[#1e293b]" />
            <SkeletonBar className="h-5 w-16 rounded-full bg-[#1e293b]" />
          </div>
        </div>
        <div className="flex items-center gap-4 sm:flex-col sm:items-end">
          <div className="space-y-1 text-right">
            <SkeletonBar className="h-3 w-16 bg-[#1e293b]" />
            <SkeletonBar className="h-6 w-16 bg-primary/20" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function FilterSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="space-y-3"
    >
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-11 w-20 shrink-0 rounded-full bg-[#1e293b] shimmer-bar"
          />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <SkeletonBar className="h-4 w-12 bg-[#1e293b]" />
        <SkeletonBar className="h-1.5 flex-1 rounded-full bg-[#1e293b]" />
        <SkeletonBar className="h-6 w-14 rounded-full bg-[#1e293b]" />
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
