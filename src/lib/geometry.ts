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
