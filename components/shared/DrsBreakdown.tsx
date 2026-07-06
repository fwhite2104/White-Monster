'use client'

import { splitPrice } from '@/lib/drs'

interface DrsBreakdownProps {
  totalPrice: number
  packSize: string
  className?: string
}

export function DrsBreakdown({ totalPrice, packSize, className }: DrsBreakdownProps) {
  const { base_price, drs_deposit } = splitPrice(totalPrice, packSize)

  return (
    <div className={`text-xs text-muted-foreground ${className ?? ''}`}>
      <span className="text-foreground font-medium">€{totalPrice.toFixed(2)}</span>
      <span className="mx-1">=</span>
      <span>€{base_price.toFixed(2)} product</span>
      <span className="mx-1">+</span>
      <span className="text-green-400">€{drs_deposit.toFixed(2)} DRS refundable</span>
    </div>
  )
}
