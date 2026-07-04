'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { SlidersHorizontal, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { MONSTER_VARIANTS, MIN_RADIUS_KM, MAX_RADIUS_KM, PACK_SIZES, formatPackSize } from '@/lib/constants'
import { ClubcardToggle } from '@/components/dashboard/ClubcardToggle'

interface FilterDrawerProps {
  sort: string
  onSortChange: (sort: string) => void
  variant: string
  onVariantChange: (variant: string) => void
  packSize: string
  onPackSizeChange: (packSize: string) => void
  radius: number
  onRadiusChange: (radius: number) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface QuickFilter {
  label: string
  isActive: (sort: string, variant: string, packSize: string, radius: number) => boolean
  apply: () => void
}

const DEFAULTS = { sort: 'price', variant: 'zero_sugar', packSize: '4_pack', radius: 10 }

// Base UI's Select.Value renders the raw value unless Root gets an items map
const SORT_ITEMS = {
  price: 'Price (lowest first)',
  distance: 'Distance (nearest first)',
  name: 'Name (A-Z)',
}
const PACK_SIZE_ITEMS = {
  all: 'All sizes',
  single: 'Single can',
  multipack: 'Multipack',
}
const MULTIPACK_OPTIONS = PACK_SIZES.filter((s) => s !== 'single')
const VARIANT_ITEMS = Object.fromEntries(MONSTER_VARIANTS.map((v) => [v.value, v.label]))

export function FilterDrawer({
  sort,
  onSortChange,
  variant,
  onVariantChange,
  packSize,
  onPackSizeChange,
  radius,
  onRadiusChange,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: FilterDrawerProps) {
  const shouldReduceMotion = useReducedMotion()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = externalOnOpenChange || setInternalOpen

  const quickFilters: QuickFilter[] = [
    {
      label: 'Nearby',
      isActive: (s, _v, _p, r) => s === 'distance' && r === 5,
      apply: () => { onSortChange('distance'); onRadiusChange(5) },
    },
    {
      label: 'Cheapest',
      isActive: (s) => s === 'price',
      apply: () => onSortChange('price'),
    },
    {
      label: 'Zero Sugar',
      isActive: (_s, v) => v === 'zero_sugar',
      apply: () => onVariantChange('zero_sugar'),
    },
    {
      label: 'Single cans',
      isActive: (_s, _v, p) => p === 'single',
      apply: () => onPackSizeChange('single'),
    },
    {
      label: 'Multipacks',
      isActive: (_s, _v, p) => p === 'multipack' || MULTIPACK_OPTIONS.includes(p as typeof MULTIPACK_OPTIONS[number]),
      apply: () => onPackSizeChange('multipack'),
    },
  ]

  const activeFilterCount = [
    sort !== DEFAULTS.sort,
    variant !== DEFAULTS.variant,
    packSize !== DEFAULTS.packSize,
    radius !== DEFAULTS.radius,
  ].filter(Boolean).length

  const pillGroupRef = useRef<HTMLDivElement>(null)

  const handlePillKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const buttons = pillGroupRef.current?.querySelectorAll<HTMLButtonElement>('button')
    if (!buttons || buttons.length === 0) return

    const currentIndex = Array.from(buttons).findIndex((btn) => btn === document.activeElement)
    if (currentIndex === -1) return

    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const nextIndex = (currentIndex + 1) % buttons.length
      buttons[nextIndex]?.focus()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prevIndex = (currentIndex - 1 + buttons.length) % buttons.length
      buttons[prevIndex]?.focus()
    }
  }, [])

  const handleReset = useCallback(() => {
    onSortChange(DEFAULTS.sort)
    onVariantChange(DEFAULTS.variant)
    onPackSizeChange(DEFAULTS.packSize)
    onRadiusChange(DEFAULTS.radius)
  }, [onSortChange, onVariantChange, onPackSizeChange, onRadiusChange])

  return (
    <div className="space-y-3">
      <div
        ref={pillGroupRef}
        role="group"
        aria-label="Quick filters"
        className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)]"
        onKeyDown={handlePillKeyDown}
      >
        {quickFilters.map((filter) => {
          const active = filter.isActive(sort, variant, packSize, radius)
          return (
            <motion.button
              key={filter.label}
              onClick={filter.apply}
              aria-pressed={active}
              className={cn(
                'relative inline-flex items-center h-11 px-3.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0',
                active
                  ? 'bg-primary text-primary-foreground shadow-[0_2px_16px_var(--color-brand-glow)]'
                  : 'bg-card ring-1 ring-border text-foreground hover:ring-primary/30 hover:bg-primary/5'
              )}
            >
              {filter.label}
              <AnimatePresence>
                {active && (
                  <motion.span
                    initial={shouldReduceMotion ? { opacity: 0 } : { scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { scaleX: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-[2px] w-4 rounded-full bg-primary-foreground/60"
                    aria-hidden="true"
                  />
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="h-11 px-3.5 shrink-0 rounded-full relative transition-all duration-200"
              />
            }
          >
            <SlidersHorizontal className="h-4 w-4 mr-1.5" />
            More
            {activeFilterCount > 0 && (
              <Badge
                variant="default"
                className="ml-1.5 h-4 min-w-4 px-1 text-xs"
              >
                {activeFilterCount}
              </Badge>
            )}
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Filters</DialogTitle>
            </DialogHeader>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Sort by</Label>
                <Select items={SORT_ITEMS} value={sort} onValueChange={(val) => val && onSortChange(val)}>
                  <SelectTrigger className="w-full h-11">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price">Price (lowest first)</SelectItem>
                    <SelectItem value="distance">Distance (nearest first)</SelectItem>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Variant</Label>
                <Select items={VARIANT_ITEMS} value={variant} onValueChange={(val) => val && onVariantChange(val)}>
                  <SelectTrigger className="w-full h-11">
                    <SelectValue placeholder="Variant" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONSTER_VARIANTS.map((v) => (
                      <SelectItem key={v.value} value={v.value}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Pack size</Label>
                {(() => {
                  const isSpecificMultipack = MULTIPACK_OPTIONS.includes(packSize as typeof MULTIPACK_OPTIONS[number])
                  const selectValue = isSpecificMultipack ? 'multipack' : packSize
                  return (
                    <>
                      <Select items={PACK_SIZE_ITEMS} value={selectValue} onValueChange={(val) => {
                        if (!val) return
                        if (val === 'multipack') {
                          onPackSizeChange('multipack')
                        } else {
                          onPackSizeChange(val)
                        }
                      }}>
                        <SelectTrigger className="w-full h-11">
                          <SelectValue placeholder="Pack size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All sizes</SelectItem>
                          <SelectItem value="single">Single can</SelectItem>
                          <SelectItem value="multipack">Multipack</SelectItem>
                        </SelectContent>
                      </Select>
                      {(selectValue === 'multipack') && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {MULTIPACK_OPTIONS.map((size) => {
                            const active = packSize === size
                            return (
                              <button
                                key={size}
                                type="button"
                                onClick={() => onPackSizeChange(active ? 'multipack' : size)}
                                className={cn(
                                  'inline-flex items-center h-8 px-3 rounded-full text-xs font-medium transition-colors',
                                  active
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                )}
                              >
                                {formatPackSize(size)}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <Label>Search radius</Label>
                  <Badge variant="secondary" className="min-w-[60px] justify-center text-xs">
                    {radius} km
                  </Badge>
                </div>
                <Slider
                  value={[radius]}
                  onValueChange={(val) => {
                    const arr = Array.isArray(val) ? val : [val]
                    onRadiusChange(arr[0])
                  }}
                  min={MIN_RADIUS_KM}
                  max={MAX_RADIUS_KM}
                  step={1}
                  className="w-full"
                  aria-label="Search radius in kilometers"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{MIN_RADIUS_KM} km</span>
                  <span>{MAX_RADIUS_KM} km</span>
                </div>
              </div>

              <div className="pt-2 border-t border-foreground/10">
                <Label className="mb-2 block">Preferences</Label>
                <ClubcardToggle />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                size="sm"
                className="h-11"
                onClick={handleReset}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Reset
              </Button>
              <Button
                size="sm"
                className="h-11"
                onClick={() => setOpen(false)}
              >
                Apply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {activeFilterCount > 0 && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          <span className="text-xs text-muted-foreground">
            {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
          </span>
          <button
            onClick={handleReset}
            className="text-xs text-primary hover:underline min-h-[44px] inline-flex items-center px-2"
          >
            Reset all
          </button>
        </motion.div>
      )}
    </div>
  )
}
