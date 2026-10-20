import { getModel, modelsByBrand, MODELS } from '../lib/models'

interface DevicePickerProps {
  value: string
  onChange: (slug: string) => void
}

export function DevicePicker({ value, onChange }: DevicePickerProps) {
  const model = getModel(value)

  return (
    <div className="device">
      <label className="field">
        <span className="field__label">Target device</span>
        <select
          className="select"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {modelsByBrand().map(({ brand, models }) => (
            <optgroup key={brand} label={brand}>
              {models.map((candidate) => (
                <option key={candidate.slug} value={candidate.slug}>
                  {candidate.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <p className="device__meta">
        <span>{model.brand}</span>
        <span aria-hidden="true">·</span>
        <span>
          {model.width} × {model.height} px
        </span>
        <span aria-hidden="true">·</span>
        <span>{aspectLabel(model.width, model.height)}</span>
      </p>
      <p className="device__hint">{MODELS.length} devices, from Kobo Nia to Kindle Scribe.</p>
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
