import React, { useState, useEffect } from 'react';
import { TextArea } from '@blueprintjs/core';
import PropTypes from 'prop-types';

const TextInput = ({ onUpdate, value }) => {
  return (
    <TextArea
      className="bp3-code-block input"
      fill
      onChange={(e) => {
        onUpdate(e.target.value);
      }}
      value={value}
    />
  );
};

TextInput.propTypes = {
  onUpdate: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
};

TextInput.defaultProps = {};

export default TextInput;
