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

// check arrayBuffer if it is a binary file or text file, make the best guess
// check first 512 bytes only
// ascii text files should be in range of 0x00 to 0x7F
const isBinary = (arrayBuffer) => {
  const uint8Array = new Uint8Array(arrayBuffer);
  const maxBytes = Math.min(uint8Array.byteLength, 512);

  // count number of non-ascii bytes
  let binaryBytes = 0;

  // loop through up to first 512 bytes
  for (let i = 0; i < maxBytes; i++) {
    const byte = uint8Array[i];
    // ignore CR and LF, these are allowed in text files
    if (byte === 0x0a || byte === 0x0d) {
      continue;
    }

    if (byte > 0x7f) {
      // non-ascii byte
      binaryBytes++;
    }
  }

  // console.log(`binary bytes detected: ${binaryBytes}/${maxBytes}`);

  // if more than 5% of bytes are non-ascii, then it is probably a binary file
  if (binaryBytes / maxBytes > 0.05) {
    return true;
  }

  return false;
};

// check whether file is a spreadsheet file
const isSpreadsheetFile = (file) => {
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

  // convert ArrayBuffer to text, compatible with spreadsheet formats
  const customTextConverter = (arrayBuffer, { file }) =>
    new Promise((resolve, reject) => {
      try {
        if (isSpreadsheetFile(file)) {
          //
          // compatible spreadsheet format, based on file extension
          //

          // dynamic load xlsx library and read XLSX ArrayBuffer
          import("xlsx").then((XLSX) => {
            try {
              // read workbook
              const wb = XLSX.read(arrayBuffer, { type: "array" });

              // only supports reading of the first worksheet, converted to CSV
              const ws = wb.Sheets[wb.SheetNames[0]];

              // https://github.com/sheetjs/sheetjs#utility-functions
              const csv = XLSX.utils.sheet_to_csv(ws);

              //
              // don't check lines, sometimes can be many blank lines at end of spreadsheet
              //
              // if (csv.length > config.maxLines) {
              //   showError(
              //     `Error: Exceeded maximum ${config.maxLines} spreadsheet lines`
              //   );
              //   return;
              // }

              // console.log(csv);
              resolve(csv);
            } catch (e) {
              // problem reading spreadsheet
              showError(`Error: ${e.message}`);
            }
          });
        } else {
          //
          // is standard text, or it could be some other file which is not a spreadsheet
          //

          // check arrayBuffer if it is a binary file or text file
          if (isBinary(arrayBuffer)) {
            showError(
              `Error: Detected non-spreadsheet binary file (over >5% of first 512 bytes is not text)`,
            );
            return;
          }

          // check max file size
          // extremely large files may cause a crash
          if (arrayBuffer.byteLength >= config.maxFileSize) {
            const prettyMaxSize = prettyBytes(config.maxFileSize);
            showError(`Error: File is larger than ${prettyMaxSize}`);
            return;
          }

          const string = arrayBufferToString(arrayBuffer);

          // check number of lines
          const lines = string.split("\n");

          if (lines.length > config.maxLines) {
            showError(`Error: Exceeded maximum ${config.maxLines} text lines`);
            return;
          }

          // check length of lines, very long lines can cause ReactDiffViewer to crash
          const maxLineLength = Math.max(...lines.map((line) => line.length));
          if (maxLineLength > config.maxPermittedLineLength) {
            showError(
              `Error: Exceeded maximum ${config.maxPermittedLineLength} line length`,
            );
            return;
          }

          // console.log(string);
          resolve(string);
        }
      } catch (error) {
        // Display error in textarea and console
        console.error(error);
        resolve(error);
      }
    });

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
        onDropRead={(text) => onUpdate(text)}
        onError={(msg) => showError(`Error: ${msg}`)}
        customTextConverter={customTextConverter}
        dropzoneProps={{
          // Ref: https://react-dropzone.js.org/
          // extremely large files may cause a crash
          // maxSize: config.maxFileSize,
          className: "dropzone",
          activeClassName: "dropzone-active",
          rejectClassName: "dropzone-reject",
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
