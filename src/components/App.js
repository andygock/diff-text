import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ReactDiffViewer from 'react-diff-viewer';
import TextInput from './TextInput';
import './App.css';

// ref:
//   https://github.com/praneshr/react-diff-viewer

const initialLeft =
  'Paste text here\nOr drop a file with text content here\n\n123\n456\n789\n000';
const initialRight =
  'Paste text here\nOr drop a file with text content here\n\n123\n456diff\n789\nExtra line';

const maxPermittedLineLength = 1000;

const getMaxLineLength = (str) => {
  return Math.max(...str.split('\n').map((s) => s.length));
};

const App = () => {
  const [inputLeft, setInputLeft] = useState(initialLeft);
  const [inputRight, setInputRight] = useState(initialRight);

  // check max line length, if longer than 1000 chars - do not render ReactDiffViewer as it may crash
  const maxInputLines = Math.max(
    getMaxLineLength(inputLeft),
    getMaxLineLength(inputRight)
  );

  return (
    <div className="app">
      <p className="heading">
        diff-text - A web app for comparing two portions of text using{' '}
        <a href="https://github.com/praneshr/react-diff-viewer">
          react-diff-viewer
        </a>
      </p>
      <div className="grid">
        <TextInput onUpdate={setInputLeft} value={inputLeft} />
        <TextInput onUpdate={setInputRight} value={inputRight} />
      </div>
      <div className="output bp3-monospace-text">
        {maxInputLines <= maxPermittedLineLength ? (
          <ReactDiffViewer
            oldValue={inputLeft}
            newValue={inputRight}
            splitView={false}
          />
        ) : (
          <p>
            Error: Can not calculate line differences if any line is over{' '}
            {maxPermittedLineLength} characters long.
          </p>
        )}
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
