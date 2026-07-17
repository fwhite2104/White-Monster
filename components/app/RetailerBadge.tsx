import { getRetailerColor } from "@/lib/constants"

interface RetailerBadgeProps {
  retailer: string
}

export function RetailerBadge({ retailer }: RetailerBadgeProps) {
  const color = getRetailerColor(retailer)
  const label = retailer.charAt(0).toUpperCase() + retailer.slice(1)

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}
