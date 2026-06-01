'use client'

import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { MIN_RADIUS_KM, MAX_RADIUS_KM } from '@/lib/constants'

interface RadiusFilterProps {
  value: number
  onChange: (radius: number) => void
}

export function RadiusFilter({ value, onChange }: RadiusFilterProps) {
  return (
    <div className="flex items-center gap-4" aria-label="Search radius in kilometers">
      <span className="text-sm font-medium whitespace-nowrap">Radius</span>
      <Slider
        value={[value]}
        onValueChange={(val) => {
          const arr = Array.isArray(val) ? val : [val]
          onChange(arr[0])
        }}
        min={MIN_RADIUS_KM}
        max={MAX_RADIUS_KM}
        step={1}
        className="flex-1"
        aria-label="Search radius in kilometers"
      />
      <Badge variant="secondary" className="min-w-[60px] justify-center">
        {value} km
      </Badge>
    </div>
  )
}
