import { PrivacyBadge } from './PrivacyBadge'

export function SiteNav() {
  return (
    <header className="site-nav">
      <div className="wrap nav-inner">
        <a className="brand" href="#top" aria-label="kwallp home">
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
              opacity=".12"
            />
            <path
              d="M6 10.5h14M6 14h14"
              stroke="currentColor"
              strokeWidth="1.6"
              opacity=".55"
            />
            <circle cx="19" cy="21.2" r="1.1" fill="currentColor" />
          </svg>
          kwallp
        </a>

        <nav className="nav-links" aria-label="Primary">
          <a href="#how">How it works</a>
          <a href="#faq">FAQ</a>
        </nav>

        <div className="nav-privacy">
          <PrivacyBadge />
        </div>

        <a className="btn btn-ghost nav-cta" href="#tool">
          Convert photos
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M3 7h8M8 4l3 3-3 3"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
    </header>
  )
}
