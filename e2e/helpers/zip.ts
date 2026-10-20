export interface ParsedZipEntry {
  name: string
  data: Uint8Array
}

/** Store-only ZIP reader for assertions on downloaded archives. */
export function parseZip(bytes: Uint8Array): ParsedZipEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const decoder = new TextDecoder()
  const eocd = bytes.length - 22

  if (view.getUint32(eocd, true) !== 0x06054b50) {
    throw new Error('Missing end-of-central-directory record')
  }

  const count = view.getUint16(eocd + 10, true)
  let offset = view.getUint32(eocd + 16, true)
  const entries: ParsedZipEntry[] = []

  for (let i = 0; i < count; i++) {
    if (view.getUint32(offset, true) !== 0x02014b50) {
      throw new Error('Bad central directory header')
    }
    const size = view.getUint32(offset + 24, true)
    const nameLength = view.getUint16(offset + 28, true)
    const extraLength = view.getUint16(offset + 30, true)
    const commentLength = view.getUint16(offset + 32, true)
    const localOffset = view.getUint32(offset + 42, true)
    const name = decoder.decode(
      bytes.subarray(offset + 46, offset + 46 + nameLength),
    )

    const localNameLength = view.getUint16(localOffset + 26, true)
    const localExtraLength = view.getUint16(localOffset + 28, true)
    const dataStart = localOffset + 30 + localNameLength + localExtraLength

    entries.push({ name, data: bytes.slice(dataStart, dataStart + size) })
    offset += 46 + nameLength + extraLength + commentLength
  }

  return entries
}
