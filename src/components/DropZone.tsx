import { useRef, useState, type DragEvent } from 'react'
import {
  ACCEPT_ATTRIBUTE,
  filesFromDataTransfer,
  filesFromFileList,
  type IntakeResult,
} from '../lib/intake'

interface DropZoneProps {
  onFiles: (result: IntakeResult) => void
  disabled?: boolean
}

export function DropZone({ onFiles, disabled = false }: DropZoneProps) {
  const [dragging, setDragging] = useState(false)
  const [reading, setReading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const folderInput = useRef<HTMLInputElement>(null)

  const handleResult = (result: IntakeResult) => {
    setError(null)
    onFiles(result)
  }

  const readDropped = async (transfer: DataTransfer) => {
    setReading(true)
    try {
      handleResult(await filesFromDataTransfer(transfer))
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not read those files.',
      )
    } finally {
      setReading(false)
    }
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    if (disabled) return
    void readDropped(event.dataTransfer)
  }

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!disabled) setDragging(true)
  }

  return (
    <div
      className={`dropzone${dragging ? ' is-dragging' : ''}`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={() => setDragging(false)}
      onClick={() => {
        if (!disabled && !reading) fileInput.current?.click()
      }}
    >
      <p className="dropzone__title">
        {reading ? 'Reading folder…' : 'Drop photos or a folder'}
      </p>
      <p className="dropzone__hint">
        JPG, PNG, WebP or BMP. Nested folders keep their structure.
      </p>

      <div className="dropzone__actions">
        <button
          type="button"
          className="btn"
          disabled={disabled || reading}
          onClick={(event) => {
            event.stopPropagation()
            fileInput.current?.click()
          }}
        >
          Choose images
        </button>
        <button
          type="button"
          className="btn"
          disabled={disabled || reading}
          onClick={(event) => {
            event.stopPropagation()
            folderInput.current?.click()
          }}
        >
          Choose folder
        </button>
      </div>

      <input
        ref={fileInput}
        type="file"
        multiple
        accept={ACCEPT_ATTRIBUTE}
        className="visually-hidden"
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          if (event.target.files) handleResult(filesFromFileList(event.target.files))
          event.target.value = ''
        }}
      />
      <input
        ref={(element) => {
          folderInput.current = element
          // React has no typed attribute for directory selection.
          element?.setAttribute('webkitdirectory', '')
          element?.setAttribute('directory', '')
        }}
        type="file"
        multiple
        className="visually-hidden"
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          if (event.target.files) handleResult(filesFromFileList(event.target.files))
          event.target.value = ''
        }}
      />

      {error && <p className="dropzone__error">{error}</p>}
    </div>
  )
}
