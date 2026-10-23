import { describe, it, expect, afterEach } from "vitest";
import { compareText } from "./compare";
import { makeDisplayRows } from "./displayRows";
import config from "../config";
const original = { ...config };
afterEach(() => Object.assign(config, original));
const restore = (result, side) =>
  result.rows.map((row) => row[side]?.text || "").join("");
describe("comparison correctness", () => {
  it.each([
    ["hello", "hello\n"],
    ["hello", "hello "],
    ["a\r\n", "a\n"],
    ["", "\n"],
    ["a\n", "a\n\n"],
  ])("preserves the exact difference between %j and %j", (left, right) => {
    const result = compareText(left, right);
    expect(result.hunks.length).toBeGreaterThan(0);
    expect(restore(result, "left")).toBe(left);
    expect(restore(result, "right")).toBe(right);
  });
  it("ignores whitespace and line endings only when explicitly requested", () => {
    expect(compareText(" a  b\r\n", "a b\n").hunks).not.toHaveLength(0);
    const result = compareText(" a  b\r\n", "a b\n", {
      ignoreWhitespace: true,
      ignoreLineEndings: true,
    });
    expect(result.hunks).toHaveLength(0);
    expect(result.exact).toBe(false);
    expect(restore(result, "left")).toBe(" a  b\r\n");
  });
  it.each([
    ["a  b", "a b"],
    ["a\tb old", "a b new"],
    ["  old", " new"],
  ])(
    "preserves rendered whitespace in word detail for %j and %j",
    (left, right) => {
      const result = compareText(left, right, { compareMethod: "diffWords" });
      for (const side of ["left", "right"]) {
        const cell = result.rows[0][side];
        const rendered = cell.parts
          ? cell.parts.map((part) => part.text).join("")
          : cell.text;
        expect(rendered).toBe(side === "left" ? left : right);
      }
    },
  );
  it("maps corresponding lines after an insertion", () => {
    const result = compareText("a\nb\nold", "insert\na\nb\nnew");
    expect(result.rows.at(-1).left.number).toBe(3);
    expect(result.rows.at(-1).right.number).toBe(4);
  });
  it("falls back without losing text when the edit budget is exceeded", () => {
    config.maxEditLength = 1;
    const result = compareText("prefix\na\nb\nsuffix", "prefix\nx\ny\nsuffix");
    expect(result.coarse).toBe(true);
    expect(restore(result, "left")).toBe("prefix\na\nb\nsuffix");
    expect(restore(result, "right")).toBe("prefix\nx\ny\nsuffix");
    expect(result.rows[0].changed).toBe(false);
    expect(result.rows.at(-1).changed).toBe(false);
  });
  it("handles long lines without an unbounded character diff", () => {
    const result = compareText("a".repeat(20000), "b".repeat(20000));
    expect(result.detailLimited).toBe(true);
    expect(result.rows[0].left.parts).toBeUndefined();
  });
  it("constructs context in one pass and retains change positions in both layouts", () => {
    const result = compareText(
      "a\n".repeat(100) + "old",
      "a\n".repeat(100) + "new",
    );
    const split = makeDisplayRows(result.rows, true, false);
    const unified = makeDisplayRows(result.rows, false, false);
    expect(split.items[0]).toEqual({ gap: 97 });
    expect(split.items[split.positions[100]].index).toBe(100);
    expect(unified.items[unified.positions[100]].side).toBe("left");
  });
  it("round-trips varied repeated lines, deletions, additions and empty lines", () => {
    // Deterministic cases catch alignment/data-loss bugs without timing assertions.
    let seed = 42;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed;
    };
    const tokens = ["a\n", "b\n", "\n", " c\r\n", "d\r"];
    for (let i = 0; i < 80; i++) {
      const left = Array.from(
        { length: random() % 30 },
        () => tokens[random() % tokens.length],
      ).join("");
      const right = Array.from(
        { length: random() % 30 },
        () => tokens[random() % tokens.length],
      ).join("");
      const result = compareText(left, right);
      expect(restore(result, "left")).toBe(left);
      expect(restore(result, "right")).toBe(right);
    }
  });
});
