/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { TextArea } from '@blueprintjs/core';
import PropTypes from 'prop-types';

const TextInput = ({ onUpdate, initialValue }) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    onUpdate(value);
  }, [onUpdate, value]);

  return (
    <TextArea
      className="bp3-code-block input"
      fill
      onChange={(e) => {
        setValue(e.target.value);
      }}
      value={value}
    />
  );
};

TextInput.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  initialValue: PropTypes.string,
};

TextInput.defaultProps = {
  initialValue: '',
};

export default TextInput;
