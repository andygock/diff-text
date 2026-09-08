import { describe, it, expect, afterEach } from "vitest";
import config from "../config";
import { decodeText, inspectText, splitLines } from "./text";
const original = { ...config };
afterEach(() => Object.assign(config, original));
describe("text validation", () => {
  it("counts bytes correctly for UTF-8, surrogate pairs and CRLF", () => {
    const text = "é🙂\r\nx";
    expect(inspectText(text)).toEqual({
      bytes: new TextEncoder().encode(text).length,
      lines: 2,
    });
  });
  it("accepts the exact byte limit and rejects the next byte", () => {
    config.maxFileSize = 4;
    expect(inspectText("🙂").bytes).toBe(4);
    expect(() => inspectText("🙂x")).toThrow("10 MiB");
  });
  it("rejects huge pasted line counts without spread/stack overflow", () => {
    expect(() => inspectText("x\n".repeat(200000))).toThrow("lines");
  });
  it("handles CR-only and mixed line endings consistently", () => {
    expect(splitLines("a\rb\r\nc\nlast")).toEqual([
      "a\r",
      "b\r\n",
      "c\n",
      "last",
    ]);
    expect(inspectText("a\rb\r\nc\nlast").lines).toBe(4);
    expect(splitLines("")).toEqual([]);
  });
  it("validates line length with an early exit", () => {
    config.maxPermittedLineLength = 3;
    expect(() => inspectText("abcd")).toThrow("characters");
  });
  it("detects UTF-16 BOMs before binary detection", () => {
    expect(decodeText(new Uint8Array([255, 254, 65, 0, 10, 0]).buffer)).toEqual(
      { text: "A\n", encoding: "utf-16le" },
    );
    expect(decodeText(new Uint8Array([254, 255, 0, 65]).buffer).text).toBe("A");
  });
  it("does not silently replace malformed UTF-8 and supports an explicit legacy encoding", () => {
    const bytes = new Uint8Array([0xe9]).buffer;
    expect(() => decodeText(bytes)).toThrow("encoding");
    expect(decodeText(bytes, "windows-1252").text).toBe("é");
  });
  it("rejects binary data", () => {
    expect(() => decodeText(new Uint8Array(100).buffer)).toThrow("binary");
  });
});
