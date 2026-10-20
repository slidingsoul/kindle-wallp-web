import { useEffect, useRef, useState } from 'react'

/**
 * Counts network requests made *after* the app mounted. The app itself loads
 * assets (and dev HMR), so the baseline is taken at effect time; anything new
 * is flagged, which makes an accidental upload visible immediately.
 */
export function PrivacyBadge() {
  const [external, setExternal] = useState<string[]>([])
  const mountedAt = useRef(0)

  useEffect(() => {
    if (typeof PerformanceObserver === 'undefined') return

    const flagged: string[] = []
    let observer: PerformanceObserver | null = null
    let cancelled = false

    const start = () => {
      if (cancelled) return
      mountedAt.current = performance.now()

      observer = new PerformanceObserver((list) => {
        let changed = false

        for (const entry of list.getEntries()) {
          if (entry.startTime < mountedAt.current) continue
          if (/^(blob:|data:|about:)/.test(entry.name)) continue
          if (entry.name === location.href) continue
          if (flagged.includes(entry.name)) continue
          flagged.push(entry.name)
          changed = true
        }

        if (changed) setExternal([...flagged])
      })

      try {
        observer.observe({ type: 'resource' })
      } catch {
        // Older browsers may not support resource observation.
      }
    }

    // Self-hosted fonts (and the initial page load) are part of the app, not
    // an upload. Baseline only once they have finished.
    const fontsReady =
      typeof document !== 'undefined' && document.fonts
        ? document.fonts.ready
        : Promise.resolve()
    const pageReady =
      document.readyState === 'complete'
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            window.addEventListener('load', () => resolve(), { once: true })
          })

    void Promise.all([fontsReady, pageReady]).then(() => {
      requestAnimationFrame(start)
    })

    return () => {
      cancelled = true
      observer?.disconnect()
    }
  }, [])

  const ok = external.length === 0

  return (
    <div
      className={`privacy ${ok ? 'privacy--ok' : 'privacy--bad'}`}
      title={
        ok
          ? 'Images are decoded and resized in this tab. Nothing is uploaded.'
          : `Unexpected requests: ${external.join(', ')}`
      }
    >
      <span className="privacy__dot" aria-hidden="true" />
      <span className="privacy__label">On-device only</span>
      <span className="privacy__count" aria-live="polite">
        {ok ? '0 network requests' : `${external.length} request(s)`}
      </span>
    </div>
  )
}
