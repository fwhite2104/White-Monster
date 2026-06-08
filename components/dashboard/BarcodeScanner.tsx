'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Camera, CameraOff, X, Flashlight, FlashlightOff } from 'lucide-react'
import { Button } from '@/components/ui/button'


interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const scanLoopRef = useRef<(() => void) | null>(null)
  const [status, setStatus] = useState<'requesting' | 'scanning' | 'error' | 'unsupported'>('requesting')
  const [errorMsg, setErrorMsg] = useState('')
  const [torchOn, setTorchOn] = useState(false)
  const [detector, setDetector] = useState<BarcodeDetector | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Initialize BarcodeDetector API
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      BarcodeDetector.getSupportedFormats().then((formats) => {
        if (formats.includes('ean_13') || formats.includes('upc_a')) {
          const det = new BarcodeDetector({ formats: ['ean_13', 'upc_a'] })
          setDetector(det)
        }
      }).catch(() => {
        // BarcodeDetector exists but not usable — will use canvas fallback
      })
    }
  }, [])

  const stopStream = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = 0
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const scanLoop = useCallback(() => {
    const video = videoRef.current
    const det = detector
    if (!video || !det || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(() => scanLoopRef.current?.())
      return
    }

    det.detect(video).then((results) => {
      if (results.length > 0) {
        const raw = results[0].rawValue
        if (raw) {
          onScan(raw)
          stopStream()
          return
        }
      }
      animFrameRef.current = requestAnimationFrame(() => scanLoopRef.current?.())
    }).catch(() => {
      animFrameRef.current = requestAnimationFrame(() => scanLoopRef.current?.())
    })
  }, [detector, onScan, stopStream])

  useEffect(() => {
    scanLoopRef.current = scanLoop
  }, [scanLoop])

  // Start camera and scan loop
  useEffect(() => {
    let mounted = true

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        })

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        if (detector) {
          setStatus('scanning')
          animFrameRef.current = requestAnimationFrame(() => scanLoopRef.current?.())
        } else {
          // No BarcodeDetector — show camera only with manual entry fallback
          setStatus('scanning')
        }
      } catch (err) {
        if (!mounted) return
        const msg = err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access and try again.'
          : 'Camera not available on this device.'
        setErrorMsg(msg)
        setStatus('error')
      }
    }

    start()

    return () => {
      mounted = false
      stopStream()
    }
  }, [detector, stopStream])

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    try {
      const caps = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean }
      if (!caps.torch) return
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as MediaTrackConstraintSet] })
      setTorchOn((prev) => !prev)
    } catch {
      // Torch not supported
    }
  }, [torchOn])

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80">
        <h2 className="text-white font-medium">Scan Barcode</h2>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:text-white/80"
          onClick={() => { stopStream(); onClose() }}
          aria-label="Close scanner"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Camera viewport */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanning overlay */}
        {status === 'scanning' && (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Semi-transparent border frame */}
            <div className="relative w-72 h-44">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-green-400 rounded-tl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-green-400 rounded-tr" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-green-400 rounded-bl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-green-400 rounded-br" />

              {/* Scanning line animation */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-green-400/80 animate-scan-line" />
            </div>

            <p className="absolute bottom-8 text-white/80 text-sm text-center px-8">
              Point your camera at a Monster Energy barcode
            </p>
          </div>
        )}

        {/* Error / unsupported states */}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white p-8 text-center">
            <CameraOff className="h-16 w-16 mb-4 text-red-400" />
            <p className="text-lg font-medium mb-2">Camera Unavailable</p>
            <p className="text-white/60 text-sm mb-6">{errorMsg}</p>
            <Button variant="outline" onClick={onClose} className="text-white border-white/20">
              Go Back
            </Button>
          </div>
        )}

        {status === 'requesting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white">
            <Camera className="h-16 w-16 mb-4 text-white/40 animate-pulse" />
            <p className="text-white/60 text-sm">Requesting camera access...</p>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      {status === 'scanning' && (
        <div className="flex items-center justify-center gap-6 p-4 bg-black/80">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:text-white/80"
            onClick={toggleTorch}
            aria-label={torchOn ? 'Turn off flashlight' : 'Turn on flashlight'}
          >
            {torchOn ? (
              <FlashlightOff className="h-6 w-6" />
            ) : (
              <Flashlight className="h-6 w-6" />
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
