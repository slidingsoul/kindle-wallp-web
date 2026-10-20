import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { expect, test } from '@playwright/test'

const singleFile = fileURLToPath(
  new URL('../dist-single/index.html', import.meta.url),
)
const fixture = fileURLToPath(
  new URL('./fixtures/src/gradient.jpg', import.meta.url),
)

test('single-file build processes images from file:// with no network', async ({
  page,
}) => {
  const requests: string[] = []
  page.on('request', (request) => requests.push(request.url()))

  await page.goto(pathToFileURL(singleFile).href)
  await expect(page.locator('.brand').first()).toContainText('kwallp')
  await expect(page).toHaveTitle(/kwallp/)

  await page.setInputFiles(
    'input[type=file]:not([webkitdirectory])',
    path.join(fixture),
  )
  await expect(page.locator('.job--done')).toHaveCount(1)

  const meta = await page
    .locator('meta[http-equiv="Content-Security-Policy"]')
    .getAttribute('content')
  expect(meta).toContain("connect-src 'none'")

  const external = requests.filter(
    (url) => !/^(file|blob|data):/.test(url),
  )
  expect(external).toEqual([])
})
