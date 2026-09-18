import { l2normalize } from "./sparse";
import type { SparseRow } from "./types";

export type Analyzer = "word" | "char_wb";

export type TfidfParams = {
  analyzer?: Analyzer;
  ngramRange?: [number, number];
  minDf?: number;
  maxDf?: number;
  maxFeatures?: number;
  sublinearTf?: boolean;
  lowercase?: boolean;
};

function wordTokens(text: string, lowercase: boolean): string[] {
  const t = lowercase ? text.toLowerCase() : text;
  return t.match(/\b\w+\b/g) ?? [];
}

function wordNgrams(tokens: string[], lo: number, hi: number): string[] {
  const out: string[] = [];
  for (let n = lo; n <= hi; n++) {
    for (let i = 0; i + n <= tokens.length; i++) {
      out.push(n === 1 ? tokens[i]! : tokens.slice(i, i + n).join(" "));
    }
  }
  return out;
}

function charWbNgrams(text: string, lo: number, hi: number, lowercase: boolean): string[] {
  const t = lowercase ? text.toLowerCase() : text;
  const words = t.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (const w of words) {
    const padded = ` ${w} `;
    for (let n = lo; n <= hi; n++) {
      if (padded.length < n) continue;
      for (let i = 0; i + n <= padded.length; i++) out.push(padded.slice(i, i + n));
    }
  }
  return out;
}

export class TfidfVectorizer {
  analyzer: Analyzer;
  ngramRange: [number, number];
  minDf: number;
  maxDf: number;
  maxFeatures: number;
  sublinearTf: boolean;
  lowercase: boolean;
  vocabulary: Map<string, number> = new Map();
  idf: Float64Array = new Float64Array(0);
  names: string[] = [];

  constructor(params: TfidfParams = {}) {
    this.analyzer = params.analyzer ?? "word";
    this.ngramRange = params.ngramRange ?? [1, 1];
    this.minDf = params.minDf ?? 1;
    this.maxDf = params.maxDf ?? 1;
    this.maxFeatures = params.maxFeatures ?? 50_000;
    this.sublinearTf = params.sublinearTf ?? true;
    this.lowercase = params.lowercase ?? true;
  }

  extract(text: string): string[] {
    const [lo, hi] = this.ngramRange;
    if (this.analyzer === "char_wb") return charWbNgrams(text, lo, hi, this.lowercase);
    return wordNgrams(wordTokens(text, this.lowercase), lo, hi);
  }

  fit(texts: string[]): this {
    const df = new Map<string, number>();
    const cf = new Map<string, number>();
    const n = texts.length;
    for (const text of texts) {
      const seen = new Set<string>();
      for (const g of this.extract(text)) {
        cf.set(g, (cf.get(g) ?? 0) + 1);
        seen.add(g);
      }
      for (const g of seen) df.set(g, (df.get(g) ?? 0) + 1);
    }
    const maxDfAbs = this.maxDf <= 1 ? this.maxDf * n : this.maxDf;
    const minDfAbs = this.minDf;
    const candidates: { term: string; df: number; cf: number }[] = [];
    for (const [term, d] of df) {
      if (d < minDfAbs) continue;
      if (d > maxDfAbs) continue;
      candidates.push({ term, df: d, cf: cf.get(term) ?? 0 });
    }
    candidates.sort((a, b) => b.cf - a.cf || a.term.localeCompare(b.term));
    const kept = candidates.slice(0, this.maxFeatures);
    this.vocabulary = new Map();
    this.names = [];
    kept.forEach((c, i) => {
      this.vocabulary.set(c.term, i);
      this.names.push(c.term);
    });
    this.idf = new Float64Array(kept.length);
    for (let i = 0; i < kept.length; i++) {
      this.idf[i] = Math.log((1 + n) / (1 + kept[i]!.df)) + 1;
    }
    return this;
  }

  transform(texts: string[]): SparseRow[] {
    return texts.map((text) => {
      const tf = new Map<number, number>();
      for (const g of this.extract(text)) {
        const j = this.vocabulary.get(g);
        if (j === undefined) continue;
        tf.set(j, (tf.get(j) ?? 0) + 1);
      }
      const idx: number[] = [];
      const val: number[] = [];
      for (const [j, c] of tf) {
        const tfv = this.sublinearTf ? 1 + Math.log(c) : c;
        idx.push(j);
        val.push(tfv * this.idf[j]!);
      }
      return l2normalize({ idx, val });
    });
  }

  get cols() {
    return this.names.length;
  }
}
