import { crc32 } from '../../src/lib/crc32'

export interface DecodedPng {
  width: number
  height: number
  bitDepth: number
  colorType: number
  pixels: Uint8Array
  chunks: { type: string; length: number; crcOk: boolean }[]
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  return pb <= pc ? b : c
}

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data.slice().buffer]).stream().pipeThrough(
    new DecompressionStream('deflate'),
  )
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

/** Minimal PNG reader used to verify the encoder round-trips. */
export async function decodePng(bytes: Uint8Array): Promise<DecodedPng> {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10]
  for (let i = 0; i < signature.length; i++) {
    if (bytes[i] !== signature[i]) throw new Error('Bad PNG signature')
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const chunks: DecodedPng['chunks'] = []
  let offset = 8
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  const idat: Uint8Array[] = []

  while (offset < bytes.length) {
    const length = view.getUint32(offset)
    const type = new TextDecoder().decode(bytes.subarray(offset + 4, offset + 8))
    const data = bytes.subarray(offset + 8, offset + 8 + length)
    const expected = view.getUint32(offset + 8 + length)

    // Recompute CRC over type + data.
    const crcInput = bytes.subarray(offset + 4, offset + 8 + length)
    const crcOk = crc32(crcInput) === expected

    chunks.push({ type, length, crcOk })

    if (type === 'IHDR') {
      const header = new DataView(data.buffer, data.byteOffset, data.byteLength)
      width = header.getUint32(0)
      height = header.getUint32(4)
      bitDepth = data[8]
      colorType = data[9]
    } else if (type === 'IDAT') {
      idat.push(data)
    } else if (type === 'IEND') {
      break
    }

    offset += 12 + length
  }

  if (bitDepth !== 8) throw new Error(`Unsupported bit depth: ${bitDepth}`)
  if (colorType !== 0 && colorType !== 2) {
    throw new Error(`Unsupported colour type: ${colorType}`)
  }

  const channels = colorType === 0 ? 1 : 3
  const stride = width * channels

  const compressed = new Uint8Array(
    idat.reduce((sum, part) => sum + part.length, 0),
  )
  let cursor = 0
  for (const part of idat) {
    compressed.set(part, cursor)
    cursor += part.length
  }

  const raw = await inflate(compressed)
  if (raw.length !== (stride + 1) * height) {
    throw new Error(`Unexpected decompressed size: ${raw.length}`)
  }

  const pixels = new Uint8Array(stride * height)
  let prev = new Uint8Array(stride)

  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1)
    const filter = raw[rowStart]
    const src = raw.subarray(rowStart + 1, rowStart + 1 + stride)
    const row = pixels.subarray(y * stride, (y + 1) * stride)

    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? row[x - channels] : 0
      const up = prev[x]
      const upLeft = x >= channels ? prev[x - channels] : 0
      let value = src[x]

      switch (filter) {
        case 0:
          break
        case 1:
          value = (value + left) & 0xff
          break
        case 2:
          value = (value + up) & 0xff
          break
        case 3:
          value = (value + ((left + up) >> 1)) & 0xff
          break
        case 4:
          value = (value + paeth(left, up, upLeft)) & 0xff
          break
        default:
          throw new Error(`Unknown filter type: ${filter}`)
      }

      row[x] = value
    }

    prev = row
  }

  return { width, height, bitDepth, colorType, pixels, chunks }
}
