import React, { createRef } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TextInput from "../TextInput";
import { startJob } from "../../library/jobs";
vi.mock("../../library/jobs", () => ({ startJob: vi.fn() }));

const document = { text: "original", revision: 1, name: "", sheets: [] };
function deferredJob() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  // Resolve can still be delivered after cancel to exercise the generation guard.
  return { promise, resolve, reject, cancel: vi.fn() };
}
const drop = (file) =>
  fireEvent.drop(screen.getByRole("region", { name: "Original editor" }), {
    dataTransfer: { files: [file] },
  });

beforeEach(() => vi.clearAllMocks());
describe("TextInput", () => {
  it("commits typing immediately without a stale debounce timer", () => {
    const onUpdate = vi.fn();
    render(<TextInput side="left" document={document} onUpdate={onUpdate} />);
    fireEvent.change(screen.getByLabelText("Original"), {
      target: { value: "latest" },
    });
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ text: "latest" }),
    );
  });
  it("accepts only the newest import even if an old result arrives late", async () => {
    const first = deferredJob();
    const second = deferredJob();
    startJob.mockReturnValueOnce(first).mockReturnValueOnce(second);
    const onUpdate = vi.fn();
    render(<TextInput side="left" document={document} onUpdate={onUpdate} />);
    drop({ name: "first.txt", size: 1 });
    drop({ name: "second.txt", size: 1 });
    await act(async () => second.resolve({ text: "new", sheets: [] }));
    await act(async () => first.resolve({ text: "old", sheets: [] }));
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ text: "new" }),
    );
    expect(first.cancel).toHaveBeenCalled();
  });
  it("typing invalidates an import and unmount cancels work", async () => {
    const job = deferredJob();
    startJob.mockReturnValue(job);
    const onUpdate = vi.fn();
    const { unmount } = render(
      <TextInput side="left" document={document} onUpdate={onUpdate} />,
    );
    drop({ name: "file.txt", size: 1 });
    fireEvent.change(screen.getByLabelText("Original"), {
      target: { value: "typed" },
    });
    await act(async () => job.resolve({ text: "late", sheets: [] }));
    expect(onUpdate).toHaveBeenCalledTimes(1);
    drop({ name: "another.txt", size: 1 });
    unmount();
    expect(job.cancel).toHaveBeenCalled();
  });
  it("keeps an import error visible and preserves the text", async () => {
    const job = deferredJob();
    startJob.mockReturnValue(job);
    const onUpdate = vi.fn();
    render(<TextInput side="left" document={document} onUpdate={onUpdate} />);
    drop({ name: "file.txt", size: 1 });
    await act(async () => job.reject(new Error("Invalid encoding")));
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid encoding");
    expect(screen.getByLabelText("Original")).toHaveValue("original");
    expect(onUpdate).not.toHaveBeenCalled();
  });
  it("rejects oversized files before creating a worker", () => {
    render(<TextInput side="left" document={document} onUpdate={vi.fn()} />);
    drop({ name: "large.txt", size: 11 * 1024 * 1024 });
    expect(startJob).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("10 MiB");
  });
  it("retries the failed file when the encoding changes", async () => {
    const first = deferredJob();
    const second = deferredJob();
    startJob.mockReturnValueOnce(first).mockReturnValueOnce(second);
    render(
      <TextInput
        side="left"
        document={{ ...document, file: { name: "previous.txt" } }}
        onUpdate={vi.fn()}
      />,
    );
    const failedFile = { name: "legacy.txt", size: 1 };
    drop(failedFile);
    await act(async () => first.reject(new Error("Invalid encoding")));
    fireEvent.change(screen.getByLabelText("Original encoding"), {
      target: { value: "windows-1252" },
    });
    expect(startJob).toHaveBeenLastCalledWith(
      "parse",
      expect.objectContaining({ file: failedFile, encoding: "windows-1252" }),
      expect.any(Function),
    );
  });
  it("selects the requested source line and turns wrapping off for accurate navigation", () => {
    const ref = createRef();
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback();
      return 1;
    });
    render(
      <TextInput
        ref={ref}
        side="left"
        document={{ ...document, text: "a\nbb\nccc" }}
        onUpdate={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Wrap" }));
    act(() => ref.current.goToLine(3));
    const editor = screen.getByLabelText("Original");
    expect(editor.selectionStart).toBe(5);
    expect(editor.selectionEnd).toBe(8);
    expect(editor).toHaveAttribute("wrap", "off");
  });
});
