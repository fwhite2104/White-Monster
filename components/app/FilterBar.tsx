"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MONSTER_VARIANTS, formatPackSize } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface FilterBarProps {
  sort: string
  setSort: (s: string) => void
  variant: string
  setVariant: (v: string) => void
  packSize: string
  setPackSize: (p: string) => void
  radius: number
  setRadius: (r: number) => void
}

const RADIUS_OPTIONS = [5, 10, 15, 25, 50]

export function FilterBar({
  sort, setSort,
  variant, setVariant,
  packSize, setPackSize,
  radius, setRadius,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 px-4 pb-3">
      <div className="flex items-center gap-3">
        <Select value={sort} onValueChange={(v) => v && setSort(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="price">Price (lowest)</SelectItem>
            <SelectItem value="distance">Distance (nearest)</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={String(radius)} onValueChange={(v) => setRadius(Number(v))}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RADIUS_OPTIONS.map((r) => (
              <SelectItem key={r} value={String(r)}>
                Within {r} km
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs text-muted-foreground shrink-0">Variant:</span>
        <div className="flex items-center gap-1.5">
          {MONSTER_VARIANTS.slice(0, 8).map((v) => (
            <Badge
              key={v.value}
              variant={variant === v.value ? "default" : "outline"}
              className={cn(
                "cursor-pointer shrink-0 text-xs",
                variant === v.value ? "bg-primary text-primary-foreground" : ""
              )}
              onClick={() => setVariant(v.value)}
            >
              {v.label.split(" ").slice(0, 2).join(" ")}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground shrink-0">Pack:</span>
        <div className="flex items-center gap-1.5">
          {["all", "single", "4_pack"].map((ps) => (
            <Badge
              key={ps}
              variant={packSize === ps ? "default" : "outline"}
              className={cn(
                "cursor-pointer shrink-0 text-xs",
                packSize === ps ? "bg-primary text-primary-foreground" : ""
              )}
              onClick={() => setPackSize(ps)}
            >
              {ps === "all" ? "All" : formatPackSize(ps)}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}
