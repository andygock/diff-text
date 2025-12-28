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
          import("xlsx")
            .then((XLSX) => {
              try {
                const timeStart = performance.now();
                const wb = XLSX.read(arrayBuffer, { type: "array" });

                if (!wb.SheetNames || wb.SheetNames.length === 0) {
                  fail("Error: Spreadsheet has no worksheets");
                  return;
                }

                const ws = wb.Sheets[wb.SheetNames[0]];
                const csv = XLSX.utils.sheet_to_csv(ws);

                const lines = csv.split("\n");
                while (lines.length > 0 && lines[lines.length - 1] === "") {
                  lines.pop();
                }

                if (lines.length > config.maxLines) {
                  fail(
                    `Error: Exceeded maximum ${config.maxLines} spreadsheet lines`,
                  );
                  return;
                }

                const maxLineLength =
                  lines.length === 0
                    ? 0
                    : Math.max(...lines.map((line) => line.length));
                if (maxLineLength > config.maxPermittedLineLength) {
                  fail(
                    `Error: Exceeded maximum ${config.maxPermittedLineLength} line length`,
                  );
                  return;
                }

                const timeEnd = performance.now();
                const timeTaken = timeEnd - timeStart;
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
          if (isBinary(arrayBuffer)) {
            fail(
              "Error: Detected non-text file (over 5% of first 512 bytes are control characters)",
            );
            return;
          }

          if (arrayBuffer.byteLength >= config.maxFileSize) {
            const prettyMaxSize = prettyBytes(config.maxFileSize);
            fail(`Error: File is larger than ${prettyMaxSize}`);
            return;
          }

          const string = arrayBufferToString(arrayBuffer);
          const lines = string.split("\n");

          if (lines.length > config.maxLines) {
            fail(`Error: Exceeded maximum ${config.maxLines} text lines`);
            return;
          }

          const maxLineLength =
            lines.length === 0
              ? 0
              : Math.max(...lines.map((line) => line.length));
          if (maxLineLength > config.maxPermittedLineLength) {
            fail(
              `Error: Exceeded maximum ${config.maxPermittedLineLength} line length`,
            );
            return;
          }

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

  /* eslint-disable-next-line no-bitwise */
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

const TextInput = ({ onUpdate, value }) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [dropStatus, setDropStatus] = React.useState({
    active: false,
    progress: 0,
    message: "",
  });
  const progressIntervalRef = React.useRef(null);
  const hideTimeoutRef = React.useRef(null);

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
          progress: Math.min(95, previous.progress + Math.random() * 12 + 3),
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

  const customTextConverter = React.useMemo(
    () =>
      createCustomTextConverter({
        onStart: startProgress,
        onSuccess: completeProgress,
        onFailure: failProgress,
      }),
    [startProgress, completeProgress, failProgress],
  );

  // https://react-dropzone.js.org/

  return (
    <div className="textarea-wrapper">
      <DropTextArea
        onChange={(e) => {
          onUpdate(e.target.value);
        }}
        value={value}
        component={TextArea}
        textareaProps={{
          className: classNames("textarea", { dragging: isDragging }),
          rows: 25,
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
};

TextInput.defaultProps = {};

export default TextInput;
