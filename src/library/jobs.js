import config from "../config";

let sequence = 0;
// Each job owns a worker. Termination interrupts synchronous algorithms;
// a queued cancel message cannot interrupt JavaScript already executing.
/**
 * @template {keyof import("./contracts").JobPayloads} T
 * @param {T} type
 * @param {import("./contracts").JobPayloads[T]} payload
 * @param {(message: string) => void} onProgress
 * @param {() => Worker} factory
 */
export function startJob(
  type,
  payload,
  onProgress = () => {},
  factory = () =>
    new Worker(new URL("../workers/parseWorker.js", import.meta.url), {
      type: "module",
    }),
) {
  let worker;
  let timer;
  let settled = false;
  let rejectJob;
  const id = ++sequence;
  const cleanup = () => {
    clearTimeout(timer);
    worker?.terminate();
  };
  /** @type {Promise<import("./contracts").JobResults[T]>} */
  const promise = new Promise((resolve, reject) => {
    rejectJob = reject;
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve(result);
    };
    try {
      worker = factory();
      worker.addEventListener("message", ({ data }) => {
        if (settled || data?.id !== id) return;
        if (data.type === "progress") onProgress(data.message);
        if (data.type === "result") finish(null, data.result);
        if (data.type === "error") finish(new Error(data.message));
      });
      worker.addEventListener("error", (event) => {
        event.preventDefault?.();
        finish(new Error("Background processing failed. Please try again."));
      });
      worker.addEventListener("messageerror", () =>
        finish(new Error("Unable to read the background result.")),
      );
      timer = setTimeout(
        () =>
          finish(
            new Error(
              "Processing took too long. Try a smaller file or line comparison.",
            ),
          ),
        config.jobTimeout,
      );
      worker.postMessage({ id, type, ...payload });
    } catch (error) {
      finish(error);
    }
  });
  return {
    promise,
    cancel() {
      if (settled) return;
      settled = true;
      cleanup();
      rejectJob(new DOMException("Cancelled", "AbortError"));
    },
  };
}
