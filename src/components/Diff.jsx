import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { lineBody, lineEnding } from "../library/text";
import { makeDisplayRows } from "../library/displayRows";
import config from "../config";

// This must match --code-row in App.css so virtual scroll positions stay exact.
const ROW_HEIGHT = 18;
const PREVIEW_LIMIT = config.previewLimit;
const CHARACTER_WIDTH = 6.6;
const CELL_OVERHEAD = 50 + 18 + 8;
const OVERSCAN = 8;

function displayColumns(text) {
  let columns = 0;
  for (let index = 0; index < text.length; index++) {
    const code = text.codePointAt(index);
    if (code > 0xffff) index++;
    columns += code === 9 ? 4 - (columns % 4) : code > 255 ? 2 : 1;
  }
  return columns;
}

function wrappedLineCount(cell, columns) {
  if (!cell) return 1;
  const body = lineBody(cell.text);
  const preview = body.slice(0, PREVIEW_LIMIT);
  // Leave room for the inline overflow affordance when a line is truncated.
  const suffix = body.length > PREVIEW_LIMIT ? 32 : 0;
  return Math.max(1, Math.ceil((displayColumns(preview) + suffix) / columns));
}

function findItemAt(offsets, scrollTop) {
  let low = 0;
  let high = offsets.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (offsets[middle] <= scrollTop) low = middle + 1;
    else high = middle;
  }
  return Math.max(0, low - 1);
}

function findItemEnd(offsets, bottom) {
  let low = 0;
  let high = offsets.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (offsets[middle] < bottom) low = middle + 1;
    else high = middle;
  }
  return low;
}

function CodeCell({ cell, side, changed, onNavigate, disabled }) {
  if (!cell) return <div className="diff-cell empty-cell" />;
  const body = lineBody(cell.text);
  const truncated = body.length > PREVIEW_LIMIT;
  return (
    <div className={"diff-cell " + (changed ? side : "")}>
      <button
        className="line-number"
        disabled={disabled}
        aria-label={
          "Go to " +
          (side === "left" ? "original" : "modified") +
          " line " +
          cell.number
        }
        onClick={() => onNavigate(side)}
      >
        {cell.number}
      </button>
      <span className="diff-sign" aria-hidden="true">
        {changed ? (side === "left" ? "−" : "+") : " "}
      </span>
      <code className="line-content">
        {cell.parts && !truncated
          ? cell.parts.map((part, index) => (
              <span
                key={index}
                className={part.changed ? "word-change" : undefined}
              >
                {part.text}
              </span>
            ))
          : body.slice(0, PREVIEW_LIMIT)}
        {truncated && (
          <button
            className="line-overflow"
            disabled={disabled}
            onClick={() => onNavigate(side)}
          >
            … {(body.length - PREVIEW_LIMIT).toLocaleString("en-AU")} more
            characters · open line
          </button>
        )}
        {changed && (
          <span className="line-ending">{lineEnding(cell.text)}</span>
        )}
      </code>
    </div>
  );
}

