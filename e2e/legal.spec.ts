import { expect, test } from '@playwright/test'

test('footer opens the privacy policy and returns to the converter', async ({
  page,
}) => {
  await page.goto('/')

  await page
    .locator('.foot-col[aria-label="Legal"]')
    .getByRole('link', { name: 'Privacy Policy' })
    .click()

  await expect(page).toHaveURL(/#\/privacy$/)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Privacy Policy' }),
  ).toBeVisible()
  await expect(page).toHaveTitle('Privacy Policy — kwallp')
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /stay on your device/,
  )

  await page.getByRole('link', { name: 'Back to the converter' }).click()

  await expect(page).toHaveURL(/#tool$/)
  await expect(page.locator('#tool')).toBeInViewport()
  await expect(
    page.getByRole('heading', {
      level: 2,
      name: 'Fit any photo to any e-reader',
    }),
  ).toBeVisible()
})

test('policy table of contents jumps to a section without leaving the page', async ({
  page,
}) => {
  await page.goto('/#/privacy')

  await page
    .locator('.legal__toc')
    .getByRole('link', { name: 'Your rights' })
    .click()

  await expect(page).toHaveURL(/#\/privacy#rights$/)
  await expect(page.locator('#rights')).toBeInViewport()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Privacy Policy' }),
  ).toBeVisible()
})

test('terms page is linked from the footer', async ({ page }) => {
  await page.goto('/')

  await page
    .locator('.foot-col[aria-label="Legal"]')
    .getByRole('link', { name: 'Terms of Service' })
    .click()

  await expect(page).toHaveURL(/#\/terms$/)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Terms of Service' }),
  ).toBeVisible()
  await expect(page).toHaveTitle('Terms of Service — kwallp')
})
