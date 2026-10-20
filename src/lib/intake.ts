import { extensionOf, normalizePath, stripCommonRoot } from './paths'

export interface IntakeFile {
  file: File
  /** Path relative to the selection root. */
  path: string
}

export interface IntakeResult {
  files: IntakeFile[]
  /** Paths that were recognised but cannot be decoded by a browser. */
  unsupported: string[]
  /** Paths skipped because they are not images at all. */
  ignored: number
}

export const ACCEPTED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.bmp',
])

/** Pillow can read these; browsers cannot (without a WASM decoder). */
export const UNSUPPORTED_EXTENSIONS = new Set(['.tif', '.tiff', '.heic', '.heif'])

export function isAcceptedPath(path: string): boolean {
  return ACCEPTED_EXTENSIONS.has(extensionOf(path))
}

export const ACCEPT_ATTRIBUTE = [...ACCEPTED_EXTENSIONS].join(',')

function relativePathOf(file: File): string {
  const withRelative = file as File & { webkitRelativePath?: string }
  return withRelative.webkitRelativePath || file.name
}

export function filesFromFileList(list: FileList | readonly File[]): IntakeResult {
  const files = Array.from(list)
  const stripped = stripCommonRoot(files.map(relativePathOf))

  const result: IntakeResult = { files: [], unsupported: [], ignored: 0 }
  files.forEach((file, index) => {
    const path = normalizePath(stripped[index])
    if (isAcceptedPath(path)) {
      result.files.push({ file, path })
    } else if (UNSUPPORTED_EXTENSIONS.has(extensionOf(path))) {
      result.unsupported.push(path)
    } else {
      result.ignored += 1
    }
  })

  return result
}

function fileFromEntry(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => entry.file(resolve, reject))
}

function readAllEntries(
  directory: FileSystemDirectoryEntry,
): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const reader = directory.createReader()
    const collected: FileSystemEntry[] = []

    const readBatch = () => {
      reader.readEntries((batch) => {
        if (batch.length === 0) {
          resolve(collected)
          return
        }
        collected.push(...batch)
        readBatch()
      }, reject)
    }

    readBatch()
  })
}

async function walkDirectory(
  directory: FileSystemDirectoryEntry,
  prefix: string,
  result: IntakeResult,
): Promise<void> {
  const entries = await readAllEntries(directory)
  entries.sort((a, b) => a.name.localeCompare(b.name))

  for (const entry of entries) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name

    if (entry.isDirectory) {
      await walkDirectory(entry as FileSystemDirectoryEntry, path, result)
      continue
    }
    if (!entry.isFile) continue

    if (isAcceptedPath(path)) {
      const file = await fileFromEntry(entry as FileSystemFileEntry)
      result.files.push({ file, path: normalizePath(path) })
    } else if (UNSUPPORTED_EXTENSIONS.has(extensionOf(path))) {
      result.unsupported.push(path)
    } else {
      result.ignored += 1
    }
  }
}

/**
 * Read a drop event. `webkitGetAsEntry` must be called synchronously before
 * the first `await`, which is why the entries are captured up front.
 */
export async function filesFromDataTransfer(
  transfer: DataTransfer,
): Promise<IntakeResult> {
  const entries = Array.from(transfer.items)
    .map((item) => item.webkitGetAsEntry?.() ?? null)
    .filter((entry): entry is FileSystemEntry => entry !== null)

  if (entries.length === 0) {
    return filesFromFileList(transfer.files)
  }

  const result: IntakeResult = { files: [], unsupported: [], ignored: 0 }
  for (const entry of entries) {
    if (entry.isDirectory) {
      // The dropped folder is the root, so its name is not part of the path.
      await walkDirectory(entry as FileSystemDirectoryEntry, '', result)
    } else if (entry.isFile) {
      if (isAcceptedPath(entry.name)) {
        const file = await fileFromEntry(entry as FileSystemFileEntry)
        result.files.push({ file, path: normalizePath(entry.name) })
      } else if (UNSUPPORTED_EXTENSIONS.has(extensionOf(entry.name))) {
        result.unsupported.push(entry.name)
      } else {
        result.ignored += 1
      }
    }
  }

  return result
}
