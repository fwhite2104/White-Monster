'use client'

import { ArrowUpDown, Filter } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MONSTER_VARIANTS } from '@/lib/constants'

interface SortControlsProps {
  sort: string
  onSortChange: (sort: string) => void
  variant: string
  onVariantChange: (variant: string) => void
}

export function SortControls({
  sort,
  onSortChange,
  variant,
  onVariantChange,
}: SortControlsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Select value={sort} onValueChange={(val) => val && onSortChange(val)}>
        <SelectTrigger className="w-[150px]">
          <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="price">Price</SelectItem>
          <SelectItem value="distance">Distance</SelectItem>
          <SelectItem value="name">Name</SelectItem>
        </SelectContent>
      </Select>

      <Select value={variant} onValueChange={(val) => val && onVariantChange(val)}>
        <SelectTrigger className="w-[220px]">
          <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
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
  )
}
