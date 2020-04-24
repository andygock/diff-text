export default {
  // max file to reader 10 MB - large files may cause ReactDiffViewer to crash
  maxFileSize: 10000000,

  // when reading lots of lines, it often causes ReactDiffViewer to crash
  maxLines: 10000,

  maxPermittedLineLength: 1000,
};
