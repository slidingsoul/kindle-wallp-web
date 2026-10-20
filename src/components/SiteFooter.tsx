import { MODELS } from '../lib/models'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="foot-inner">
        <div className="foot-brand">
          <a className="brand" href="#top">
            <svg viewBox="0 0 26 26" fill="none" aria-hidden="true">
              <rect
                x="3"
                y="2"
                width="20"
                height="22"
                rx="3.5"
                stroke="currentColor"
                strokeWidth="1.9"
              />
              <rect
                x="6"
                y="5.5"
                width="14"
                height="13"
                rx="1.6"
                fill="currentColor"
                opacity=".22"
              />
              <path
                d="M6 10.5h14M6 14h14"
                stroke="currentColor"
                strokeWidth="1.6"
                opacity=".7"
              />
              <circle cx="19" cy="21.2" r="1.1" fill="currentColor" />
            </svg>
            kwallp
          </a>
          <p>
            E-reader screensavers and wallpapers, resized entirely on your
            device. No backend, no uploads, no telemetry.
          </p>
        </div>

        <nav className="foot-col" aria-label="Quick links">
          <h4>Quick links</h4>
          <a href="#top">Home</a>
          <a href="#tool">Image resizer</a>
          <a href="#how">How it works</a>
          <a href="#faq">FAQ</a>
        </nav>

        <nav className="foot-col" aria-label="Legal">
          <h4>Legal</h4>
          <a href="#/privacy">Privacy Policy</a>
          <a href="#/terms">Terms of Service</a>
        </nav>
      </div>

      <div className="foot-bottom">
        <p>Copyright © 2026 · All rights reserved</p>
        <p className="foot-legal">
          <span>Your images never leave your browser.</span>
          <span>Free to use · no sign-up required.</span>
          <span>{MODELS.length} devices supported.</span>
        </p>
      </div>

      <p className="foot-fine">
        Production builds block all network connections with{' '}
        <code>connect-src &apos;none&apos;</code>. The single-file build works
        offline from <code>file://</code> · No analytics, fonts or third-party
        requests.
      </p>
    </footer>
  )
}
