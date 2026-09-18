import type { SparseRow } from "./types";

export function dot(w: Float64Array, row: SparseRow): number {
  let s = 0;
  const { idx, val } = row;
  for (let i = 0; i < idx.length; i++) s += w[idx[i]!]! * val[i]!;
  return s;
}

export function axpy(w: Float64Array, row: SparseRow, a: number) {
  const { idx, val } = row;
  for (let i = 0; i < idx.length; i++) w[idx[i]!]! += a * val[i]!;
}

export function hstack(parts: { rows: SparseRow[]; cols: number }[]): {
  rows: SparseRow[];
  cols: number;
} {
  const n = parts[0]?.rows.length ?? 0;
  const rows: SparseRow[] = [];
  for (let r = 0; r < n; r++) {
    const idx: number[] = [];
    const val: number[] = [];
    let offset = 0;
    for (const p of parts) {
      const row = p.rows[r]!;
      for (let i = 0; i < row.idx.length; i++) {
        idx.push(row.idx[i]! + offset);
        val.push(row.val[i]!);
      }
      offset += p.cols;
    }
    rows.push({ idx, val });
  }
  const cols = parts.reduce((s, p) => s + p.cols, 0);
  return { rows, cols };
}

export function denseRows(matrix: number[][]): { rows: SparseRow[]; cols: number } {
  const cols = matrix[0]?.length ?? 0;
  const rows: SparseRow[] = matrix.map((v) => {
    const idx: number[] = [];
    const val: number[] = [];
    for (let i = 0; i < v.length; i++) {
      if (v[i] !== 0) {
        idx.push(i);
        val.push(v[i]!);
      }
    }
    return { idx, val };
  });
  return { rows, cols };
}

export function l2normalize(row: SparseRow): SparseRow {
  let ss = 0;
  for (const v of row.val) ss += v * v;
  const n = Math.sqrt(ss);
  if (n < 1e-12) return row;
  return { idx: row.idx, val: row.val.map((v) => v / n) };
}

export class StandardScaler {
  mean: number[] = [];
  std: number[] = [];

  fit(X: number[][]): this {
    const n = X.length;
    const d = X[0]?.length ?? 0;
    this.mean = new Array(d).fill(0);
    this.std = new Array(d).fill(0);
    for (const row of X) for (let j = 0; j < d; j++) this.mean[j]! += row[j]!;
    for (let j = 0; j < d; j++) this.mean[j]! /= Math.max(n, 1);
    for (const row of X) {
      for (let j = 0; j < d; j++) {
        const dlt = row[j]! - this.mean[j]!;
        this.std[j]! += dlt * dlt;
      }
    }
    for (let j = 0; j < d; j++) this.std[j] = Math.sqrt(this.std[j]! / Math.max(n, 1)) || 1;
    return this;
  }

  transform(X: number[][]): number[][] {
    return X.map((row) => row.map((v, j) => (v - this.mean[j]!) / this.std[j]!));
  }
}
