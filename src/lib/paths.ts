/** Normalise a relative path: forward slashes, no `.`/`..`/empty segments. */
export function normalizePath(input: string): string {
  const segments: string[] = []

  for (const segment of input.replace(/\\/g, '/').split('/')) {
    if (!segment || segment === '.') continue
    if (segment === '..') {
      segments.pop()
      continue
    }
    segments.push(segment)
  }

  return segments.join('/')
}

export function extensionOf(path: string): string {
  const base = path.slice(path.lastIndexOf('/') + 1)
  const dot = base.lastIndexOf('.')
  return dot > 0 ? base.slice(dot).toLowerCase() : ''
}

export function stemOf(path: string): string {
  const base = path.slice(path.lastIndexOf('/') + 1)
  const dot = base.lastIndexOf('.')
  return dot > 0 ? base.slice(0, dot) : base
}

export function replaceExtension(path: string, extension: string): string {
  const dir = path.includes('/') ? path.slice(0, path.lastIndexOf('/') + 1) : ''
  return `${dir}${stemOf(path)}${extension}`
}

/**
 * When a whole directory is chosen or dropped, every path shares its top
 * folder (`Photos/a/b.jpg`). Strip it so output mirrors the CLI, which treats
 * the given folder as the root.
 */
export function stripCommonRoot(paths: readonly string[]): string[] {
  if (paths.length === 0) return []
  const segments = paths.map((path) => path.split('/'))
  const root = segments[0][0]
  if (!root || segments[0].length < 2) return [...paths]
  if (!segments.every((parts) => parts.length >= 2 && parts[0] === root)) {
    return [...paths]
  }
  return segments.map((parts) => parts.slice(1).join('/'))
}

/**
 * Never overwrite: `photo.png`, then `photo (2).png`, `photo (3).png`…
 * Mutates `taken` with the returned path.
 */
export function uniquePath(path: string, taken: Set<string>): string {
  if (!taken.has(path)) {
    taken.add(path)
    return path
  }

  const dir = path.includes('/') ? path.slice(0, path.lastIndexOf('/') + 1) : ''
  const file = path.slice(dir.length)
  const extension = extensionOf(file)
  const stem = extension ? file.slice(0, -extension.length) : file

  let counter = 2
  let candidate: string
  do {
    candidate = `${dir}${stem} (${counter})${extension}`
    counter++
  } while (taken.has(candidate))

  taken.add(candidate)
  return candidate
}
