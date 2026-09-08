/* global self */
import { compareText } from "../library/compare";
import { parseFile } from "../library/parse";

self.addEventListener("message", async ({ data }) => {
  const { id, type } = data;
  const progress = (message) =>
    self.postMessage({ id, type: "progress", message });
  try {
    let result;
    if (type === "compare") {
      progress("Comparing text…");
      result = compareText(data.left, data.right, data.options);
    } else if (type === "parse") {
      result = await parseFile(
        data.file,
        data.encoding,
        data.sheetIndex,
        progress,
      );
    } else throw new Error("Unknown background task.");
    self.postMessage({ id, type: "result", result });
  } catch (error) {
    self.postMessage({
      id,
      type: "error",
      message: error.message || "Processing failed.",
    });
  }
});
