import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_MODEL_SLUG, getModel, MODELS_BY_SLUG } from '../lib/models'
import { ImageProcessor, bytesToPngBlob } from '../lib/processor'
import { replaceExtension, uniquePath } from '../lib/paths'
import type { IntakeFile } from '../lib/intake'
import {
  pickDirectory,
  saveBlob,
  supportsDirectoryPicker,
  writeToDirectory,
} from '../lib/download'
import { zipBlob, type ZipEntry } from '../lib/zip'

export type JobStatus = 'queued' | 'processing' | 'done' | 'error'

export interface JobResult {
  blob: Blob
  url: string
  width: number
  height: number
  bytes: number
  grayscale: boolean
}

export interface Job {
  id: string
  file: File
  /** Input path relative to the dropped/selected root. */
  path: string
  /** Output path inside the ZIP or chosen folder. */
  outputPath: string
  status: JobStatus
  result?: JobResult
  error?: string
}

export interface BatchStats {
  total: number
  done: number
  failed: number
  processing: boolean
  pending: number
}

export interface SaveState {
  running: boolean
  done: number
  total: number
  current: string
}

const SETTINGS_KEY = 'kwallp:settings'

interface Settings {
  model: string
  grayscale: boolean
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Settings>
      return {
        model:
          typeof parsed.model === 'string' && MODELS_BY_SLUG.has(parsed.model)
            ? parsed.model
            : DEFAULT_MODEL_SLUG,
        grayscale:
          typeof parsed.grayscale === 'boolean' ? parsed.grayscale : true,
      }
    }
  } catch {
    // Ignore unreadable storage (private mode, corrupted value).
  }
  return { model: DEFAULT_MODEL_SLUG, grayscale: true }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

let idCounter = 0
function nextId(): string {
  idCounter += 1
  return `job-${Date.now().toString(36)}-${idCounter}`
}

