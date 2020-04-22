import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TextArea } from '@blueprintjs/core';
import ReactDiffViewer from 'react-diff-viewer';
import TextInput from './TextInput';
import './App.css';

// ref:
// https://github.com/praneshr/react-diff-viewer

const initialLeft = 'Paste text here\n\n123\n456\n789\n000';
const initialRight = 'Paste text here\n\n123\n456diff\n789\nExtra line';

const App = () => {
  const [inputLeft, setInputLeft] = useState('');
  const [inputRight, setInputRight] = useState('');

  useEffect(() => {
    // nothing needed at the moment
  }, []);

  return (
    <div className="app">
      <p className="heading">
        diff-text - A web app for comparing two portions of text using{' '}
        <a href="https://github.com/praneshr/react-diff-viewer">
          react-diff-viewer
        </a>
      </p>
      <div className="grid">
        <TextInput onUpdate={setInputLeft} initialValue={initialLeft} />
        <TextInput onUpdate={setInputRight} initialValue={initialRight} />
      </div>
      <div className="output bp3-monospace-text">
        <ReactDiffViewer
          oldValue={inputLeft}
          newValue={inputRight}
          splitView={false}
        />
      </div>
      <div className="footer bp3-text-small">
        &copy; <a href="https://gock.net/">Andy Gock</a> | MIT License |{' '}
        <a href="https://github.com/andygock/diff-text">GitHub</a>
      </div>
    </div>
  );
};

App.propTypes = {};

App.defaultProps = {};

export default App;
