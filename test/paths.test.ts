import { describe, expect, it } from 'vitest'
import {
  extensionOf,
  normalizePath,
  replaceExtension,
  stemOf,
  stripCommonRoot,
  uniquePath,
} from '../src/lib/paths'

describe('normalizePath', () => {
  it('converts backslashes and drops empty or traversing segments', () => {
    expect(normalizePath('Photos\\\\a\\\\..\\\\b\\\\photo.jpg')).toBe(
      'Photos/b/photo.jpg',
    )
    expect(normalizePath('/leading//double.png')).toBe('leading/double.png')
    expect(normalizePath('./x.png')).toBe('x.png')
  })
})

describe('extensionOf and stemOf', () => {
  it('handles dots in directories', () => {
    expect(extensionOf('a.b/photo.JPG')).toBe('.jpg')
    expect(stemOf('a.b/photo.JPG')).toBe('photo')
    expect(extensionOf('noextension')).toBe('')
    expect(stemOf('.hidden')).toBe('.hidden')
  })
})

describe('replaceExtension', () => {
  it('keeps the directory and swaps the suffix', () => {
    expect(replaceExtension('a/b/photo.jpeg', '.png')).toBe('a/b/photo.png')
    expect(replaceExtension('photo', '.png')).toBe('photo.png')
  })
})

describe('stripCommonRoot', () => {
  it('removes the top folder when every path shares it', () => {
    expect(stripCommonRoot(['Photos/a.jpg', 'Photos/sub/b.jpg'])).toEqual([
      'a.jpg',
      'sub/b.jpg',
    ])
  })

  it('leaves files selected individually alone', () => {
    expect(stripCommonRoot(['a.jpg', 'b.jpg'])).toEqual(['a.jpg', 'b.jpg'])
  })

  it('leaves unrelated roots alone', () => {
    expect(stripCommonRoot(['one/a.jpg', 'two/b.jpg'])).toEqual([
      'one/a.jpg',
      'two/b.jpg',
    ])
  })
})

describe('uniquePath', () => {
  it('de-duplicates names without overwriting', () => {
    const taken = new Set<string>()
    expect(uniquePath('a/photo.png', taken)).toBe('a/photo.png')
    expect(uniquePath('a/photo.png', taken)).toBe('a/photo (2).png')
    expect(uniquePath('a/photo.png', taken)).toBe('a/photo (3).png')
    expect(taken.size).toBe(3)
  })
})
