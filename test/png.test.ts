import { describe, expect, it } from 'vitest'
import { encodePng } from '../src/lib/png'
import { decodePng } from './helpers/png-decode'

describe('encodePng', () => {
  it('round-trips 8-bit grayscale pixels', async () => {
    const data = Uint8Array.of(0, 64, 128, 255)
    const png = await encodePng({ width: 2, height: 2, data, channels: 1 })
    const decoded = await decodePng(png)

    expect(decoded.width).toBe(2)
    expect(decoded.height).toBe(2)
    expect(decoded.colorType).toBe(0)
    expect(decoded.bitDepth).toBe(8)
    expect([...decoded.pixels]).toEqual([...data])
  })

  it('round-trips 8-bit RGB pixels', async () => {
    const data = new Uint8Array(3 * 3 * 2)
    for (let i = 0; i < data.length; i++) data[i] = (i * 37) & 0xff

    const png = await encodePng({ width: 3, height: 2, data, channels: 3 })
    const decoded = await decodePng(png)

    expect(decoded.colorType).toBe(2)
    expect([...decoded.pixels]).toEqual([...data])
  })

  it('writes valid chunk CRCs and the expected chunk order', async () => {
    const data = new Uint8Array(16).fill(9)
    const png = await encodePng({ width: 4, height: 4, data, channels: 1 })
    const decoded = await decodePng(png)

    expect(decoded.chunks.map((chunk) => chunk.type)).toEqual([
      'IHDR',
      'IDAT',
      'IEND',
    ])
    expect(decoded.chunks.every((chunk) => chunk.crcOk)).toBe(true)
  })

  it('compresses long runs of identical pixels', async () => {
    const width = 256
    const height = 256
    const data = new Uint8Array(width * height).fill(200)
    const png = await encodePng({ width, height, data, channels: 1 })
    expect(png.length).toBeLessThan(2000)
  })

  it('rejects mismatched pixel data', async () => {
    await expect(
      encodePng({
        width: 10,
        height: 10,
        data: new Uint8Array(3),
        channels: 1,
      }),
    ).rejects.toThrow(/Expected 100 bytes/)
  })

  it('rejects invalid dimensions', async () => {
    await expect(
      encodePng({ width: 0, height: 5, data: new Uint8Array(0), channels: 1 }),
    ).rejects.toThrow(/Invalid PNG dimensions/)
  })
})
