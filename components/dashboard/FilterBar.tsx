'use client'

import { useCallback, useRef } from 'react'
import { RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  MONSTER_VARIANTS,
  PACK_SIZES,
  formatPackSize,
} from '@/lib/constants'

interface FilterBarProps {
  sort: string
  onSortChange: (sort: string) => void
  variant: string
  onVariantChange: (variant: string) => void
  packSize: string
  onPackSizeChange: (packSize: string) => void
  radius: number
  onRadiusChange: (radius: number) => void
  activeFilterCount?: number
  onReset?: () => void
}

const SORT_ITEMS = {
  price: 'Price (lowest)',
  distance: 'Distance (nearest)',
  name: 'Name (A-Z)',
}

const MULTIPACK_OPTIONS = PACK_SIZES.filter((s) => s !== 'single')

const RADIUS_STEPS = [5, 10, 15, 25, 50]

export function FilterBar({
  sort,
  onSortChange,
  variant,
  onVariantChange,
  packSize,
  onPackSizeChange,
  radius,
  onRadiusChange,
  activeFilterCount = 0,
  onReset,
}: FilterBarProps) {
  const chipGroupRef = useRef<HTMLDivElement>(null)

  const handleChipKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const buttons = chipGroupRef.current?.querySelectorAll<HTMLButtonElement>('button')
      if (!buttons?.length) return

      const idx = Array.from(buttons).findIndex((b) => b === document.activeElement)
      if (idx === -1) return

      if (e.key === 'ArrowRight') {
        e.preventDefault()
        buttons[(idx + 1) % buttons.length]?.focus()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        buttons[(idx - 1 + buttons.length) % buttons.length]?.focus()
      }
    },
    [],
  )

  const isMultipackActive =
    packSize === 'multipack' || MULTIPACK_OPTIONS.includes(packSize as (typeof MULTIPACK_OPTIONS)[number])

  return (
    <div className="flex flex-col gap-2">
      {/* Top row: sort + radius + reset */}
      <div className="flex items-center gap-2">
        <Select items={SORT_ITEMS} value={sort} onValueChange={(v) => v && onSortChange(v)}>
          <SelectTrigger className="h-9 w-auto min-w-[130px] shrink-0 text-xs">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="price">Price (lowest)</SelectItem>
            <SelectItem value="distance">Distance (nearest)</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
          </SelectContent>
        </Select>

        <Select
          items={Object.fromEntries(RADIUS_STEPS.map((r) => [String(r), `${r} km`]))}
          value={String(radius)}
          onValueChange={(v) => v && onRadiusChange(Number(v))}
        >
          <SelectTrigger className="h-9 w-auto min-w-[80px] shrink-0 text-xs">
            <SelectValue placeholder="Radius" />
          </SelectTrigger>
          <SelectContent>
            {RADIUS_STEPS.map((r) => (
              <SelectItem key={r} value={String(r)}>
                {r} km
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeFilterCount > 0 && onReset && (
          <button
            onClick={onReset}
            className={cn(
              'inline-flex items-center gap-1 h-9 px-2.5 rounded-full text-xs font-medium shrink-0',
              'text-muted-foreground hover:text-foreground',
              'backdrop-blur-xl bg-white/5 border border-white/10',
              'transition-colors duration-200',
            )}
          >
            <RotateCcw className="size-3" />
            Reset
            <Badge variant="secondary" className="ml-0.5 h-4 min-w-4 px-1 text-[10px]">
              {activeFilterCount}
            </Badge>
          </button>
        )}
      </div>

      {/* Variant chips — horizontally scrollable with fade mask */}
      <div
        ref={chipGroupRef}
        role="group"
        aria-label="Variant filters"
        className="flex items-center gap-1.5 overflow-x-auto scrollbar-none [mask-image:linear-gradient(to_right,transparent,black_2rem,black_calc(100%-2rem),transparent)]"
        onKeyDown={handleChipKeyDown}
      >
        {MONSTER_VARIANTS.map((v) => {
          const active = variant === v.value
          return (
            <button
              key={v.value}
              type="button"
              onClick={() => onVariantChange(v.value)}
              aria-pressed={active}
              className={cn(
                'inline-flex items-center h-9 px-3 rounded-full text-xs font-medium whitespace-nowrap shrink-0',
                'transition-all duration-200',
                active
                  ? 'bg-primary text-primary-foreground shadow-[0_2px_16px_var(--color-brand-glow)]'
                  : 'backdrop-blur-xl bg-white/5 border border-white/10 text-foreground hover:border-primary/30 hover:bg-white/[0.08]',
              )}
            >
              {v.label}
            </button>
          )
        })}
      </div>

      {/* Pack size chips */}
      <div role="group" aria-label="Pack size filters" className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPackSizeChange('single')}
          aria-pressed={packSize === 'single'}
          className={cn(
            'inline-flex items-center h-8 px-3 rounded-full text-xs font-medium shrink-0',
            'transition-all duration-200',
            packSize === 'single'
              ? 'bg-primary text-primary-foreground shadow-[0_2px_16px_var(--color-brand-glow)]'
              : 'backdrop-blur-xl bg-white/5 border border-white/10 text-foreground hover:border-primary/30 hover:bg-white/[0.08]',
          )}
        >
          Single
        </button>
        <button
          type="button"
          onClick={() => onPackSizeChange('multipack')}
          aria-pressed={isMultipackActive}
          className={cn(
            'inline-flex items-center h-8 px-3 rounded-full text-xs font-medium shrink-0',
            'transition-all duration-200',
            isMultipackActive
              ? 'bg-primary text-primary-foreground shadow-[0_2px_16px_var(--color-brand-glow)]'
              : 'backdrop-blur-xl bg-white/5 border border-white/10 text-foreground hover:border-primary/30 hover:bg-white/[0.08]',
          )}
        >
          Multipack
        </button>

        {isMultipackActive &&
          MULTIPACK_OPTIONS.map((size) => {
            const active = packSize === size
            return (
              <button
                key={size}
                type="button"
                onClick={() => onPackSizeChange(active ? 'multipack' : size)}
                aria-pressed={active}
                className={cn(
                  'inline-flex items-center h-8 px-2.5 rounded-full text-xs font-medium shrink-0',
                  'transition-all duration-200',
                  active
                    ? 'bg-primary/80 text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
              >
                {formatPackSize(size)}
              </button>
            )
          })}
      </div>
    </div>
  )
}
