export interface Crop {
  sx: number
  sy: number
  sw: number
  sh: number
}

/**
 * Mirror of Pillow's `ImageOps.fit(image, size, centering=(0.5, 0.5))`:
 * scale to cover the destination, cropping the overflow from the centre.
 *
 * Returns the source rectangle to sample from, in source pixels.
 */
export function coverCrop(
  srcWidth: number,
  srcHeight: number,
  dstWidth: number,
  dstHeight: number,
  centerX = 0.5,
  centerY = 0.5,
): Crop {
  if (!(srcWidth > 0 && srcHeight > 0 && dstWidth > 0 && dstHeight > 0)) {
    throw new Error(
      `Invalid dimensions: ${srcWidth}x${srcHeight} -> ${dstWidth}x${dstHeight}`,
    )
  }
  if (centerX < 0 || centerX > 1 || centerY < 0 || centerY > 1) {
    throw new Error(`Centering must be within 0..1, got ${centerX},${centerY}`)
  }

  const srcAspect = srcWidth / srcHeight
  const dstAspect = dstWidth / dstHeight

  let sw = srcWidth
  let sh = srcHeight

  if (srcAspect > dstAspect) {
    // Source is wider than the target: trim the sides.
    sw = srcHeight * dstAspect
  } else if (srcAspect < dstAspect) {
    // Source is taller than the target: trim top/bottom.
    sh = srcWidth / dstAspect
  }

  return {
    sx: (srcWidth - sw) * centerX,
    sy: (srcHeight - sh) * centerY,
    sw,
    sh,
  }
}

/** Scale factor that will be applied to the cropped region. */
export function fitScale(crop: Crop, dstWidth: number): number {
  return dstWidth / crop.sw
}

/**
 * User-controlled framing on top of the cover fit.
 *
 * `zoom` magnifies the covered image (1 = the whole covered area).
 * `focusX`/`focusY` pick where the crop window sits inside the available
 * travel: 0 pins the top/left edge, 0.5 centres it, 1 pins the bottom/right.
 */
export interface CropTransform {
  zoom: number
  focusX: number
  focusY: number
}

export const DEFAULT_CROP: CropTransform = Object.freeze({
  zoom: 1,
  focusX: 0.5,
  focusY: 0.5,
})

export const MIN_ZOOM = 1
export const MAX_ZOOM = 6

export function normalizeCrop(crop?: Partial<CropTransform> | null): CropTransform {
  if (!crop) return DEFAULT_CROP
  const zoom = Number.isFinite(crop.zoom) ? crop.zoom! : DEFAULT_CROP.zoom
  const focusX = Number.isFinite(crop.focusX) ? crop.focusX! : DEFAULT_CROP.focusX
  const focusY = Number.isFinite(crop.focusY) ? crop.focusY! : DEFAULT_CROP.focusY
  return {
    zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom)),
    focusX: Math.min(1, Math.max(0, focusX)),
    focusY: Math.min(1, Math.max(0, focusY)),
  }
}

export function cropsEqual(a?: CropTransform | null, b?: CropTransform | null): boolean {
  const left = normalizeCrop(a)
  const right = normalizeCrop(b)
  return (
    left.zoom === right.zoom &&
    left.focusX === right.focusX &&
    left.focusY === right.focusY
  )
}

/**
 * Source rectangle for a (possibly zoomed and panned) cover crop.
 *
 * With the default transform this is identical to `coverCrop(..., 0.5, 0.5)`,
 * so untransformed batches keep the CLI-parity output.
 */
export function cropRect(
  srcWidth: number,
  srcHeight: number,
  dstWidth: number,
  dstHeight: number,
  transform: CropTransform = DEFAULT_CROP,
): Crop {
  const base = coverCrop(srcWidth, srcHeight, dstWidth, dstHeight)
  const { zoom, focusX, focusY } = normalizeCrop(transform)

  const sw = base.sw / zoom
  const sh = base.sh / zoom

  return {
    sw,
    sh,
    sx: (srcWidth - sw) * focusX,
    sy: (srcHeight - sh) * focusY,
  }
}
