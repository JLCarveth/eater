/**
 * BarcodeDetector abstraction layer
 * Uses native BarcodeDetector API where available,
 * falls back to barcode-detector WASM polyfill
 */

// Supported barcode formats for UPC scanning
export const UPC_FORMATS: BarcodeFormat[] = [
  "upc_a",
  "upc_e",
  "ean_13",
  "ean_8",
];

// Check if native BarcodeDetector is available
export function hasNativeBarcodeDetector(): boolean {
  return typeof globalThis.BarcodeDetector !== "undefined";
}

let cachedDetector: BarcodeDetector | null = null;

/**
 * Get or create a BarcodeDetector instance
 * Uses native API if available, otherwise loads WASM polyfill
 */
export async function getBarcodeDetector(): Promise<BarcodeDetector> {
  if (cachedDetector) {
    return cachedDetector;
  }

  if (hasNativeBarcodeDetector()) {
    cachedDetector = new globalThis.BarcodeDetector({ formats: UPC_FORMATS });
    return cachedDetector;
  }

  // Dynamically import the polyfill
  const { BarcodeDetector: PolyfillDetector } = await import("barcode-detector");
  cachedDetector = new PolyfillDetector({ formats: UPC_FORMATS });
  return cachedDetector;
}

/**
 * Detect barcodes in an image source
 * Returns array of detected barcode values
 */
export async function detectBarcodes(
  source: ImageBitmapSource
): Promise<string[]> {
  const detector = await getBarcodeDetector();
  const results = await detector.detect(source);
  return results.map((result) => result.rawValue);
}
