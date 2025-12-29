import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import TextInput from "../TextInput";
import config from "../../config";
import { showError } from "../../library/toaster";
import * as XLSX from "xlsx";

let lastDropzoneProps = null;

vi.mock("react-dropzone-textarea", () => ({
  default: (props) => {
    lastDropzoneProps = props;
    return (
      <textarea
        data-testid="dropzone"
        value={props.value}
        onChange={props.onChange}
      />
    );
  },
}));

vi.mock("../../library/toaster", () => ({
  showError: vi.fn(),
  showMessage: vi.fn(),
}));

vi.mock("xlsx", () => ({
  read: vi.fn(),
  utils: {
    sheet_to_csv: vi.fn(),
  },
}));

const toArrayBuffer = (text) => new TextEncoder().encode(text).buffer;

describe("TextInput", () => {
  const originalConfig = { ...config };

  beforeEach(() => {
    lastDropzoneProps = null;
    vi.clearAllMocks();
    Object.assign(config, originalConfig);
  });

  afterEach(() => {
    Object.assign(config, originalConfig);
  });

  it("updates via onChange", async () => {
    const onUpdate = vi.fn();
    render(<TextInput value="hello" onUpdate={onUpdate} />);

    const textarea = document.querySelector('[data-testid="dropzone"]');
    fireEvent.change(textarea, { target: { value: "next" } });
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith("next");
    });
  });

  it("ignores non-string onDropRead values", () => {
    const onUpdate = vi.fn();
    render(<TextInput value="" onUpdate={onUpdate} />);

    lastDropzoneProps.onDropRead(null);
    expect(onUpdate).not.toHaveBeenCalled();

    lastDropzoneProps.onDropRead("ok");
    expect(onUpdate).toHaveBeenCalledWith("ok");
  });

  it("rejects missing arrayBuffer", async () => {
    render(<TextInput value="" onUpdate={() => {}} />);

    const result = await lastDropzoneProps.customTextConverter(null, {
      file: { name: "file.txt" },
    });
    expect(result).toBeNull();
    expect(showError).toHaveBeenCalledWith("Error: No file data to read");
  });

  it("rejects binary files", async () => {
    render(<TextInput value="" onUpdate={() => {}} />);

    const bytes = new Uint8Array(100).fill(0);
    const result = await lastDropzoneProps.customTextConverter(bytes.buffer, {
      file: { name: "file.bin" },
    });
    expect(result).toBeNull();
    expect(showError).toHaveBeenCalled();
  });

  it("rejects oversized files", async () => {
    render(<TextInput value="" onUpdate={() => {}} />);
    config.maxFileSize = 4;

    const result = await lastDropzoneProps.customTextConverter(
      new Uint8Array(10).buffer,
      { file: { name: "file.txt" } },
    );
    expect(result).toBeNull();
    expect(showError).toHaveBeenCalled();
  });

  it("rejects too many text lines", async () => {
    render(<TextInput value="" onUpdate={() => {}} />);
    config.maxLines = 2;

    const text = "a\nb\nc\n";
    const result = await lastDropzoneProps.customTextConverter(
      toArrayBuffer(text),
      { file: { name: "file.txt" } },
    );
    expect(result).toBeNull();
    expect(showError).toHaveBeenCalled();
  });

  it("rejects overly long text lines", async () => {
    render(<TextInput value="" onUpdate={() => {}} />);
    config.maxPermittedLineLength = 3;

    const text = "abcd\n";
    const result = await lastDropzoneProps.customTextConverter(
      toArrayBuffer(text),
      { file: { name: "file.txt" } },
    );
    expect(result).toBeNull();
    expect(showError).toHaveBeenCalled();
  });

  it("parses spreadsheets and trims trailing empty lines", async () => {
    render(<TextInput value="" onUpdate={() => {}} />);

    XLSX.read.mockReturnValue({
      SheetNames: ["Sheet1"],
      Sheets: { Sheet1: {} },
    });
    XLSX.utils.sheet_to_csv.mockReturnValue("a,b\nc,d\n\n");

    const result = await lastDropzoneProps.customTextConverter(
      new ArrayBuffer(8),
      { file: { name: "file.xlsx" } },
    );
    expect(result).toBe("a,b\nc,d\n\n");
  });

  it("rejects spreadsheets with no worksheets", async () => {
    render(<TextInput value="" onUpdate={() => {}} />);

    XLSX.read.mockReturnValue({
      SheetNames: [],
      Sheets: {},
    });

    const result = await lastDropzoneProps.customTextConverter(
      new ArrayBuffer(8),
      { file: { name: "file.xlsx" } },
    );
    expect(result).toBeNull();
    expect(showError).toHaveBeenCalledWith(
      "Error: Spreadsheet has no worksheets",
    );
  });

  it("rejects spreadsheets that exceed max lines", async () => {
    render(<TextInput value="" onUpdate={() => {}} />);
    config.maxLines = 1;

    XLSX.read.mockReturnValue({
      SheetNames: ["Sheet1"],
      Sheets: { Sheet1: {} },
    });
    XLSX.utils.sheet_to_csv.mockReturnValue("a\nb\n");

    const result = await lastDropzoneProps.customTextConverter(
      new ArrayBuffer(8),
      { file: { name: "file.xlsx" } },
    );
    expect(result).toBeNull();
    expect(showError).toHaveBeenCalled();
  });

  it("rejects spreadsheets with overly long lines", async () => {
    render(<TextInput value="" onUpdate={() => {}} />);
    config.maxPermittedLineLength = 3;

    XLSX.read.mockReturnValue({
      SheetNames: ["Sheet1"],
      Sheets: { Sheet1: {} },
    });
    XLSX.utils.sheet_to_csv.mockReturnValue("abcd\n");

    const result = await lastDropzoneProps.customTextConverter(
      new ArrayBuffer(8),
      { file: { name: "file.xlsx" } },
    );
    expect(result).toBeNull();
    expect(showError).toHaveBeenCalled();
  });
});
