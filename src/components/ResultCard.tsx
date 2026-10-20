import type { CSSProperties } from 'react'
import type { Job } from '../hooks/useBatch'
import type { Model } from '../lib/models'
import { formatBytes } from '../lib/format'

interface ResultCardProps {
  job: Job
  model: Model
  onDownload: (job: Job) => void
  onRemove: (id: string) => void
}

export function ResultCard({ job, model, onDownload, onRemove }: ResultCardProps) {
  const result = job.result
  const name = job.path.split('/').pop() ?? job.path
  const directory = job.path.includes('/')
    ? job.path.slice(0, job.path.lastIndexOf('/'))
    : null

  return (
    <li className={`job job--${job.status}`}>
      <div
        className="job__frame"
        style={{ '--ar': `${model.width} / ${model.height}` } as CSSProperties}
      >
        {result ? (
          <img className="job__thumb" src={result.url} alt="" loading="lazy" />
        ) : (
          <span className="job__placeholder" aria-hidden="true" />
        )}
      </div>

      <div className="job__info">
        <p className="job__name" title={job.path}>
          {name}
          {directory && <span className="job__dir">{directory}/</span>}
        </p>

        <p className="job__meta">
          {job.status === 'done' && result ? (
            <>
              {result.width} × {result.height} · {formatBytes(result.bytes)} ·{' '}
              {result.grayscale ? 'grayscale' : 'color'}
            </>
          ) : job.status === 'error' ? (
            <span className="text-danger">{job.error ?? 'Processing failed'}</span>
          ) : job.status === 'processing' ? (
            <span className="job__working">Resizing…</span>
          ) : (
            'Queued'
          )}
        </p>
      </div>

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
