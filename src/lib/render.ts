import type { Crop } from './geometry'

export type AnyCanvas = OffscreenCanvas | HTMLCanvasElement

/** Caps intermediate canvases; keeps very large photos from exhausting memory. */
const MAX_STAGE_PIXELS = 16_000_000

export function createCanvas(width: number, height: number): AnyCanvas {
  if (typeof OffscreenCanvas === 'function') {
    return new OffscreenCanvas(width, height)
  }
  if (typeof document === 'undefined') {
    throw new Error('No canvas implementation is available in this context')
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

export function context2d(canvas: AnyCanvas): CanvasRenderingContext2D {
  const context = (canvas as HTMLCanvasElement).getContext('2d')
  if (!context) throw new Error('Canvas 2D is unavailable')
  return context
}

export async function decodeImage(blob: Blob): Promise<ImageBitmap> {
  if (typeof createImageBitmap !== 'function') {
    throw new Error('This browser cannot decode images')
  }

  try {
    // `from-image` is the spec default, but some engines need it explicitly.
    return await createImageBitmap(blob, { imageOrientation: 'from-image' })
  } catch {
    return await createImageBitmap(blob)
  }
}

/**
 * Draw the cropped source into a destination canvas of `width × height`,
 * downscaling in halving steps when the reduction is more than 2×. A single
 * huge jump makes most browsers alias, so the extra passes are what keep
 * quality close to Pillow's LANCZOS.
 */
export function renderCover(
  bitmap: ImageBitmap,
  crop: Crop,
  width: number,
  height: number,
): AnyCanvas {
  const fullWidth = Math.max(1, Math.round(crop.sw))
  const fullHeight = Math.max(1, Math.round(crop.sh))
  const fullPixels = fullWidth * fullHeight
  const capScale =
    fullPixels > MAX_STAGE_PIXELS
      ? Math.sqrt(MAX_STAGE_PIXELS / fullPixels)
      : 1

  let currentWidth = Math.max(1, Math.round(fullWidth * capScale))
  let currentHeight = Math.max(1, Math.round(fullHeight * capScale))
  let current: AnyCanvas | null = null

  if (capScale < 1) {
    current = createCanvas(currentWidth, currentHeight)
    drawCropped(current, bitmap, crop)
  }

  while (currentWidth > width * 2 && currentHeight > height * 2) {
    const nextWidth = Math.max(width, Math.floor(currentWidth / 2))
    const nextHeight = Math.max(height, Math.floor(currentHeight / 2))
    if (nextWidth >= currentWidth && nextHeight >= currentHeight) break

    const next = createCanvas(nextWidth, nextHeight)
    const context = context2d(next)
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'

    if (current) {
      context.drawImage(
        current,
        0,
        0,
        currentWidth,
        currentHeight,
        0,
        0,
        nextWidth,
        nextHeight,
      )
      release(current)
    } else {
      context.drawImage(
        bitmap,
        crop.sx,
        crop.sy,
        crop.sw,
        crop.sh,
        0,
        0,
        nextWidth,
        nextHeight,
      )
    }

    current = next
    currentWidth = nextWidth
    currentHeight = nextHeight
  }

  const out = createCanvas(width, height)
  const context = context2d(out)
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'

  if (current) {
    context.drawImage(
      current,
      0,
      0,
      currentWidth,
      currentHeight,
      0,
      0,
      width,
      height,
    )
    release(current)
  } else {
    context.drawImage(
      bitmap,
      crop.sx,
      crop.sy,
      crop.sw,
      crop.sh,
      0,
      0,
      width,
      height,
    )
  }

  return out
}

function drawCropped(canvas: AnyCanvas, bitmap: ImageBitmap, crop: Crop): void {
  const context = context2d(canvas)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(
    bitmap,
    crop.sx,
    crop.sy,
    crop.sw,
    crop.sh,
    0,
    0,
    canvas.width,
    canvas.height,
  )
}

function release(canvas: AnyCanvas): void {
  canvas.width = 0
  canvas.height = 0
}
