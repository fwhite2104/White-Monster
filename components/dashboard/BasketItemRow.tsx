'use client'

import { useState } from 'react'
import { X, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MONSTER_VARIANTS } from '@/lib/constants'
import type { BasketItem } from '@/lib/basket-types'

interface BasketItemRowProps {
  item: BasketItem
  onRemove: (variant: string, packSize: string) => void
  onUpdateQuantity: (variant: string, packSize: string, quantity: number) => void
}

export function BasketItemRow({ item, onRemove, onUpdateQuantity }: BasketItemRowProps) {
  const variantLabel = MONSTER_VARIANTS.find((v) => v.value === item.variant)?.label ?? item.variant

  return (
    <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-card ring-1 ring-foreground/10">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{variantLabel}</span>
          <Badge variant="outline" className="text-[10px] h-4 border-foreground/15 shrink-0">
            {item.pack_size === '4_pack' ? '4-pack' : 'Single'}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onUpdateQuantity(item.variant, item.pack_size, item.quantity - 1)}
          aria-label="Decrease quantity"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="text-sm font-medium tabular-nums min-w-[24px] text-center">
          {item.quantity}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onUpdateQuantity(item.variant, item.pack_size, item.quantity + 1)}
          aria-label="Increase quantity"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-red-400"
        onClick={() => onRemove(item.variant, item.pack_size)}
        aria-label={`Remove ${variantLabel}`}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

interface BasketItemAdderProps {
  onAdd: (item: BasketItem) => void
  canAddMore: boolean
}

export function BasketItemAdder({ onAdd, canAddMore }: BasketItemAdderProps) {
  const [variant, setVariant] = useState<string>('')
  const [packSize, setPackSize] = useState<string>('single')

  const handleAdd = () => {
    if (!variant) return
    onAdd({ variant, pack_size: packSize as 'single' | '4_pack', quantity: 1 })
    setVariant('')
  }

  if (!canAddMore) return null

  return (
    <div className="flex items-center gap-2">
      <Select value={variant} onValueChange={(v) => v !== null && setVariant(v)}>
        <SelectTrigger className="flex-1 h-9">
          <SelectValue placeholder="Select variant..." />
        </SelectTrigger>
        <SelectContent>
          {MONSTER_VARIANTS.map((v) => (
            <SelectItem key={v.value} value={v.value}>
              {v.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={packSize} onValueChange={(v) => v !== null && setPackSize(v)}>
        <SelectTrigger className="w-28 h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="single">Single</SelectItem>
          <SelectItem value="4_pack">4-Pack</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        className="h-9 px-3"
        onClick={handleAdd}
        disabled={!variant}
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        Add
      </Button>
    </div>
  )
}
