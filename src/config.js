export default {
  // Bound imported bytes and decoded text before allocating a diff model.
  maxFileSize: 1024 * 1024 * 10, // 10 MiB
  maxLines: 100000,
  maxPermittedLineLength: 100000,
  maxExpandedSize: 64 * 1024 * 1024,
  maxCells: 250000,
  maxColumns: 512,
  autoCompareSize: 500000,
  diffTimeout: 1500,
  maxEditLength: 2000,
  jobTimeout: 20000,
  inlineLineLength: 1000,
  inlineBudget: 100000,
  previewLimit: 2000,
};
