import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

/**
 * Content-Security-Policy is injected into production builds only: the dev
 * server's HMR socket would be blocked by `connect-src 'none'`.
 *
 * `connect-src 'none'` is the load-bearing directive for the privacy promise:
 * it makes fetch/XHR/WebSocket/sendBeacon impossible, regardless of what the
 * bundled code does.
 */
function cspPlugin(single: boolean): Plugin {
  const scriptSrc = single ? "'unsafe-inline'" : "'self'"
  const styleSrc = single ? "'unsafe-inline'" : "'self' 'unsafe-inline'"
  const csp = [
    "default-src 'none'",
    `script-src ${scriptSrc}`,
    `style-src ${styleSrc}`,
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "worker-src blob: 'self'",
    "connect-src 'none'",
    "media-src 'none'",
    "object-src 'none'",
    "form-action 'none'",
    "base-uri 'none'",
  ].join('; ')

  return {
    name: 'kwallp-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<!--CSP-->',
        `<meta http-equiv="Content-Security-Policy" content="${csp}" />`,
      )
    },
  }
}

export default defineConfig(({ mode }) => {
  const single = mode === 'single'

  return {
    root: projectRoot,
    base: './',
    plugins: [
      react(),
      cspPlugin(single),
      ...(single ? [viteSingleFile({ removeViteModuleLoader: true })] : []),
    ],
    build: {
      outDir: single ? 'dist-single' : 'dist',
      emptyOutDir: true,
      target: 'es2022',
      assetsInlineLimit: single ? 100_000_000 : 4096,
      cssCodeSplit: !single,
      rollupOptions: single ? { output: { inlineDynamicImports: true } } : {},
    },
  }
})
