import { describe, expect, it } from 'vitest'
import { coverCrop, fitScale } from '../src/lib/geometry'

describe('coverCrop', () => {
  it('crops the sides when the source is wider than the target', () => {
    // 4:3 photo into a 3:4 e-reader panel.
    const crop = coverCrop(4000, 3000, 1860, 2480)
    expect(crop.sh).toBe(3000)
    expect(crop.sw).toBeCloseTo(2250, 6)
    expect(crop.sx).toBeCloseTo(875, 6)
    expect(crop.sy).toBeCloseTo(0, 6)
  })

  it('crops top and bottom when the source is taller than the target', () => {
    // Portrait 1:2 photo into a square target.
    const crop = coverCrop(1000, 2000, 1000, 1000)
    expect(crop.sw).toBe(1000)
    expect(crop.sh).toBeCloseTo(1000, 6)
    expect(crop.sx).toBeCloseTo(0, 6)
    expect(crop.sy).toBeCloseTo(500, 6)
  })

  it('keeps the full image when the aspect ratio already matches', () => {
    const crop = coverCrop(1200, 1600, 1200, 1600)
    expect(crop).toEqual({ sx: 0, sy: 0, sw: 1200, sh: 1600 })
  })

  it('handles target ratios close to but not exactly the source ratio', () => {
    const crop = coverCrop(1080, 1440, 1072, 1448)
    expect(crop.sw).toBeLessThanOrEqual(1080.000001)
    expect(crop.sh).toBeLessThanOrEqual(1440.000001)
    expect(crop.sx).toBeGreaterThanOrEqual(0)
    expect(crop.sy).toBeGreaterThanOrEqual(0)
  })

  it('supports off-centre cropping', () => {
    const top = coverCrop(1000, 2000, 1000, 1000, 0.5, 0)
    const bottom = coverCrop(1000, 2000, 1000, 1000, 0.5, 1)
    expect(top.sy).toBeCloseTo(0, 6)
    expect(bottom.sy).toBeCloseTo(1000, 6)
  })

  it('reports the upscale factor for small sources', () => {
    const crop = coverCrop(500, 500, 1000, 1000)
    expect(crop).toEqual({ sx: 0, sy: 0, sw: 500, sh: 500 })
    expect(fitScale(crop, 1000)).toBe(2)
  })

  it('rejects invalid dimensions and centering', () => {
    expect(() => coverCrop(0, 100, 10, 10)).toThrow()
    expect(() => coverCrop(100, 100, 100, 100, 1.5, 0.5)).toThrow()
  })
})
