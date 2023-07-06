import React from "react";
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
      <div>
        {compareButtons.map((data) => (
          <label key={data.method}>
            <input
              type="radio"
              name="compareMethod"
              value={data.method}
              checked={options?.compareMethod === data.method}
              onChange={() => {
                onChange({ ...options, compareMethod: data.method });
              }}
            />
            {useShortButtons ? data.text : data.tooltip}
          </label>
        ))}
      </div>
      &nbsp;
      <div>
        <label>
          <input
            type="radio"
            name="viewType"
            value="unified"
            checked={!options?.splitView}
            onChange={() => {
              onChange({ ...options, splitView: false });
            }}
          />
          Unified
        </label>
        <label>
          <input
            type="radio"
            name="viewType"
            value="split"
            checked={options?.splitView}
            onChange={() => {
              onChange({ ...options, splitView: true });
            }}
          />
          Split
        </label>
      </div>
    </div>
  );
};

DiffViewerOptions.propTypes = {};

DiffViewerOptions.defaultProps = {};

export default DiffViewerOptions;
