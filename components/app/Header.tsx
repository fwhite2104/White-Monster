"use client"

import { Zap } from "lucide-react"
import { motion } from "framer-motion"

export function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md border-b border-border bg-background/80">
      <div className="flex items-center gap-2 px-4 py-2">
        <motion.div
          whileHover={{ rotate: 15, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          <Zap className="size-6 text-primary fill-primary" />
        </motion.div>
        <div className="flex items-baseline gap-2">
          <h1 className="text-heading-md font-bold">Monster Cork</h1>
          <span className="hidden md:block text-sm text-muted-foreground">
            Cork&apos;s cheapest energy drinks
          </span>
        </div>
      </div>
    </header>
  )
}
