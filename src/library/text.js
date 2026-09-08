import config from "../config";

// One allocation-free pass is shared by paste, typing and imports. Count UTF-8
// bytes without allocating a second full-sized encoded buffer.
export function inspectText(text) {
  let bytes = 0;
  let lines = 1;
  let length = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    bytes += code < 128 ? 1 : code < 2048 ? 2 : 3;
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
      const next = text.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        bytes++;
        length++;
        i++;
      }
    }
    if (code === 13 || code === 10) {
      if (code === 13 && text.charCodeAt(i + 1) === 10) {
        bytes++;
        i++;
      }
      lines++;
      length = 0;
    } else length++;
    if (bytes > config.maxFileSize)
      throw new Error("Text exceeds the 10 MiB limit.");
    if (lines > config.maxLines)
      throw new Error(
        `Text exceeds ${config.maxLines.toLocaleString("en-AU")} lines.`,
      );
    if (length > config.maxPermittedLineLength)
      throw new Error(
        `A line exceeds ${config.maxPermittedLineLength.toLocaleString("en-AU")} characters.`,
      );
  }
  return { bytes, lines };
}

// Keep delimiters in tokens: EOF newlines and CRLF/LF differences are real edits.
export function splitLines(text) {
  return text.match(/[^\r\n]*(?:\r\n|\r|\n)|[^\r\n]+$/g) || [];
}
export function lineBody(text) {
  return text.replace(/(?:\r\n|\r|\n)$/, "");
}
export function lineEnding(text) {
  return text.endsWith("\r\n")
    ? "CRLF"
    : text.endsWith("\n")
      ? "LF"
      : text.endsWith("\r")
        ? "CR"
        : "No newline";
}
export function decodeText(buffer, encoding = "auto") {
  const bytes = new Uint8Array(buffer);
  let chosen = encoding;
  if (chosen === "auto")
    chosen =
      bytes[0] === 0xff && bytes[1] === 0xfe
        ? "utf-16le"
        : bytes[0] === 0xfe && bytes[1] === 0xff
          ? "utf-16be"
          : "utf-8";
  let text;
  try {
    text = new TextDecoder(chosen, { fatal: true }).decode(buffer);
  } catch {
    throw new Error(
      "Unable to decode this file. Choose its text encoding and reopen it.",
    );
  }
  let controls = 0;
  const sample = Math.min(text.length, 4096);
  for (let i = 0; i < sample; i++) {
    const code = text.charCodeAt(i);
    if ((code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127)
      controls++;
  }
  if (sample && controls / sample > 0.05)
    throw new Error("This appears to be a binary file, not text.");
  inspectText(text);
  return { text, encoding: chosen };
}
