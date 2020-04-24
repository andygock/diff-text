import { Button, ButtonGroup } from '@blueprintjs/core';
import React from 'react';

const DiffViewerOptions = ({ options, onChange }) => {
  const compareButtons = [
    {
      method: 'diffChars',
      text: 'Chars',
    },
    {
      method: 'diffWords',
      text: 'Words',
    },
    {
      method: 'diffWordsWithSpace',
      text: 'Words+Space',
    },
    {
      method: 'diffLines',
      text: 'Lines',
    },
    {
      method: 'diffTrimmedLines',
      text: 'Trimmed Lines',
    },
    {
      method: 'diffSentences',
      text: 'Sentences',
    },
  ];

  return (
    <div className="options">
      <ButtonGroup>
        {compareButtons.map((data) => (
          <Button
            key={data.method}
            active={options?.compareMethod === data.method}
            onClick={() => {
              onChange({ ...options, compareMethod: data.method });
            }}
          >
            {data.text}
          </Button>
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
