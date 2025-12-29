import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import DropTextArea from "react-dropzone-textarea";
import prettyBytes from "pretty-bytes";
import config from "../config";
import { showError } from "../library/toaster";

// wrap textarea in forwardRef to allow passing to DropTextArea
const TextArea = React.forwardRef((props, ref) => (
  <textarea {...props} ref={ref} spellCheck="false" autoComplete="off" />
));
TextArea.displayName = "TextArea";

const createCustomTextConverter = (callbacks = {}) => {
  const notifyFailure = (message) => {
    if (callbacks.onFailure) {
      callbacks.onFailure(message);
    }
  };

  const notifySuccess = () => {
    if (callbacks.onSuccess) {
      callbacks.onSuccess();
    }
  };

  return (arrayBuffer, { file } = {}) => {
    if (callbacks.onStart) {
      callbacks.onStart(file);
    }
    return new Promise((resolve) => {
      const fail = (message) => {
        showError(message);
        notifyFailure(message);
        resolve(null);
      };

      try {
        if (!arrayBuffer) {
          fail("Error: No file data to read");
          return;
        }

        if (isSpreadsheetFile(file)) {
          // compatible spreadsheet format, based on file extension
          // dynamic load xlsx library and read XLSX ArrayBuffer
          import("xlsx")
            .then((XLSX) => {
              try {
                // record this to read XLSX file
                // const timeStart = performance.now();
                const wb = XLSX.read(arrayBuffer, { type: "array" });

                if (!wb.SheetNames || wb.SheetNames.length === 0) {
                  fail("Error: Spreadsheet has no worksheets");
                  return;
                }

                // only supports reading of the first worksheet, converted to CSV
                const ws = wb.Sheets[wb.SheetNames[0]];

                // https://github.com/sheetjs/sheetjs#utility-functions
                const csv = XLSX.utils.sheet_to_csv(ws);

                const lines = csv.split("\n");
                while (lines.length > 0 && lines[lines.length - 1] === "") {
                  lines.pop();
                }

                if (lines.length > config.maxLines) {
                  fail(
                    `Error: Exceeded maximum ${config.maxLines} spreadsheet lines (found ${lines.length})`,
                  );
                  return;
                }

                const maxLineLength =
                  lines.length === 0
                    ? 0
                    : Math.max(...lines.map((line) => line.length));
                if (maxLineLength > config.maxPermittedLineLength) {
                  fail(
                    `Error: Exceeded maximum ${config.maxPermittedLineLength} line length (found ${maxLineLength})`,
                  );
                  return;
                }

                // const timeEnd = performance.now();
                // const timeTaken = timeEnd - timeStart;
                // showMessage(`Parsed spreadsheet in ${timeTaken.toFixed(2)}ms`);

                resolve(csv);
                notifySuccess();
              } catch (e) {
                fail(`Error: ${e.message}`);
              }
            })
            .catch((error) => {
              fail(`Error: ${error.message}`);
            });
        } else {
          // is standard text, or it could be some other file which is not a spreadsheet
          // check arrayBuffer if it is a binary file or text file
          if (isBinary(arrayBuffer)) {
            fail(
              "Error: Detected non-text file (over 5% of first 512 bytes are control characters)",
            );
            return;
          }

          // check max file size
          // extremely large files may cause a crash
          // react-dropzone may already check for this when dropping files, would have already aborted if size is too large
          if (arrayBuffer.byteLength >= config.maxFileSize) {
            const prettyMaxSize = prettyBytes(config.maxFileSize);
            fail(`Error: File is larger than ${prettyMaxSize}`);
            return;
          }

          // convert ArrayBuffer to string
          const string = arrayBufferToString(arrayBuffer);

          // check number of lines
          // check number of lines, very large files can cause ReactDiffViewer to crash
          const lines = string.split("\n");

          if (lines.length > config.maxLines) {
            fail(
              `Error: Exceeded maximum ${config.maxLines} lines (found ${lines.length})`,
            );
            return;
          }

          // check length of lines, very long lines can cause ReactDiffViewer to crash
          const maxLineLength =
            lines.length === 0
              ? 0
              : Math.max(...lines.map((line) => line.length));
          if (maxLineLength > config.maxPermittedLineLength) {
            fail(
              `Error: Exceeded maximum ${config.maxPermittedLineLength} line length (found ${maxLineLength})`,
            );
            return;
          }

          // console.log(string);
          resolve(string);
          notifySuccess();
        }
      } catch (error) {
        fail(`Error: ${error.message}`);
      }
    });
  };
};

