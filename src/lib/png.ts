import { toArrayBuffer } from './bytes'
import { crc32 } from './crc32'

export type PngChannels = 1 | 3

export interface PngInput {
  width: number
  height: number
  /** Packed pixel data: `width * height * channels` bytes. */
  data: Uint8Array
  channels: PngChannels
}

const SIGNATURE = Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10)

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  return pb <= pc ? b : c
}

function score(row: Uint8Array): number {
  let sum = 0
  for (let i = 0; i < row.length; i++) {
    const value = row[i]
    sum += value < 128 ? value : 256 - value
  }
  return sum
}

/**
 * Filter one scanline. Candidates are None, Sub, Up and Paeth; the winner is
 * the one with the smallest sum of absolute signed differences, the same
 * heuristic libpng uses.
 */
function filterRow(
  row: Uint8Array,
  prev: Uint8Array | null,
  bpp: number,
  scratch: Uint8Array[],
): { filter: number; data: Uint8Array } {
  const stride = row.length

  for (let i = 0; i < stride; i++) {
    const left = i >= bpp ? row[i - bpp] : 0
    const up = prev ? prev[i] : 0
    const upLeft = prev && i >= bpp ? prev[i - bpp] : 0

    scratch[0][i] = row[i]
    scratch[1][i] = (row[i] - left) & 0xff
    scratch[2][i] = (row[i] - up) & 0xff
    scratch[4][i] = (row[i] - paeth(left, up, upLeft)) & 0xff
  }

  let bestFilter = 0
  let bestScore = score(scratch[0])
  for (const filter of [1, 2, 4]) {
    const candidate = score(scratch[filter])
    if (candidate < bestScore) {
      bestScore = candidate
      bestFilter = filter
    }
  }

  return { filter: bestFilter, data: scratch[bestFilter] }
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type)
  const out = new Uint8Array(12 + data.length)
  const view = new DataView(out.buffer)

  view.setUint32(0, data.length)
  out.set(typeBytes, 4)
  out.set(data, 8)
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)))

  return out
}

async function zlibDeflate(data: Uint8Array): Promise<Uint8Array> {
  const input = new Blob([toArrayBuffer(data)]).stream()
  const compressed = input.pipeThrough(new CompressionStream('deflate'))
  return new Uint8Array(await new Response(compressed).arrayBuffer())
}

/**
 * Minimal PNG encoder. Writing the file ourselves (instead of canvas
 * `toBlob`) gives true 8-bit grayscale output (colour type 0, like Pillow's
 * `L` mode) instead of always-RGBA, which matters for e-ink readers.
 */
export async function encodePng({
  width,
  height,
  data,
  channels,
}: PngInput): Promise<Uint8Array> {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw new Error(`Invalid PNG dimensions: ${width}x${height}`)
  }
  const expected = width * height * channels
  if (data.length !== expected) {
    throw new Error(`Expected ${expected} bytes of pixel data, got ${data.length}`)
  }

  const bpp = channels
  const stride = width * bpp
  const raw = new Uint8Array((stride + 1) * height)
  const scratch = [
    new Uint8Array(stride),
    new Uint8Array(stride),
    new Uint8Array(stride),
    new Uint8Array(stride),
    new Uint8Array(stride),
  ]

  let prev: Uint8Array | null = null
  for (let y = 0; y < height; y++) {
    const row = data.subarray(y * stride, (y + 1) * stride)
    const { filter, data: filtered } = filterRow(row, prev, bpp, scratch)
    const offset = y * (stride + 1)
    raw[offset] = filter
    raw.set(filtered, offset + 1)
    prev = row
  }

  const ihdr = new Uint8Array(13)
  const header = new DataView(ihdr.buffer)
  header.setUint32(0, width)
  header.setUint32(4, height)
  ihdr[8] = 8 // bit depth
  ihdr[9] = channels === 1 ? 0 : 2 // colour type: grayscale / truecolour
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  const idat = await zlibDeflate(raw)

  const parts = [
    SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', new Uint8Array(0)),
  ]
  const total = parts.reduce((sum, part) => sum + part.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}
