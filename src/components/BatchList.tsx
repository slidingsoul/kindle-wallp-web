import type { Job } from '../hooks/useBatch'
import type { Model } from '../lib/models'
import { ResultCard } from './ResultCard'

interface BatchListProps {
  jobs: readonly Job[]
  model: Model
  activeId: string | null
  onSelect: (id: string) => void
  onDownload: (job: Job) => void
  onRemove: (id: string) => void
}

export function BatchList({
  jobs,
  model,
  activeId,
  onSelect,
  onDownload,
  onRemove,
}: BatchListProps) {
  if (jobs.length === 0) {
    return (
      <div className="empty">
        <p className="empty__title">Nothing queued yet</p>
        <p className="empty__body">
          Add a photo or a whole folder. Pick a device on the left, then frame
          each image or keep the centred crop — and download the batch as a ZIP
          or straight into a folder.
        </p>
        <ul className="empty__list">
          <li>Cover-cropped and centred, never stretched</li>
          <li>8-bit grayscale PNG matches e-ink panels</li>
          <li>Nested folder structure preserved</li>
        </ul>
      </div>
    )
  }

  return (
    <ul className="jobs">
      {jobs.map((job) => (
        <ResultCard
          key={job.id}
          job={job}
          model={model}
          selected={job.id === activeId}
          onSelect={onSelect}
          onDownload={onDownload}
          onRemove={onRemove}
        />
      ))}
    </ul>
  )
}
