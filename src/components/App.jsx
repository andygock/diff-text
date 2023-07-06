import React from "react";
import "./App.css";
import Diff from "./Diff";
import Footer from "./Footer";
import TextInput from "./TextInput";
import DiffViewerOptions from "./DiffViewerOptions";
import { initialLeft, initialRight } from "../library/inputs";

const App = () => {
  const [inputLeft, setInputLeft] = React.useState(initialLeft);
  const [inputRight, setInputRight] = React.useState(initialRight);
  const [options, setOptions] = React.useState({
    splitView: false,
    compareMethod: "diffChars",
  });

  return (
    <div className="app">
      <div className="grid-header">
        <p className="heading">
          diff-text - Compare two portions of text in a browser. Supports text
          and{" "}
          <a href="https://docs.sheetjs.com/docs/#supported-file-formats">
            common spreadsheet files
          </a>
          .
        </p>
        <div className="center">
          <button
            onClick={() => {
              // swap left and right contents
              const [left, right] = [inputLeft, inputRight];
              setInputLeft(right);
              setInputRight(left);
            }}
          >
            &harr;
          </button>
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
