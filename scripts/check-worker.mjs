import { Worker } from "node:worker_threads";
import { readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";

const assets = await readdir(new URL("../dist/assets/", import.meta.url));
const entryName = assets.find((name) => /^parseWorker-.*\.js$/.test(name));
assert.ok(entryName, "Run pnpm build before checking the production worker.");
const entry = pathToFileURL(path.resolve("dist/assets", entryName)).href;
let sequence = 0;
async function run(payload) {
  const worker = new Worker(new URL("./worker-harness.mjs", import.meta.url), {
    workerData: { entry, fileName: payload.file?.name },
  });
  try {
    return await new Promise((resolve, reject) => {
      const id = ++sequence;
      const timeout = setTimeout(
        () => reject(new Error("Production worker timed out")),
        20000,
      );
      const done = (error, result) => {
        clearTimeout(timeout);
        error ? reject(error) : resolve(result);
      };
      worker.on("error", (error) => done(error));
      worker.on("message", (message) => {
        if (message.id !== id) return;
        if (message.type === "error") done(new Error(message.message));
        if (message.type === "result") done(null, message.result);
      });
      worker.postMessage({ id, ...payload });
    });
  } finally {
    await worker.terminate();
  }
}

const result = await run({
  type: "compare",
  left: "hello",
  right: "hello\n",
  options: {},
});
assert.equal(result.hunks.length, 1);
const text = await run({
  type: "parse",
  file: new File([new Uint8Array([255, 254, 65, 0])], "utf16.txt"),
  encoding: "auto",
});
assert.equal(text.text, "A");
const book = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(
  book,
  XLSX.utils.aoa_to_sheet([["first"]]),
  "First",
);
XLSX.utils.book_append_sheet(
  book,
  XLSX.utils.aoa_to_sheet([["second"]]),
  "Second",
);
const workbook = XLSX.write(book, { type: "array", bookType: "xlsx" });
const sheet = await run({
  type: "parse",
  file: new File([workbook], "sample.xlsx"),
  sheetIndex: 1,
});
assert.equal(sheet.text, "second");
assert.deepEqual(sheet.sheets, ["First", "Second"]);
const legacyBook = XLSX.utils.book_new();
XLSX.set_cptable(await import("xlsx/dist/cpexcel.full.mjs"));
XLSX.utils.book_append_sheet(
  legacyBook,
  XLSX.utils.aoa_to_sheet([["name"], ["Привет"]]),
  "Data",
);
const legacy = await run({
  type: "parse",
  file: new File(
    [
      XLSX.write(legacyBook, {
        type: "array",
        bookType: "dbf",
        codepage: 1251,
      }),
    ],
    "legacy.dbf",
  ),
});
assert.ok(legacy.text.includes("Привет"));
console.log(
  "Production worker passed: exact EOF diff, UTF-16 import, lazy spreadsheet import, worksheet selection and legacy code pages.",
);
