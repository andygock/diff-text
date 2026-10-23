import {
  diffArrays,
  diffChars,
  diffWords,
  diffWordsWithSpace,
  diffSentences,
} from "diff";
import config from "../config";
import { inspectText, splitLines, lineBody } from "./text";

const methods = { diffChars, diffWords, diffWordsWithSpace, diffSentences };
/**
 * @param {string} left
 * @param {string} right
 * @param {import("./contracts").CompareOptions} options
 * @returns {import("./contracts").ComparisonResult}
 */
export function compareText(left, right, options = {}) {
  const leftStats = inspectText(left);
  const rightStats = inspectText(right);
  const oldLines = splitLines(left);
  const newLines = splitLines(right);
  const key = (line) => {
    let body = lineBody(line);
    if (options.ignoreWhitespace) body = body.trim().replace(/\s+/g, " ");
    return (
      body +
      (options.ignoreLineEndings ? "" : line.slice(lineBody(line).length))
    );
  };
  const oldKeys = oldLines.map(key);
  const newKeys = newLines.map(key);
  const started = performance.now();
  /** @type {{count: number, added?: boolean, removed?: boolean}[] | undefined} */
  let changes = diffArrays(oldKeys, newKeys, {
    timeout: config.diffTimeout,
    maxEditLength: config.maxEditLength,
  });
  const coarse = !changes;
  if (!changes) {
    // Preserve equal edges and show the unmatched middle explicitly. This
    // bounded fallback never presents a partial calculation as an exact diff.
    let head = 0;
    let tail = 0;
    while (
      head < oldKeys.length &&
      head < newKeys.length &&
      oldKeys[head] === newKeys[head]
    )
      head++;
    while (
      tail < oldKeys.length - head &&
      tail < newKeys.length - head &&
      oldKeys[oldKeys.length - 1 - tail] === newKeys[newKeys.length - 1 - tail]
    )
      tail++;
    changes = [
      { count: head },
      { count: oldKeys.length - head - tail, removed: true },
      { count: newKeys.length - head - tail, added: true },
      { count: tail },
    ].filter(({ count }) => count);
  }
  /** @type {import("./contracts").Row[]} */
  const rows = [];
  const hunks = [];
  let oldIndex = 0;
  let newIndex = 0;
  let added = 0;
  let removed = 0;
  let inlineRemaining = config.inlineBudget;
  const inlineMethod = methods[options.compareMethod || "diffChars"];
  const large = left.length + right.length > config.autoCompareSize;
  let detailLimited = large || coarse;
  let previewColumns = 0;
  /** @returns {import("./contracts").Cell} */
  const cell = (lines, index) => {
    const text = lines[index];
    let columns = 0;
    // Estimate a conservative monospace width in the worker, including tabs and
    // wide Unicode characters, rather than rescanning large strings on render.
    for (let i = 0; i < Math.min(text.length, config.previewLimit); i++) {
      const code = text.codePointAt(i);
      if (code > 0xffff) i++;
      columns += code === 9 ? 4 - (columns % 4) : code > 255 ? 2 : 1;
    }
    previewColumns = Math.max(previewColumns, columns);
    return { number: index + 1, text };
  };
  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];
    if (!change.added && !change.removed) {
      for (let n = 0; n < change.count; n++)
        rows.push({
          left: cell(oldLines, oldIndex++),
          right: cell(newLines, newIndex++),
          changed: false,
        });
      continue;
    }
    const deleteCount = change.removed ? change.count : 0;
    let addCount = change.added ? change.count : 0;
    if (change.removed && changes[i + 1]?.added) addCount = changes[++i].count;
    removed += deleteCount;
    added += addCount;
    hunks.push(rows.length);
    for (let n = 0; n < Math.max(deleteCount, addCount); n++) {
      const row = {
        left: n < deleteCount ? cell(oldLines, oldIndex++) : null,
        right: n < addCount ? cell(newLines, newIndex++) : null,
        changed: true,
        // Align navigation to the counterpart or nearest insertion point.
        leftAnchor: Math.max(
          1,
          Math.min(oldLines.length, oldIndex + (n < deleteCount ? 0 : 1)),
        ),
        rightAnchor: Math.max(
          1,
          Math.min(newLines.length, newIndex + (n < addCount ? 0 : 1)),
        ),
      };
      if (inlineMethod && row.left && row.right && !large && !coarse) {
        const a = lineBody(row.left.text);
        const b = lineBody(row.right.text);
        if (
          Math.max(a.length, b.length) <= config.inlineLineLength &&
          inlineRemaining >= a.length + b.length &&
          performance.now() - started < config.diffTimeout
        ) {
          inlineRemaining -= a.length + b.length;
          const parts = inlineMethod(a, b, { timeout: 15, maxEditLength: 300 });
          // Shared word tokens can normalise whitespace. Only render parts
          // that reproduce both source bodies exactly; otherwise retain raw text.
          if (
            parts &&
            parts
              .filter((part) => !part.added)
              .map((part) => part.value)
              .join("") === a &&
            parts
              .filter((part) => !part.removed)
              .map((part) => part.value)
              .join("") === b
          ) {
            row.left.parts = parts
              .filter((part) => !part.added)
              .map((part) => ({ text: part.value, changed: !!part.removed }));
            row.right.parts = parts
              .filter((part) => !part.removed)
              .map((part) => ({ text: part.value, changed: !!part.added }));
          } else detailLimited = true;
        } else detailLimited = true;
      }
      rows.push(row);
    }
  }
  return {
    rows,
    hunks,
    added,
    removed,
    coarse,
    detailLimited,
    exact: left === right,
    leftStats,
    rightStats,
    elapsed: Math.round(performance.now() - started),
    previewColumns,
  };
}
