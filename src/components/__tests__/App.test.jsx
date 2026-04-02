import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "../App";
import { initialLeft, initialRight } from "../../library/inputs";

vi.mock("../TextInput", () => ({
  default: (props) => (
    <div data-testid="text-input" data-line={props.scrollRequest?.line ?? ""}>
      {props.value}
    </div>
  ),
}));

vi.mock("../Diff", () => ({
  default: (props) => (
    <div data-testid="diff-output">
      <button
        data-testid="click-left"
        onClick={() =>
          props.onLineNumberClick && props.onLineNumberClick("L-2")
        }
      >
        L-2
      </button>
      <button
        data-testid="click-right"
        onClick={() =>
          props.onLineNumberClick && props.onLineNumberClick("R-3")
        }
      >
        R-3
      </button>
      <button
        data-testid="click-invalid"
        onClick={() =>
          props.onLineNumberClick && props.onLineNumberClick("X-4")
        }
      >
        X-4
      </button>
      <button
        data-testid="click-undefined"
        onClick={() =>
          props.onLineNumberClick && props.onLineNumberClick("undefined-5")
        }
      >
        undefined-5
      </button>
    </div>
  ),
}));

vi.mock("../DiffViewerOptions", () => ({
  default: () => <div data-testid="options" />,
}));

describe("App", () => {
  it("renders the initial inputs and swaps them", () => {
    const { getAllByTestId, getByText } = render(<App />);
    const inputs = getAllByTestId("text-input");
    const normalize = (text) => text.replace(/\s+/g, " ").trim();
    expect(normalize(inputs[0].textContent || "")).toBe(normalize(initialLeft));
    expect(normalize(inputs[1].textContent || "")).toBe(
      normalize(initialRight),
    );

    const button = getByText("↔");
    fireEvent.click(button);

    const swapped = getAllByTestId("text-input");
    expect(normalize(swapped[0].textContent || "")).toBe(
      normalize(initialRight),
    );
    expect(normalize(swapped[1].textContent || "")).toBe(
      normalize(initialLeft),
    );
  });

  it("handleLineNumberClick parses only L/R prefixes and ignores others", async () => {
    const { getByTestId, getAllByTestId } = render(<App />);

    // click a valid left-line button, expect left scrollRequest to update
    const diffOutputs = getAllByTestId("diff-output");
    const diffOutput = diffOutputs[0];
    const clickLeft = within(diffOutput).getByTestId("click-left");
    fireEvent.click(clickLeft);
    await screen.findAllByTestId("text-input");
    const inputsAfter = getAllByTestId("text-input");
    expect(inputsAfter[0].dataset.line).toBe("2");

    // clicking an invalid prefix should not change the recorded line
    const clickInvalid = within(diffOutput).getByTestId("click-invalid");
    fireEvent.click(clickInvalid);
    const inputsAfterInvalid = getAllByTestId("text-input");
    expect(inputsAfterInvalid[0].dataset.line).toBe("2");

    // previously tolerated 'undefined-...' should be ignored now
    const clickUndefined = within(diffOutput).getByTestId("click-undefined");
    fireEvent.click(clickUndefined);
    const inputsAfterUndef = getAllByTestId("text-input");
    expect(inputsAfterUndef[0].dataset.line).toBe("2");
  });
});
