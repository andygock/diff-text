/* global self */
// Web Worker to parse text and spreadsheet files off the main thread
import config from "../config";

// Convert ArrayBuffer to string using UTF-8
const arrayBufferToString = (arrayBuffer) =>
  new TextDecoder("utf-8").decode(arrayBuffer);

// Check first 512 bytes for control characters to guess binary files
const isBinary = (arrayBuffer) => {
  const uint8Array = new Uint8Array(arrayBuffer);
  const maxBytes = Math.min(uint8Array.byteLength, 512);

  if (maxBytes === 0) {
    return false;
  }

  let binaryBytes = 0;
  for (let i = 0; i < maxBytes; i++) {
    const byte = uint8Array[i];
    if (byte === 0x09 || byte === 0x0a || byte === 0x0d) continue;
    if (byte === 0x00 || byte < 0x20 || byte === 0x7f) binaryBytes++;
  }
  return binaryBytes / maxBytes > 0.05;
};

const isSpreadsheetFile = (file) => {
  if (!file?.name) return false;
  const ext = file.name.slice(((file.name.lastIndexOf(".") - 1) >>> 0) + 2);
  return [
    "xls",
    "xlsx",
    "xlsb",
    "xlsm",
    "dif",
    "sylk",
    "slk",
    "prn",
    "ods",
    "fods",
    "dbf",
    "wks",
    "wk1",
    "wk2",
    "wk3",
    "wk4",
    "123",
    "wq1",
    "wq2",
    "wb1",
    "wb2",
    "wb3",
    "qbw",
  ].includes(ext.toLowerCase());
};

self.addEventListener("message", async (event) => {
  const { id, type, arrayBuffer, file } = event.data || {};
  if (type !== "parse") return;

  try {
    if (!arrayBuffer) {
      self.postMessage({ id, type: "error", message: "No file data to read" });
      return;
    }

    if (arrayBuffer.byteLength >= config.maxFileSize) {
      self.postMessage({
        id,
        type: "error",
        message: "File is larger than allowed maximum",
      });
      return;
    }

    if (isSpreadsheetFile(file)) {
      self.postMessage({
        id,
        type: "progress",
        progress: 5,
        message: "Loading spreadsheet parser",
      });
      const XLSX = await import("xlsx");
      self.postMessage({
        id,
        type: "progress",
        progress: 35,
        message: "Parsing spreadsheet",
      });

      const wb = XLSX.read(arrayBuffer, { type: "array" });
      if (!wb.SheetNames || wb.SheetNames.length === 0) {
        self.postMessage({
          id,
          type: "error",
          message: "Spreadsheet has no worksheets",
        });
        return;
      }

      const ws = wb.Sheets[wb.SheetNames[0]];
      self.postMessage({
        id,
        type: "progress",
        progress: 65,
        message: "Converting sheet to CSV",
      });
      const csv = XLSX.utils.sheet_to_csv(ws);

      // trim trailing empty lines
      const lines = csv.split("\n");
      while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();

      if (lines.length > config.maxLines) {
        self.postMessage({
          id,
          type: "error",
          message: `Exceeded maximum ${config.maxLines} spreadsheet lines (found ${lines.length})`,
        });
        return;
      }

      const maxLineLength =
        lines.length === 0 ? 0 : Math.max(...lines.map((line) => line.length));
      if (maxLineLength > config.maxPermittedLineLength) {
        self.postMessage({
          id,
          type: "error",
          message: `Exceeded maximum ${config.maxPermittedLineLength} line length (found ${maxLineLength})`,
        });
        return;
      }

      self.postMessage({
        id,
        type: "progress",
        progress: 100,
        message: "Done",
      });
      self.postMessage({ id, type: "result", result: csv });
      return;
    }

    // treat as text
    if (isBinary(arrayBuffer)) {
      self.postMessage({
        id,
        type: "error",
        message:
          "Detected non-text file (over 5% of first 512 bytes are control characters)",
      });
      return;
    }

    const string = arrayBufferToString(arrayBuffer);
    const lines = string.split("\n");

    if (lines.length > config.maxLines) {
      self.postMessage({
        id,
        type: "error",
        message: `Exceeded maximum ${config.maxLines} lines (found ${lines.length})`,
      });
      return;
    }

    const maxLineLength =
      lines.length === 0 ? 0 : Math.max(...lines.map((line) => line.length));
    if (maxLineLength > config.maxPermittedLineLength) {
      self.postMessage({
        id,
        type: "error",
        message: `Exceeded maximum ${config.maxPermittedLineLength} line length (found ${maxLineLength})`,
      });
      return;
    }

    self.postMessage({ id, type: "progress", progress: 100, message: "Done" });
    self.postMessage({ id, type: "result", result: string });
  } catch (error) {
    self.postMessage({
      id,
      type: "error",
      message: error?.message || String(error),
    });
  }
});
