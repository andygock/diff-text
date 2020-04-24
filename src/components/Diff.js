import mem from 'mem';
import PropTypes from 'prop-types';
import React from 'react';
import ReactDiffViewer from 'react-diff-viewer';
import Spark from 'spark-md5';

const maxPermittedLineLength = 1000;

// memoized MD5 calculation
const md5 = mem((s) => Spark.hash(s));

const getMaxLineLength = (str) => {
  return Math.max(...str.split('\n').map((s) => s.length));
};

const Diff = ({ left, right }) => {
  // calculate md5 hash
  const hash = {
    left: md5(left),
    right: md5(right),
  };

  // check max line length, if longer than 1000 chars - do not render ReactDiffViewer as it may crash
  const maxInputLines = Math.max(
    getMaxLineLength(left),
    getMaxLineLength(right)
  );

  if (maxInputLines > maxPermittedLineLength) {
    return (
      <p>
        Error: Can not calculate line differences if any line is over{' '}
        {maxPermittedLineLength} characters long.
      </p>
    );
  }

  if (hash.left === hash.right) {
    // content is identical
    return <p className="identical">Content is identical</p>;
  }

  return <ReactDiffViewer oldValue={left} newValue={right} splitView={false} />;
};

Diff.propTypes = {
  left: PropTypes.string.isRequired,
  right: PropTypes.string.isRequired,
};

Diff.defaultProps = {};

export default Diff;
