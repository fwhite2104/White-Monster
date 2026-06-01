'use client'

import { motion } from 'framer-motion'

interface LoadingSkeletonProps {
  count?: number
}

export function LoadingSkeleton({ count = 4 }: LoadingSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
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
      ))}
    </div>
  )
}
