'use client'

import * as Select from "@radix-ui/react-select"
import { ChevronDown, Check } from "lucide-react"
import { PACK_SIZES, formatPackSize } from "@/lib/constants"
import { VariantPicker } from "./VariantPicker"

interface FilterBarProps {
  variant: string
  setVariant: (v: string) => void
  packSize: string
  setPackSize: (p: string) => void
  sort: string
  setSort: (s: string) => void
  radius: number
  setRadius: (r: number) => void
}

const sortOptions = [
  { value: 'price', label: 'Price: low to high' },
  { value: 'distance', label: 'Distance: nearest first' },
]

function FilterSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  label: string
}) {
  const selected = options.find((o) => o.value === value)

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Select.Root value={value} onValueChange={onChange}>
        <Select.Trigger
          className="inline-flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-lg bg-muted border border-border hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring min-w-[140px]"
          aria-label={label}
          data-testid={`filter-${label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <Select.Value placeholder={`Select ${label.toLowerCase()}`}>
            {selected?.label ?? value}
          </Select.Value>
          <Select.Icon>
            <ChevronDown className="size-4 text-muted-foreground" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            className="overflow-hidden rounded-lg bg-background border border-border shadow-lg z-50"
            position="popper"
            sideOffset={4}
          >
            <Select.Viewport className="p-1">
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className="relative flex items-center justify-between gap-4 px-6 py-2 text-sm rounded-md cursor-pointer hover:bg-muted focus:bg-muted focus:outline-none data-[state=checked]:text-primary"
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator className="inline-flex items-center justify-center">
                    <Check className="size-4" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  )
}

export function FilterBar({
  variant,
  setVariant,
  packSize,
  setPackSize,
  sort,
  setSort,
  radius,
  setRadius,
}: FilterBarProps) {
  const packOptions = PACK_SIZES.map((p) => ({ value: p, label: formatPackSize(p) }))

  return (
    <div className="px-4 py-3 border-b border-border bg-card/30">
      <div className="max-w-7xl mx-auto flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Variant</label>
          <VariantPicker value={variant} onChange={setVariant} />
        </div>
        <FilterSelect
          label="Pack size"
          value={packSize}
          onChange={setPackSize}
          options={packOptions}
        />
        <FilterSelect
          label="Sort"
          value={sort}
          onChange={setSort}
          options={sortOptions}
        />
        <div className="flex flex-col gap-1 min-w-[140px]">
          <label htmlFor="radius" className="text-xs font-medium text-muted-foreground">
            Radius: {radius} km
          </label>
          <input
            id="radius"
            type="range"
            min={1}
            max={50}
            step={1}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
      </div>
    </div>
  )
}