// check arrayBuffer if it is a binary file or text file, make the best guess
// check first 512 bytes only
const isBinary = (arrayBuffer) => {
  const uint8Array = new Uint8Array(arrayBuffer);
  const maxBytes = Math.min(uint8Array.byteLength, 512);

  if (maxBytes === 0) {
    return false;
  }

  // count number of control bytes
  let binaryBytes = 0;

  // loop through up to first 512 bytes
  for (let i = 0; i < maxBytes; i++) {
    const byte = uint8Array[i];

    // ignore tab, CR, and LF
    if (byte === 0x09 || byte === 0x0a || byte === 0x0d) {
      continue;
    }

    if (byte === 0x00 || byte < 0x20 || byte === 0x7f) {
      binaryBytes++;
    }
  }

  // console.log(`binary bytes detected: ${binaryBytes}/${maxBytes}`);

  // if more than 5% of bytes are control characters, then it is probably a binary file
  if (binaryBytes / maxBytes > 0.05) {
    return true;
  }

  return false;
};

// check whether file is a spreadsheet file
const isSpreadsheetFile = (file) => {
  if (!file?.name) {
    return false;
  }

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

// convert ArrayBuffer to string, works in browsers only
const arrayBufferToString = (arrayBuffer) =>
  new TextDecoder("utf-8").decode(arrayBuffer);

const TextInput = ({ onUpdate, value, scrollRequest }) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [dropStatus, setDropStatus] = React.useState({
    active: false,
    progress: 0,
    message: "",
  });
  const [localValue, setLocalValue] = React.useState(value);
  const progressIntervalRef = React.useRef(null);
  const hideTimeoutRef = React.useRef(null);
  const debounceTimeoutRef = React.useRef(null);
  const textareaRef = React.useRef(null);

  const DEBOUNCE_DELAY = 500; // ms of inactivity before processing text input

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const cancelTimers = React.useCallback(() => {
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const showStatus = React.useCallback((message, progress) => {
    setDropStatus({ active: true, progress, message });
  }, []);

  const startProgress = React.useCallback(
    (file) => {
      const fileLabel = file?.name ?? "file";
      cancelTimers();
      showStatus(`Reading ${fileLabel}`, 0);
      progressIntervalRef.current = window.setInterval(() => {
        setDropStatus((previous) => ({
          ...previous,
          progress: Math.min(99, previous.progress + Math.random() * 12 + 3),
        }));
      }, 220);
    },
    [cancelTimers, showStatus],
  );

  const completeProgress = React.useCallback(() => {
    cancelTimers();
    showStatus("Ready", 100);
    hideTimeoutRef.current = window.setTimeout(() => {
      setDropStatus({ active: false, progress: 0, message: "" });
    }, 900);
  }, [cancelTimers, showStatus]);

  const failProgress = React.useCallback(
    (message) => {
      cancelTimers();
      showStatus(message || "Unable to read file", 0);
      hideTimeoutRef.current = window.setTimeout(() => {
        setDropStatus({ active: false, progress: 0, message: "" });
      }, 1500);
    },
    [cancelTimers, showStatus],
  );

  React.useEffect(() => cancelTimers, [cancelTimers]);

  const debouncedOnUpdate = React.useCallback(
    (newValue) => {
      if (debounceTimeoutRef.current) {
        window.clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = window.setTimeout(() => {
        onUpdate(newValue);
      }, DEBOUNCE_DELAY);
    },
    [onUpdate, DEBOUNCE_DELAY],
  );

  React.useEffect(
    () => () => {
      if (debounceTimeoutRef.current) {
        window.clearTimeout(debounceTimeoutRef.current);
      }
    },
    [],
  );

  const scrollToLine = React.useCallback(
    (rawLineNumber, { select = true } = {}) => {
      const textarea = textareaRef.current;
      if (!textarea) {
        return;
      }

      const lines = textarea.value.split("\n");
      const totalLines = Math.max(1, lines.length);
      const targetLine = Math.min(
        totalLines,
        Math.max(1, Math.floor(rawLineNumber)),
      );

      const computedStyles =
        typeof window !== "undefined"
          ? window.getComputedStyle(textarea)
          : null;

      const rawLineHeight =
        computedStyles && computedStyles.lineHeight
          ? parseFloat(computedStyles.lineHeight)
          : 0;
      const rawFontSize =
        computedStyles && computedStyles.fontSize
          ? parseFloat(computedStyles.fontSize)
          : 0;

      const lineHeight =
        rawLineHeight > 0
          ? rawLineHeight
          : rawFontSize > 0
          ? rawFontSize * 1.3
          : 18;

      const lineTopOffset = (targetLine - 1) * lineHeight;
      const centerOffsetPx = Math.max(
        0,
        textarea.clientHeight / 2 - lineHeight / 2,
      );
      const maxScrollTop = Math.max(
        0,
        textarea.scrollHeight - textarea.clientHeight,
      );
      const desiredScrollTop = Math.min(
        maxScrollTop,
        Math.max(0, lineTopOffset - centerOffsetPx),
      );
      textarea.scrollTop = desiredScrollTop;

      if (select) {
        const lineIndex = targetLine - 1;
        const beforeLine = lines
          .slice(0, lineIndex)
          .reduce((acc, current) => acc + current.length + 1, 0);
        const currentLine = lines[lineIndex] ?? "";
        if (typeof textarea.setSelectionRange === "function") {
          try {
            textarea.focus({ preventScroll: true });
          } catch {
            textarea.focus();
          }
          textarea.setSelectionRange(
            beforeLine,
            beforeLine + currentLine.length,
          );
        } else {
          textarea.focus();
          textarea.select();
        }
      }
    },
    [],
  );

  const customTextConverter = React.useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
      createCustomTextConverter({
        onStart: startProgress,
        onSuccess: completeProgress,
        onFailure: failProgress,
      }),
    [startProgress, completeProgress, failProgress],
  );

  // https://react-dropzone.js.org/

  const scrollLineNumber = scrollRequest?.line ?? null;
  const scrollToken = scrollRequest?.token ?? 0;
  const shouldSelectLine = scrollRequest?.select ?? true;
  React.useEffect(() => {
    if (typeof scrollLineNumber === "number") {
      scrollToLine(scrollLineNumber, { select: shouldSelectLine });
    }
  }, [scrollToken, scrollLineNumber, shouldSelectLine, scrollToLine]);

  return (
    <div className="textarea-wrapper">
      <DropTextArea
        onChange={(e) => {
          const newValue = e.target.value;
          setLocalValue(newValue);
          debouncedOnUpdate(newValue);
        }}
        value={localValue}
        component={TextArea}
        textareaProps={{
          className: classNames("textarea", { dragging: isDragging }),
          rows: 25,
          ref: textareaRef,
        }}
        onDropRead={(text) => {
          setIsDragging(false);
          if (typeof text === "string") {
            onUpdate(text);
            completeProgress();
          } else {
            failProgress("Could not read dropped file");
          }
        }}
        onError={(msg) => {
          setIsDragging(false);
          const message = msg || "Unexpected error";
          showError(`Error: ${message}`);
          failProgress(message);
        }}
        customTextConverter={customTextConverter}
        dropzoneProps={{
          // Ref: https://react-dropzone.js.org/
          // extremely large files may cause a crash
          maxSize: config.maxFileSize,
          onDragEnter: () => setIsDragging(true),
          onDragLeave: () => setIsDragging(false),
        }}
      />
      {dropStatus.active && (
        <div className="drop-progress" aria-live="polite">
          <div className="drop-progress-header">
            <span>{dropStatus.message}</span>
            <span>{Math.round(dropStatus.progress)}%</span>
          </div>
          <div
            className="drop-progress-bar"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={Math.round(dropStatus.progress)}
          >
            <div
              className="drop-progress-fill"
              style={{ width: `${Math.min(100, dropStatus.progress)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

TextInput.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  scrollRequest: PropTypes.shape({
    line: PropTypes.number,
    token: PropTypes.number.isRequired,
    select: PropTypes.bool,
  }),
};

TextInput.defaultProps = {
  scrollRequest: undefined,
};

export default TextInput;
