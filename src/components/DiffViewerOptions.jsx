import { Button, ButtonGroup, Position, Tooltip } from "@blueprintjs/core";
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
      <ButtonGroup>
        {compareButtons.map((data) => (
          <Tooltip
            key={data.method}
            content={data.tooltip}
            position={Position.BOTTOM}
            disabled={!useShortButtons}
          >
            <Button
              key={data.method}
              active={options?.compareMethod === data.method}
              onClick={() => {
                onChange({ ...options, compareMethod: data.method });
              }}
            >
              {useShortButtons ? data.text : data.tooltip}
            </Button>
          </Tooltip>
        ))}
      </ButtonGroup>
      &nbsp;
      <ButtonGroup>
        <Button
          active={!options?.splitView}
          onClick={() => {
            onChange({ ...options, splitView: false });
          }}
        >
          Unified
        </Button>
        <Button
          active={options?.splitView}
          onClick={() => {
            onChange({ ...options, splitView: true });
          }}
        >
          Split
        </Button>
      </ButtonGroup>
    </div>
  );
};

DiffViewerOptions.propTypes = {};

DiffViewerOptions.defaultProps = {};

export default DiffViewerOptions;
