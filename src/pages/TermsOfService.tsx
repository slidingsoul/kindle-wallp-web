import { LegalLayout, type LegalSectionLink } from '../components/LegalLayout'

const SECTIONS: LegalSectionLink[] = [
  { id: 'agreement', title: 'Agreement' },
  { id: 'service', title: 'The service' },
  { id: 'your-content', title: 'Your images and content' },
  { id: 'acceptable-use', title: 'Acceptable use' },
  { id: 'output', title: 'Output and compatibility' },
  { id: 'warranty', title: 'No warranty' },
  { id: 'liability', title: 'Limitation of liability' },
  { id: 'ip', title: 'Intellectual property' },
  { id: 'third-party', title: 'Third-party links' },
  { id: 'privacy', title: 'Privacy' },
  { id: 'changes', title: 'Changes to these terms' },
  { id: 'contact', title: 'Contact' },
]

const ISSUES = 'https://github.com/slidingsoul/kindle-wallp-web/issues'

export function TermsOfService() {
  return (
    <LegalLayout
      base="terms"
      eyebrow="Legal"
      title="Terms of Service"
      updated="20 October 2026"
      summary="These terms cover your use of kwallp, a free browser-based tool for resizing images to e-reader screens. The short version: use it lawfully, keep your originals, and understand that the output is provided as-is."
      sections={SECTIONS}
      otherPolicy={{ href: '#/privacy', label: 'Read the Privacy Policy' }}
    >
      <section id="agreement" aria-labelledby="agreement-title">
        <h2 id="agreement-title">Agreement</h2>
        <p>
          By accessing or using kwallp (the &ldquo;service&rdquo;), you agree to
          these Terms of Service. If you do not agree, please do not use the
          service. If you use it on behalf of an organisation, you confirm that
          you have authority to bind that organisation to these terms.
        </p>
      </section>

      <section id="service" aria-labelledby="service-title">
        <h2 id="service-title">The service</h2>
        <p>
          kwallp is a free, browser-based image resizer for e-reader screensavers
          and wallpapers. It runs entirely on your device: no account is
          required and no images are uploaded. We may add, change, suspend or
          discontinue features at any time, and we do not guarantee that the
          service will be available uninterrupted or error-free.
        </p>
      </section>

      <section id="your-content" aria-labelledby="your-content-title">
        <h2 id="your-content-title">Your images and content</h2>
        <p>
          You retain all rights to the images you process. We claim no ownership
          or licence in them. Because processing happens locally, we never
          receive a copy and cannot access, use or distribute your images.
        </p>
        <p>
          You are responsible for ensuring you have the rights and permissions
          needed to use each image, and for complying with any licence terms that
          apply to it. Do not use the service to process content that is
          unlawful or infringing, or that violates someone else&apos;s privacy.
        </p>
      </section>

      <section id="acceptable-use" aria-labelledby="acceptable-use-title">
        <h2 id="acceptable-use-title">Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>
            use the service for unlawful purposes or to infringe intellectual
            property, privacy or other rights;
          </li>
          <li>
            process malware or content designed to harm others, or use the
            service to harass or deceive;
          </li>
          <li>
            interfere with the site, its hosting or other users, including
            through excessive automated requests;
          </li>
          <li>
            attempt to bypass security controls, including the
            Content-Security-Policy; or
          </li>
          <li>
            misrepresent the service or its output as official, endorsed or
            provided by a device manufacturer.
          </li>
        </ul>
        <p>
          We may restrict access if we reasonably believe these rules have been
          broken.
        </p>
      </section>

      <section id="output" aria-labelledby="output-title">
        <h2 id="output-title">Output and compatibility</h2>
        <p>
          Cropping, resizing and grayscale conversion can change an image.
          Review every result on your device before relying on it, and keep your
          originals. Screen sizes and specifications are taken from published
          manufacturer information and may change. A conversion that matches a
          listed resolution does not guarantee that a particular device will
          display it as expected.
        </p>
      </section>

      <section id="warranty" aria-labelledby="warranty-title">
        <h2 id="warranty-title">No warranty</h2>
        <p>
          The service is provided &ldquo;as is&rdquo; and &ldquo;as
          available&rdquo;, without warranties of any kind, whether express,
          implied or statutory, including merchantability, fitness for a
          particular purpose, accuracy and non-infringement. We do not warrant
          that the output will be free of errors or suitable for your device.
        </p>
      </section>

      <section id="liability" aria-labelledby="liability-title">
        <h2 id="liability-title">Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, the kwallp project and its
          contributors are not liable for indirect, incidental, special,
          consequential or punitive damages, or for loss of data, images, profits
          or device functionality, arising from your use of or inability to use
          the service.
        </p>
        <p>
          The service is free, so our total aggregate liability is limited to
          the amount you paid us, which is zero. Nothing in these terms excludes
          liability that cannot lawfully be excluded, including your mandatory
          consumer rights under the law of your country of residence.
        </p>
      </section>

      <section id="ip" aria-labelledby="ip-title">
        <h2 id="ip-title">Intellectual property</h2>
        <p>
          The kwallp name, logo, site design and written content belong to the
          project and may not be used in a way that suggests endorsement without
          permission. The bundled fonts are licensed under the SIL Open Font
          License. The source code is available in the project repository.
        </p>
        <p>
          Kindle, Kobo, BOOX, reMarkable, Nook, PocketBook and other product
          names are trademarks of their respective owners. kwallp is not
          affiliated with, endorsed by or sponsored by any device manufacturer.
        </p>
      </section>

      <section id="third-party" aria-labelledby="third-party-title">
        <h2 id="third-party-title">Third-party links</h2>
        <p>
          The service links to third-party sites such as GitHub. We do not
          control those sites and are not responsible for their content,
          policies or practices. Following a link is at your own risk and
          subject to that site&apos;s terms.
        </p>
      </section>

      <section id="privacy" aria-labelledby="privacy-title">
        <h2 id="privacy-title">Privacy</h2>
        <p>
          Our <a href="#/privacy">Privacy Policy</a> explains what data is and
          is not processed. In short: your images stay on your device, and we do
          not run analytics, advertising or accounts.
        </p>
      </section>

      <section id="changes" aria-labelledby="changes-title">
        <h2 id="changes-title">Changes to these terms</h2>
        <p>
          We may update these terms from time to time. The date at the top shows
          the current version, and material changes will be noted on the site. If
          you continue to use the service after a change takes effect, you accept
          the updated terms.
        </p>
      </section>

      <section id="contact" aria-labelledby="contact-title">
        <h2 id="contact-title">Contact</h2>
        <p>
          Questions about these terms? Open an issue at{' '}
          <a href={ISSUES} rel="noreferrer">
            github.com/slidingsoul/kindle-wallp-web/issues
          </a>
          .
        </p>
      </section>
    </LegalLayout>
  )
}
