import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "../App";
import { initialLeft, initialRight } from "../../library/inputs";

vi.mock("../TextInput", () => ({
  default: (props) => (
    <div data-testid="text-input">{props.value}</div>
  ),
}));

vi.mock("../Diff", () => ({
  default: () => <div data-testid="diff-output" />,
}));

vi.mock("../DiffViewerOptions", () => ({
  default: () => <div data-testid="options" />,
}));

describe("App", () => {
  it("renders the initial inputs and swaps them", () => {
    render(<App />);

    const inputs = screen.getAllByTestId("text-input");
    const normalize = (text) => text.replace(/\s+/g, " ").trim();
    expect(normalize(inputs[0].textContent || "")).toBe(normalize(initialLeft));
    expect(normalize(inputs[1].textContent || "")).toBe(normalize(initialRight));

    const button = screen.getByRole("button");
    fireEvent.click(button);

    const swapped = screen.getAllByTestId("text-input");
    expect(normalize(swapped[0].textContent || "")).toBe(
      normalize(initialRight),
    );
    expect(normalize(swapped[1].textContent || "")).toBe(
      normalize(initialLeft),
    );
  });
});
