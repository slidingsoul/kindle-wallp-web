import type { ReactNode } from 'react'
import { MODELS } from '../lib/models'

interface Entry {
  question: string
  answer: ReactNode
  open?: boolean
}

const plus = (
  <span className="plus" aria-hidden="true">
    <svg viewBox="0 0 12 12" fill="none">
      <path
        d="M6 1v10M1 6h10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  </span>
)

const entries: Entry[] = [
  {
    question: 'Are my images uploaded to a server?',
    open: true,
    answer: (
      <p>
        <b>No.</b> Cropping, resizing and PNG encoding all happen in this tab,
        inside a Web Worker. Production builds ship a Content-Security-Policy
        with <code>connect-src &apos;none&apos;</code>, so the page cannot open
        a connection even if it tried. Images are never transmitted, stored or
        logged, and nothing is retained after you close the tab. Once loaded,
        the app keeps working offline.
      </p>
    ),
  },
  {
    question: 'Can I frame each photo differently?',
    answer: (
      <p>
        Yes. Select any image in the batch to open its framing preview, then
        drag to reposition and use the zoom slider. The crop stays locked to
        your device&apos;s ratio. &ldquo;Use this framing for all&rdquo; copies
        the current framing to every queued photo; otherwise each image keeps
        its own — with a centred cover crop as the default.
      </p>
    ),
  },
  {
    question: 'How do I set up custom screensavers on Kindle?',
    answer: (
      <>
        <p>
          Kindle doesn&apos;t officially support custom screensavers, but a
          common workaround uses a book cover that is actually your image:
        </p>
        <ol>
          <li>Resize your image here so it matches your Kindle model&apos;s dimensions.</li>
          <li>
            Convert the PNG into an <b>EPUB file</b> with the image embedded as
            its cover (Calibre or an online converter works).
          </li>
          <li>
            Send the EPUB to your Kindle via <b>Send to Kindle</b>.
          </li>
          <li>
            On the device, enable <b>Settings → Device Options → Display Cover</b>.
          </li>
          <li>
            Sync, open the &ldquo;book&rdquo;, and put your Kindle to sleep —
            your image appears on the lockscreen.
          </li>
        </ol>
        <p>
          This is a community workaround, and its effectiveness may vary by
          model and firmware.
        </p>
      </>
    ),
  },
  {
    question: 'How do I set up custom screensavers on Kobo?',
    answer: (
      <ol>
        <li>
          Connect your Kobo to a computer via USB and tap <b>Connect</b> on the
          device.
        </li>
        <li>
          Open the Kobo drive and go into the <b>.kobo</b> folder.
        </li>
        <li>
          Create a new folder named exactly <b>screensaver</b>, and copy your
          downloaded images into it.
        </li>
        <li>
          Safely eject, then open <b>Settings → Energy saving and privacy</b>.
        </li>
        <li>
          Make sure <b>Show current read</b> and{' '}
          <b>Show book covers full screen</b> are both on, then put your Kobo to
          sleep.
        </li>
      </ol>
    ),
  },
  {
    question: 'How do I set up custom screensavers in KOReader?',
    answer: (
      <ol>
        <li>
          Connect your e-reader via USB and open the <b>.adds/koreader</b> folder
          on the device.
        </li>
        <li>
          Create a folder such as <b>screensaver</b> and copy your images into
          it.
        </li>
        <li>
          Safely eject, then in KOReader open{' '}
          <b>Settings → Screen → Sleep screen → Wallpaper</b>.
        </li>
        <li>
          Choose a single custom image or a random folder, and point it at your
          new folder.
        </li>
      </ol>
    ),
  },
  {
    question: 'Why should I resize images for my e-reader?',
    answer: (
      <p>
        E-readers use specific screen dimensions and aspect ratios. Properly
        sized images display sharply and fill the screen edge to edge — which
        matters for cover images, wallpapers and screensaver art. Off-size
        images get stretched, cropped, or show unwanted borders.
      </p>
    ),
  },
  {
    question: 'Should I use grayscale?',
    answer: (
      <p>
        Most e-ink panels are grayscale, so a grayscale PNG is what the device
        will actually display — and it is much smaller. Colour models such as
        the Kindle Colorsoft, Kobo Libra Colour or Boox Tab Ultra can keep
        colour. Toggle <b>Grayscale</b> in the tool; it uses the same Rec.601
        coefficients as Pillow&apos;s <code>convert(&quot;L&quot;)</code>.
      </p>
    ),
  },
  {
    question: 'How is this different from the command line?',
    answer: (
      <ul className="ans-list">
        <li>
          Same cover-crop geometry and the same Rec.601 grayscale coefficients
          as Pillow&apos;s <code>ImageOps.fit</code> +{' '}
          <code>convert(&quot;L&quot;)</code>.
        </li>
        <li>
          Resampling is the browser&apos;s high-quality filter with extra
          downscale passes, not LANCZOS — close, but not pixel-identical.
        </li>
        <li>
          EXIF orientation is respected here; Pillow ignores it unless told
          otherwise. Transparency is flattened onto white.
        </li>
        <li>
          TIFF input needs a decoder browsers do not ship, so it is skipped.
        </li>
      </ul>
    ),
  },
]

export function Faq() {
  return (
    <section className="faq" id="faq" aria-labelledby="faq-title">
      <div className="wrap faq-grid">
        <div className="faq-intro">
          <p className="kicker">FAQ</p>
          <h2 id="faq-title">Common questions</h2>
          <p>
            {MODELS.length} devices, batch processing and a strictly local
            pipeline. Here is how the details work.
          </p>
          <p>
            <a href="#tool">Resize an image first</a>, then follow the guide for
            your model.
          </p>
        </div>

        <div>
          {entries.map((entry) => (
            <details className="faq-item" key={entry.question} open={entry.open}>
              <summary>
                {entry.question}
                {plus}
              </summary>
              <div className="ans">{entry.answer}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
