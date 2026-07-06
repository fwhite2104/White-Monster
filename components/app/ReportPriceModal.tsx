"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StoreUploadForm } from "@/components/dashboard/StoreUploadForm"

interface ReportPriceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prefillStoreName?: string
}

export function ReportPriceModal({ open, onOpenChange, prefillStoreName }: ReportPriceModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report a price</DialogTitle>
        </DialogHeader>
        <StoreUploadForm
          externalOpen={open}
          onExternalOpenChange={onOpenChange}
          prefillStoreName={prefillStoreName}
        />
      </DialogContent>
    </Dialog>
  )
}
