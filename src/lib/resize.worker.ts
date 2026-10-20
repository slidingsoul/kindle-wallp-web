import { toArrayBuffer } from './bytes'
import { processBlob } from './pipeline'
import type { WorkerRequest, WorkerResponse } from './types'

interface WorkerScope {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null
  postMessage(message: WorkerResponse, transfer?: Transferable[]): void
}

const scope = self as unknown as WorkerScope

scope.onmessage = (event) => {
  const { id, file, width, height, grayscale } = event.data

  void (async () => {
    try {
      const result = await processBlob(file, { width, height, grayscale })
      const png = toArrayBuffer(result.png)
      scope.postMessage(
        {
          id,
          ok: true,
          png,
          width: result.width,
          height: result.height,
          channels: result.channels,
        },
        [png],
      )
    } catch (error) {
      scope.postMessage({
        id,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  })()
}
