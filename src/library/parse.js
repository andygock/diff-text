import config from "../config";
import { decodeText, inspectText } from "./text";

const spreadsheetExtensions = new Set([
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
]);

// Check ZIP directory sizes before SheetJS inflates a workbook. This is a
// resource guard, not an archive security validator; the worker also has a deadline.
export function checkArchiveSize(buffer) {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint32(0, true) !== 0x04034b50) return;
  let end = -1;
  for (
    let i = view.byteLength - 22;
    i >= Math.max(0, view.byteLength - 65557);
    i--
  ) {
    if (
      view.getUint32(i, true) === 0x06054b50 &&
      i + 22 + view.getUint16(i + 20, true) === view.byteLength
    ) {
      end = i;
      break;
    }
  }
  if (end < 0) throw new Error("Invalid spreadsheet archive.");
  const entries = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true);
  let total = 0;
  if (entries === 65535 || offset === 0xffffffff)
    throw new Error("ZIP64 workbooks are not supported.");
  for (let i = 0; i < entries; i++) {
    if (offset + 46 > end || view.getUint32(offset, true) !== 0x02014b50)
      throw new Error("Invalid spreadsheet archive directory.");
    total += view.getUint32(offset + 24, true);
    if (total > config.maxExpandedSize)
      throw new Error("Expanded workbook exceeds the 64 MiB limit.");
    offset +=
      46 +
      view.getUint16(offset + 28, true) +
      view.getUint16(offset + 30, true) +
      view.getUint16(offset + 32, true);
  }
}

export async function parseFile(
  file,
  encoding = "auto",
  sheetIndex = 0,
  progress = () => {},
) {
  if (!file || typeof file.arrayBuffer !== "function")
    throw new Error("No file selected.");
  if (file.size > config.maxFileSize)
    throw new Error("File exceeds the 10 MiB limit.");
  progress("Reading " + file.name + "…");
  const buffer = await file.arrayBuffer();
  if (buffer.byteLength > config.maxFileSize)
    throw new Error("File exceeds the 10 MiB limit.");
  const extension = file.name.split(".").pop().toLowerCase();
  if (!spreadsheetExtensions.has(extension))
    return { ...decodeText(buffer, encoding), sheets: [], sheetIndex: 0 };

  checkArchiveSize(buffer);
  progress("Loading spreadsheet parser…");
  const mod = await import("xlsx");
  const XLSX = mod.default || mod;
  // Read names first, then only the selected worksheet. Never silently truncate.
  const metadata = XLSX.read(buffer, { type: "array", bookSheets: true });
  const sheets = metadata.SheetNames || [];
  if (!sheets.length) throw new Error("Spreadsheet has no worksheets.");
  if (!Number.isInteger(sheetIndex) || !sheets[sheetIndex])
    throw new Error("Worksheet does not exist.");
  progress("Reading " + sheets[sheetIndex] + "…");
  const workbook = XLSX.read(buffer, {
    type: "array",
    sheets: sheetIndex,
    sheetRows: config.maxLines + 1,
    cellHTML: false,
    cellStyles: false,
    cellNF: false,
  });
  const sheet = workbook.Sheets[sheets[sheetIndex]];
  if (!sheet) throw new Error("Unable to read this worksheet.");
  if (sheet["!ref"]) {
    const range = XLSX.utils.decode_range(sheet["!fullref"] || sheet["!ref"]);
    const rows = range.e.r + 1;
    const columns = range.e.c + 1;
    if (
      rows > config.maxLines ||
      columns > config.maxColumns ||
      rows * columns > config.maxCells
    ) {
      throw new Error(
        "Worksheet exceeds the row, column or 250,000-cell limit.",
      );
    }
  }
  progress("Converting worksheet to CSV…");
  const text = XLSX.utils.sheet_to_csv(sheet);
  inspectText(text);
  return { text, sheets, sheetIndex, encoding: "spreadsheet" };
}
