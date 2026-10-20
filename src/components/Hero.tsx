import type { Model } from '../lib/models'
import { ForestScene } from './ForestScene'

interface HeroProps {
  model: Model
  deviceCount: number
}

const check = (
  <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <circle cx="9" cy="9" r="7.2" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M6 9.2l2 2 4-4.4"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
)

export function Hero({ model, deviceCount }: HeroProps) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <p className="kicker hero-badge">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <path
                d="M2.8 3.2A5 5 0 1 0 6.5 11.8 5 5 0 0 0 2.8 3.2Z"
                stroke="currentColor"
                strokeWidth="1.4"
                opacity=".6"
              />
              <circle cx="7.3" cy="5.6" r="2.6" fill="currentColor" opacity=".85" />
            </svg>
            Free · private · no sign-up
          </p>

          <h1 id="hero-title">
            Create perfect e&#8209;reader screensavers &amp; wallpapers
          </h1>

          <p className="lead">
            Resize and crop any photo to the exact screen of your Kindle, Kobo,
            Boox or reMarkable — in your browser. Nothing is uploaded, nothing
            gets stretched, and your images never leave your device.
          </p>

          <div className="hero-cta">
            <a className="btn btn-primary" href="#tool">
              Start resizing
            </a>
            <a className="btn btn-ghost" href="#how">
              See how it works
            </a>
          </div>

          <ul className="trust" aria-label="Highlights">
            <li>{check}Nothing is uploaded</li>
            <li>{check}Free, no watermark</li>
            <li>{check}{deviceCount} devices</li>
          </ul>
        </div>

        <div className="hero-visual">
          <figure
            className="reader"
            role="img"
            aria-label="E-reader displaying a pine-forest screensaver"
          >
            <div className="reader__screen">
              <ForestScene />
            </div>
            <span className="reader__dot" />
            <div className="reader-badge">
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M4 13V7l6-3.5L16 7v6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 10.5h6v5H7z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path d="M9 13h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <span>
                Perfect fit · {model.width} × {model.height} px
              </span>
            </div>
          </figure>
        </div>
      </div>
    </section>
  )
}
