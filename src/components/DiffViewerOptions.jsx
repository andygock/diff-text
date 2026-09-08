import React from "react";

const methods = [
  ["diffChars", "Characters"],
  ["diffWords", "Words"],
  ["diffWordsWithSpace", "Words + spaces"],
  ["diffLines", "Lines"],
  ["diffSentences", "Sentences"],
];

export default function DiffViewerOptions({
  options,
  onChange,
  splitView,
  onViewChange,
  wrapOutput = false,
  onWrapChange = () => {},
}) {
  return (
    <div className="comparison-options">
      <label className="inline-label">
        Detail
        <select
          aria-label="Comparison detail"
          value={options.compareMethod}
          onChange={(event) => onChange({ compareMethod: event.target.value })}
        >
          {methods.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="check-label">
        <input
          type="checkbox"
          checked={options.ignoreWhitespace}
          onChange={(event) =>
            onChange({ ignoreWhitespace: event.target.checked })
          }
        />
        Ignore whitespace
      </label>
      <label className="check-label">
        <input
          type="checkbox"
          checked={options.ignoreLineEndings}
          onChange={(event) =>
            onChange({ ignoreLineEndings: event.target.checked })
          }
        />
        Ignore line endings
      </label>
      <div className="segmented" role="group" aria-label="Diff layout">
        <button aria-pressed={!splitView} onClick={() => onViewChange(false)}>
          Unified
        </button>
        <button aria-pressed={splitView} onClick={() => onViewChange(true)}>
          Split
        </button>
      </div>
      <label className="check-label">
        <input
          type="checkbox"
          checked={wrapOutput}
          onChange={(event) => onWrapChange(event.target.checked)}
        />
        Wrap output
      </label>
    </div>
  );
}