const Diff = memo(function Diff({
  result,
  splitView,
  wrapOutput,
  stale,
  onNavigate,
}) {
  const viewport = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportSize, setViewportSize] = useState({ height: 432, width: 900 });
  const [showAll, setShowAll] = useState(false);
  const [activeHunk, setActiveHunk] = useState(-1);
  const rows = result.rows;
  const { items, positions } = useMemo(
    () => makeDisplayRows(rows, splitView, showAll),
    [rows, splitView, showAll],
  );
  const contentWidth =
    Math.max(280, result.previewColumns * 6.6 + 250) * (splitView ? 2 : 1);
  const wrapColumns = Math.max(
    1,
    Math.floor(
      (viewportSize.width / (splitView ? 2 : 1) - CELL_OVERHEAD) /
        CHARACTER_WIDTH,
    ),
  );
  const layout = useMemo(() => {
    if (!wrapOutput)
      return {
        offsets: null,
        rowHeights: null,
        totalHeight: items.length * ROW_HEIGHT,
      };
    const offsets = new Array(items.length);
    const rowHeights = new Array(items.length);
    let top = 0;
    items.forEach((item, index) => {
      offsets[index] = top;
      let height = ROW_HEIGHT;
      if (!item.gap) {
        const row = rows[item.index];
        const cells = splitView
          ? [row.left, row.right]
          : [item.side === "left" ? row.left : row.right || row.left];
        height =
          Math.max(
            ...cells.map((cell) => wrappedLineCount(cell, wrapColumns)),
          ) * ROW_HEIGHT;
      }
      rowHeights[index] = height;
      top += height;
    });
    return { offsets, rowHeights, totalHeight: top };
  }, [items, rows, splitView, wrapColumns, wrapOutput]);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) =>
      setViewportSize({
        height: entry.contentRect.height,
        width: entry.contentRect.width,
      }),
    );
    observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);

  let start = 0;
  let end = items.length;
  if (items.length) {
    if (wrapOutput) {
      const visibleStart = findItemAt(layout.offsets, scrollTop);
      const visibleEnd = findItemEnd(
        layout.offsets,
        scrollTop + viewportSize.height,
      );
      start = Math.max(0, visibleStart - OVERSCAN);
      end = Math.min(items.length, visibleEnd + OVERSCAN);
    } else {
      start = Math.max(
        0,
        Math.min(items.length - 1, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN),
      );
      end = Math.min(
        items.length,
        start + Math.ceil(viewportSize.height / ROW_HEIGHT) + OVERSCAN * 2,
      );
    }
  }
  useEffect(() => {
    if (viewport.current) viewport.current.scrollTop = 0;
    const reset = window.setTimeout(() => setScrollTop(0), 0);
    return () => window.clearTimeout(reset);
  }, [wrapOutput]);
  function jump(direction) {
    if (!result.hunks.length) return;
    const next =
      activeHunk < 0
        ? direction > 0
          ? 0
          : result.hunks.length - 1
        : (activeHunk + direction + result.hunks.length) % result.hunks.length;
    setActiveHunk(next);
    const itemPosition = positions[result.hunks[next]];
    const top = layout.offsets
      ? layout.offsets[itemPosition]
      : itemPosition * ROW_HEIGHT;
    viewport.current.scrollTop = top;
    setScrollTop(top);
  }
  function changeLayoutContext(value) {
    setShowAll(value);
    viewport.current.scrollTop = 0;
    setScrollTop(0);
  }
  return (
    <>
      <div className="result-tools">
        <div className="result-summary">
          <strong>Comparison</strong>
          <span className="badge removed">
            −{result.removed.toLocaleString("en-AU")}
          </span>
          <span className="badge added">
            +{result.added.toLocaleString("en-AU")}
          </span>
          <span className="muted">
            {result.hunks.length.toLocaleString("en-AU")} change groups
          </span>
        </div>
        <div className="button-group">
          <label className="check-label">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(event) => changeLayoutContext(event.target.checked)}
            />
            Show unchanged
          </label>
          <span className="mono muted" aria-live="polite">
            {activeHunk < 0 ? "–" : activeHunk + 1} / {result.hunks.length}
          </span>
          <button
            aria-label="Previous change"
            title="Previous change"
            disabled={!result.hunks.length}
            onClick={() => jump(-1)}
          >
            ↑
          </button>
          <button
            aria-label="Next change"
            title="Next change"
            disabled={!result.hunks.length}
            onClick={() => jump(1)}
          >
            ↓
          </button>
        </div>
      </div>
      {result.coarse && (
        <div className="notice" role="status">
          Detailed alignment exceeded the processing budget. The entire
          unmatched section is represented as removed and added.
        </div>
      )}
      {result.detailLimited && !result.coarse && (
        <div className="notice">
          Line comparison is complete. Some inline highlighting was skipped to
          keep processing bounded.
        </div>
      )}
      {!result.hunks.length && (
        <div className="identical" role="status">
          <span className="status-dot" />
          {result.exact
            ? "Content is identical"
            : "Content matches with the selected ignore options."}
        </div>
      )}
      <div
        className={
          "diff-viewport" +
          (stale ? " stale" : "") +
          (wrapOutput ? " wrap-output" : "")
        }
        ref={viewport}
        tabIndex={0}
        role="region"
        aria-label="Comparison results"
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
        <div
          className="diff-canvas"
          style={{
            height: layout.totalHeight,
            minWidth: wrapOutput ? 0 : contentWidth,
          }}
        >
          {items.slice(start, end).map((item, offset) => {
            const position = start + offset;
            if (item.gap)
              return (
                <button
                  className="context-gap virtual-row"
                  key={"gap-" + position}
                  style={{
                    top: layout.offsets
                      ? layout.offsets[position]
                      : position * ROW_HEIGHT,
                    height: layout.rowHeights?.[position],
                  }}
                  onClick={() => changeLayoutContext(true)}
                >
                  ··· {item.gap.toLocaleString("en-AU")} unchanged lines · click
                  to expand
                </button>
              );
            const row = result.rows[item.index];
            const navigate = (side) => onNavigate(row, side);
            return (
              <div
                key={position}
                className={
                  "virtual-row diff-row " +
                  (splitView ? "split-row" : "") +
                  (result.hunks[activeHunk] === item.index
                    ? " active-change"
                    : "")
                }
                style={{
                  top: layout.offsets
                    ? layout.offsets[position]
                    : position * ROW_HEIGHT,
                  height: layout.rowHeights?.[position],
                }}
              >
                {splitView ? (
                  <>
                    <CodeCell
                      cell={row.left}
                      side="left"
                      changed={row.changed}
                      onNavigate={navigate}
                      disabled={stale}
                    />
                    <CodeCell
                      cell={row.right}
                      side="right"
                      changed={row.changed}
                      onNavigate={navigate}
                      disabled={stale}
                    />
                  </>
                ) : (
                  <CodeCell
                    cell={
                      item.side === "left" ? row.left : row.right || row.left
                    }
                    side={item.side === "left" ? "left" : "right"}
                    changed={row.changed}
                    onNavigate={navigate}
                    disabled={stale}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="result-footer">
        <span>
          Line numbers open the source · LF / CRLF / CR markers preserve line
          endings
        </span>
        <span className="mono">
          {result.elapsed.toLocaleString("en-AU")} ms
        </span>
      </div>
    </>
  );
});
export default Diff;
