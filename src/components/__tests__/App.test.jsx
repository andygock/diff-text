import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import App from "../App";
import { startJob } from "../../library/jobs";
import { compareText } from "../../library/compare";
vi.mock("../../library/jobs", () => ({ startJob: vi.fn() }));
beforeEach(() => {
  vi.useFakeTimers();
  startJob.mockImplementation((type, data) => ({
    promise:
      type === "compare"
        ? Promise.resolve(compareText(data.left, data.right, data.options))
        : new Promise(() => {}),
    cancel: vi.fn(),
  }));
});
afterEach(() => vi.useRealTimers());
const advance = () =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
describe("App", () => {
  it("does not recompute when changing only the layout", async () => {
    render(<App />);
    await advance();
    const calls = startJob.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Unified" }));
    await advance();
    expect(startJob.mock.calls.length).toBe(calls);
  });
  it("swaps the visible latest text without waiting for comparison", async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Original"), {
      target: { value: "just typed" },
    });
    fireEvent.change(screen.getByLabelText("Modified"), {
      target: { value: "right value" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Swap original and modified" }),
    );
    expect(screen.getByLabelText("Original")).toHaveValue("right value");
    expect(screen.getByLabelText("Modified")).toHaveValue("just typed");
    await advance();
    expect(screen.getByLabelText("Modified")).toHaveValue("just typed");
  });
  it("marks results stale immediately and waits for Compare in manual mode", async () => {
    render(<App />);
    await advance();
    expect(screen.getByText("Comparison up to date")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Manual"));
    fireEvent.change(screen.getByLabelText("Original"), {
      target: { value: "changed" },
    });
    expect(screen.getByText("Previous result")).toBeInTheDocument();
    const before = startJob.mock.calls.length;
    await advance();
    expect(startJob.mock.calls.length).toBe(before);
    fireEvent.click(screen.getByRole("button", { name: /Compare/ }));
    await advance();
    expect(startJob.mock.calls.length).toBe(before + 1);
    expect(screen.queryByText("Previous result")).not.toBeInTheDocument();
  });
  it("cancels imports on swap", () => {
    const cancel = vi.fn();
    startJob.mockReturnValue({ promise: new Promise(() => {}), cancel });
    render(<App />);
    fireEvent.drop(screen.getByRole("region", { name: "Original editor" }), {
      dataTransfer: { files: [{ name: "file.txt", size: 1 }] },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Swap original and modified" }),
    );
    expect(cancel).toHaveBeenCalled();
  });
  it("switching to manual during comparison leaves a usable Compare button", async () => {
    startJob.mockReturnValue({
      promise: new Promise(() => {}),
      cancel: vi.fn(),
    });
    render(<App />);
    await advance();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Manual"));
    expect(screen.getByRole("button", { name: /Compare/ })).toBeInTheDocument();
  });
});
