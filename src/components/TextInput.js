import React, { useState, useEffect } from 'react';
import { TextArea } from '@blueprintjs/core';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { isText, isBinary, getEncoding } from 'istextorbinary';

const TextInput = ({ onUpdate, value }) => {
  const [dragCounter, setDragCounter] = React.useState(0);

  const dragCounterIncrement = () => setDragCounter((prev) => prev + 1);
  const dragCounterDecrement = () =>
    setDragCounter((prev) => Math.max(0, prev - 1));

  return (
    <TextArea
      className={classNames('bp3-code-block', 'input', {
        dragover: dragCounter,
      })}
      fill
      onChange={(e) => {
        onUpdate(e.target.value);
      }}
      value={value}
      onDrop={(e) => {
        e.preventDefault();
        dragCounterDecrement();

        // get file objects, if they exist
        const files = e.dataTransfer.files;

        // check if user dropped more than one file
        if (files.length > 1) {
          // user dropped more than one file
          window.alert("Error: Don't drop more than one file.");
          return;
        }

        const file = files[0];

        // check filename, whether it may be a binary file
        // if all good, we'll check for the content later again
        if (isBinary(file.name)) {
          window.alert(
            'Error: Dropped file appears to be not a text file (by file extension)'
          );
          return;
        }

        // read the file object
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onloadend = () => {
          // reading of file complete
          // console.log(file.name, reader.result);

          // check content of file to see if it seems to be a binary file
          if (isBinary(null, reader.result)) {
            // binary file was read
            window.alert('Error: Dropped file appears to be not a text file');
            return;
          }

          // make callback with file contents
          onUpdate(reader.result);
        };
      }}
      onDragEnter={(e) => {
        // console.log(e);
        e.preventDefault();
        dragCounterIncrement();
      }}
      onDragLeave={(e) => {
        // console.log(e);
        e.preventDefault();
        dragCounterDecrement();
      }}
      onDragOver={(e) => {
        e.preventDefault();
      }}
    />
  );
};

TextInput.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
};

TextInput.defaultProps = {};

export default TextInput;
