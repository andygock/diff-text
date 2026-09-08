import React, { useCallback, useRef, useState } from "react";
import "./App.css";
import Diff from "./Diff";
import Footer from "./Footer";
import TextInput from "./TextInput";
import DiffViewerOptions from "./DiffViewerOptions";
import ErrorBoundary from "./ErrorBoundary";
import useComparison from "../hooks/useComparison";
import { initialLeft, initialRight } from "../library/inputs";

const initialDocument = (text, revision) => ({
  text,
  revision,
  name: "",
  sheets: [],
  file: null,
});

export default function App() {
  const sequence = useRef(2);
  const [documents, setDocuments] = useState({
    left: initialDocument(initialLeft, 0),
    right: initialDocument(initialRight, 1),
  });
  const [options, setOptions] = useState({
    compareMethod: "diffChars",
    ignoreWhitespace: false,
    ignoreLineEndings: false,
  });
  const [splitView, setSplitView] = useState(true);
  const [manual, setManual] = useState(false);
  const leftEditor = useRef(null);
  const rightEditor = useRef(null);
  const comparison = useComparison(
    documents.left,
    documents.right,
    options,
    manual,
  );

  // Editors commit immediately. Only comparison is debounced, so swaps always
  // use what is visible and no old typing timer can replace a later import.
  const updateDocument = useCallback((side, patch) => {
    const revision = sequence.current++;
    setDocuments((previous) => ({
      ...previous,
      [side]: { ...previous[side], ...patch, revision },
    }));
  }, []);
  const updateLeft = useCallback(
    (patch) => updateDocument("left", patch),
    [updateDocument],
  );
  const updateRight = useCallback(
    (patch) => updateDocument("right", patch),
    [updateDocument],
  );
  const updateOptions = useCallback(
    (patch) => setOptions((previous) => ({ ...previous, ...patch })),
    [],
  );
  const navigate = useCallback((row, side) => {
    leftEditor.current?.goToLine(
      row.left?.number || row.leftAnchor || 1,
      side === "left",
    );
    rightEditor.current?.goToLine(
      row.right?.number || row.rightAnchor || 1,
      side === "right",
    );
  }, []);

  function swap() {
    leftEditor.current?.cancel();
    rightEditor.current?.cancel();
    const leftRevision = sequence.current++;
    const rightRevision = sequence.current++;
    setDocuments((previous) => ({
      left: { ...previous.right, revision: leftRevision },
      right: { ...previous.left, revision: rightRevision },
    }));
  }
  const working = comparison.status === "working";
  return (
    <main
      className="app"
      onKeyDown={(event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          event.preventDefault();
          comparison.compare();
        }
      }}
    >
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <img src="/diff.svg" alt="" />
          </span>
          <h1>
            diff<span className="muted">text</span>
          </h1>
          <span className="header-divider" />
          <span className="tagline">
            {" "}
            Compare two portions of text in the browser. Supports text and{" "}
            <a href="https://docs.sheetjs.com/docs/#supported-file-formats">
              common spreadsheet files{" "}
            </a>
            .
          </span>
        </div>
        <button onClick={swap} aria-label="Swap original and modified">
          <span aria-hidden="true">⇄</span> Swap sides
        </button>
      </header>
      <div className="editors">
        <TextInput
          ref={leftEditor}
          side="left"
          document={documents.left}
          onUpdate={updateLeft}
        />
        <TextInput
          ref={rightEditor}
          side="right"
          document={documents.right}
          onUpdate={updateRight}
        />
      </div>
      <div className="toolbar panel">
        <DiffViewerOptions
          options={options}
          onChange={updateOptions}
          splitView={splitView}
          onViewChange={setSplitView}
        />
        <div className="toolbar-actions">
          <label className="check-label">
            <input
              type="checkbox"
              checked={manual}
              onChange={(event) => setManual(event.target.checked)}
            />
            Manual
          </label>
          {working ? (
            <button onClick={comparison.cancel}>Cancel</button>
          ) : (
            <button
              className="primary"
              title="Compare (Ctrl/⌘ + Enter)"
              onClick={comparison.compare}
            >
              Compare <span aria-hidden="true">↵</span>
            </button>
          )}
        </div>
      </div>
      <div className="comparison-status" role="status">
        {working ? (
          <>
            <span className="spinner" />
            Comparing…
          </>
        ) : comparison.status === "cancelled" ? (
          "Comparison cancelled. Select Compare to resume."
        ) : comparison.error ? (
          "Comparison failed. Adjust the input or select Compare to retry."
        ) : comparison.stale ? (
          comparison.large ? (
            "Large-file mode · select Compare to update the result."
          ) : manual ? (
            "Edits ready · select Compare to update the result."
          ) : (
            "Text changed · preparing comparison…"
          )
        ) : (
          "Comparison up to date"
        )}
        {comparison.stale && comparison.result && (
          <span className="badge">Previous result</span>
        )}
      </div>
      {comparison.error && (
        <div className="inline-error" role="alert">
          {comparison.error} Your text is still available above.
        </div>
      )}
      <section className="results panel" aria-label="Diff">
        <ErrorBoundary key={comparison.signature}>
          {comparison.result ? (
            <Diff
              key={comparison.signature}
              result={comparison.result}
              splitView={splitView}
              stale={comparison.stale}
              onNavigate={navigate}
            />
          ) : (
            <div className="empty-result">
              <span className="empty-symbol" aria-hidden="true">
                ≠
              </span>
              <strong>Your comparison will appear here</strong>
              <p>
                {comparison.error || comparison.status === "cancelled"
                  ? "Your editors are ready when you are."
                  : comparison.large || manual
                    ? "Select Compare when you are ready."
                    : "Preparing your text…"}
              </p>
            </div>
          )}
        </ErrorBoundary>
      </section>
      <div className="app-footer">
        <span>
          10 MiB per input · 100,000 lines · 100,000 characters per line
        </span>
        <Footer />
      </div>
    </main>
  );
}
