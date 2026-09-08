import { createServer } from "vite";

// Load the actual source through Vite without starting a listening server.
const server = await createServer({
  configFile: false,
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true },
});
try {
  const { compareText } = await server.ssrLoadModule("/src/library/compare.js");
  const { makeDisplayRows } = await server.ssrLoadModule(
    "/src/library/displayRows.js",
  );
  const lines = Array.from(
    { length: 99999 },
    (_, index) => "record " + index,
  ).join("\n");
  const cases = [
    ["100k identical lines", lines, lines],
    [
      "100k lines, one edit",
      lines,
      lines.replace("record 50000", "updated 50000"),
    ],
    ["100k changed lines", lines, lines.replaceAll("record", "changed")],
    ["long changed line", "a".repeat(100000), "b".repeat(100000)],
    ["repeated lines", "a\nb\n".repeat(20000), "b\na\n".repeat(20000)],
  ];
  for (const [name, left, right] of cases) {
    const start = performance.now();
    const result = compareText(left, right);
    const computed = performance.now();
    const display = makeDisplayRows(result.rows, false, false);
    console.log(
      JSON.stringify({
        case: name,
        compareMs: Math.round(computed - start),
        displayModelMs: Math.round(performance.now() - computed),
        sourceRows: result.rows.length,
        displayRows: display.items.length,
        fallback: result.coarse,
      }),
    );
  }
} finally {
  await server.close();
}
