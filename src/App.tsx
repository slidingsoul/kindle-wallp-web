import { useCallback, useState } from 'react'
import { BatchList } from './components/BatchList'
import { DevicePicker } from './components/DevicePicker'
import { DropZone } from './components/DropZone'
import { PrivacyBadge } from './components/PrivacyBadge'
import { Toolbar } from './components/Toolbar'
import { useBatch } from './hooks/useBatch'
import type { IntakeResult } from './lib/intake'
import { getModel } from './lib/models'

export default function App() {
  const batch = useBatch()
  const model = getModel(batch.modelSlug)
  const [notice, setNotice] = useState<string | null>(null)

  const handleIntake = useCallback(
    (result: IntakeResult) => {
      const messages: string[] = []

      if (result.files.length > 0) batch.addFiles(result.files)

      if (result.unsupported.length > 0) {
        const preview = result.unsupported.slice(0, 3).join(', ')
        const extra =
          result.unsupported.length > 3
            ? ` and ${result.unsupported.length - 3} more`
            : ''
        messages.push(
          `${result.unsupported.length} file(s) skipped (${preview}${extra}) — browsers cannot decode TIFF or HEIC.`,
        )
      }

      if (result.ignored > 0) {
        messages.push(`${result.ignored} non-image file(s) ignored.`)
      }

      if (result.files.length === 0 && messages.length === 0) {
        messages.push('No supported images found in that selection.')
      }

      setNotice(messages.length > 0 ? messages.join(' ') : null)
    },
    [batch.addFiles],
  )

  return (
    <div className="app">
      <header className="masthead">
        <div className="masthead__brand">
          <span className="logo" aria-hidden="true">
            K
          </span>
          <div>
            <h1>kwallp</h1>
            <p className="masthead__tagline">
              E-reader screensavers and wallpapers, resized on your device.
            </p>
          </div>
        </div>
        <PrivacyBadge />
      </header>

      <main className="layout">
        <aside className="sidebar">
          <DropZone onFiles={handleIntake} />

          <section className="card">
            <DevicePicker value={batch.modelSlug} onChange={batch.chooseModel} />

            <label className="switch">
              <span className="switch__text">
                <span className="switch__label">Grayscale</span>
                <span className="switch__hint">
                  Matches the CLI&apos;s convert(&quot;L&quot;) for e-ink panels.
                </span>
              </span>
              <input
                type="checkbox"
                checked={batch.grayscale}
                onChange={(event) => batch.chooseGrayscale(event.target.checked)}
              />
            </label>
          </section>

          <section className="card summary">
            <h2>Output</h2>
            <dl>
              <div>
                <dt>Size</dt>
                <dd>
                  {model.width} × {model.height}
                </dd>
              </div>
              <div>
                <dt>Format</dt>
                <dd>
                  PNG · {batch.grayscale ? '8-bit grayscale' : '24-bit RGB'}
                </dd>
              </div>
              <div>
                <dt>Fit</dt>
                <dd>Cover, centred crop</dd>
              </div>
            </dl>
          </section>
        </aside>

        <section className="results" aria-label="Batch">
          <Toolbar
            stats={batch.stats}
            saveState={batch.saveState}
            canSaveToFolder={batch.canSaveToFolder}
            onDownloadAll={() => void batch.downloadAll()}
            onSaveAll={() => void batch.saveAll()}
            onReprocess={batch.reprocess}
            onClear={batch.clearAll}
          />

          {notice && (
            <p className="notice" role="status">
              <span>{notice}</span>
              <button
                type="button"
                className="notice__dismiss"
                onClick={() => setNotice(null)}
                aria-label="Dismiss message"
              >
                ×
              </button>
            </p>
          )}

          {batch.actionError && (
            <p className="notice notice--error" role="alert">
              <span>{batch.actionError}</span>
              <button
                type="button"
                className="notice__dismiss"
                onClick={batch.dismissError}
                aria-label="Dismiss error"
              >
                ×
              </button>
            </p>
          )}

          <BatchList
            jobs={batch.jobs}
            model={model}
            onDownload={batch.downloadOne}
            onRemove={batch.removeJob}
          />
        </section>
      </main>

      <footer className="footer">
        <p>
          <strong>No uploads, ever.</strong> Images are decoded and resized by this
          tab. The production build ships with a Content-Security-Policy that blocks
          all network connections (<code>connect-src &apos;none&apos;</code>), so
          there is nowhere for a file to go.
        </p>

        <details>
          <summary>How this compares to the command line</summary>
          <ul>
            <li>
              Same cover-crop geometry and the same Rec.601 grayscale coefficients
              as Pillow&apos;s <code>ImageOps.fit</code> + <code>convert(&quot;L&quot;)</code>.
            </li>
            <li>
              Resampling is the browser&apos;s high-quality filter with extra
              downscale passes, not LANCZOS — close, but not pixel-identical.
            </li>
            <li>
              EXIF orientation is respected here; Pillow ignores it unless told
              otherwise. Transparency is flattened onto white.
            </li>
            <li>TIFF input needs a decoder browsers do not ship.</li>
          </ul>
        </details>

        <p className="footer__fine">
          Single-file build works offline from <code>file://</code> · No analytics,
          fonts or third-party requests · 25 devices from Kobo Nia to Kindle Scribe
        </p>
      </footer>
    </div>
  )
}
