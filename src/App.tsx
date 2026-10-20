import { useCallback, useEffect, useState } from 'react'
import { BatchList } from './components/BatchList'
import { CropEditor } from './components/CropEditor'
import { DeviceChips } from './components/DeviceChips'
import { DropZone } from './components/DropZone'
import { Faq } from './components/Faq'
import { Hero } from './components/Hero'
import { HowItWorks } from './components/HowItWorks'
import { SiteFooter } from './components/SiteFooter'
import { SiteNav } from './components/SiteNav'
import { Toolbar } from './components/Toolbar'
import { useBatch } from './hooks/useBatch'
import { useRoute } from './hooks/useRoute'
import type { IntakeResult } from './lib/intake'
import { getModel, MODELS } from './lib/models'
import type { Route } from './lib/route'
import { PrivacyPolicy } from './pages/PrivacyPolicy'
import { TermsOfService } from './pages/TermsOfService'

const PAGE_META: Record<Route, { title: string; description: string }> = {
  home: {
    title: 'kwallp — Create perfect e-reader screensavers & wallpapers',
    description:
      'Resize and crop photos to the exact screen of 25 Kindle, Kobo, Boox, reMarkable, Nook and PocketBook models. Framing, grayscale and ZIP export run entirely in your browser — nothing is uploaded.',
  },
  privacy: {
    title: 'Privacy Policy — kwallp',
    description:
      'What kwallp collects (nothing), how your images stay on your device, and the privacy rights you can exercise.',
  },
  terms: {
    title: 'Terms of Service — kwallp',
    description:
      'The terms that apply when you use kwallp, the free in-browser e-reader wallpaper resizer.',
  },
}

export default function App() {
  const batch = useBatch()
  const { route, section } = useRoute()
  const model = getModel(batch.modelSlug)
  const [notice, setNotice] = useState<string | null>(null)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

  const handleIntake = useCallback(
    (result: IntakeResult) => {
      const messages: string[] = []
      let added: string[] = []

      if (result.files.length > 0) added = batch.addFiles(result.files)

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

      if (added.length > 0) {
        setActiveJobId((current) => current ?? added[0])
      }

      setNotice(messages.length > 0 ? messages.join(' ') : null)
    },
    [batch.addFiles],
  )

  useEffect(() => {
    if (batch.jobs.length === 0) {
      if (activeJobId !== null) setActiveJobId(null)
      return
    }
    if (!batch.jobs.some((job) => job.id === activeJobId)) {
      setActiveJobId(batch.jobs[batch.jobs.length - 1].id)
    }
  }, [batch.jobs, activeJobId])

  useEffect(() => {
    const meta = PAGE_META[route]
    document.title = meta.title
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', meta.description)
  }, [route])

  useEffect(() => {
    if (section) {
      const target = document.getElementById(section)
      if (target) {
        target.scrollIntoView()
        return
      }
    }

    if (
      route !== 'home' ||
      window.location.hash === '#/' ||
      window.location.hash === '#'
    ) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }, [route, section])

  const activeJob =
    batch.jobs.find((job) => job.id === activeJobId) ?? batch.jobs[0]
  const busy = batch.stats.processing || batch.stats.pending > 0
  const canExport =
    batch.stats.done > 0 && !busy && !batch.saveState.running

  return (
    <div className="app" id="top">
      <SiteNav />

      {route === 'home' && (
        <main>
          <Hero model={model} deviceCount={MODELS.length} />

          <section className="resizer" id="tool" aria-labelledby="tool-title">
            <div className="wrap">
              <div className="section-head">
                <p className="kicker">Resize your images</p>
                <h2 id="tool-title">Fit any photo to any e-reader</h2>
                <p className="lead">
                  Pick your device, add photos or a whole folder, and every crop
                  frame snaps to the exact screen ratio. No uploading, no account,
                  no waiting.
                </p>
              </div>

              <div className="tool">
                <div className="tool-top">
                  <p className="caps">Free converter · works 100% in your browser</p>
                  <span className="tool-status">
                    <span className="pulse" aria-hidden="true" />
                    <span>
                      {model.name} · {model.width} × {model.height} px
                    </span>
                  </span>
                </div>

                <div className="tool-col">
                  <div className="step-pane">
                    <div className="step-label">
                      <span className="num">1</span>
                      <h3>Select your device</h3>
                    </div>
                    <p className="step-desc">
                      Filter by brand or browse every model we support.
                    </p>

                    <DeviceChips
                      value={batch.modelSlug}
                      onChange={batch.chooseModel}
                    />

                    <label className="switch">
                      <span className="switch__text">
                        <span className="switch__label">Grayscale</span>
                        <span className="switch__hint">
                          Matches e-ink panels and the CLI&apos;s convert(&quot;L&quot;).
                        </span>
                      </span>
                      <input
                        type="checkbox"
                        checked={batch.grayscale}
                        onChange={(event) =>
                          batch.chooseGrayscale(event.target.checked)
                        }
                      />
                    </label>
                  </div>

                  <div className="step-pane">
                    <div className="step-label">
                      <span className="num">2</span>
                      <h3>Add your photos</h3>
                    </div>
                    <p className="step-desc">
                      Drop files or a folder — they never leave this tab.
                    </p>

                    <DropZone
                      onFiles={handleIntake}
                      compact={batch.jobs.length > 0}
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

                    {activeJob && (
                      <>
                        <div className="step-label step-label--spaced">
                          <span className="num">3</span>
                          <h3>Frame and download</h3>
                        </div>
                        <p className="step-desc">
                          Select a photo below to adjust its framing.
                        </p>

                        <CropEditor
                          key={activeJob.id}
                          job={activeJob}
                          model={model}
                          jobCount={batch.jobs.length}
                          onChange={batch.setCrop}
                          onApplyToAll={batch.applyCropToAll}
                        />
                      </>
                    )}

                    <Toolbar
                      stats={batch.stats}
                      saveState={batch.saveState}
                      onReprocess={batch.reprocess}
                      onClear={batch.clearAll}
                    />

                    <div className="jobs-region" aria-label="Batch">
                      <BatchList
                        jobs={batch.jobs}
                        model={model}
                        activeId={activeJob?.id ?? null}
                        onSelect={setActiveJobId}
                        onDownload={batch.downloadOne}
                        onRemove={batch.removeJob}
                      />
                    </div>

                    <div className="dl-bar">
                      <div className="dims">
                        Screensaver PNG ·{' '}
                        <span>
                          {model.width} × {model.height} px
                        </span>
                        <small>
                          Aspect ratio 1 : {(model.height / model.width).toFixed(2)}{' '}
                          · {batch.grayscale ? '8-bit grayscale' : '24-bit color'}
                        </small>
                      </div>
                      <div className="dl-actions">
                        {batch.canSaveToFolder && (
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => void batch.saveAll()}
                            disabled={!canExport}
                          >
                            {batch.saveState.running
                              ? `Saving ${batch.saveState.done}/${batch.saveState.total}…`
                              : 'Save to folder…'}
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => void batch.downloadAll()}
                          disabled={!canExport}
                        >
                          Download ZIP
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <HowItWorks />
          <Faq />
        </main>
      )}

      {route === 'privacy' && <PrivacyPolicy />}
      {route === 'terms' && <TermsOfService />}

      <SiteFooter />
    </div>
  )
}
