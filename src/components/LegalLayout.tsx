import type { ReactNode } from 'react'

export interface LegalSectionLink {
  id: string
  title: string
}

interface LegalLayoutProps {
  base: 'privacy' | 'terms'
  eyebrow: string
  title: string
  updated: string
  summary: string
  sections: LegalSectionLink[]
  otherPolicy: { href: string; label: string }
  children: ReactNode
}

export function LegalLayout({
  base,
  eyebrow,
  title,
  updated,
  summary,
  sections,
  otherPolicy,
  children,
}: LegalLayoutProps) {
  return (
    <main className="legal">
      <div className="wrap legal__layout">
        <header className="legal__head">
          <p className="kicker">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="legal__meta">Last updated {updated}</p>
          <p className="legal__summary">{summary}</p>
        </header>

        <nav className="legal__toc" aria-label="On this page">
          <p className="legal__toc-title">On this page</p>
          <ol>
            {sections.map((section) => (
              <li key={section.id}>
                <a href={`#/${base}#${section.id}`}>{section.title}</a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="legal__doc">
          {children}

          <footer className="legal__foot">
            <a className="btn btn--ghost" href="#tool">
              Back to the converter
            </a>
            <a href={otherPolicy.href}>{otherPolicy.label}</a>
          </footer>
        </article>
      </div>
    </main>
  )
}
