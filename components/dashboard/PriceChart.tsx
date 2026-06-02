'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { getRetailerColor } from '@/lib/constants'
import type { Price } from '@/lib/types'

interface PriceChartProps {
  prices: Price[]
  maxItems?: number
}

function formatLabel(retailer: string, packSize: string): string {
  if (packSize === '4_pack') return `${retailer} (4pk)`
  return retailer
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffMs = now - date
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export function PriceChart({ prices, maxItems = 8 }: PriceChartProps) {
  const shouldReduceMotion = useReducedMotion()
  const sorted = [...prices]
    .sort((a, b) => Number(a.price) - Number(b.price))
    .slice(0, maxItems)

  if (sorted.length < 2) return null

  const maxPrice = Math.max(...sorted.map((p) => Number(p.price)))
  const minPrice = Math.min(...sorted.map((p) => Number(p.price)))
  const chartMin = Math.max(0, minPrice - 0.5)
  const chartMax = maxPrice + 0.5
  const priceRange = chartMax - chartMin

  // Grid line values at ~5 intervals
  const gridStep = priceRange / 5
  const gridLines = Array.from({ length: 6 }, (_, i) => chartMin + gridStep * i)

  const hasAnyScraped = sorted.some((p) => p.scraped_at)

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-xl bg-card ring-1 ring-foreground/10 p-4 sm:p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Price Comparison
        </h3>
        {hasAnyScraped && (
          <span className="text-[10px] text-muted-foreground/40">
            • Scraped prices
          </span>
        )}
      </div>

      {/* --- SVG Bar Chart --- */}
      <div className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <svg
          role="img"
          aria-label="Price comparison bar chart"
          className="w-full min-w-[320px]"
          viewBox={`0 0 ${sorted.length * 64 + 48} 240`}
          preserveAspectRatio="xMidYMid meet"
          style={{ height: 'auto' }}
        >
          {/* Grid lines + Y-axis labels */}
          {gridLines.map((val) => {
            const y = 220 - ((val - chartMin) / priceRange) * 180
            return (
              <g key={val.toFixed(2)}>
                <line
                  x1={44}
                  y1={y}
                  x2={sorted.length * 64 + 44}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.08}
                  strokeDasharray="3 3"
                />
                <text
                  x={42}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="currentColor"
                  fillOpacity={0.4}
                >
                  €{val.toFixed(2)}
                </text>
              </g>
            )
          })}

          {/* Bars */}
          {sorted.map((price, index) => {
            const priceNum = Number(price.price)
            const barHeight = Math.max(
              6,
              ((priceNum - chartMin) / priceRange) * 180
            )
            const x = index * 64 + 52
            const y = 220 - barHeight
            const barWidth = 48
            const isCheapest = index === 0
            const store = price.stores ?? { name: 'Unknown', retailer: 'other' }
            const product = price.products ?? {
              name: 'Unknown Product',
              pack_size: 'single',
            }
            const retailerColor = getRetailerColor(store.retailer ?? 'other')
            const label = formatLabel(
              store.retailer ?? 'other',
              product.pack_size ?? 'single'
            )
            const perCanPrice =
              product.pack_size === '4_pack'
                ? Number(price.per_can_price ?? priceNum / 4).toFixed(2)
                : null

            return (
              <g key={price.id}>
                {/* Bar */}
                <motion.rect
                  x={x}
                  y={220}
                  width={barWidth}
                  height={0}
                  rx={4}
                  fill={retailerColor}
                  initial={shouldReduceMotion ? false : undefined}
                  animate={{ y, height: barHeight }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.05,
                    ease: 'easeOut',
                  }}
                />

                {/* Price label on top */}
                <motion.text
                  x={x + barWidth / 2}
                  y={y - 8}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="bold"
                  fill={isCheapest ? retailerColor : 'currentColor'}
                  fillOpacity={isCheapest ? 1 : 0.85}
                  initial={{ opacity: 0, y: y - 4 }}
                  animate={{ opacity: 1, y: y - 8 }}
                  transition={{ delay: 0.3 + index * 0.04, duration: 0.3 }}
                >
                  €{priceNum.toFixed(2)}
                </motion.text>

                {/* Per-can price for 4-packs */}
                {perCanPrice && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 8 + 12}
                    textAnchor="middle"
                    fontSize="8"
                    fill="currentColor"
                    fillOpacity={0.4}
                  >
                    €{perCanPrice}/can
                  </text>
                )}

                {/* Bar label */}
                <text
                  x={x + barWidth / 2}
                  y={228}
                  textAnchor="middle"
                  fontSize="10"
                  fill="currentColor"
                  fillOpacity={0.7}
                  className="select-none"
                >
                  {label}
                </text>

                {/* Scraped-at freshness */}
                {price.scraped_at && (
                  <text
                    x={x + barWidth / 2}
                    y={240}
                    textAnchor="middle"
                    fontSize="8"
                    fill="currentColor"
                    fillOpacity={0.3}
                  >
                    {formatTimeAgo(price.scraped_at)}
                  </text>
                )}

                {/* Best price badge */}
                {isCheapest && (
                  <motion.rect
                    x={x - 1}
                    y={y - 1}
                    width={barWidth + 2}
                    height={barHeight + 2}
                    rx={5}
                    fill="none"
                    stroke={retailerColor}
                    strokeWidth={1.5}
                    strokeOpacity={0.5}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  />
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 pt-3 border-t border-border/50">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <span className="text-xs text-muted-foreground">Best price</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
          <span className="text-xs text-muted-foreground">
            €{minPrice.toFixed(2)} – €{maxPrice.toFixed(2)}
          </span>
        </div>
        {hasAnyScraped && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground/40">
              Freshness shown per retailer
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
