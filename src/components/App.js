import { Button } from '@blueprintjs/core';
import React from 'react';
import './App.css';
import Diff from './Diff';
import Footer from './Footer';
import TextInput from './TextInput';
import DiffViewerOptions from './DiffViewerOptions';
import { initialLeft, initialRight } from '../library/inputs';

const App = () => {
  const [inputLeft, setInputLeft] = React.useState(initialLeft);
  const [inputRight, setInputRight] = React.useState(initialRight);
  const [options, setOptions] = React.useState({
    splitView: false,
    compareMethod: 'diffChars',
  });

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
        <div>
          <DiffViewerOptions
            options={options}
            onChange={(options) => setOptions(options)}
          />
        </div>
      </div>

      <div className="grid-inputs">
        <TextInput onUpdate={setInputLeft} value={inputLeft} />
        <TextInput onUpdate={setInputRight} value={inputRight} />
      </div>
      <div className="output bp3-monospace-text">
        <Diff left={inputLeft} right={inputRight} options={options} />
      </div>
      <Footer />
    </div>
  );
};

App.propTypes = {};

App.defaultProps = {};

export default App;
