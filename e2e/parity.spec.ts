import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

/**
 * The parity tests shell out to the Python CLI. Point this at your checkout if
 * it does not sit next to this project.
 */
const cliRepo =
  process.env.KWALLP_CLI_REPO ??
  fileURLToPath(new URL('../../kindle-wallp', import.meta.url))
const hasCli = existsSync(path.join(cliRepo, 'main.py'))
const fixtures = fileURLToPath(new URL('./fixtures/src', import.meta.url))

interface Case {
  file: string
  model: string
  grayscale: boolean
  /** Minimum PSNR against the Pillow reference. */
  minPsnr: number
}

const cases: Case[] = [
  // Large downscale into the biggest panel, grayscale.
  { file: 'gradient.jpg', model: 'kindle-scribe', grayscale: true, minPsnr: 34 },
  // Small target with sharp edges, colour.
  { file: 'shapes.png', model: 'kobo-nia', grayscale: false, minPsnr: 32 },
  // Upscale from a tiny source.
  { file: 'tiny.png', model: 'boox-palma', grayscale: false, minPsnr: 34 },
]

function pillowReference(entry: Case): string {
  const directory = mkdtempSync(path.join(tmpdir(), 'kwallp-ref-'))
  const output = path.join(directory, 'ref.png')

  execFileSync(
    'uv',
    [
      'run',
      'kwallp',
      path.join(fixtures, entry.file),
      '-m',
      entry.model,
      entry.grayscale ? '--grayscale' : '--no-grayscale',
      '-o',
      output,
    ],
    { cwd: cliRepo, stdio: 'pipe' },
  )

  return readFileSync(output).toString('base64')
}

for (const entry of cases) {
  test(`${entry.file} → ${entry.model} (${entry.grayscale ? 'gray' : 'color'})`, async ({
    page,
  }) => {
    test.skip(
      !hasCli,
      `kwallp CLI repo not found at ${cliRepo}. Set KWALLP_CLI_REPO to run parity tests.`,
    )

    const reference = pillowReference(entry)

    await page.goto('/')
    await page.selectOption('select.select', entry.model)
    if (!entry.grayscale) {
      await page.getByRole('checkbox').uncheck()
    }

    await page.setInputFiles(
      'input[type=file]:not([webkitdirectory])',
      path.join(fixtures, entry.file),
    )
    await expect(page.locator('.job--done')).toHaveCount(1)

    const metrics = await page.evaluate(async ({ refBase64 }) => {
      function readPixels(src: string): Promise<ImageData> {
        return new Promise((resolve, reject) => {
          const image = new Image()
          image.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = image.naturalWidth
            canvas.height = image.naturalHeight
            const context = canvas.getContext('2d')
            if (!context) {
              reject(new Error('canvas unavailable'))
              return
            }
            context.drawImage(image, 0, 0)
            resolve(context.getImageData(0, 0, canvas.width, canvas.height))
          }
          image.onerror = () => reject(new Error('could not decode image'))
          image.src = src
        })
      }

      const webImage = document.querySelector<HTMLImageElement>(
        '.job--done .job__thumb',
      )
      if (!webImage) throw new Error('no result image')

      const web = await readPixels(webImage.src)
      const ref = await readPixels(`data:image/png;base64,${refBase64}`)

      if (web.width !== ref.width || web.height !== ref.height) {
        return {
          width: web.width,
          height: web.height,
          refWidth: ref.width,
          refHeight: ref.height,
          psnr: Number.NEGATIVE_INFINITY,
          meanAbs: 255,
          maxDelta: 255,
        }
      }

      let mse = 0
      let sumAbs = 0
      let maxDelta = 0
      let count = 0

      for (let i = 0; i < web.data.length; i += 4) {
        for (let channel = 0; channel < 3; channel++) {
          const delta = Math.abs(web.data[i + channel] - ref.data[i + channel])
          mse += delta * delta
          sumAbs += delta
          if (delta > maxDelta) maxDelta = delta
          count += 1
        }
      }

      const averageMse = mse / count
      return {
        width: web.width,
        height: web.height,
        refWidth: ref.width,
        refHeight: ref.height,
        psnr:
          averageMse === 0
            ? Number.POSITIVE_INFINITY
            : 10 * Math.log10((255 * 255) / averageMse),
        meanAbs: sumAbs / count,
        maxDelta,
      }
    }, { refBase64: reference })

    console.log(
      `${entry.file} → ${entry.model}: ${JSON.stringify(metrics)}`,
    )

    expect(metrics.width).toBe(metrics.refWidth)
    expect(metrics.height).toBe(metrics.refHeight)
    expect(metrics.psnr).toBeGreaterThanOrEqual(entry.minPsnr)
    expect(metrics.meanAbs).toBeLessThanOrEqual(4)
  })
}
