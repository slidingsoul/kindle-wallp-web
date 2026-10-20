import { useState } from 'react'
import { BRANDS, getModel, MODELS } from '../lib/models'

interface DeviceChipsProps {
  value: string
  onChange: (slug: string) => void
}

const ALL = 'All'

export function DeviceChips({ value, onChange }: DeviceChipsProps) {
  const [brand, setBrand] = useState<string>(ALL)
  const model = getModel(value)
  const visible = brand === ALL ? MODELS : MODELS.filter((entry) => entry.brand === brand)

  return (
    <div className="device-picker">
      <div className="brand-tabs" role="group" aria-label="Filter devices by brand">
        {[ALL, ...BRANDS].map((name) => (
          <button
            key={name}
            type="button"
            className="brand-tab"
            aria-pressed={brand === name}
            onClick={() => setBrand(name)}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="chip-grid" role="group" aria-label="Choose e-reader model">
        {visible.map((entry) => (
          <button
            key={entry.slug}
            type="button"
            className="chip"
            data-slug={entry.slug}
            aria-pressed={entry.slug === value}
            aria-label={`${entry.name}, ${entry.width} × ${entry.height} px`}
            onClick={() => onChange(entry.slug)}
          >
            <span className="nm">{entry.name}</span>
            <span className="sc">
              {entry.width} × {entry.height} px
            </span>
          </button>
        ))}
      </div>

      <p className="device__meta">
        <span>{model.brand}</span>
        <span aria-hidden="true">·</span>
        <span>
          {model.width} × {model.height} px
        </span>
        <span aria-hidden="true">·</span>
        <span>{aspectLabel(model.width, model.height)}</span>
      </p>
      <p className="device__hint">
        {brand === ALL
          ? `${MODELS.length} devices, from Kobo Nia to Kindle Scribe.`
          : `${visible.length} of ${MODELS.length} devices shown.`}
      </p>
    </div>
  )
}

function aspectLabel(width: number, height: number): string {
  const ratio = width / height
  const known: [number, string][] = [
    [3 / 4, '3:4'],
    [2 / 3, '2:3'],
    [0.5, '1:2'],
    [4 / 5, '4:5'],
  ]
  for (const [value, label] of known) {
    if (Math.abs(ratio - value) < 0.005) return label
  }
  return `${ratio.toFixed(2)}:1`
}
