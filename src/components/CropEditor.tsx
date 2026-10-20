import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import {
  DEFAULT_CROP,
  MAX_ZOOM,
  MIN_ZOOM,
  cropRect,
  coverCrop,
  normalizeCrop,
  type CropTransform,
} from '../lib/geometry'
import type { Job } from '../hooks/useBatch'
import type { Model } from '../lib/models'

interface CropEditorProps {
  job: Job
  model: Model
  jobCount: number
  onChange: (jobId: string, crop: CropTransform) => void
  onApplyToAll: (crop: CropTransform) => void
}

const COMMIT_DELAY = 150
const KEYBOARD_STEP = 12

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function CropEditor({
  job,
  model,
  jobCount,
  onChange,
  onApplyToAll,
}: CropEditorProps) {
  const [crop, setCrop] = useState<CropTransform>(() => normalizeCrop(job.crop))
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewport, setViewport] = useState({ width: 0, height: 0 })

  const frameRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cropRef = useRef(crop)
  const dragRef = useRef<{
    pointerId: number
    x: number
    y: number
    crop: CropTransform
  } | null>(null)

  const name = job.path.split('/').pop() ?? job.path

  cropRef.current = crop

  const clearTimer = useCallback(() => {
    if (commitTimer.current) {
      clearTimeout(commitTimer.current)
      commitTimer.current = null
    }
  }, [])

  const commit = useCallback(
    (next: CropTransform) => {
      clearTimer()
      onChange(job.id, next)
    },
    [clearTimer, job.id, onChange],
  )

  const commitSoon = useCallback(
    (next: CropTransform) => {
      clearTimer()
      commitTimer.current = setTimeout(() => {
        commitTimer.current = null
        onChange(job.id, next)
      }, COMMIT_DELAY)
    },
    [clearTimer, job.id, onChange],
  )

  useEffect(() => clearTimer, [clearTimer])

  /* Load the source file into an object URL for the preview. */
  useEffect(() => {
    const url = URL.createObjectURL(job.file)
    const next = new Image()
    let cancelled = false

    next.decoding = 'async'
    next.onload = () => {
      if (cancelled) return
      setImage(next)
      setError(null)
    }
    next.onerror = () => {
      if (cancelled) return
      setImage(null)
      setError('Could not decode this image for previewing.')
    }
    next.src = url

    return () => {
      cancelled = true
      next.onload = null
      next.onerror = null
      URL.revokeObjectURL(url)
    }
  }, [job.file])

  /* Track the frame's CSS size so the canvas stays sharp on any screen. */
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return

    const measure = () => {
      const width = frame.clientWidth
      const height = frame.clientHeight
      setViewport((current) =>
        current.width === width && current.height === height
          ? current
          : { width, height },
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  /* Paint the same rectangle the export pipeline will sample. */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || viewport.width < 2 || viewport.height < 2) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(viewport.width * dpr)
    canvas.height = Math.round(viewport.height * dpr)

    const context = canvas.getContext('2d')
    if (!context) return

    context.clearRect(0, 0, canvas.width, canvas.height)
    if (!image) return

    const rect = cropRect(
      image.naturalWidth,
      image.naturalHeight,
      model.width,
      model.height,
      crop,
    )

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(
      image,
      rect.sx,
      rect.sy,
      rect.sw,
      rect.sh,
      0,
      0,
      canvas.width,
      canvas.height,
    )
  }, [crop, image, model.width, model.height, viewport])

  const applyCrop = useCallback((next: CropTransform) => {
    cropRef.current = next
    setCrop(next)
  }, [])

  const panFrom = useCallback(
    (start: CropTransform, dxCss: number, dyCss: number): CropTransform => {
      if (!image) return start
      const base = coverCrop(
        image.naturalWidth,
        image.naturalHeight,
        model.width,
        model.height,
      )
      const sw = base.sw / start.zoom
      const sh = base.sh / start.zoom
      const overflowX = image.naturalWidth - sw
      const overflowY = image.naturalHeight - sh
      const frame = frameRef.current
      const frameWidth = frame?.clientWidth || viewport.width
      const frameHeight = frame?.clientHeight || viewport.height

      // The sampled rectangle spans the whole frame, so a CSS-pixel drag
      // corresponds to `sw / frameWidth` source pixels.
      const shiftX =
        overflowX > 0 && frameWidth > 0
          ? (dxCss * (sw / frameWidth)) / overflowX
          : 0
      const shiftY =
        overflowY > 0 && frameHeight > 0
          ? (dyCss * (sh / frameHeight)) / overflowY
          : 0

      return {
        zoom: start.zoom,
        focusX: clamp(start.focusX - shiftX, 0, 1),
        focusY: clamp(start.focusY - shiftY, 0, 1),
      }
    },
    [image, model.width, model.height, viewport.height, viewport.width],
  )

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!image || event.button !== 0) return
    event.currentTarget.focus()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      crop: cropRef.current,
    }
    setDragging(true)
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    applyCrop(
      panFrom(drag.crop, event.clientX - drag.x, event.clientY - drag.y),
    )
  }

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    setDragging(false)
    commit(cropRef.current)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!image) return
    const deltas: Record<string, [number, number]> = {
      ArrowLeft: [KEYBOARD_STEP, 0],
      ArrowRight: [-KEYBOARD_STEP, 0],
      ArrowUp: [0, KEYBOARD_STEP],
      ArrowDown: [0, -KEYBOARD_STEP],
    }
    const delta = deltas[event.key]
    if (!delta) return

    event.preventDefault()
    const next = panFrom(cropRef.current, delta[0], delta[1])
    applyCrop(next)
    commitSoon(next)
  }

  const changeZoom = (value: number) => {
    const next = normalizeCrop({ ...cropRef.current, zoom: value })
    applyCrop(next)
    commitSoon(next)
  }

  const reset = () => {
    applyCrop(DEFAULT_CROP)
    commit(DEFAULT_CROP)
  }

  return (
    <div
      className="crop-editor"
      role="group"
      aria-label={`Framing for ${name}`}
    >
      <div className="crop-editor__head">
        <p className="caps">Framing · {name}</p>
        <span className="crop-editor__status">
          {job.status === 'processing' ? 'Resizing…' : 'Drag to position'}
        </span>
      </div>

      <div className="preview-frame-wrap">
        <div
          ref={frameRef}
          className={`frame${dragging ? ' is-dragging' : ''}`}
          style={{ '--ar': `${model.width} / ${model.height}` } as CSSProperties}
          tabIndex={0}
          role="group"
          aria-roledescription="crop area"
          aria-label={`Preview of ${name}. Drag to reposition, or use the arrow keys.`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDown}
        >
          <canvas ref={canvasRef} aria-hidden="true" />
          {crop.zoom > 1.001 && <span className="hint">Drag to position</span>}
        </div>
      </div>

      {error && <p className="err-msg">{error}</p>}

      <div className="edit-row">
        <button
          type="button"
          className="zoom-btn"
          aria-label="Zoom out"
          onClick={() => changeZoom(crop.zoom - 0.2)}
          disabled={crop.zoom <= MIN_ZOOM}
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3.5 8h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <input
          type="range"
          className="zoom-range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.02}
          value={crop.zoom}
          aria-label="Zoom"
          onChange={(event) => changeZoom(Number(event.target.value))}
        />
        <button
          type="button"
          className="zoom-btn"
          aria-label="Zoom in"
          onClick={() => changeZoom(crop.zoom + 0.2)}
          disabled={crop.zoom >= MAX_ZOOM}
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M8 3.5v9M3.5 8h9"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <span className="zoom-readout">{Math.round(crop.zoom * 100)}%</span>
        <button type="button" className="reset-link" onClick={reset}>
          Reset view
        </button>
      </div>

      <div className="crop-editor__foot">
        <p className="file-meta">
          Loaded <b>{name}</b>
          {image && (
            <>
              {' '}
              · {image.naturalWidth} × {image.naturalHeight} px source
            </>
          )}
        </p>
        {jobCount > 1 && (
          <button
            type="button"
            className="reset-link crop-editor__apply"
            onClick={() => onApplyToAll(cropRef.current)}
          >
            Use this framing for all
          </button>
        )}
      </div>
    </div>
  )
}
