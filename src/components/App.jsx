import React from "react";
import "./App.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Diff from "./Diff";
import Footer from "./Footer";
import TextInput from "./TextInput";
import DiffViewerOptions from "./DiffViewerOptions";
import { initialLeft, initialRight } from "../library/inputs";
import config from "../config";
import PrettyBytes from "./PrettyBytes";

const App = () => {
  const [inputLeft, setInputLeft] = React.useState(initialLeft);
  const [inputRight, setInputRight] = React.useState(initialRight);
  const [options, setOptions] = React.useState({
    splitView: false,
    compareMethod: "diffChars",
  });
  const deferredLeft = React.useDeferredValue(inputLeft); // keep diff SPA responsive for large files
  const deferredRight = React.useDeferredValue(inputRight);
  const isDiffPending =
    deferredLeft !== inputLeft || deferredRight !== inputRight;

  return (
    <div className={isDiffPending ? "app app-pending" : "app"}>
      <ToastContainer />
      <div className="grid-header">
        <p className="heading">
          diff-text - Compare two portions of text in the browser. Supports text
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
      <div className="output">
        {isDiffPending && (
          <div className="diff-pending" aria-live="polite">
            Preparing diff...
          </div>
        )}
        <Diff left={deferredLeft} right={deferredRight} options={options} />
      </div>

      {/* list config limits, maxLines and maxFileSize permitted */}
      <div className="limits">
        <p>
          Limits: {config.maxLines.toLocaleString()} lines,{" "}
          <PrettyBytes bytes={config.maxFileSize} /> file size and{" "}
          {config.maxPermittedLineLength.toLocaleString()} characters per line.
        </p>
      </div>

      <Footer />
    </div>
  );
};

App.propTypes = {};

App.defaultProps = {};

export default App;
