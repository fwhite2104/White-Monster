'use client'

import { useState, useEffect, useCallback } from 'react'
import { ScanLine, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Product, Price, Store } from '@/lib/types'

interface ScanButtonProps {
  onScanResult: (result: { barcode: string; product: Product; prices: Array<Price & { stores?: Store }> }) => void
  userLat: number
  userLng: number
  radius: number
}

export function ScanButton({ onScanResult, userLat, userLng, radius }: ScanButtonProps) {
  const [showScanner, setShowScanner] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleScan = useCallback(async (barcode: string) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/scan?barcode=${encodeURIComponent(barcode)}&lat=${userLat}&lng=${userLng}&radius=${radius}`
      )
      const data = await res.json()

      if (!data.found) {
        setError(data.message ?? 'Product not found')
        return
      }

      onScanResult(data)
      setShowScanner(false)
    } catch {
      setError('Failed to look up barcode')
    } finally {
      setLoading(false)
    }
  }, [userLat, userLng, radius, onScanResult])

  // Dynamic import BarcodeScanner to keep bundle small
  const openScanner = useCallback(() => {
    setShowScanner(true)
    setError(null)
  }, [])

  return (
    <>
      <Button
        onClick={openScanner}
        size="icon"
        className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
        aria-label="Scan barcode"
        disabled={loading}
      >
        <ScanLine className="h-6 w-6" />
      </Button>

      {showScanner && (
        <div className="fixed inset-0 z-50">
          {/* Lazy-loaded scanner */}
          <BarcodeScannerLoader
            onScan={handleScan}
            onClose={() => setShowScanner(false)}
          />
        </div>
      )}

      {error && (
        <div
          className="fixed bottom-4 left-4 right-4 z-50 bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg text-center"
          role="alert"
          aria-live="assertive"
        >
          {error}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-2 text-destructive hover:text-destructive/80 h-8 px-2"
          >
            Dismiss
          </Button>
        </div>
      )}
    </>
  )
}

// Lazy loader to keep initial bundle small
function BarcodeScannerLoader({ onScan, onClose }: { onScan: (barcode: string) => void; onClose: () => void }) {
  const [Scanner, setScanner] = useState<React.ComponentType<{ onScan: (barcode: string) => void; onClose: () => void }> | null>(null)

  useEffect(() => {
    import('@/components/dashboard/BarcodeScanner').then((mod) => {
      setScanner(() => mod.BarcodeScanner)
    })
  }, [])

  if (!Scanner) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-3 text-white">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-white/60">Loading scanner...</p>
      </div>
    )
  }

  return <Scanner onScan={onScan} onClose={onClose} />
}
