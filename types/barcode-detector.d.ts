// Ambient type declarations for BarcodeDetector API (not yet in TypeScript's default lib)
// See: https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector

interface BarcodeDetectorOptions {
  formats?: string[]
}

interface DetectedBarcode {
  boundingBox: DOMRectReadOnly
  corners: DOMPointReadOnly[]
  format: string
  rawValue: string
}

declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions)
  static getSupportedFormats(): Promise<string[]>
  detect(source: ImageBitmapSource): Promise<DetectedBarcode[]>
}
