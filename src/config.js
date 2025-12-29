export default {
  // max file to reader 10 MB - large files may cause ReactDiffViewer to crash
  maxFileSize: 1024 * 1024 * 10, // 10 MB

  // when reading lots of lines, it often causes ReactDiffViewer to crash
  maxLines: 100000,

  maxPermittedLineLength: 100000,
};
