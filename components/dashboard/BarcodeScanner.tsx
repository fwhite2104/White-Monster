'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Camera, CameraOff, X, Flashlight, FlashlightOff, ScanLine, Keyboard } from 'lucide-react'
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
  const inputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<'camera' | 'manual'>('camera')
  const [status, setStatus] = useState<'requesting' | 'scanning' | 'error'>('requesting')
  const [errorMsg, setErrorMsg] = useState('')
  const [torchOn, setTorchOn] = useState(false)
  const [detector, setDetector] = useState<BarcodeDetector | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [manualBarcode, setManualBarcode] = useState('')
  const [validationError, setValidationError] = useState('')

  // Initialize BarcodeDetector API and set default mode
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      BarcodeDetector.getSupportedFormats().then((formats) => {
        if (formats.includes('ean_13') || formats.includes('upc_a')) {
          const det = new BarcodeDetector({ formats: ['ean_13', 'upc_a'] })
          setDetector(det)
          setMode('camera')
        } else {
          setMode('manual')
        }
      }).catch(() => {
        setMode('manual')
      })
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time init based on BarcodeDetector availability
      setMode('manual')
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
    if (mode !== 'camera') return
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
  }, [mode, detector, stopStream])

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

  const handleManualSubmit = useCallback(() => {
    const cleaned = manualBarcode.trim()
    if (!/^\d{8,14}$/.test(cleaned)) {
      setValidationError('Please enter 8–14 digits')
      return
    }
    setValidationError('')
    onScan(cleaned)
  }, [manualBarcode, onScan])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleManualSubmit()
    }
  }, [handleManualSubmit])

  const switchToManual = useCallback(() => {
    stopStream()
    setMode('manual')
    setStatus('requesting')
    setErrorMsg('')
  }, [stopStream])

  // Focus input when switching to manual mode
  useEffect(() => {
    if (mode === 'manual') {
      inputRef.current?.focus()
    }
  }, [mode])

  return (
    <div className="fixed inset-0 z-[var(--z-overlay)] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80">
        <h2 className="text-white font-medium">Scan Barcode</h2>
        <Button
          variant="ghost"
          size="icon-lg"
          className="text-white hover:text-white/80"
          onClick={() => { stopStream(); onClose() }}
          aria-label="Close scanner"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Mode tabs */}
      <div className="flex bg-black/60 border-b border-white/10" role="tablist" aria-label="Scanner mode">
        <button
          role="tab"
          aria-selected={mode === 'camera'}
          onClick={() => { setMode('camera'); setStatus('requesting'); setErrorMsg('') }}
          className={`relative flex-1 flex items-center justify-center gap-2 min-h-[48px] px-4 text-sm font-medium transition-colors ${
            mode === 'camera' ? 'text-primary' : 'text-white/60 hover:text-white/80'
          }`}
          aria-label="Camera scan mode"
        >
          <ScanLine className="h-4 w-4" />
          Scan
          {mode === 'camera' && (
            <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full origin-center" style={{ animation: 'tab-indicator-slide 200ms var(--ease-out) forwards' }} />
          )}
        </button>
        <button
          role="tab"
          aria-selected={mode === 'manual'}
          onClick={() => { stopStream(); setMode('manual'); setErrorMsg('') }}
          className={`relative flex-1 flex items-center justify-center gap-2 min-h-[48px] px-4 text-sm font-medium transition-colors ${
            mode === 'manual' ? 'text-primary' : 'text-white/60 hover:text-white/80'
          }`}
          aria-label="Manual entry mode"
        >
          <Keyboard className="h-4 w-4" />
          Type
          {mode === 'manual' && (
            <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full origin-center" style={{ animation: 'tab-indicator-slide 200ms var(--ease-out) forwards' }} />
          )}
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 relative overflow-hidden">
        {mode === 'camera' ? (
          <>
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

                {!detector && (
                  <div className="absolute top-4 left-4 right-4 bg-destructive/20 border border-destructive/30 text-destructive-foreground text-sm p-3 rounded-lg text-center space-y-2">
                    <p>Barcode detection is not supported in this browser.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={switchToManual}
                      className="text-white border-white/20 h-10"
                    >
                      <Keyboard className="h-4 w-4 mr-1.5" />
                      Enter manually
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Error state */}
            {status === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white p-8 text-center" role="alert" aria-live="assertive">
                <CameraOff className="h-16 w-16 mb-4 text-red-400" />
                <p className="text-lg font-medium mb-2">Camera Unavailable</p>
                <p className="text-white/60 text-sm mb-6">{errorMsg}</p>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <Button variant="outline" onClick={switchToManual} className="text-white border-white/20">
                    Try Manual Entry
                  </Button>
                  <Button variant="outline" onClick={onClose} className="text-white border-white/20">
                    Go Back
                  </Button>
                </div>
              </div>
            )}

            {status === 'requesting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white">
                <Camera className="h-16 w-16 mb-4 text-white/40 animate-pulse" />
                <p className="text-white/60 text-sm">Requesting camera access...</p>
              </div>
            )}
          </>
        ) : (
          /* Manual mode */
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background p-6">
            <div className="w-full max-w-sm bg-card border border-border rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-card-foreground mb-2 text-center">
                Enter Barcode
              </h3>

              {!detector && (
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    Your browser doesn&apos;t support camera scanning. Enter the barcode number from the product:
                  </p>
              )}

              {detector && (
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  Type the barcode number from the product label
                </p>
              )}

              <div className="space-y-4">
                <div>
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={manualBarcode}
                    onChange={(e) => {
                      setManualBarcode(e.target.value.replace(/\D/g, ''))
                      setValidationError('')
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="1234567890123"
                    maxLength={14}
                    className="w-full bg-background border border-input rounded-lg px-4 py-3 text-foreground text-lg text-center tracking-widest placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Barcode number input"
                  />
                  {validationError && (
                    <p className="text-sm text-destructive mt-2 text-center" role="alert" aria-live="assertive">{validationError}</p>
                  )}
                </div>

                <Button
                  onClick={handleManualSubmit}
                  className="w-full"
                  aria-label="Look up barcode"
                >
                  Look Up
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      {mode === 'camera' && status === 'scanning' && (
        <div className="flex items-center justify-center gap-6 p-4 bg-black/80">
          <Button
            variant="ghost"
            size="icon-lg"
            className="text-white hover:text-white/80 h-11 w-11"
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
