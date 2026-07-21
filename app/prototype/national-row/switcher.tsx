"use client"

// PROTOTYPE switcher — throwaway. Floating bottom bar for switching variants.
// Hidden in production builds per prototype skill convention.

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

interface Variant {
  key: string
  label: string
}

export function PrototypeSwitcher({ variants, current }: { variants: Variant[]; current: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const cycle = useCallback(
    (dir: 1 | -1) => {
      const idx = variants.findIndex((v) => v.key === current)
      if (idx === -1) return
      const next = variants[(idx + dir + variants.length) % variants.length]
      const params = new URLSearchParams(searchParams.toString())
      params.set("variant", next.key)
      router.replace(`/prototype/national-row?${params.toString()}`)
    },
    [router, searchParams, variants, current],
  )

  const currentLabel = variants.find((v) => v.key === current)?.label ?? current

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-foreground text-background text-sm font-medium shadow-2xl">
      <button
        onClick={() => cycle(-1)}
        className="px-2 py-1 rounded-full hover:bg-background/20"
        aria-label="Previous variant"
      >
        &larr;
      </button>
      <span className="min-w-[180px] text-center">{currentLabel}</span>
      <button
        onClick={() => cycle(1)}
        className="px-2 py-1 rounded-full hover:bg-background/20"
        aria-label="Next variant"
      >
        &rarr;
      </button>
    </div>
  )
}