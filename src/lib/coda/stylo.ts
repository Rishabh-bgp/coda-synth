import { STOP } from "./stops";
import { STYLO_NAMES, type StyloVector } from "./types";

const WORD = /\b\w+\b/g;
const SENT_SPLIT = /[.!?]+/;
const PUNCT = /[.,;:!?()\-]/g;

export function stylo(text: string): StyloVector {
  const t = text ?? "";
  const lower = t.toLowerCase();
  const toks = lower.match(WORD) ?? [];
  const n = Math.max(toks.length, 1);
  const sents = t.split(SENT_SPLIT).filter((s) => s.trim());
  const ns = Math.max(sents.length, 1);
  const uniq = new Set(toks);
  const freq = new Map<string, number>();
  for (const w of toks) freq.set(w, (freq.get(w) ?? 0) + 1);
  let hap = 0;
  for (const c of freq.values()) if (c === 1) hap += 1;
  let stop = 0;
  for (const w of toks) if (STOP.has(w)) stop += 1;
  const meanWord = toks.length ? toks.reduce((s, w) => s + w.length, 0) / toks.length : 0;
  const meanSent = sents.length
    ? sents.reduce((s, sent) => s + sent.trim().split(/\s+/).filter(Boolean).length, 0) / sents.length
    : 0;
  const len = Math.max(t.length, 1);
  return [
    toks.length,
    meanWord,
    meanSent,
    uniq.size / n,
    hap / n,
    stop / n,
    (t.match(PUNCT) ?? []).length / len,
    [...t].filter((ch) => ch >= "0" && ch <= "9").length / len,
    [...t].filter((ch) => ch >= "A" && ch <= "Z").length / len,
    (t.match(/!/g) ?? []).length / ns,
    (t.match(/\?/g) ?? []).length / ns,
  ];
}

export function styloLabeled(text: string) {
  const v = stylo(text);
  return STYLO_NAMES.map((name, i) => ({ name, value: v[i]! }));
}

export function meanVectors(rows: StyloVector[]): number[] {
  if (!rows.length) return STYLO_NAMES.map(() => 0);
  const d = rows[0]!.length;
  const acc = new Array<number>(d).fill(0);
  for (const r of rows) for (let i = 0; i < d; i++) acc[i]! += r[i]!;
  return acc.map((x) => x / rows.length);
}
