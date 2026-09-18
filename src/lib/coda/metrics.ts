import type { ClassReport, SourceMetrics, TopicMetrics } from "./types";

export function confusion(yTrue: number[], yPred: number[], nClasses: number): number[][] {
  const m = Array.from({ length: nClasses }, () => new Array<number>(nClasses).fill(0));
  for (let i = 0; i < yTrue.length; i++) m[yTrue[i]!]![yPred[i]!]! += 1;
  return m;
}

function prf(tp: number, fp: number, fn: number, support: number): ClassReport {
  const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  return { precision, recall, f1, support };
}

export function sourceMetrics(yTrue: number[], yPred: number[], scores: number[]): SourceMetrics {
  const cm = confusion(yTrue, yPred, 2);
  const human = prf(cm[0]![0]!, cm[1]![0]!, cm[0]![1]!, cm[0]![0]! + cm[0]![1]!);
  const llm = prf(cm[1]![1]!, cm[0]![1]!, cm[1]![0]!, cm[1]![0]! + cm[1]![1]!);
  const acc = yTrue.filter((y, i) => y === yPred[i]).length / Math.max(yTrue.length, 1);
  return {
    precision: llm.precision,
    recall: llm.recall,
    f1: llm.f1,
    auc: rocAuc(yTrue, scores),
    accuracy: acc,
    labels: ["human", "llm"],
    confusion: cm,
    report: { human, llm },
  };
}

export function topicMetrics(yTrue: number[], yPred: number[], labels: string[]): TopicMetrics {
  const n = labels.length;
  const cm = confusion(yTrue, yPred, n);
  const perClass: Record<string, ClassReport> = {};
  let weighted = 0;
  let macro = 0;
  let total = 0;
  for (let k = 0; k < n; k++) {
    let tp = cm[k]![k]!;
    let fp = 0;
    let fn = 0;
    for (let i = 0; i < n; i++) {
      if (i !== k) {
        fp += cm[i]![k]!;
        fn += cm[k]![i]!;
      }
    }
    const support = tp + fn;
    const r = prf(tp, fp, fn, support);
    perClass[labels[k]!] = r;
    weighted += r.f1 * support;
    macro += r.f1;
    total += support;
  }
  const acc = yTrue.filter((y, i) => y === yPred[i]).length / Math.max(yTrue.length, 1);
  return {
    accuracy: acc,
    weightedF1: total ? weighted / total : 0,
    macroF1: n ? macro / n : 0,
    labels,
    confusion: cm,
    perClass,
  };
}

export function rocAuc(yTrue: number[], scores: number[]): number {
  const pairs = yTrue.map((y, i) => ({ y, s: scores[i]! }));
  pairs.sort((a, b) => b.s - a.s);
  const P = pairs.filter((p) => p.y === 1).length;
  const N = pairs.length - P;
  if (P === 0 || N === 0) return 0.5;
  let tps = 0;
  let fps = 0;
  let prev = Infinity;
  let auc = 0;
  let prevTpr = 0;
  let prevFpr = 0;
  for (const p of pairs) {
    if (p.s !== prev) {
      const tpr = tps / P;
      const fpr = fps / N;
      auc += ((fpr - prevFpr) * (tpr + prevTpr)) / 2;
      prevTpr = tpr;
      prevFpr = fpr;
      prev = p.s;
    }
    if (p.y === 1) tps += 1;
    else fps += 1;
  }
  auc += ((1 - prevFpr) * (1 + prevTpr)) / 2;
  return auc;
}

export function rocCurve(yTrue: number[], scores: number[], bins = 48): { fpr: number[]; tpr: number[] } {
  const pairs = yTrue.map((y, i) => ({ y, s: scores[i]! })).sort((a, b) => b.s - a.s);
  const P = pairs.filter((p) => p.y === 1).length || 1;
  const N = pairs.length - P || 1;
  const fpr = [0];
  const tpr = [0];
  let tp = 0;
  let fp = 0;
  const step = Math.max(1, Math.floor(pairs.length / bins));
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i]!.y === 1) tp += 1;
    else fp += 1;
    if (i % step === 0 || i === pairs.length - 1) {
      fpr.push(fp / N);
      tpr.push(tp / P);
    }
  }
  fpr.push(1);
  tpr.push(1);
  return { fpr, tpr };
}

export function f1Binary(yTrue: number[], yPred: number[], positive = 1): number {
  let tp = 0, fp = 0, fn = 0;
  for (let i = 0; i < yTrue.length; i++) {
    if (yPred[i] === positive && yTrue[i] === positive) tp += 1;
    else if (yPred[i] === positive) fp += 1;
    else if (yTrue[i] === positive) fn += 1;
  }
  const p = tp + fp === 0 ? 0 : tp / (tp + fp);
  const r = tp + fn === 0 ? 0 : tp / (tp + fn);
  return p + r === 0 ? 0 : (2 * p * r) / (p + r);
}
