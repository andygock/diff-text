import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import DiffViewerOptions from "../DiffViewerOptions";
const options = {
  compareMethod: "diffChars",
  ignoreWhitespace: false,
  ignoreLineEndings: false,
};
describe("DiffViewerOptions", () => {
  it("exposes labelled native controls and updates semantic options", () => {
    const onChange = vi.fn();
    render(
      <DiffViewerOptions
        options={options}
        onChange={onChange}
        splitView
        onViewChange={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Comparison detail"), {
      target: { value: "diffWords" },
    });
    expect(onChange).toHaveBeenCalledWith({ compareMethod: "diffWords" });
    fireEvent.click(screen.getByLabelText("Ignore whitespace"));
    expect(onChange).toHaveBeenCalledWith({ ignoreWhitespace: true });
    fireEvent.click(screen.getByLabelText("Ignore line endings"));
    expect(onChange).toHaveBeenCalledWith({ ignoreLineEndings: true });
  });
  it("switches layout independently of comparison options", () => {
    const onViewChange = vi.fn();
    render(
      <DiffViewerOptions
        options={options}
        onChange={vi.fn()}
        splitView
        onViewChange={onViewChange}
      />,
    );
    expect(screen.getByRole("button", { name: "Split" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Unified" }));
    expect(onViewChange).toHaveBeenCalledWith(false);
  });
});
