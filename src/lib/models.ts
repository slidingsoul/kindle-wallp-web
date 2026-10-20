import rawModels from '../../models.json'

export interface Model {
  slug: string
  width: number
  height: number
  name: string
  brand: string
}

const data = rawModels as { models: Model[] }

export const MODELS: readonly Model[] = data.models

export const MODELS_BY_SLUG: ReadonlyMap<string, Model> = new Map(
  MODELS.map((model) => [model.slug, model]),
)

export const BRANDS: readonly string[] = [...new Set(MODELS.map((m) => m.brand))]

export const DEFAULT_MODEL_SLUG = 'kindle-paperwhite-11th-gen'

export function getModel(slug: string): Model {
  const model = MODELS_BY_SLUG.get(slug)
  if (!model) throw new Error(`Unknown model: ${slug}`)
  return model
}

export function modelsByBrand(): { brand: string; models: Model[] }[] {
  return BRANDS.map((brand) => ({
    brand,
    models: MODELS.filter((m) => m.brand === brand),
  }))
}
