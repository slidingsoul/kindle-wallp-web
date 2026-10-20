import { BRANDS, MODELS } from '../lib/models'

const steps = [
  {
    title: 'Pick your e-reader',
    body: 'Choose your model from the list. The crop frame snaps to that screen’s exact aspect ratio, so nothing gets stretched or squeezed.',
    icon: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="3" stroke="currentColor" strokeWidth="1.7" />
        <rect x="7.5" y="7" width="9" height="9" rx="1.4" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="17.2" cy="18.2" r="0.9" fill="currentColor" />
      </>
    ),
  },
  {
    title: 'Add photos or a folder',
    body: 'Drag in JPG, PNG, WebP or BMP files — or a whole folder. Images are read straight into the browser, and nested folders keep their structure.',
    icon: (
      <>
        <path
          d="M12 16V5M8.5 8.5 12 5l3.5 3.5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 14v5a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </>
    ),
  },
  {
    title: 'Crop and position',
    body: 'Click any photo to frame it. Drag to reposition and zoom in until it sits how you want — or leave the centred cover crop and move on.',
    icon: (
      <>
        <path
          d="M7 5V3.5A1.5 1.5 0 0 1 8.5 2H20v11.5A1.5 1.5 0 0 1 18.5 15H17"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 11H3V3.5A1.5 1.5 0 0 1 4.5 2H9"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15 13h6v7.5a1.5 1.5 0 0 1-1.5 1.5H9v-7"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 21.5v-6H9"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  {
    title: 'Download and transfer',
    body: 'Get every image at the exact pixel resolution — one at a time, as a ZIP, or written straight into a folder. Then copy it to your e-reader.',
    icon: (
      <>
        <path
          d="M12 4v11M8.5 11.5 12 15l3.5-3.5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 16v3.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V16"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </>
    ),
  },
]

export function HowItWorks() {
  return (
    <section className="how" id="how" aria-labelledby="how-title">
      <div className="wrap">
        <div className="section-head">
          <p className="kicker">How it works</p>
          <h2 id="how-title">Four steps, about two minutes, no account</h2>
          <p className="lead">
            The whole pipeline stays on your computer — from the moment the
            image is picked until you save the finished files.
          </p>
        </div>

        <div className="steps">
          {steps.map((step, index) => (
            <article className="step-card" key={step.title} data-step={index + 1}>
              <div className="ico">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  {step.icon}
                </svg>
              </div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>

        <div className="device-strip">
          <div>
            <h3>{MODELS.length} devices, perfectly matched</h3>
            <p>
              Every screen ratio is built in, from the 6-inch Kobo Nia to the
              10-inch Kindle Scribe — with grayscale output for e-ink panels.
            </p>
          </div>
          <div className="device-chips">
            {BRANDS.map((brand) => (
              <span className="dchip" key={brand}>
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
