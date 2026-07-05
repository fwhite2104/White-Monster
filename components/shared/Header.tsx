'use client'

import { motion } from 'framer-motion'
import { Zap, CirclePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  onReportPrice?: () => void
}

export function Header({ onReportPrice }: HeaderProps) {
  return (
    <header className="sticky top-0 z-[var(--z-header)] border-b border-white/10 bg-white/5 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 md:py-3">
        <div className="flex items-center gap-2.5">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
            className="drop-shadow-[0_0_8px_oklch(0.72_0.22_145/0.6)]"
          >
            <Zap className="size-5 text-primary" aria-hidden="true" />
          </motion.div>
          <h1 className="text-heading-lg font-semibold tracking-tight">
            Monster <span className="text-primary">Cork</span>
          </h1>
        </div>

        {onReportPrice && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReportPrice}
            className="hidden h-11 gap-1.5 border-white/10 bg-white/5 text-muted-foreground backdrop-blur-sm hover:text-foreground md:inline-flex"
          >
            <CirclePlus className="size-3.5" aria-hidden="true" />
            Report a Price
          </Button>
        )}
      </div>
    </header>
  )
}
