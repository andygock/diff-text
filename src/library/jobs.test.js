import { describe, it, expect, vi, afterEach } from "vitest";
import { startJob } from "./jobs";
import config from "../config";
function fakeWorker() {
  const listeners = {};
  return {
    addEventListener: (type, handler) => {
      listeners[type] = handler;
    },
    terminate: vi.fn(),
    postMessage: vi.fn(),
    emit: (type, event) => listeners[type](event),
  };
}
afterEach(() => vi.useRealTimers());
describe("worker lifecycle", () => {
  it("matches job IDs, reports stages, settles once and terminates", async () => {
    const worker = fakeWorker();
    const progress = vi.fn();
    const job = startJob("compare", {}, progress, () => worker);
    const id = worker.postMessage.mock.calls[0][0].id;
    worker.emit("message", {
      data: { id: -1, type: "result", result: "wrong" },
    });
    worker.emit("message", {
      data: { id, type: "progress", message: "Reading" },
    });
    worker.emit("message", { data: { id, type: "result", result: "correct" } });
    worker.emit("message", {
      data: { id, type: "result", result: "duplicate" },
    });
    expect(await job.promise).toBe("correct");
    expect(progress).toHaveBeenCalledWith("Reading");
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });
  it.each(["error", "messageerror"])(
    "settles a worker %s event",
    async (type) => {
      const worker = fakeWorker();
      const job = startJob("parse", {}, undefined, () => worker);
      worker.emit(type, {});
      await expect(job.promise).rejects.toThrow();
      expect(worker.terminate).toHaveBeenCalledOnce();
    },
  );
  it("terminates a hung job at the deadline", async () => {
    vi.useFakeTimers();
    const worker = fakeWorker();
    const job = startJob("parse", {}, undefined, () => worker);
    const rejection = expect(job.promise).rejects.toThrow("too long");
    await vi.advanceTimersByTimeAsync(config.jobTimeout);
    await rejection;
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
  it("cancels synchronously and ignores late results", async () => {
    const worker = fakeWorker();
    const job = startJob("parse", {}, undefined, () => worker);
    job.cancel();
    const id = worker.postMessage.mock.calls[0][0].id;
    worker.emit("message", { data: { id, type: "result", result: "late" } });
    await expect(job.promise).rejects.toMatchObject({ name: "AbortError" });
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
  it("cleans up after a postMessage failure", async () => {
    const worker = fakeWorker();
    worker.postMessage.mockImplementation(() => {
      throw new Error("Cannot clone");
    });
    const job = startJob("parse", {}, undefined, () => worker);
    await expect(job.promise).rejects.toThrow("Cannot clone");
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
});
