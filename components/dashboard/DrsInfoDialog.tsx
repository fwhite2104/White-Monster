'use client'

import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DRS_INFO } from '@/lib/drs'

interface DrsInfoDialogProps {
  open: boolean
  onClose: () => void
}

export function DrsInfoDialog({ open, onClose }: DrsInfoDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[var(--z-dialog)] flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-5 w-5 text-green-400" />
          <h2 className="text-lg font-semibold">{DRS_INFO.schemeName}</h2>
        </div>

        <div className="space-y-3 text-sm text-muted-foreground">
          <p>{DRS_INFO.description}</p>

          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            <p className="font-medium text-foreground">How it works</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>€{DRS_INFO.rate.toFixed(2)} deposit added per {DRS_INFO.applicableSizes}</li>
              <li>4-pack = €{(DRS_INFO.rate * 4).toFixed(2)} deposit (4 × €{DRS_INFO.rate.toFixed(2)})</li>
              <li>Return empty cans to any DRS collection point</li>
              <li>Get your full deposit back as cash or voucher</li>
            </ul>
          </div>

          <p className="text-xs">
            Monster Cork shows the DRS deposit separately so you can see the true product cost.
          </p>
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={onClose} variant="outline" size="sm">
            Got it
          </Button>
        </div>
      </div>
    </div>
  )
}
