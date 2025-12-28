import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import DiffViewerOptions from "../DiffViewerOptions";

afterEach(() => {
  cleanup();
});

describe("DiffViewerOptions", () => {
  it("renders full labels on large screens", () => {
    window.innerWidth = 1600;
    render(
      <DiffViewerOptions
        options={{ compareMethod: "diffChars", splitView: false }}
        onChange={() => {}}
      />,
    );

    expect(screen.getByText("Characters")).toBeInTheDocument();
    expect(screen.getByText("Unified")).toBeInTheDocument();
    expect(screen.getByText("Split")).toBeInTheDocument();
  });

  it("renders short labels on small screens", () => {
    window.innerWidth = 1200;
    render(
      <DiffViewerOptions
        options={{ compareMethod: "diffChars", splitView: false }}
        onChange={() => {}}
      />,
    );

    expect(screen.getByText("Ch")).toBeInTheDocument();
    expect(screen.queryByText("Characters")).not.toBeInTheDocument();
  });

  it("changes compare method selection", () => {
    window.innerWidth = 1600;
    const onChange = vi.fn();
    render(
      <DiffViewerOptions
        options={{ compareMethod: "diffChars", splitView: false }}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByLabelText("Words"));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ compareMethod: "diffWords" }),
    );
  });

  it("switches view type", () => {
    window.innerWidth = 1600;
    const onChange = vi.fn();
    render(
      <DiffViewerOptions
        options={{ compareMethod: "diffChars", splitView: false }}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByLabelText("Split"));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ splitView: true }),
    );
  });
});
