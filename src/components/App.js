import { Button } from '@blueprintjs/core';
import React from 'react';
import './App.css';
import Diff from './Diff';
import Footer from './Footer';
import TextInput from './TextInput';

// ref:
//   https://github.com/praneshr/react-diff-viewer

const initialLeft = `Paste text here, or drop a text or spreadsheet file here
Each line is compared for differences with results shown below

Lines are compared character by character

Replaced lines are detected

And so are deleted lines

Common lines are not marked 1
Common lines are not marked 2
Common lines are not marked 3
`;

const initialRight = `Paste text here, or drop a text or spreadsheet file here
Each line is compared for differences with results shown below

Lines are compared characTER by character

Lines replaced are detected

Common lines are not marked 1
Common lines are not marked 2
Common lines are not marked 3

Additional lines are marked green`;

const App = () => {
  const [inputLeft, setInputLeft] = React.useState(initialLeft);
  const [inputRight, setInputRight] = React.useState(initialRight);

  return (
    <div className="app">
      <div className="grid-header">
        <p className="heading">
          diff-text - A web app for comparing two portions of text using{' '}
          <a href="https://github.com/praneshr/react-diff-viewer">
            react-diff-viewer
          </a>
          . Supports text and{' '}
          <a href="https://github.com/sheetjs/sheetjs#file-formats">
            common spreadsheet files
          </a>
          .
        </p>
        <div className="center">
          <Button
            minimal
            onClick={() => {
              // swap left and right contents
              const [left, right] = [inputLeft, inputRight];
              setInputLeft(right);
              setInputRight(left);
            }}
          >
            &harr;
          </Button>
        </div>
        <div>&nbsp;</div>
      </div>

      <div className="grid-inputs">
        <TextInput onUpdate={setInputLeft} value={inputLeft} />
        <TextInput onUpdate={setInputRight} value={inputRight} />
      </div>
      <div className="output bp3-monospace-text">
        <Diff left={inputLeft} right={inputRight} />
      </div>
      <Footer />
    </div>
  );
};

App.propTypes = {};

App.defaultProps = {};

export default App;
