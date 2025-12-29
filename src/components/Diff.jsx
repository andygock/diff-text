import PropTypes from "prop-types";
import React from "react";
import ReactDiffViewer from "react-diff-viewer-continued";
import config from "../config";

const getMaxLineLength = (str) =>
  Math.max(...str.split("\n").map((s) => s.length));

const Diff = ({ left, right, options, onLineNumberClick }) => {
  // check max line length, if longer than permitted chars chars - do not render ReactDiffViewer as it may crash
  const maxInputLines = Math.max(
    getMaxLineLength(left),
    getMaxLineLength(right),
  );

  if (maxInputLines > config.maxPermittedLineLength) {
    return (
      <p>
        Error: Can not calculate line differences if any line is over{" "}
        {config.maxPermittedLineLength} characters long.
      </p>
    );
  }

  if (left === right) {
    // content is identical
    return <p className="identical">Content is identical</p>;
  }

  return (
    <ReactDiffViewer
      oldValue={left}
      newValue={right}
      splitView={false}
      onLineNumberClick={onLineNumberClick}
      {...options}
    />
  );
};

Diff.propTypes = {
  left: PropTypes.string.isRequired,
  right: PropTypes.string.isRequired,
  options: PropTypes.object,
  onLineNumberClick: PropTypes.func,
};

Diff.defaultProps = {
  options: {},
  onLineNumberClick: undefined,
};

export default Diff;
