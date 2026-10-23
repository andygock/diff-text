import { describe, it, expect, afterEach } from "vitest";
import * as XLSX from "xlsx";
import { parseFile, checkArchiveSize } from "./parse";
import config from "../config";
const original = { ...config };
afterEach(() => Object.assign(config, original));
function file(name, buffer) {
  return { name, size: buffer.byteLength, arrayBuffer: async () => buffer };
}
function workbook() {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet([["first"], ["one"]]),
    "First",
  );
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet([["second"], ["two"]]),
    "Second",
  );
  return XLSX.write(book, {
    type: "array",
    bookType: "xlsx",
    compression: true,
  });
}
describe("file parsing", () => {
  it("reads text with exact trailing whitespace", async () => {
    const text = "text  \r\n\r\n";
    const result = await parseFile(
      file("input.txt", new TextEncoder().encode(text).buffer),
    );
    expect(result.text).toBe(text);
  });
  it("reads a selected real worksheet and exposes all sheet names", async () => {
    const result = await parseFile(file("input.xlsx", workbook()), "auto", 1);
    expect(result.text).toBe("second\ntwo");
    expect(result.sheets).toEqual(["First", "Second"]);
    expect(result.sheetIndex).toBe(1);
  });
  it("preserves non-ASCII text in legacy DBF code pages", async () => {
    XLSX.set_cptable(await import("xlsx/dist/cpexcel.full.mjs"));
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.aoa_to_sheet([["name"], ["Привет"]]),
      "Data",
    );
    const buffer = XLSX.write(book, {
      type: "array",
      bookType: "dbf",
      codepage: 1251,
    });
    const result = await parseFile(file("legacy.dbf", buffer));
    expect(result.text).toContain("Привет");
  });
  it("rejects invalid sheet indexes and bounded cell ranges", async () => {
    const input = file("input.xlsx", workbook());
    await expect(parseFile(input, "auto", 2)).rejects.toThrow("does not exist");
    config.maxCells = 1;
    await expect(parseFile(input)).rejects.toThrow("cell limit");
  });
  it("rejects before reading an oversized file", async () => {
    await expect(
      parseFile({
        size: config.maxFileSize + 1,
        arrayBuffer: () => {
          throw new Error("should not read");
        },
      }),
    ).rejects.toThrow("10 MiB");
  });
  it("checks declared ZIP expansion before decompression", () => {
    const buffer = new ArrayBuffer(72);
    const view = new DataView(buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint32(4, 0x02014b50, true);
    view.setUint32(28, config.maxExpandedSize + 1, true);
    view.setUint32(50, 0x06054b50, true);
    view.setUint16(60, 1, true);
    view.setUint32(66, 4, true);
    expect(() => checkArchiveSize(buffer)).toThrow("64 MiB");
  });
});
