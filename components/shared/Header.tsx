'use client'

import { motion } from 'framer-motion'
import { Zap, CirclePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  onReportPrice?: () => void
}

export function Header({ onReportPrice }: HeaderProps) {
  return (
    <header className="sticky top-0 z-[var(--z-header)] border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 md:py-3">
        <div className="flex items-center gap-2.5">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
          >
            <Zap className="size-5 text-primary" aria-hidden="true" />
          </motion.div>
          <h1 className="text-lg font-bold tracking-tight">
            Monster <span className="text-primary">Cork</span>
          </h1>
        </div>

        {onReportPrice && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReportPrice}
            className="hidden gap-1.5 border-border/50 text-muted-foreground hover:text-foreground md:inline-flex"
          >
            <CirclePlus className="size-3.5" aria-hidden="true" />
            Report a Price
          </Button>
        )}
      </div>
    </header>
  )
}
