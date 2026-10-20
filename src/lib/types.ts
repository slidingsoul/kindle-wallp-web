import type { CropTransform } from './geometry'

export interface WorkerRequest {
  id: number
  file: File
  width: number
  height: number
  grayscale: boolean
  crop?: CropTransform
}

export type WorkerResponse =
  | {
      id: number
      ok: true
      png: ArrayBuffer
      width: number
      height: number
      channels: 1 | 3
    }
  | { id: number; ok: false; error: string }
