# kwallp web

E-reader screensavers and wallpapers, resized **entirely in the browser**. No backend, no uploads, no telemetry.

25 devices across Kindle, Kobo, reMarkable, Boox, Nook and PocketBook — the same list used by the [`kwallp` CLI](https://github.com/) (this project started inside that repo).

## Quick start

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # static site in dist/
npm run build:single   # one self-contained file: dist-single/index.html
```

`dist-single/index.html` (~270 KB) works when opened directly from disk with networking disabled.

## Why the privacy claim holds

- **No network code.** Nothing in the bundle calls `fetch`, `XMLHttpRequest`, `sendBeacon` or a WebSocket.
- **CSP `connect-src 'none'`.** Production builds ship a Content-Security-Policy meta tag that makes outbound connections impossible, even if future code tried.
- **Inlined model data.** `models.json` is imported at build time, so the app makes zero requests after the page loads.
- **Automated proof.** `npm run test:e2e` intercepts every request, processes a batch, and fails if anything is requested. It also loads the single-file build from `file://` and asserts no requests.

The only request ever made is the initial page load. Images are read through the File API and never leave the tab.

## How it works

Per image, in a Web Worker (`src/lib/pipeline.ts`):

1. Decode with `createImageBitmap` (EXIF orientation respected).
2. Cover-crop and centre, using the same geometry as Pillow's `ImageOps.fit`.
3. Resample with the browser's high-quality filter, in halving passes when the reduction is more than 2×.
4. Optional grayscale using Rec.601 coefficients — the same ones as Pillow's `convert("L")`.
5. Encode PNG by hand: 8-bit grayscale (colour type 0) or RGB (type 2), zlib via `CompressionStream`.

Grayscale output is a real 8-bit grayscale PNG, which is what e-ink panels want and much smaller than canvas `toBlob()`'s always-RGBA output.

## Fidelity vs. the CLI

| Topic | CLI | Web |
| --- | --- | --- |
| Resampling | Pillow LANCZOS | browser high-quality filter + extra passes |
| Grayscale | Rec.601 `convert("L")` | same coefficients, colour type 0 PNG |
| Geometry | `ImageOps.fit`, centred | identical cover-crop math |
| EXIF rotation | ignored | respected (matches browser display) |
| Transparency | ignored by `convert("L")` | flattened onto white |
| TIFF | supported | unsupported (no browser decoder) |
| Delivery | writes `./output` | ZIP with preserved paths, or "Save to folder…" |

Measured against `uv run kwallp` (see `e2e/parity.spec.ts`): 63 dB PSNR for grayscale, 41–45 dB for colour — well past the thresholds in the test.

## Devices

`models.json` is committed so the project builds on its own. It is copied from the CLI checkout:

```bash
npm run sync:models    # from ../kindle-wallp/models.json
npm run check:models   # fail if the copy is stale (CI)
KWALLP_MODELS=/path/to/models.json npm run sync:models
```

## Tests

```bash
npx playwright install chromium   # once
npm test                          # Vitest: geometry, luma, PNG, ZIP, paths
npm run test:e2e                  # Playwright: privacy, offline build, parity
```

The parity tests shell out to the Python CLI. They look for it at `../kindle-wallp` and skip with a message when it is absent; set `KWALLP_CLI_REPO` to point somewhere else.

## Browser support

Requires `CompressionStream` (Chrome/Edge 111+, Safari 16.4+, Firefox 113+). "Save to folder…" appears only where the File System Access API exists; everyone else gets the ZIP download.

## Layout

```
src/lib/         pipeline, geometry, luma, PNG encoder, ZIP, intake, paths
src/components/  drop zone, device picker, batch list, toolbar, privacy badge
src/hooks/       queue and settings state
e2e/             privacy, offline single-file, Pillow parity
test/            unit tests
scripts/         models.json sync
```
