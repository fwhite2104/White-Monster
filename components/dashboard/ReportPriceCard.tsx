'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { CirclePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ReportPriceCardProps {
  onReportPrice: () => void
  variant?: 'mobile' | 'desktop' | 'inline'
}

export function ReportPriceCard({ onReportPrice, variant = 'mobile' }: ReportPriceCardProps) {
  const shouldReduceMotion = useReducedMotion()

  const headline =
    variant === 'desktop' ? 'See a price we missed?' : 'Know a better price?'

  const subline =
    variant === 'desktop'
      ? 'Help the community by reporting it.'
      : 'Help the community — prices from local shops are updated faster when you report them.'

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
    >
      <div
        className={cn(
          'bg-brand-surface border-l-[3px] border-primary-light rounded-xl',
          variant === 'mobile' && 'p-4 w-full',
          variant === 'desktop' && 'p-3 w-full',
          variant === 'inline' && 'p-4 w-full'
        )}
      >
        <div
          className={cn(
            'flex flex-col',
            variant === 'mobile' && 'gap-4',
            variant === 'desktop' && 'gap-2',
            variant === 'inline' && 'gap-3'
          )}
        >
          <div>
            <p
              className={cn(
                'font-semibold text-foreground',
                variant === 'desktop' && 'text-sm',
                variant === 'mobile' && 'text-base',
                variant === 'inline' && 'text-base'
              )}
            >
              {headline}
            </p>
            <p
              className={cn(
                'text-muted-foreground',
                variant === 'desktop' && 'text-xs',
                variant === 'mobile' && 'text-sm',
                variant === 'inline' && 'text-sm'
              )}
            >
              {subline}
            </p>
          </div>

          <motion.div whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}>
            <Button
              onClick={onReportPrice}
              variant="default"
              size={variant === 'desktop' ? 'sm' : 'default'}
              className={cn(
                'bg-primary text-primary-foreground gap-1.5',
                variant === 'mobile' && 'w-full'
              )}
            >
              <CirclePlus className="size-4" />
              Report a Price
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
