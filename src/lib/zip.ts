import { toArrayBuffer } from './bytes'
import { crc32 } from './crc32'

export interface ZipEntry {
  /** Forward-slash relative path inside the archive. */
  path: string
  data: Uint8Array
  modified?: Date
}

const LOCAL_HEADER = 0x04034b50
const CENTRAL_HEADER = 0x02014b50
const END_OF_CENTRAL = 0x06054b50
const UTF8_FLAG = 0x0800
const VERSION = 20

function dosDateTime(date: Date): { time: number; date: number } {
  const year = Math.max(1980, date.getFullYear())
  const time =
    (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1)
  const day =
    ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  return { time, date: day }
}

/**
 * Store-only ZIP writer. PNG data is already deflated, so there is nothing to
 * gain from compressing it again — and this keeps the archive dependency-free.
 */
export function createZip(entries: readonly ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder()
  const prepared = entries.map((entry) => {
    const name = encoder.encode(entry.path)
    const { time, date } = dosDateTime(entry.modified ?? new Date())
    return {
      name,
      data: entry.data,
      crc: crc32(entry.data),
      time,
      date,
    }
  })

  let localSize = 0
  let centralSize = 0
  for (const entry of prepared) {
    localSize += 30 + entry.name.length + entry.data.length
    centralSize += 46 + entry.name.length
  }

  const out = new Uint8Array(localSize + centralSize + 22)
  const view = new DataView(out.buffer)
  const offsets: number[] = []
  let offset = 0

  for (const entry of prepared) {
    offsets.push(offset)
    view.setUint32(offset, LOCAL_HEADER, true)
    view.setUint16(offset + 4, VERSION, true)
    view.setUint16(offset + 6, UTF8_FLAG, true)
    view.setUint16(offset + 8, 0, true) // store
    view.setUint16(offset + 10, entry.time, true)
    view.setUint16(offset + 12, entry.date, true)
    view.setUint32(offset + 14, entry.crc, true)
    view.setUint32(offset + 18, entry.data.length, true)
    view.setUint32(offset + 22, entry.data.length, true)
    view.setUint16(offset + 26, entry.name.length, true)
    view.setUint16(offset + 28, 0, true) // extra length
    out.set(entry.name, offset + 30)
    out.set(entry.data, offset + 30 + entry.name.length)
    offset += 30 + entry.name.length + entry.data.length
  }

  const centralOffset = offset
  for (let i = 0; i < prepared.length; i++) {
    const entry = prepared[i]
    view.setUint32(offset, CENTRAL_HEADER, true)
    view.setUint16(offset + 4, 0x0314, true) // made by: unix, 2.0
    view.setUint16(offset + 6, VERSION, true)
    view.setUint16(offset + 8, UTF8_FLAG, true)
    view.setUint16(offset + 10, 0, true) // store
    view.setUint16(offset + 12, entry.time, true)
    view.setUint16(offset + 14, entry.date, true)
    view.setUint32(offset + 16, entry.crc, true)
    view.setUint32(offset + 20, entry.data.length, true)
    view.setUint32(offset + 24, entry.data.length, true)
    view.setUint16(offset + 28, entry.name.length, true)
    view.setUint16(offset + 30, 0, true) // extra
    view.setUint16(offset + 32, 0, true) // comment
    view.setUint16(offset + 34, 0, true) // disk
    view.setUint16(offset + 36, 0, true) // internal attrs
    view.setUint32(offset + 38, 0, true) // external attrs
    view.setUint32(offset + 42, offsets[i], true)
    out.set(entry.name, offset + 46)
    offset += 46 + entry.name.length
  }

  view.setUint32(offset, END_OF_CENTRAL, true)
  view.setUint16(offset + 4, 0, true)
  view.setUint16(offset + 6, 0, true)
  view.setUint16(offset + 8, prepared.length, true)
  view.setUint16(offset + 10, prepared.length, true)
  view.setUint32(offset + 12, offset - centralOffset, true)
  view.setUint32(offset + 16, centralOffset, true)
  view.setUint16(offset + 20, 0, true)

  return out
}

export function zipBlob(entries: readonly ZipEntry[]): Blob {
  return new Blob([toArrayBuffer(createZip(entries))], { type: 'application/zip' })
}
