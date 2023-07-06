import React from "react";
import PropTypes from "prop-types";
import useWindowSize from "../hooks/useWindowSize";

const DiffViewerOptions = ({ options, onChange }) => {
  const compareButtons = [
    {
      method: "diffChars",
      text: "Ch",
      tooltip: "Characters",
    },
    {
      method: "diffWords",
      text: "W",
      tooltip: "Words",
    },
    {
      method: "diffWordsWithSpace",
      text: "W+S",
      tooltip: "Words & Space",
    },
    {
      method: "diffLines",
      text: "L",
      tooltip: "Lines",
    },
    {
      method: "diffTrimmedLines",
      text: "TL",
      tooltip: "Trimmed Lines",
    },
    {
      method: "diffSentences",
      text: "S",
      tooltip: "Sentences",
    },
  ];

  // use shorter buttons with tooltips when window width is small to prevent wrapping
  const size = useWindowSize();
  const useShortButtons = size.width < 1500;

  return (
    <div className="options">
      <div className="compare-method">
        {compareButtons.map((data, index) => (
          <span key={data.method}>
            <input
              id={`compareMethod${index}`}
              type="radio"
              name="compareMethod"
              value={data.method}
              checked={options?.compareMethod === data.method}
              onChange={() => {
                onChange({ ...options, compareMethod: data.method });
              }}
            />
            <label htmlFor={`compareMethod${index}`} className="radio-button">
              {useShortButtons ? data.text : data.tooltip}
            </label>
          </span>
        ))}
      </div>
      <div className="view-type">
        <input
          id="viewTypeUnified"
          type="radio"
          name="viewType"
          value="unified"
          checked={!options?.splitView}
          onChange={() => {
            onChange({ ...options, splitView: false });
          }}
        />
        <label htmlFor="viewTypeUnified" className="radio-button">
          Unified
        </label>

        <input
          id="viewTypeSplit"
          type="radio"
          name="viewType"
          value="split"
          checked={options?.splitView}
          onChange={() => {
            onChange({ ...options, splitView: true });
          }}
        />
        <label htmlFor="viewTypeSplit" className="radio-button">
          Split
        </label>
      </div>
    </div>
  );
};

DiffViewerOptions.propTypes = {
  options: PropTypes.object,
  onChange: PropTypes.func.isRequired,
};

DiffViewerOptions.defaultProps = {
  options: {},
};

export default DiffViewerOptions;
