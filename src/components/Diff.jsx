import PropTypes from "prop-types";
import React from "react";
import ReactDiffViewer from "react-diff-viewer-continued";
import config from "../config";

const getMaxLineLength = (input) => {
  const s = String(input || "");
  const parts = s.split("\n");
  return Math.max(...parts.map((p) => p.length));
};

const Diff = ({ left, right, options, onLineNumberClick }) => {
  // check max line length, coerce inputs to strings to avoid exceptions
  const safeLeft = String(left || "");
  const safeRight = String(right || "");
  const maxInputLines = Math.max(
    getMaxLineLength(safeLeft),
    getMaxLineLength(safeRight),
  );

  if (maxInputLines > config.maxPermittedLineLength) {
    return (
      <p>
        Error: Can not calculate line differences if any line is over{" "}
        {config.maxPermittedLineLength} characters long.
      </p>
    );
  }

  if (safeLeft === safeRight) {
    // content is identical
    return <p className="identical">Content is identical</p>;
  }

  // Whitelist allowed option props instead of spreading user-controlled options
  const allowedOptions =
    options && typeof options === "object"
      ? {
          splitView: options.splitView,
          compareMethod: options.compareMethod,
          showDiffOnly: options.showDiffOnly,
          hideLineNumbers: options.hideLineNumbers,
          leftTitle: options.leftTitle,
          rightTitle: options.rightTitle,
        }
      : {};

  return (
    <ReactDiffViewer
      oldValue={safeLeft}
      newValue={safeRight}
      splitView={false}
      onLineNumberClick={onLineNumberClick}
      {...allowedOptions}
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
