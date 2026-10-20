import { describe, expect, it } from 'vitest'
import { createZip, type ZipEntry } from '../src/lib/zip'
import { crc32 } from '../src/lib/crc32'

interface ParsedEntry {
  name: string
  data: Uint8Array
  crc: number
}

function parseZip(bytes: Uint8Array): ParsedEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const decoder = new TextDecoder()

  const eocd = bytes.length - 22
  if (view.getUint32(eocd, true) !== 0x06054b50) {
    throw new Error('Missing end-of-central-directory record')
  }

  const count = view.getUint16(eocd + 10, true)
  let offset = view.getUint32(eocd + 16, true)
  const entries: ParsedEntry[] = []

  for (let i = 0; i < count; i++) {
    if (view.getUint32(offset, true) !== 0x02014b50) {
      throw new Error('Bad central directory header')
    }
    const crc = view.getUint32(offset + 16, true)
    const size = view.getUint32(offset + 24, true)
    const nameLength = view.getUint16(offset + 28, true)
    const extraLength = view.getUint16(offset + 30, true)
    const commentLength = view.getUint16(offset + 32, true)
    const localOffset = view.getUint32(offset + 42, true)
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength))

    if (view.getUint32(localOffset, true) !== 0x04034b50) {
      throw new Error('Bad local file header')
    }
    const localNameLength = view.getUint16(localOffset + 26, true)
    const localExtraLength = view.getUint16(localOffset + 28, true)
    const dataStart = localOffset + 30 + localNameLength + localExtraLength
    const data = bytes.slice(dataStart, dataStart + size)

    entries.push({ name, data, crc })
    offset += 46 + nameLength + extraLength + commentLength
  }

  return entries
}

describe('createZip', () => {
  it('stores entries with valid CRCs', () => {
    const files: ZipEntry[] = [
      { path: 'photo.png', data: Uint8Array.of(1, 2, 3, 4) },
      { path: 'nested/deep/second.png', data: Uint8Array.of(9, 8, 7) },
    ]

    const entries = parseZip(createZip(files))

    expect(entries.map((entry) => entry.name)).toEqual([
      'photo.png',
      'nested/deep/second.png',
    ])
    expect([...entries[0].data]).toEqual([1, 2, 3, 4])
    expect([...entries[1].data]).toEqual([9, 8, 7])
    expect(entries[0].crc).toBe(crc32(files[0].data))
  })

  it('handles UTF-8 filenames', () => {
    const entries = parseZip(
      createZip([{ path: 'café/日本語.png', data: Uint8Array.of(42) }]),
    )
    expect(entries[0].name).toBe('café/日本語.png')
  })

  it('writes an empty archive', () => {
    expect(parseZip(createZip([]))).toEqual([])
  })

  it('produces the documented signatures', () => {
    const bytes = createZip([{ path: 'a.png', data: Uint8Array.of(1) }])
    const view = new DataView(bytes.buffer)
    expect(view.getUint32(0, true)).toBe(0x04034b50)
  })
})
