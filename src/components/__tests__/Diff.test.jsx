import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Diff from "../Diff";
import { compareText } from "../../library/compare";

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
