import ResizeWorker from './resize.worker?worker&inline'
import { toArrayBuffer } from './bytes'
import { processBlob } from './pipeline'
import type { CropTransform } from './geometry'
import type { WorkerResponse } from './types'

export interface ImageProcessOptions {
  width: number
  height: number
  grayscale: boolean
  crop?: CropTransform
}

export interface ProcessedImage {
  png: Uint8Array
  width: number
  height: number
  channels: 1 | 3
}

interface Pending {
  resolve: (value: ProcessedImage) => void
  reject: (reason: Error) => void
}

/**
 * Runs the pipeline in a Worker when possible and transparently falls back to
 * the main thread (for example if a `file://` page blocks blob workers).
 */
export class ImageProcessor {
  private worker: Worker | null | undefined
  private pending = new Map<number, Pending>()
  private nextId = 1

  async process(
    file: File,
    options: ImageProcessOptions,
  ): Promise<ProcessedImage> {
    const worker = this.ensureWorker()

    if (!worker) {
      const result = await processBlob(file, options)
      return result
    }

    return new Promise<ProcessedImage>((resolve, reject) => {
      const id = this.nextId++
      this.pending.set(id, { resolve, reject })
      worker.postMessage({ id, file, ...options })
    })
  }

  dispose(): void {
    this.worker?.terminate()
    this.worker = undefined
    this.failAll(new Error('Processor disposed'))
  }

  private ensureWorker(): Worker | null {
    if (this.worker !== undefined) return this.worker

    try {
      const worker = new ResizeWorker()

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const message = event.data
        const pending = this.pending.get(message.id)
        if (!pending) return
        this.pending.delete(message.id)

        if (message.ok) {
          pending.resolve({
            png: new Uint8Array(message.png),
            width: message.width,
            height: message.height,
            channels: message.channels,
          })
        } else {
          pending.reject(new Error(message.error))
        }
      }

      worker.onerror = (event) => {
        this.failAll(new Error(event.message || 'Image worker crashed'))
        worker.terminate()
        this.worker = undefined
      }

      this.worker = worker
    } catch {
      // Blob workers can be unavailable (e.g. some file:// contexts).
      this.worker = null
    }

    return this.worker
  }

  private failAll(error: Error): void {
    for (const pending of this.pending.values()) pending.reject(error)
    this.pending.clear()
  }
}

export function bytesToPngBlob(bytes: Uint8Array): Blob {
  return new Blob([toArrayBuffer(bytes)], { type: 'image/png' })
}
