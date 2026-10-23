export interface CompareOptions {
  compareMethod?:
    | "diffChars"
    | "diffWords"
    | "diffWordsWithSpace"
    | "diffSentences"
    | "diffLines";
  ignoreWhitespace?: boolean;
  ignoreLineEndings?: boolean;
}
export interface Cell {
  number: number;
  text: string;
  parts?: { text: string; changed: boolean }[];
}
export interface Row {
  left: Cell | null;
  right: Cell | null;
  changed: boolean;
  leftAnchor?: number;
  rightAnchor?: number;
}
export interface ComparisonResult {
  rows: Row[];
  hunks: number[];
  added: number;
  removed: number;
  coarse: boolean;
  detailLimited: boolean;
  exact: boolean;
  leftStats: { bytes: number; lines: number };
  rightStats: { bytes: number; lines: number };
  elapsed: number;
  previewColumns: number;
}
export interface ParsedFile {
  text: string;
  sheets: string[];
  sheetIndex: number;
  encoding: string;
}
export interface JobPayloads {
  compare: { left: string; right: string; options?: CompareOptions };
  parse: { file: File; sheetIndex?: number; encoding?: string };
}
export interface JobResults {
  compare: ComparisonResult;
  parse: ParsedFile;
}
export type WorkerRequest = {
  [K in keyof JobPayloads]: { id: number; type: K } & JobPayloads[K];
}[keyof JobPayloads];
export interface DiffProps {
  result: ComparisonResult;
  splitView?: boolean;
  wrapOutput?: boolean;
  stale?: boolean;
  onNavigate: (row: Row, side: "left" | "right") => void;
}
