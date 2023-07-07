import React from "react";

const PrettyBytes = ({ bytes }) => {
  const units = ["B", "kB", "MB", "GB", "TB"];

  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  const sizeString = size.toFixed(1);

  return <span>{`${sizeString}${units[unitIndex]}`}</span>;
};

export default PrettyBytes;
