import { TextArea } from '@blueprintjs/core';
import classNames from 'classnames';
import { isBinary } from 'istextorbinary';
import PropTypes from 'prop-types';
import React from 'react';
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

// code splitted function to read a spreadsheet file using SheetJS
// https://github.com/sheetjs/sheetjs
const readFileSpreadsheet = async (data) => {
  try {
    // dynamic load the library and read XLSX ArrayBuffer
    const XLSX = await import('xlsx');

    const wb = XLSX.read(data, { type: 'array' });

    // currently only supports reading of the first worksheet
    // it is converted to CSV, then the CSV is diffed
    const ws = wb.Sheets[wb.SheetNames[0]];

    // https://github.com/sheetjs/sheetjs#utility-functions
    const csv = XLSX.utils.sheet_to_csv(ws);
    return csv;
  } catch (err) {
    console.error(err);
    return err;
  }
};

// read File object using FileReader API
const readFile = (file, callback, options) => {
  // read the file object
  const reader = new FileReader();

  // spreadsheet binary mode
  if (options?.xlsx) {
    reader.onloadend = async () => {
      const text = await readFileSpreadsheet(reader.result);
      callback(text);
    };
    reader.readAsArrayBuffer(file);
    return;
  }

  // normal text mode
  reader.onloadend = () => {
    const lines = reader.result.split('\n').length;
    if (lines > config.maxLines) {
      showError(`Error: Exceeded maximum ${config.maxLines} text lines`);
      return;
    }
    callback(reader.result);
  };
  reader.readAsText(file);
};

const TextInput = ({ onUpdate, value }) => {
  const [dragCounter, setDragCounter] = React.useState(0);

  const dragCounterIncrement = () => setDragCounter((prev) => prev + 1);
  const dragCounterDecrement = () =>
    setDragCounter((prev) => Math.max(0, prev - 1));

  const onLoadHandler = (data) => {
    // check content of file to see if it seems to be a binary file
    if (isBinary(null, data)) {
      showError(
        `Error: Dropped file's contents appears not to be a text or spreadsheet file`
      );
      return;
    }

    // make callback with file contents
    onUpdate(data);
  };

  const onDropHandler = (e) => {
    e.preventDefault();
    dragCounterDecrement();

    // get file objects, if they exist
    const files = e.dataTransfer.files;

    // check if user dropped more than one file
    if (files.length > 1) {
      // user dropped more than one file
      showError(`Error: Don't drop more than one file.`);
      return;
    }

    const file = files[0];

    // extremely large files may cause a crash
    if (file.size > config.maxFileSize) {
      showError(`Error: Exceeded max file size of ${config.maxFileSize} bytes`);
      return;
    }

    if (isSpreadsheetFile(file)) {
      // special case, we can compare spreadsheet binary files
      // console.log('Spreadsheet file not supported yet');
      readFile(file, onLoadHandler, { xlsx: true });
      return;
    }

    // check filename, whether it may be a binary file
    // if all good, we'll check for the content later again
    if (isBinary(file.name)) {
      showError(
        `Error: Dropped file appears to be not a text file (by file extension)`
      );
      return;
    }

    // read the file object
    readFile(file, onLoadHandler);
  };

  return (
    <div>
      <TextArea
        className={classNames('bp3-code-block', 'input', {
          dragover: dragCounter,
        })}
        fill
        onChange={(e) => {
          onUpdate(e.target.value);
        }}
        value={value}
        onDrop={onDropHandler}
        onDragEnter={(e) => {
          e.preventDefault();
          dragCounterIncrement();
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          dragCounterDecrement();
        }}
        onDragOver={(e) => {
          e.preventDefault();
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
