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

// convert ArrayBuffer to text, compatible with spreadsheet formats
const customTextConverter = (arrayBuffer, { file } = {}) =>
  new Promise((resolve) => {
    const fail = (message) => {
      showError(message);
      resolve(null);
    };

    try {
      if (!arrayBuffer) {
        fail("Error: No file data to read");
        return;
      }

      if (isSpreadsheetFile(file)) {
        //
        // compatible spreadsheet format, based on file extension
        //

        // dynamic load xlsx library and read XLSX ArrayBuffer
        import("xlsx")
          .then((XLSX) => {
            try {
              // record this to ead XLSx file
              const timeStart = performance.now();

              // read workbook
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

              // console.log(csv);
              resolve(csv);
            } catch (e) {
              // problem reading spreadsheet
              fail(`Error: ${e.message}`);
            }
          })
          .catch((error) => {
            fail(`Error: ${error.message}`);
          });
      } else {
        //
        // is standard text, or it could be some other file which is not a spreadsheet
        //

        // check arrayBuffer if it is a binary file or text file
        if (isBinary(arrayBuffer)) {
          fail(
            "Error: Detected non-text file (over 5% of first 512 bytes are control characters)",
          );
          return;
        }

        // check max file size
        // extremely large files may cause a crash
        // readt-dropzone may already check for this when dropping files, would have already aborted if size is too large
        if (arrayBuffer.byteLength >= config.maxFileSize) {
          const prettyMaxSize = prettyBytes(config.maxFileSize);
          fail(`Error: File is larger than ${prettyMaxSize}`);
          return;
        }

        // convert ArrayBuffer to string
        const string = arrayBufferToString(arrayBuffer);

        // check number of lines
        const lines = string.split("\n");

        // check number of lines, very large files can cause ReactDiffViewer to crash
        if (lines.length > config.maxLines) {
          fail(`Error: Exceeded maximum ${config.maxLines} text lines`);
          return;
        }

        // check length of lines, very long lines can cause ReactDiffViewer to crash
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

        // console.log(string);
        resolve(string);
      }
    } catch (error) {
      // parsing errors from xlsx may be thrown and caught here
      fail(`Error: ${error.message}`);
      // console.error(error);
    }
  });

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

    if (byte === 0x00 || (byte < 0x20 || byte === 0x7f)) {
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
  // https://react-dropzone.js.org/

  return (
    <div>
      <DropTextArea
        onChange={(e) => {
          onUpdate(e.target.value);
        }}
        value={value}
        component={TextArea}
        textareaProps={{
          className: classNames("textarea"),
          rows: 25,
        }}
        onDropRead={(text) => {
          if (typeof text === "string") {
            onUpdate(text);
          }
        }}
        onError={(msg) => showError(`Error: ${msg}`)}
        customTextConverter={customTextConverter}
        dropzoneProps={{
          // Ref: https://react-dropzone.js.org/
          // extremely large files may cause a crash
          maxSize: config.maxFileSize,
        }}
      />
    </div>
  );
};

TextInput.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
};

TextInput.defaultProps = {};

export default TextInput;
