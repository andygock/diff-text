import React from "react";

const PrettyBytes = ({ bytes }) => {
  if (bytes == null || Number.isNaN(Number(bytes))) return null;

  const units = ["B", "kB", "MB", "GB", "TB"];

  let size = Number(bytes);
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  const formatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1,
  });
  const sizeString = formatter.format(size);

  // add a space between the number and unit for readability and localization
  return <span>{`${sizeString} ${units[unitIndex]}`}</span>;
};

export default PrettyBytes;
