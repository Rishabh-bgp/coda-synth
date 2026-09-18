import { axpy, dot } from "./sparse";
import { mulberry32, shuffle } from "./rng";
import type { SparseRow } from "./types";

export type LinearModel = {
  weights: Float64Array[];
  bias: Float64Array;
  nClasses: number;
  kind: "hinge" | "log";
};

function classWeight(y: number[], nClasses: number): number[] {
  const counts = new Array(nClasses).fill(0);
  for (const v of y) counts[v]! += 1;
  const n = y.length;
  return counts.map((c) => (c === 0 ? 1 : n / (nClasses * c)));
}

function sigmoid(z: number) {
  if (z > 30) return 1;
  if (z < -30) return 0;
  return 1 / (1 + Math.exp(-z));
}

export function fitLinear(
  X: SparseRow[],
  y: number[],
  opts: {
    nClasses: number;
    kind: "hinge" | "log";
    C?: number;
    epochs?: number;
    seed?: number;
  },
): LinearModel {
  const nClasses = opts.nClasses;
  const kind = opts.kind;
  const C = opts.C ?? 1;
  const epochs = opts.epochs ?? 24;
  const rng = mulberry32(opts.seed ?? 42);
  const n = X.length;
  let cols = 0;
  for (const r of X) for (const i of r.idx) if (i + 1 > cols) cols = i + 1;
  const cw = classWeight(y, nClasses);
  const heads = nClasses === 2 ? 1 : nClasses;
  const weights = Array.from({ length: heads }, () => new Float64Array(cols));
  const bias = new Float64Array(heads);
  const lam = 1 / (C * Math.max(n, 1));
  const order = Array.from({ length: n }, (_, i) => i);

  for (let epoch = 0; epoch < epochs; epoch++) {
    shuffle(order, rng);
    const eta = 0.12 / (1 + epoch * 0.15);
    for (const i of order) {
      const row = X[i]!;
      const yi = y[i]!;
      const sw = cw[yi]!;
      if (heads === 1) {
        const ypm = yi === 1 ? 1 : -1;
        const score = dot(weights[0]!, row) + bias[0]!;
        for (const j of row.idx) weights[0]![j]! *= 1 - eta * lam;
        if (kind === "hinge") {
          if (ypm * score < 1) {
            axpy(weights[0]!, row, eta * sw * ypm);
            bias[0]! += eta * sw * ypm;
          }
        } else {
          const p = sigmoid(score);
          const g = sw * (yi - p);
          axpy(weights[0]!, row, eta * g);
          bias[0]! += eta * g;
        }
      } else {
        for (let k = 0; k < heads; k++) {
          const yk = yi === k ? 1 : 0;
          const ypm = yk === 1 ? 1 : -1;
          const score = dot(weights[k]!, row) + bias[k]!;
          for (const j of row.idx) weights[k]![j]! *= 1 - eta * lam;
          if (kind === "hinge") {
            if (ypm * score < 1) {
              axpy(weights[k]!, row, eta * sw * ypm);
              bias[k]! += eta * sw * ypm;
            }
          } else {
            const p = sigmoid(score);
            const g = sw * (yk - p);
            axpy(weights[k]!, row, eta * g);
            bias[k]! += eta * g;
          }
        }
      }
    }
  }
  return { weights, bias, nClasses, kind };
}

export function decisionFunction(model: LinearModel, row: SparseRow): number[] {
  return model.weights.map((w, k) => dot(w, row) + model.bias[k]!);
}

export function predict(model: LinearModel, row: SparseRow): number {
  const scores = decisionFunction(model, row);
  if (model.nClasses === 2) return scores[0]! >= 0 ? 1 : 0;
  let best = 0;
  for (let i = 1; i < scores.length; i++) if (scores[i]! > scores[best]!) best = i;
  return best;
}

export function predictProba(model: LinearModel, row: SparseRow): number[] {
  const scores = decisionFunction(model, row);
  if (model.nClasses === 2) {
    const p = sigmoid(scores[0]!);
    return [1 - p, p];
  }
  const exps = scores.map((s) => Math.exp(Math.min(Math.max(s, -30), 30)));
  const z = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((e) => e / z);
}

export function predictMany(model: LinearModel, rows: SparseRow[]): number[] {
  return rows.map((r) => predict(model, r));
}

export function scoresMany(model: LinearModel, rows: SparseRow[]): number[] {
  return rows.map((r) => decisionFunction(model, r)[0]!);
}

export function topCoefficients(
  model: LinearModel,
  names: string[],
  k = 12,
  head = 0,
): { pos: { name: string; weight: number }[]; neg: { name: string; weight: number }[] } {
  const w = model.weights[head]!;
  const pairs: { name: string; weight: number }[] = [];
  const n = Math.min(names.length, w.length);
  for (let i = 0; i < n; i++) pairs.push({ name: names[i]!, weight: w[i]! });
  const pos = pairs.filter((p) => p.weight > 0).sort((a, b) => b.weight - a.weight).slice(0, k);
  const neg = pairs.filter((p) => p.weight < 0).sort((a, b) => a.weight - b.weight).slice(0, k);
  return { pos, neg };
}

export function explainRow(
  model: LinearModel,
  row: SparseRow,
  names: string[],
  k = 8,
): { pos: { name: string; weight: number }[]; neg: { name: string; weight: number }[] } {
  const w = model.weights[0]!;
  const hits: { name: string; weight: number }[] = [];
  for (let i = 0; i < row.idx.length; i++) {
    const j = row.idx[i]!;
    hits.push({ name: names[j] ?? `#${j}`, weight: w[j]! * row.val[i]! });
  }
  const pos = hits.filter((h) => h.weight > 0).sort((a, b) => b.weight - a.weight).slice(0, k);
  const neg = hits.filter((h) => h.weight < 0).sort((a, b) => a.weight - b.weight).slice(0, k);
  return { pos, neg };
}
