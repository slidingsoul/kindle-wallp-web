import type { CSSProperties } from 'react'
import type { Job } from '../hooks/useBatch'
import type { Model } from '../lib/models'
import { formatBytes } from '../lib/format'

interface ResultCardProps {
  job: Job
  model: Model
  selected: boolean
  onSelect: (id: string) => void
  onDownload: (job: Job) => void
  onRemove: (id: string) => void
}

export function ResultCard({
  job,
  model,
  selected,
  onSelect,
  onDownload,
  onRemove,
}: ResultCardProps) {
  const result = job.result
  const name = job.path.split('/').pop() ?? job.path
  const directory = job.path.includes('/')
    ? job.path.slice(0, job.path.lastIndexOf('/'))
    : null

  return (
    <li className={`job job--${job.status}${selected ? ' job--active' : ''}`}>
      <button
        type="button"
        className="job__select"
        aria-pressed={selected}
        onClick={() => onSelect(job.id)}
      >
        <span
          className="job__frame"
          style={{ '--ar': `${model.width} / ${model.height}` } as CSSProperties}
        >
          {result ? (
            <img className="job__thumb" src={result.url} alt="" loading="lazy" />
          ) : (
            <span className="job__placeholder" aria-hidden="true" />
          )}
        </span>

        <span className="job__info">
          <span className="job__name" title={job.path}>
            {name}
            {directory && <span className="job__dir">{directory}/</span>}
          </span>

          <span className="job__meta">
            {job.status === 'done' && result ? (
              <>
                {result.width} × {result.height} · {formatBytes(result.bytes)} ·{' '}
                {result.grayscale ? 'grayscale' : 'color'}
                {job.crop && job.crop.zoom > 1.001 ? ' · custom framing' : ''}
              </>
            ) : job.status === 'error' ? (
              <span className="text-danger">{job.error ?? 'Processing failed'}</span>
            ) : job.status === 'processing' ? (
              <span className="job__working">Resizing…</span>
            ) : (
              'Queued'
            )}
          </span>
        </span>
      </button>

      <div className="job__actions">
        <button
          type="button"
          className="btn btn--small"
          disabled={!result}
          onClick={() => onDownload(job)}
        >
          Download
        </button>
        <button
          type="button"
          className="iconbtn"
          aria-label={`Remove ${name}`}
          title="Remove"
          onClick={() => onRemove(job.id)}
        >
          ×
        </button>
      </div>
    </li>
  )
}
