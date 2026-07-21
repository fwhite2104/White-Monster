'use client'

import { useState, useRef } from "react"
import * as Popover from "@radix-ui/react-popover"
import { ChevronDown, Check, Search, X } from "lucide-react"
import { MONSTER_VARIANTS, MONSTER_FAVOURITES } from "@/lib/constants"

interface VariantPickerProps {
  value: string
  onChange: (value: string) => void
}

const CATEGORY_LABELS: Record<string, string> = {
  zero_sugar: "Zero Sugar",
  full_sugar: "Full Sugar",
  hydro_rehab: "Hydro / Rehab",
}

function getVariant(slug: string) {
  return MONSTER_VARIANTS.find((v) => v.value === slug)
}

export function VariantPicker({ value, onChange }: VariantPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = getVariant(value)

  const filtered = search.trim()
    ? MONSTER_VARIANTS.filter((v) =>
        v.label.toLowerCase().includes(search.toLowerCase())
      )
    : MONSTER_VARIANTS

  const grouped = filtered.reduce<Record<string, typeof MONSTER_VARIANTS>>(
    (acc, v) => {
      const cat = v.category
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(v)
      return acc
    },
    {}
  )

  const select = (slug: string) => {
    onChange(slug)
    setOpen(false)
    setSearch("")
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className="inline-flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-lg bg-muted border border-border hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring min-w-[160px]"
          aria-label="Select variant"
          data-testid="variant-picker-trigger"
        >
          <span className="truncate">{selected?.label ?? value}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-50 w-[320px] rounded-xl bg-background border border-border shadow-lg p-3"
          sideOffset={4}
          align="start"
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            inputRef.current?.focus()
          }}
        >
          {/* Favourites */}
          <div className="mb-3">
            <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
              Favourites
            </p>
            <div className="flex flex-wrap gap-1.5">
              {MONSTER_FAVOURITES.map((slug) => {
                const v = getVariant(slug)
                if (!v) return null
                const isActive = value === slug
                return (
                  <button
                    key={slug}
                    onClick={() => select(slug)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-foreground border-border hover:border-primary/30"
                    }`}
                  >
                    {v.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search all variants…"
              aria-label="Search variants"
              className="w-full pl-8 pr-8 py-2 text-sm rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-[260px] overflow-y-auto space-y-2">
            {Object.entries(grouped).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No variants found
              </p>
            )}
            {Object.entries(grouped).map(([cat, variants]) => (
              <div key={cat}>
                <p className="text-xs font-medium text-muted-foreground px-1 pt-1 pb-0.5 sticky top-0 bg-background">
                  {CATEGORY_LABELS[cat] ?? cat}
                </p>
                {variants.map((v) => {
                  const isActive = value === v.value
                  return (
                    <button
                      key={v.value}
                      onClick={() => select(v.value)}
                      className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 text-sm rounded-md transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <span className="truncate">{v.label}</span>
                      {isActive && <Check className="size-4 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
