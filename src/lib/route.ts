export type Route = 'home' | 'privacy' | 'terms'

export interface AppLocation {
  route: Route
  /** In-page anchor, e.g. `tool` or `rights`, or null. */
  section: string | null
}

const ROUTE_PATHS: Record<string, Route> = {
  '/privacy': 'privacy',
  '/terms': 'terms',
}

/**
 * Hash routing keeps deep links working from `file://`, which the single-file
 * build relies on. Section anchors are encoded after a second `#`, e.g.
 * `#/privacy#rights`, so the table of contents can live in the same hash.
 */
export function parseLocation(hash: string): AppLocation {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash

  // Plain anchors (`#tool`, `#faq`) belong to the home page.
  if (!raw.startsWith('/')) {
    return { route: 'home', section: raw || null }
  }

  const [path, section] = raw.split('#')
  const route = ROUTE_PATHS[path.replace(/\/+$/, '')] ?? 'home'
  return { route, section: section || null }
}
