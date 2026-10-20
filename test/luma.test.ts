import { describe, expect, it } from 'vitest'
import { luma601, rgbaToGrayscale, rgbaToRgb } from '../src/lib/luma'

describe('luma601', () => {
  it('matches Pillow rec601 coefficients', () => {
    expect(luma601(0, 0, 0)).toBe(0)
    expect(luma601(255, 255, 255)).toBe(255)
    expect(luma601(255, 0, 0)).toBe(76)
    expect(luma601(0, 255, 0)).toBe(150)
    expect(luma601(0, 0, 255)).toBe(29)
  })

  it('uses rec601, not rec709', () => {
    // Rec.709 would give 54 for pure red and 182 for pure green.
    expect(luma601(255, 0, 0)).not.toBe(54)
    expect(luma601(0, 255, 0)).not.toBe(182)
  })
})

describe('rgbaToGrayscale', () => {
  it('converts opaque pixels directly', () => {
    const rgba = Uint8Array.of(255, 0, 0, 255, 0, 0, 255, 255)
    expect([...rgbaToGrayscale(rgba)]).toEqual([76, 29])
  })

  it('flattens transparency onto white', () => {
    const rgba = Uint8Array.of(0, 0, 0, 0)
    expect(rgbaToGrayscale(rgba)[0]).toBe(255)
  })

  it('blends half-transparent black onto white', () => {
    const rgba = Uint8Array.of(0, 0, 0, 128)
    // 255 * (1 - 128/255) = 127
    expect(rgbaToGrayscale(rgba)[0]).toBe(127)
  })

  it('produces one byte per pixel', () => {
    const rgba = new Uint8Array(4 * 7)
    expect(rgbaToGrayscale(rgba)).toHaveLength(7)
  })
})

describe('rgbaToRgb', () => {
  it('drops the alpha channel', () => {
    const rgba = Uint8Array.of(10, 20, 30, 255, 40, 50, 60, 255)
    expect([...rgbaToRgb(rgba)]).toEqual([10, 20, 30, 40, 50, 60])
  })

  it('flattens transparency onto white', () => {
    const rgba = Uint8Array.of(0, 0, 0, 0)
    expect([...rgbaToRgb(rgba)]).toEqual([255, 255, 255])
  })
})
