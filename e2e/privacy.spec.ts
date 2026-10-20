import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { parseZip } from './helpers/zip'

const fixtures = fileURLToPath(new URL('./fixtures/src', import.meta.url))
const fileInput = 'input[type=file]:not([webkitdirectory])'
const folderInput = 'input[type=file][webkitdirectory]'

test('processes a batch without a single network request', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const requests: string[] = []
  page.on('request', (request) => requests.push(request.url()))

  await page.setInputFiles(fileInput, [
    path.join(fixtures, 'gradient.jpg'),
    path.join(fixtures, 'shapes.png'),
  ])

  await expect(page.locator('.job--done')).toHaveCount(2)

  const unexpected = requests.filter(
    (url) => !url.startsWith('blob:') && !url.startsWith('data:'),
  )
  expect(unexpected).toEqual([])

  const badge = page.locator('.privacy')
  await expect(badge).toHaveClass(/privacy--ok/)
  await expect(badge).toContainText('0 network requests')
})

test('ships a CSP that blocks outbound connections', async ({ page }) => {
  await page.goto('/')

  const content = await page
    .locator('meta[http-equiv="Content-Security-Policy"]')
    .getAttribute('content')
  expect(content).toContain("connect-src 'none'")
  expect(content).toContain("default-src 'none'")

  const requests: string[] = []
  page.on('request', (request) => requests.push(request.url()))

  const blocked = await page.evaluate(async () => {
    try {
      await fetch('https://example.com/exfiltration')
      return false
    } catch {
      return true
    }
  })

  expect(blocked).toBe(true)
  expect(requests.filter((url) => url.includes('example.com'))).toEqual([])
})

test('keeps nested folder structure in results and in the ZIP', async ({
  page,
}) => {
  await page.goto('/')
  await page.setInputFiles(folderInput, fixtures)

  await expect(page.locator('.job--done')).toHaveCount(5)
  const directories = await page.locator('.job__dir').allTextContents()
  expect(directories.sort()).toEqual(['album/', 'album/sub/'])

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download ZIP' }).click()
  const download = await downloadPromise
  const file = await download.path()
  const bytes = readFileSync(file!)

  const names = parseZip(new Uint8Array(bytes)).map((entry) => entry.name)
  expect(names.sort()).toEqual([
    'album/one.png',
    'album/sub/two.png',
    'gradient.png',
    'shapes.png',
    'tiny.png',
  ])
})
