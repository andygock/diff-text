import { parentPort, workerData } from "node:worker_threads";

// Adapt only the worker transport so the production browser bundle runs intact.
globalThis.self = {
  addEventListener: (type, handler) => {
    if (type === "message")
      parentPort.on("message", (data) => {
        // Node 22 clones File as Blob, unlike browsers. Restore the filename
        // carried alongside the fixture before calling the production handler.
        if (data.file && !data.file.name && workerData.fileName) {
          Object.defineProperty(data.file, "name", {
            value: workerData.fileName,
          });
        }
        handler({ data });
      });
  },
  postMessage: (data) => parentPort.postMessage(data),
};
await import(workerData.entry);
