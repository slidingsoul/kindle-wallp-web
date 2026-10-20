/**
 * ITU-R BT.601 luma — the same coefficients Pillow uses for `convert("L")`.
 *
 * Deliberately not the CSS `grayscale()` filter, which follows Rec.709
 * (0.2126/0.7152/0.0722) and would not match the CLI.
 */
export function luma601(r: number, g: number, b: number): number {
  return Math.round(0.299 * r + 0.587 * g + 0.114 * b)
}

/**
 * Convert RGBA pixels to 8-bit grayscale, compositing any transparency onto
 * white first. Pillow ignores alpha in `convert("L")`, which produces dirty
 * edges on transparent PNGs; flattening is the better behaviour for e-ink.
 */
export function rgbaToGrayscale(
  rgba: Uint8ClampedArray | Uint8Array,
  background = 255,
): Uint8Array {
  const pixels = rgba.length / 4
  const out = new Uint8Array(pixels)

  for (let i = 0, p = 0; i < rgba.length; i += 4, p++) {
    const alpha = rgba[i + 3]
    if (alpha === 255) {
      out[p] = luma601(rgba[i], rgba[i + 1], rgba[i + 2])
      continue
    }
    const a = alpha / 255
    const r = rgba[i] * a + background * (1 - a)
    const g = rgba[i + 1] * a + background * (1 - a)
    const b = rgba[i + 2] * a + background * (1 - a)
    out[p] = luma601(r, g, b)
  }

  return out
}

/**
 * Convert RGBA pixels to packed RGB, compositing transparency onto white.
 */
export function rgbaToRgb(
  rgba: Uint8ClampedArray | Uint8Array,
  background = 255,
): Uint8Array {
  const pixels = rgba.length / 4
  const out = new Uint8Array(pixels * 3)

  for (let i = 0, o = 0; i < rgba.length; i += 4, o += 3) {
    const alpha = rgba[i + 3]
    if (alpha === 255) {
      out[o] = rgba[i]
      out[o + 1] = rgba[i + 1]
      out[o + 2] = rgba[i + 2]
      continue
    }
    const a = alpha / 255
    out[o] = Math.round(rgba[i] * a + background * (1 - a))
    out[o + 1] = Math.round(rgba[i + 1] * a + background * (1 - a))
    out[o + 2] = Math.round(rgba[i + 2] * a + background * (1 - a))
  }

  return out
}
