import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Diff from "../Diff";
import config from "../../config";

vi.mock("react-diff-viewer-continued", () => ({
  default: (props) => (
    <div
      data-testid="diff-viewer"
      data-old={props.oldValue}
      data-new={props.newValue}
      data-split={String(props.splitView)}
      data-compare={props.compareMethod ?? ""}
    />
  ),
}));

describe("Diff", () => {
  const originalConfig = { ...config };

  beforeEach(() => {
    Object.assign(config, originalConfig);
  });

  afterEach(() => {
    Object.assign(config, originalConfig);
  });

  it("shows an error when lines exceed max length", () => {
    config.maxPermittedLineLength = 3;
    render(<Diff left={"abcd"} right={"x"} options={{}} />);

    expect(
      screen.getByText(/Can not calculate line differences/i),
    ).toBeInTheDocument();
  });

  it("shows identical message when content matches", () => {
    render(<Diff left={"same"} right={"same"} options={{}} />);
    expect(screen.getByText("Content is identical")).toBeInTheDocument();
  });

  it("renders the diff viewer with provided options", () => {
    render(
      <Diff
        left={"a"}
        right={"b"}
        options={{ splitView: true, compareMethod: "diffWords" }}
      />,
    );

    const viewer = screen.getByTestId("diff-viewer");
    expect(viewer.dataset.old).toBe("a");
    expect(viewer.dataset.new).toBe("b");
    expect(viewer.dataset.split).toBe("true");
    expect(viewer.dataset.compare).toBe("diffWords");
  });
});
