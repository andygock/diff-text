// Virtualise both layouts, including expanded context. DOM size depends on the
// viewport, not file size; all change positions refer back to the same row model.
/**
 * @param {import("./contracts").Row[]} rows
 * @param {boolean} splitView
 * @param {boolean} showAll
 */
export function makeDisplayRows(rows, splitView, showAll) {
  const visible = new Uint8Array(rows.length);
  if (showAll) visible.fill(1);
  else
    rows.forEach((row, index) => {
      if (row.changed)
        visible.fill(
          1,
          Math.max(0, index - 3),
          Math.min(rows.length, index + 4),
        );
    });
  const items = [];
  const positions = new Int32Array(rows.length);
  let hidden = 0;
  const flush = () => {
    if (hidden) {
      items.push({ gap: hidden });
      hidden = 0;
    }
  };
  rows.forEach((row, index) => {
    if (!visible[index]) {
      hidden++;
      return;
    }
    flush();
    positions[index] = items.length;
    if (splitView || !row.changed) items.push({ index, side: "both" });
    else {
      if (row.left) items.push({ index, side: "left" });
      if (row.right) items.push({ index, side: "right" });
    }
  });
  flush();
  return { items, positions };
}
