import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  testDir: './e2e',
  outputDir: fileURLToPath(new URL('./test-results', import.meta.url)),
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 20_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command:
      'npm run build && npm run build:single && npx vite preview --port 4173 --strictPort --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    cwd: projectRoot,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
