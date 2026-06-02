'use client'

import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

export function Header() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50"
    >
      <div className="max-w-6xl mx-auto px-4 py-2 md:py-4 flex items-center gap-3">
        <motion.div
          whileHover={{ rotate: 15, scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        >
          <Zap className="h-6 w-6 text-primary" />
        </motion.div>
        <h1 className="text-xl font-bold tracking-tight">
          Monster <span className="text-primary">Cork</span>
        </h1>
        <span className="text-xs text-muted-foreground ml-auto hidden sm:inline">
          Find cheapest Monster nearby
        </span>
      </div>
    </motion.header>
  )
}
