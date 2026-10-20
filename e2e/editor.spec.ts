import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'

const fixtures = fileURLToPath(new URL('./fixtures/src', import.meta.url))
const fileInput = 'input[type=file]:not([webkitdirectory])'

/** Fingerprint the rendered thumbnail so reprocessing is observable. */
async function thumbHash(page: Page): Promise<number | null> {
  return page.evaluate(async () => {
    const img = document.querySelector<HTMLImageElement>(
      '.job--done .job__thumb',
    )
    if (!img) return null
    await img.decode()

    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const context = canvas.getContext('2d')
    if (!context) return null
    context.drawImage(img, 0, 0)

    const data = context.getImageData(0, 0, canvas.width, canvas.height).data
    let hash = 2166136261
    for (let index = 0; index < data.length; index += 53) {
      hash ^= data[index]
      hash = Math.imul(hash, 16777619)
    }
    return hash >>> 0
  })
}

test('framing changes the output and reset restores it', async ({ page }) => {
  await page.goto('/')
  await page.setInputFiles(fileInput, path.join(fixtures, 'gradient.jpg'))
  await expect(page.locator('.job--done')).toHaveCount(1)

  const original = await thumbHash(page)
  expect(original).not.toBeNull()

  await page.getByRole('button', { name: 'Zoom in' }).click()
  await page.getByRole('button', { name: 'Zoom in' }).click()
  await expect(page.locator('.zoom-readout')).toHaveText('140%')
  await expect(page.locator('.frame .hint')).toBeVisible()

  await expect
    .poll(() => thumbHash(page), { timeout: 20_000 })
    .not.toBe(original)

  await page.getByRole('button', { name: 'Reset view' }).click()
  await expect(page.locator('.zoom-readout')).toHaveText('100%')

  await expect
    .poll(() => thumbHash(page), { timeout: 20_000 })
    .toBe(original)
})

test('selecting a job switches the framing preview', async ({ page }) => {
  await page.goto('/')
  await page.setInputFiles(fileInput, [
    path.join(fixtures, 'gradient.jpg'),
    path.join(fixtures, 'shapes.png'),
  ])
  await expect(page.locator('.job--done')).toHaveCount(2)

  await expect(page.locator('.crop-editor__head .caps')).toContainText(
    'gradient.jpg',
  )

  await page.locator('.job').nth(1).locator('.job__select').click()
  await expect(page.locator('.crop-editor__head .caps')).toContainText(
    'shapes.png',
  )
  await expect(page.locator('.job').nth(1)).toHaveClass(/job--active/)
})

test('framing can be applied to the whole batch', async ({ page }) => {
  await page.goto('/')
  await page.setInputFiles(fileInput, [
    path.join(fixtures, 'gradient.jpg'),
    path.join(fixtures, 'shapes.png'),
  ])
  await expect(page.locator('.job--done')).toHaveCount(2)

  await page.getByRole('button', { name: 'Zoom in' }).click()
  await page.getByRole('button', { name: 'Use this framing for all' }).click()

  await expect
    .poll(
      () =>
        page
          .locator('.job--done .job__meta')
          .filter({ hasText: 'custom framing' })
          .count(),
      { timeout: 20_000 },
    )
    .toBe(2)
})