export function useBatch() {
  const initialRef = useRef<Settings | null>(null)
  const initial = initialRef.current ?? (initialRef.current = loadSettings())

  const [modelSlug, setModelSlug] = useState(initial.model)
  const [grayscale, setGrayscale] = useState(initial.grayscale)
  const [jobs, setJobs] = useState<Job[]>([])
  const [saveState, setSaveState] = useState<SaveState>({
    running: false,
    done: 0,
    total: 0,
    current: '',
  })
  const [actionError, setActionError] = useState<string | null>(null)

  const jobsRef = useRef<Job[]>([])
  const modelRef = useRef(modelSlug)
  const grayscaleRef = useRef(grayscale)
  const generationRef = useRef(0)
  const runningRef = useRef(false)

  const processorRef = useRef<ImageProcessor | null>(null)
  if (!processorRef.current) processorRef.current = new ImageProcessor()

  const commit = useCallback((updater: (current: Job[]) => Job[]) => {
    const next = updater(jobsRef.current)
    jobsRef.current = next
    setJobs(next)
  }, [])

  const patchJob = useCallback(
    (id: string, patch: Partial<Job>) => {
      commit((current) =>
        current.map((job) => (job.id === id ? { ...job, ...patch } : job)),
      )
    },
    [commit],
  )

  const pump = useCallback(async () => {
    if (runningRef.current) return
    runningRef.current = true

    try {
      for (;;) {
        const generation = generationRef.current
        const job = jobsRef.current.find((candidate) => candidate.status === 'queued')
        if (!job) break

        patchJob(job.id, { status: 'processing', error: undefined })
        const model = getModel(modelRef.current)

        try {
          const result = await processorRef.current!.process(job.file, {
            width: model.width,
            height: model.height,
            grayscale: grayscaleRef.current,
          })

          if (generationRef.current !== generation) break

          // The job may have been removed while it was being processed.
          if (!jobsRef.current.some((candidate) => candidate.id === job.id)) {
            continue
          }

          const blob = bytesToPngBlob(result.png)
          const url = URL.createObjectURL(blob)
          patchJob(job.id, {
            status: 'done',
            result: {
              blob,
              url,
              width: result.width,
              height: result.height,
              bytes: blob.size,
              grayscale: grayscaleRef.current,
            },
          })
        } catch (error) {
          if (generationRef.current !== generation) break
          patchJob(job.id, { status: 'error', error: messageOf(error) })
        }
      }
    } finally {
      runningRef.current = false
      // Settings may have changed while a job was in flight.
      if (jobsRef.current.some((job) => job.status === 'queued')) {
        void pump()
      }
    }
  }, [patchJob])

  const restart = useCallback(() => {
    generationRef.current += 1
    commit((current) =>
      current.map((job) => {
        if (job.result) URL.revokeObjectURL(job.result.url)
        return {
          ...job,
          status: 'queued' as const,
          result: undefined,
          error: undefined,
        }
      }),
    )
    void pump()
  }, [commit, pump])

  const persist = useCallback((model: string, gray: boolean) => {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ model, grayscale: gray }),
      )
    } catch {
      // Storage may be unavailable; settings simply won't persist.
    }
  }, [])

  const chooseModel = useCallback(
    (slug: string) => {
      if (!MODELS_BY_SLUG.has(slug) || slug === modelRef.current) return
      modelRef.current = slug
      setModelSlug(slug)
      persist(slug, grayscaleRef.current)
      restart()
    },
    [persist, restart],
  )

  const chooseGrayscale = useCallback(
    (gray: boolean) => {
      if (gray === grayscaleRef.current) return
      grayscaleRef.current = gray
      setGrayscale(gray)
      persist(modelRef.current, gray)
      restart()
    },
    [persist, restart],
  )

  const addFiles = useCallback(
    (incoming: readonly IntakeFile[]) => {
      if (incoming.length === 0) return

      const taken = new Set(jobsRef.current.map((job) => job.outputPath))
      const additions: Job[] = incoming.map(({ file, path }) => ({
        id: nextId(),
        file,
        path,
        outputPath: uniquePath(replaceExtension(path, '.png'), taken),
        status: 'queued',
      }))

      commit((current) => [...current, ...additions])
      void pump()
    },
    [commit, pump],
  )

  const removeJob = useCallback(
    (id: string) => {
      commit((current) => {
        const job = current.find((candidate) => candidate.id === id)
        if (job?.result) URL.revokeObjectURL(job.result.url)
        return current.filter((candidate) => candidate.id !== id)
      })
    },
    [commit],
  )

  const clearAll = useCallback(() => {
    generationRef.current += 1
    commit((current) => {
      for (const job of current) {
        if (job.result) URL.revokeObjectURL(job.result.url)
      }
      return []
    })
  }, [commit])

  const doneJobs = useCallback(
    () => jobsRef.current.filter((job) => job.status === 'done' && job.result),
    [],
  )

  const downloadOne = useCallback((job: Job) => {
    if (!job.result) return
    const filename = job.outputPath.split('/').pop() ?? `${job.id}.png`
    saveBlob(job.result.blob, filename)
  }, [])

  const downloadAll = useCallback(async () => {
    setActionError(null)
    const jobsToZip = doneJobs()
    if (jobsToZip.length === 0) return

    try {
      const entries: ZipEntry[] = []
      for (const job of jobsToZip) {
        const data = new Uint8Array(await job.result!.blob.arrayBuffer())
        entries.push({ path: job.outputPath, data })
      }
      saveBlob(zipBlob(entries), `kwallp-${modelRef.current}.zip`)
    } catch (error) {
      setActionError(messageOf(error))
    }
  }, [doneJobs])

  const saveAll = useCallback(async () => {
    setActionError(null)
    const jobsToSave = doneJobs()
    if (jobsToSave.length === 0) return
    if (!supportsDirectoryPicker()) {
      setActionError('This browser cannot save into a folder. Use the ZIP download.')
      return
    }

    try {
      const directory = await pickDirectory()
      if (!directory) return

      setSaveState({
        running: true,
        done: 0,
        total: jobsToSave.length,
        current: '',
      })

      await writeToDirectory(
        directory,
        jobsToSave.map((job) => ({
          path: job.outputPath,
          blob: job.result!.blob,
        })),
        (done, total, current) =>
          setSaveState({ running: true, done, total, current }),
      )
      setSaveState({
        running: false,
        done: jobsToSave.length,
        total: jobsToSave.length,
        current: '',
      })
    } catch (error) {
      setSaveState({
        running: false,
        done: 0,
        total: 0,
        current: '',
      })
      setActionError(messageOf(error))
    }
  }, [doneJobs])

  const stats = useMemo<BatchStats>(() => {
    const done = jobs.filter((job) => job.status === 'done').length
    const failed = jobs.filter((job) => job.status === 'error').length
    const processing = jobs.some((job) => job.status === 'processing')
    return {
      total: jobs.length,
      done,
      failed,
      processing,
      pending: jobs.length - done - failed,
    }
  }, [jobs])

  useEffect(() => {
    return () => {
      processorRef.current?.dispose()
    }
  }, [])

  return {
    jobs,
    modelSlug,
    grayscale,
    stats,
    saveState,
    actionError,
    chooseModel,
    chooseGrayscale,
    addFiles,
    removeJob,
    clearAll,
    reprocess: restart,
    downloadOne,
    downloadAll,
    saveAll,
    canSaveToFolder: supportsDirectoryPicker(),
    dismissError: () => setActionError(null),
  }
}
