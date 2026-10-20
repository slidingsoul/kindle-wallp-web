#!/usr/bin/env node
/**
 * Copy the device list from the kwallp CLI checkout into this project.
 * models.json is committed here so the web app builds without the CLI present.
 *
 *   npm run sync:models          # copy from ../kindle-wallp/models.json
 *   npm run check:models         # fail if the copy is stale (useful in CI)
 *   KWALLP_MODELS=/path/to/models.json npm run sync:models
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))
const source =
  process.env.KWALLP_MODELS ??
  path.join(projectRoot, '..', 'kindle-wallp', 'models.json')
const target = path.join(projectRoot, 'models.json')
const checkOnly = process.argv.includes('--check')

function fail(message) {
  console.error(`sync-models: ${message}`)
  process.exit(1)
}

if (!existsSync(source)) {
  fail(
    `source not found: ${source}\nSet KWALLP_MODELS to the CLI's models.json.`,
  )
}

let parsed
try {
  parsed = JSON.parse(readFileSync(source, 'utf8'))
} catch (error) {
  fail(`could not parse ${source}: ${error.message}`)
}

if (!parsed || !Array.isArray(parsed.models) || parsed.models.length === 0) {
  fail(`${source} does not contain a non-empty "models" array`)
}

const slugs = new Set()
for (const model of parsed.models) {
  if (!model || typeof model.slug !== 'string' || !model.slug) {
    fail('found a model without a slug')
  }
  if (slugs.has(model.slug)) fail(`duplicate slug: ${model.slug}`)
  slugs.add(model.slug)

  if (
    !Number.isInteger(model.width) ||
    !Number.isInteger(model.height) ||
    model.width <= 0 ||
    model.height <= 0
  ) {
    fail(`invalid size for ${model.slug}: ${model.width}x${model.height}`)
  }
  if (typeof model.name !== 'string' || typeof model.brand !== 'string') {
    fail(`invalid name or brand for ${model.slug}`)
  }
}

const normalized = `${JSON.stringify({ models: parsed.models }, null, 2)}\n`
const current = existsSync(target) ? readFileSync(target, 'utf8') : ''

if (checkOnly) {
  if (current !== normalized) {
    fail(`models.json is out of date with ${source}`)
  }
  console.log(`sync-models: up to date (${parsed.models.length} models)`)
} else if (current === normalized) {
  console.log(`sync-models: already up to date (${parsed.models.length} models)`)
} else {
  writeFileSync(target, normalized)
  console.log(
    `sync-models: wrote ${parsed.models.length} models from ${source}`,
  )
}
