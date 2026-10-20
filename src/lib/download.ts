export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  // Give the browser time to start the download before dropping the URL.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export interface WritableLike {
  write(data: Blob): Promise<void>
  close(): Promise<void>
}

export interface DirectoryHandleLike {
  name: string
  getDirectoryHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<DirectoryHandleLike>
  getFileHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<{ createWritable(): Promise<WritableLike> }>
}

export function supportsDirectoryPicker(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as { showDirectoryPicker?: unknown }).showDirectoryPicker ===
      'function'
  )
}

export async function pickDirectory(): Promise<DirectoryHandleLike | null> {
  const picker = (
    window as unknown as {
      showDirectoryPicker: (options?: {
        mode?: 'read' | 'readwrite'
      }) => Promise<DirectoryHandleLike>
    }
  ).showDirectoryPicker

  if (!picker) return null

  try {
    return await picker.call(window, { mode: 'readwrite' })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return null
    throw error
  }
}

export interface OutputFile {
  path: string
  blob: Blob
}

export interface SaveProgress {
  (done: number, total: number, current: string): void
}

/**
 * Write outputs directly into a user-chosen folder, preserving the relative
 * directory structure. This keeps large batches out of memory.
 */
export async function writeToDirectory(
  root: DirectoryHandleLike,
  files: readonly OutputFile[],
  onProgress?: SaveProgress,
): Promise<void> {
  let done = 0

  for (const file of files) {
    const parts = file.path.split('/')
    const filename = parts.pop()
    if (!filename) continue

    let directory = root
    for (const part of parts) {
      directory = await directory.getDirectoryHandle(part, { create: true })
    }

    const handle = await directory.getFileHandle(filename, { create: true })
    const writable = await handle.createWritable()
    await writable.write(file.blob)
    await writable.close()

    done += 1
    onProgress?.(done, files.length, file.path)
  }
}
