import type { BatchStats, SaveState } from '../hooks/useBatch'

interface ToolbarProps {
  stats: BatchStats
  saveState: SaveState
  canSaveToFolder: boolean
  onDownloadAll: () => void
  onSaveAll: () => void
  onReprocess: () => void
  onClear: () => void
}

export function Toolbar({
  stats,
  saveState,
  canSaveToFolder,
  onDownloadAll,
  onSaveAll,
  onReprocess,
  onClear,
}: ToolbarProps) {
  const busy = stats.processing || stats.pending > 0
  const finished = stats.done + stats.failed
  const percent = stats.total === 0 ? 0 : Math.round((finished / stats.total) * 100)

  return (
    <div className="toolbar">
      <div className="toolbar__row">
        <p className="toolbar__status" aria-live="polite">
          <strong>{stats.total}</strong> {stats.total === 1 ? 'image' : 'images'}
          {stats.done > 0 && <> · {stats.done} ready</>}
          {stats.failed > 0 && (
            <>
              {' '}
              · <span className="text-danger">{stats.failed} failed</span>
            </>
          )}
          {busy && <> · working…</>}
          {saveState.running && (
            <>
              {' '}
              · saving {saveState.done}/{saveState.total}
            </>
          )}
        </p>

        <div className="toolbar__actions">
          <button
            type="button"
            className="btn btn--small"
            onClick={onReprocess}
            disabled={busy || stats.total === 0}
          >
            Reprocess
          </button>
          {canSaveToFolder && (
            <button
              type="button"
              className="btn btn--small"
              onClick={onSaveAll}
              disabled={busy || stats.done === 0 || saveState.running}
            >
              Save to folder…
            </button>
          )}
          <button
            type="button"
            className="btn btn--small btn--primary"
            onClick={onDownloadAll}
            disabled={busy || stats.done === 0 || saveState.running}
          >
            Download ZIP
          </button>
          <button
            type="button"
            className="btn btn--small btn--ghost"
            onClick={onClear}
            disabled={saveState.running}
          >
            Clear
          </button>
        </div>
      </div>

      {(busy || saveState.running) && (
        <div
          className="progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={saveState.running ? Math.round((saveState.done / Math.max(1, saveState.total)) * 100) : percent}
          aria-label={saveState.running ? 'Saving images' : 'Resizing images'}
        >
          <span
            style={{
              inlineSize: `${
                saveState.running
                  ? Math.round((saveState.done / Math.max(1, saveState.total)) * 100)
                  : percent
              }%`,
            }}
          />
        </div>
      )}
    </div>
  )
}
