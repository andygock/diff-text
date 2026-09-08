import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { startJob } from "../library/jobs";
import config from "../config";

const TextInput = forwardRef(function TextInput(
  { side, document, onUpdate },
  ref,
) {
  const textarea = useRef(null);
  const picker = useRef(null);
  const active = useRef(null);
  const lastFile = useRef(null);
  const generation = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [wrap, setWrap] = useState(false);
  const [encoding, setEncoding] = useState("auto");
  const label = side === "left" ? "Original" : "Modified";

  const cancel = () => {
    generation.current++;
    active.current?.cancel();
    active.current = null;
    lastFile.current = null;
    setBusy(false);
    setStatus("");
  };
  useEffect(
    () => () => {
      generation.current++;
      active.current?.cancel();
    },
    [],
  );

  useImperativeHandle(ref, () => ({
    cancel,
    goToLine(number, select = true) {
      const element = textarea.current;
      if (!element) return;
      // Fixed line metrics make navigation reliable. Turn wrapping off explicitly
      // when navigating rather than estimating a logical line's visual height.
      if (wrap) {
        setWrap(false);
        setStatus("Wrapping turned off for line navigation.");
      }
      const text = element.value;
      let start = 0;
      let current = 1;
      while (current < number) {
        const next = text.indexOf("\n", start);
        if (next < 0) break;
        start = next + 1;
        current++;
      }
      const end = text.indexOf("\n", start);
      requestAnimationFrame(() => {
        if (!textarea.current) return;
        if (select) {
          element.focus({ preventScroll: true });
          element.setSelectionRange(start, end < 0 ? text.length : end);
        }
        element.scrollTop = Math.max(
          0,
          (current - 1) * 20 - element.clientHeight / 2 + 10,
        );
      });
    },
  }));

  async function readFile(file, sheetIndex = 0, chosenEncoding = encoding) {
    cancel();
    setError("");
    if (!file) return;
    // Retain failed imports so changing the encoding retries that file, not the
    // previously displayed document. Edits and swaps clear this reference.
    lastFile.current = file;
    if (file.size > config.maxFileSize) {
      setError("File exceeds the 10 MiB limit.");
      return;
    }
    const token = generation.current;
    setBusy(true);
    setStatus("Reading " + file.name + "…");
    const job = startJob(
      "parse",
      { file, sheetIndex, encoding: chosenEncoding },
      (message) => {
        if (generation.current === token) setStatus(message);
      },
    );
    active.current = job;
    try {
      const parsed = await job.promise;
      if (generation.current !== token) return;
      onUpdate({ ...parsed, file, name: file.name });
      setStatus("Loaded " + file.name);
    } catch (failure) {
      if (generation.current === token && failure.name !== "AbortError")
        setError(failure.message);
    } finally {
      if (generation.current === token) {
        setBusy(false);
        active.current = null;
      }
    }
  }

  return (
    <section
      className={"editor panel" + (dragging ? " dragging" : "")}
      aria-label={label + " editor"}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (event.dataTransfer.files.length !== 1) {
          cancel();
          setError("Drop one file into each editor.");
          return;
        }
        readFile(event.dataTransfer.files[0]);
      }}
    >
      <div className="panel-heading">
        <div className="editor-title">
          <span className={"side-dot " + side} />
          <label htmlFor={side + "-text"}>{label}</label>
          <span className="filename" title={document.name}>
            {document.name || "Untitled"}
          </span>
        </div>
        <div className="button-group">
          <button
            type="button"
            className="ghost"
            aria-pressed={wrap}
            onClick={() => setWrap(!wrap)}
            title="Wrap long lines"
          >
            Wrap
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => picker.current.click()}
          >
            Open file
          </button>
          <button
            type="button"
            className="ghost"
            aria-label={"Clear " + label.toLowerCase()}
            onClick={() => {
              cancel();
              setError("");
              onUpdate({ text: "", name: "", file: null, sheets: [] });
            }}
          >
            Clear
          </button>
        </div>
      </div>
      <input
        ref={picker}
        type="file"
        tabIndex={-1}
        className="visually-hidden"
        aria-label={"Open " + label.toLowerCase() + " file"}
        onChange={(event) => {
          readFile(event.target.files[0]);
          event.target.value = "";
        }}
      />
      <textarea
        ref={textarea}
        id={side + "-text"}
        value={document.text}
        wrap={wrap ? "soft" : "off"}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        className="textarea"
        placeholder={
          "Paste " + label.toLowerCase() + " text or drop a file here…"
        }
        onChange={(event) => {
          cancel();
          const text = event.target.value;
          if (text.length > config.maxFileSize) {
            setError("Text exceeds the 10 MiB limit.");
            return;
          }
          setError("");
          onUpdate({
            text,
            name: document.name,
            file: null,
            sheets: [],
            encoding: "edited",
          });
        }}
      />
      <div className="editor-meta">
        <span className="mono">
          {document.text.length.toLocaleString("en-AU")} chars
        </span>
        {document.sheets?.length > 0 ? (
          <label className="inline-label">
            Sheet{" "}
            <select
              aria-label={label + " worksheet"}
              value={document.sheetIndex}
              disabled={busy}
              onChange={(event) =>
                readFile(document.file, Number(event.target.value))
              }
            >
              {document.sheets.map((name, index) => (
                <option key={name} value={index}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="inline-label">
            Encoding{" "}
            <select
              aria-label={label + " encoding"}
              value={encoding}
              onChange={(event) => {
                setEncoding(event.target.value);
                const file = lastFile.current || document.file;
                if (file) readFile(file, 0, event.target.value);
              }}
            >
              <option value="auto">Auto / UTF-8</option>
              <option value="utf-8">UTF-8</option>
              <option value="utf-16le">UTF-16 LE</option>
              <option value="utf-16be">UTF-16 BE</option>
              <option value="windows-1252">Windows-1252</option>
            </select>
          </label>
        )}
        {busy && (
          <button className="ghost" onClick={cancel}>
            Cancel import
          </button>
        )}
      </div>
      {status && (
        <div className="editor-status" role="status">
          {busy && <span className="spinner" />}
          {status}
        </div>
      )}
      {error && (
        <div className="inline-error" role="alert">
          {error}
        </div>
      )}
    </section>
  );
});
export default React.memo(TextInput);
