import { decodeImage, renderCover } from './render'
import { rgbaToGrayscale, rgbaToRgb } from './luma'
import { coverCrop } from './geometry'
import { encodePng, type PngChannels } from './png'

export interface ProcessOptions {
  width: number
  height: number
  grayscale: boolean
}

export interface ProcessResult {
  png: Uint8Array
  width: number
  height: number
  channels: PngChannels
}

/**
 * The whole per-image pipeline: decode → cover-crop → resample → colour
 * conversion → PNG encode. Pure browser APIs, no DOM required, so it can run
 * in a Worker or on the main thread as a fallback.
 */
export async function processBlob(
  file: Blob,
  { width, height, grayscale }: ProcessOptions,
): Promise<ProcessResult> {
  const bitmap = await decodeImage(file)

  try {
    const crop = coverCrop(bitmap.width, bitmap.height, width, height)
    const canvas = renderCover(bitmap, crop, width, height)

    try {
      const context = canvas.getContext('2d') as CanvasRenderingContext2D | null
      if (!context) throw new Error('Canvas 2D is unavailable')

      const pixels = context.getImageData(0, 0, width, height).data
      const channels: PngChannels = grayscale ? 1 : 3
      const data = grayscale ? rgbaToGrayscale(pixels) : rgbaToRgb(pixels)

      const png = await encodePng({ width, height, data, channels })
      return { png, width, height, channels }
    } finally {
      releaseCanvas(canvas)
    }
  } finally {
    bitmap.close()
  }
}

function releaseCanvas(canvas: OffscreenCanvas | HTMLCanvasElement): void {
  canvas.width = 0
  canvas.height = 0
}
