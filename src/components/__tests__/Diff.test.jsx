import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import Diff from "../Diff";
import { compareText } from "../../library/compare";

afterEach(() => vi.unstubAllGlobals());
describe("Diff", () => {
  it("shows exact equality and preserves EOF changes", () => {
    render(
      <Diff
        result={compareText("same", "same")}
        splitView={false}
        onNavigate={vi.fn()}
      />,
    );
    expect(screen.getByText("Content is identical")).toBeInTheDocument();
  });
  it("renders EOF markers and maps navigation to aligned source lines", () => {
    const navigate = vi.fn();
    const result = compareText("a\nb", "inserted\na\nb\n");
    render(<Diff result={result} splitView onNavigate={navigate} />);
    expect(screen.getByText("No newline")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Go to original line 2" }),
    );
    expect(navigate).toHaveBeenCalledWith(
      expect.objectContaining({
        left: expect.objectContaining({ number: 2 }),
        right: expect.objectContaining({ number: 3 }),
      }),
      "left",
    );
  });
  it("keeps mounted rows bounded for a large expanded diff", () => {
    const result = compareText("a\n".repeat(10000), "b\n".repeat(10000), {
      compareMethod: "diffLines",
    });
    const { container } = render(
      <Diff result={result} splitView onNavigate={vi.fn()} />,
    );
    fireEvent.click(screen.getByLabelText("Show unchanged"));
    expect(container.querySelectorAll(".diff-row").length).toBeLessThan(60);
    fireEvent.scroll(
      screen.getByRole("region", { name: "Comparison results" }),
      { target: { scrollTop: 200000 } },
    );
    expect(container.querySelectorAll(".diff-row").length).toBeLessThan(60);
  });
  it("disables source navigation while showing a stale result", () => {
    render(
      <Diff
        result={compareText("a", "b")}
        splitView
        stale
        onNavigate={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Go to original line 1" }),
    ).toBeDisabled();
  });
  it("wraps output rows when requested", () => {
    render(
      <Diff
        result={compareText("a".repeat(300), "b".repeat(300))}
        splitView
        wrapOutput
        onNavigate={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("region", { name: "Comparison results" }),
    ).toHaveClass("wrap-output");
  });
  it("updates virtual offsets using measured row heights", () => {
    const observers = [];
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback) {
          this.callback = callback;
          observers.push(this);
        }
        observe(element) {
          this.element = element;
        }
        disconnect() {}
      },
    );
    let height = 54;
    vi.spyOn(
      window.HTMLElement.prototype,
      "getBoundingClientRect",
    ).mockImplementation(function () {
      return { height: this.classList.contains("diff-row") ? height : 18 };
    });
    const { container } = render(
      <Diff
        result={compareText("one\ntwo", "ONE\nTWO")}
        splitView
        wrapOutput
        onNavigate={vi.fn()}
      />,
    );
    const rows = container.querySelectorAll(".diff-row");
    expect(rows[1].style.top).toBe("54px");
    height = 90;
    act(() =>
      observers
        .filter((observer) => observer.element?.classList.contains("diff-row"))
        .forEach((observer) => observer.callback([])),
    );
    expect(rows[1].style.top).toBe("90px");
    expect(rows[0].style.height).toBe("");
  });
  it("keeps a distant change anchored as wrapped overscan rows are measured", () => {
    vi.spyOn(
      window.HTMLElement.prototype,
      "getBoundingClientRect",
    ).mockImplementation(() => ({ height: 54 }));
    const same = "unchanged\n".repeat(1000);
    const { container } = render(
      <Diff
        result={compareText(same + "old", same + "new")}
        splitView
        wrapOutput
        onNavigate={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByLabelText("Show unchanged"));
    fireEvent.click(screen.getByRole("button", { name: "Next change" }));
    const target = screen.getByRole("button", {
      name: "Go to original line 1001",
    });
    expect(Number.parseFloat(target.closest(".diff-row").style.top)).toBe(
      container.querySelector(".diff-viewport").scrollTop,
    );
  });
  it("renders original whitespace faithfully in word mode", () => {
    const { container } = render(
      <Diff
        result={compareText("a  b", "a b", { compareMethod: "diffWords" })}
        splitView
        onNavigate={vi.fn()}
      />,
    );
    expect(container.querySelector(".diff-cell.left code").textContent).toBe(
      "a  bNo newline",
    );
  });
  it("navigates to changes beyond the virtualised viewport", () => {
    const same = Array.from({ length: 1000 }, (_, i) => i + "\n").join("");
    render(
      <Diff
        result={compareText(same + "old", same + "new")}
        splitView
        onNavigate={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByLabelText("Show unchanged"));
    fireEvent.click(screen.getByRole("button", { name: "Next change" }));
    expect(
      screen.getByRole("button", { name: "Go to original line 1001" }),
    ).toBeInTheDocument();
  });
});
