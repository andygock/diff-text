import { TextArea } from '@blueprintjs/core';
import classNames from 'classnames';
import { isBinary } from 'istextorbinary';
import PropTypes from 'prop-types';
import React from 'react';
import DropTextArea from 'react-dropzone-textarea';
import prettyBytes from 'pretty-bytes';
import config from '../config';
import { showError } from '../library/toaster';

// check whether file is a spreadsheet file
const isSpreadsheetFile = (file) => {
  /* eslint-disable-next-line no-bitwise */
  const ext = file.name.slice(((file.name.lastIndexOf('.') - 1) >>> 0) + 2);
  return [
    'xls',
    'xlsx',
    'xlsb',
    'xlsm',
    'dif',
    'sylk',
    'slk',
    'prn',
    'ods',
    'fods',
    'dbf',
    'wks',
    'wk1',
    'wk2',
    'wk3',
    'wk4',
    '123',
    'wq1',
    'wq2',
    'wb1',
    'wb2',
    'wb3',
    'qbw',
  ].includes(ext.toLowerCase());
};

// convert ArrayBuffer to string, works in browsers only
const arrayBufferToString = (arrayBuffer) =>
  new TextDecoder('utf-8').decode(arrayBuffer);

const TextInput = ({ onUpdate, value }) => {
  // https://react-dropzone.js.org/

  // convert ArrayBuffer to text, compatible with spreadsheet formats
  const customTextConverter = (arrayBuffer, { file }) =>
    new Promise((resolve, reject) => {
      try {
        if (isSpreadsheetFile(file)) {
          //
          // compatible spreadsheet format
          //
          // dynamic load xlsx library and read XLSX ArrayBuffer
          import('xlsx').then((XLSX) => {
            // read workbook
            const wb = XLSX.read(arrayBuffer, { type: 'array' });

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
          });
        } else {
          //
          // standard text
          //

          // check if binary
          if (isBinary(file?.name || null, arrayBuffer)) {
            showError(`Error: Detected non-spreadsheet binary file`);
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
          const lines = string.split('\n');

          if (lines.length > config.maxLines) {
            showError(`Error: Exceeded maximum ${config.maxLines} text lines`);
            return;
          }

          // check length of lines, very long lines can cause ReactDiffViewer to crash
          const maxLineLength = Math.max(...lines.map((line) => line.length));
          if (maxLineLength > config.maxPermittedLineLength) {
            showError(
              `Error: Exceeded maximum ${config.maxPermittedLineLength} line length`
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
          className: classNames('bp3-code-block', 'input'),
          fill: true,
        }}
        onDropRead={(text) => onUpdate(text)}
        onError={(msg) => showError(`Error: ${msg}`)}
        customTextConverter={customTextConverter}
        dropzoneProps={
          {
            // Ref: https://react-dropzone.js.org/
            // extremely large files may cause a crash
            // maxSize: config.maxFileSize,
          }
        }
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
