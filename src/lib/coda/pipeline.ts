import { getCorpus } from "./corpus";
import {
  explainRow,
  fitLinear,
  predict,
  predictMany,
  predictProba,
  scoresMany,
  topCoefficients,
  type LinearModel,
} from "./linear";
import { f1Binary, rocAuc, rocCurve, sourceMetrics, topicMetrics } from "./metrics";
import { denseRows, hstack, StandardScaler } from "./sparse";
import { meanVectors, stylo } from "./stylo";
import { TfidfVectorizer } from "./tfidf";
import {
  STYLO_NAMES,
  TOPICS,
  type AblationId,
  type AblationRow,
  type Doc,
  type Experiment,
  type ProbeResult,
  type SparseRow,
} from "./types";

export type FittedBundle = {
  word: TfidfVectorizer;
  char: TfidfVectorizer;
  scaler: StandardScaler;
  sourceModel: LinearModel;
  sourceLogit: LinearModel;
  topicModel: LinearModel;
  names: string[];
  experiment: Experiment;
};

let bundle: FittedBundle | null = null;

const yieldTick = () => new Promise<void>((r) => setTimeout(r, 0));

export type Stage =
  | "load"
  | "clean"
  | "synth"
  | "split"
  | "features"
  | "train"
  | "ablate"
  | "eval";

function slice(docs: Doc[], split: Doc["split"]) {
  return docs.filter((d) => d.split === split);
}

function encodeTopics(docs: Doc[]) {
  const idx = new Map(TOPICS.map((t, i) => [t, i]));
  return docs.map((d) => idx.get(d.topic) ?? 0);
}

function featureStack(
  word: TfidfVectorizer,
  char: TfidfVectorizer | null,
  scaler: StandardScaler | null,
  texts: string[],
  styloRaw: number[][] | null,
): { rows: SparseRow[]; cols: number; names: string[] } {
  const wRows = word.transform(texts);
  const parts: { rows: SparseRow[]; cols: number }[] = [{ rows: wRows, cols: word.cols }];
  const names = word.names.map((n) => `w:${n}`);
  if (char) {
    parts.push({ rows: char.transform(texts), cols: char.cols });
    names.push(...char.names.map((n) => `c:${n}`));
  }
  if (scaler && styloRaw) {
    const scaled = scaler.transform(styloRaw);
    parts.push(denseRows(scaled));
    names.push(...STYLO_NAMES.map((n) => `s:${n}`));
  }
  const stacked = hstack(parts);
  return { ...stacked, names };
}

export async function runExperiment(
  onStage?: (stage: Stage, detail?: string) => void,
): Promise<FittedBundle> {
  const t0 = performance.now();
  onStage?.("load", "Proxy corpus (not the gated CoDA dump)");
  await yieldTick();
  const docs = getCorpus();
  onStage?.("clean", "HTML stripped, short rows dropped, masks kept");
  await yieldTick();
  onStage?.("synth", "Half of ids paraphrased by polish-A / rhythm-B");
  await yieldTick();
  onStage?.("split", "Id-safe 70 / 15 / 15, stratified by topic");
  await yieldTick();

  const tr = slice(docs, "train");
  const va = slice(docs, "val");
  const te = slice(docs, "test");

  onStage?.("features", "Word TF-IDF + char n-grams + 11 stylo features");
  await yieldTick();

  const word = new TfidfVectorizer({
    ngramRange: [1, 2],
    minDf: 2,
    maxDf: 0.9,
    maxFeatures: 8000,
    sublinearTf: true,
  });
  const char = new TfidfVectorizer({
    analyzer: "char_wb",
    ngramRange: [3, 5],
    minDf: 2,
    maxFeatures: 4000,
  });
  word.fit(tr.map((d) => d.text));
  char.fit(tr.map((d) => d.text));

  const S_tr = tr.map((d) => stylo(d.text));
  const S_te = te.map((d) => stylo(d.text));
  const scaler = new StandardScaler().fit(S_tr);

  const ySrc = (d: Doc) => (d.source === "llm" ? 1 : 0);
  const y_tr = tr.map(ySrc);
  const y_te = te.map(ySrc);
  const yt_tr = encodeTopics(tr);
  const yt_te = encodeTopics(te);

  const ablations: { id: AblationId; label: string; useChar: boolean; useStylo: boolean }[] = [
    { id: "word", label: "Word TF-IDF", useChar: false, useStylo: false },
    { id: "word_char", label: "Word + char", useChar: true, useStylo: false },
    { id: "full", label: "Word + char + stylo", useChar: true, useStylo: true },
  ];

  onStage?.("train", "LinearSVC (hinge) + logistic for probabilities");
  await yieldTick();

  const ablationRows: AblationRow[] = [];
  let fullSource: ReturnType<typeof sourceMetrics> | null = null;
  let fullTopic: ReturnType<typeof topicMetrics> | null = null;
  let sourceModel!: LinearModel;
  let sourceLogit!: LinearModel;
  let topicModel!: LinearModel;
  let fullNames: string[] = [];
  let roc = { fpr: [0, 1], tpr: [0, 1] };

  for (const ab of ablations) {
    onStage?.("ablate", ab.label);
    await yieldTick();
    const trX = featureStack(
      word,
      ab.useChar ? char : null,
      ab.useStylo ? scaler : null,
      tr.map((d) => d.text),
      ab.useStylo ? S_tr : null,
    );
    const teX = featureStack(
      word,
      ab.useChar ? char : null,
      ab.useStylo ? scaler : null,
      te.map((d) => d.text),
      ab.useStylo ? S_te : null,
    );

    const src = fitLinear(trX.rows, y_tr, { nClasses: 2, kind: "hinge", C: 1, epochs: 18, seed: 42 });
    const logit = fitLinear(trX.rows, y_tr, { nClasses: 2, kind: "log", C: 1, epochs: 16, seed: 7 });
    const top = fitLinear(trX.rows, yt_tr, {
      nClasses: TOPICS.length,
      kind: "hinge",
      C: 1,
      epochs: 14,
      seed: 42,
    });

    const predS = predictMany(src, teX.rows);
    const scores = scoresMany(logit, teX.rows);
    const srcM = sourceMetrics(y_te, predS, scores);
    const predT = predictMany(top, teX.rows);
    const topM = topicMetrics(yt_te, predT, [...TOPICS]);

    ablationRows.push({
      id: ab.id,
      label: ab.label,
      sourceF1: srcM.f1,
      sourceAuc: srcM.auc,
      topicWeightedF1: topM.weightedF1,
    });

    if (ab.id === "full") {
      fullSource = srcM;
      fullTopic = topM;
      sourceModel = src;
      sourceLogit = logit;
      topicModel = top;
      fullNames = teX.names;
      roc = rocCurve(y_te, scores);
    }
  }

  onStage?.("eval", "Held-out test + RQ3 / RQ4 checks");
  await yieldTick();

  const trHuman = tr.filter((d) => d.source === "human");
  const teHuman = te.filter((d) => d.source === "human");
  const mixedX = featureStack(word, char, scaler, tr.map((d) => d.text), S_tr);
  const humanX = featureStack(
    word,
    char,
    scaler,
    trHuman.map((d) => d.text),
    trHuman.map((d) => stylo(d.text)),
  );
  const teHumanX = featureStack(
    word,
    char,
    scaler,
    teHuman.map((d) => d.text),
    teHuman.map((d) => stylo(d.text)),
  );
  const ytHumanTr = encodeTopics(trHuman);
  const ytHumanTe = encodeTopics(teHuman);
  const topicHuman = fitLinear(humanX.rows, ytHumanTr, {
    nClasses: TOPICS.length,
    kind: "hinge",
    C: 1,
    epochs: 18,
    seed: 42,
  });
  const topicMixed = fitLinear(mixedX.rows, yt_tr, {
    nClasses: TOPICS.length,
    kind: "hinge",
    C: 1,
    epochs: 18,
    seed: 42,
  });
  const th = topicMetrics(ytHumanTe, predictMany(topicHuman, teHumanX.rows), [...TOPICS]);
  const tm = topicMetrics(ytHumanTe, predictMany(topicMixed, teHumanX.rows), [...TOPICS]);

  const trA = tr.filter((d) => d.source === "human" || d.generator === "polish-A");
  const teB = te.filter((d) => d.generator === "rhythm-B");
  const teBPlusHuman = te.filter(
    (d) => d.generator === "rhythm-B" || (d.source === "human" && teB.some((b) => b.doc_id === d.doc_id)),
  );
  const testRQ4 =
    teBPlusHuman.length >= 8
      ? teBPlusHuman
      : te.filter((d) => d.source === "human" || d.generator === "rhythm-B");
  const trAX = featureStack(
    word,
    char,
    scaler,
    trA.map((d) => d.text),
    trA.map((d) => stylo(d.text)),
  );
  const teBX = featureStack(
    word,
    char,
    scaler,
    testRQ4.map((d) => d.text),
    testRQ4.map((d) => stylo(d.text)),
  );
  const srcA = fitLinear(trAX.rows, trA.map(ySrc), { nClasses: 2, kind: "hinge", C: 1, epochs: 22, seed: 42 });
  const logitA = fitLinear(trAX.rows, trA.map(ySrc), { nClasses: 2, kind: "log", C: 1, epochs: 22, seed: 7 });
  const predB = predictMany(srcA, teBX.rows);
  const yB = testRQ4.map(ySrc);
  const rq4f1 = f1Binary(yB, predB, 1);
  const rq4auc = rocAuc(yB, scoresMany(logitA, teBX.rows));

  const coeffs = topCoefficients(sourceModel, fullNames, 10);
  const humanStylo = meanVectors(docs.filter((d) => d.source === "human").map((d) => stylo(d.text)));
  const llmStylo = meanVectors(docs.filter((d) => d.source === "llm").map((d) => stylo(d.text)));

  const experiment: Experiment = {
    docs,
    counts: {
      human: docs.filter((d) => d.source === "human").length,
      llm: docs.filter((d) => d.source === "llm").length,
      train: tr.length,
      val: va.length,
      test: te.length,
      byTopic: Object.fromEntries(TOPICS.map((t) => [t, docs.filter((d) => d.topic === t).length])),
      byGenerator: {
        original: docs.filter((d) => d.generator === "original").length,
        "polish-A": docs.filter((d) => d.generator === "polish-A").length,
        "rhythm-B": docs.filter((d) => d.generator === "rhythm-B").length,
      },
    },
    ablations: ablationRows,
    source: fullSource!,
    topic: fullTopic!,
    topicHumanOnly: { weightedF1: th.weightedF1, accuracy: th.accuracy },
    topicMixed: { weightedF1: tm.weightedF1, accuracy: tm.accuracy },
    rq4: {
      trainOn: "polish-A",
      testOn: "rhythm-B",
      f1: rq4f1,
      auc: rq4auc,
      nTest: testRQ4.length,
    },
    topSourceCoeffs: { llm: coeffs.pos, human: coeffs.neg },
    styloMeans: { human: humanStylo, llm: llmStylo, names: STYLO_NAMES },
    roc,
    seeds: 42,
    trainedAt: Date.now(),
    durationMs: performance.now() - t0,
  };

  bundle = {
    word,
    char,
    scaler,
    sourceModel,
    sourceLogit,
    topicModel,
    names: fullNames,
    experiment,
  };
  return bundle;
}

export function getBundle(): FittedBundle | null {
  return bundle;
}

export function probeText(text: string): ProbeResult | null {
  if (!bundle) return null;
  const { word, char, scaler, sourceModel, sourceLogit, topicModel, names } = bundle;
  const raw = stylo(text);
  const packed = featureStack(word, char, scaler, [text], [raw]);
  const row = packed.rows[0]!;
  const src = predict(sourceModel, row) === 1 ? "llm" : "human";
  const proba = predictProba(sourceLogit, row);
  const topicScores = TOPICS.map((topic, k) => {
    let s = topicModel.bias[k]!;
    const w = topicModel.weights[k]!;
    for (let i = 0; i < row.idx.length; i++) s += w[row.idx[i]!]! * row.val[i]!;
    return { topic, score: s };
  }).sort((a, b) => b.score - a.score);
  const ev = explainRow(sourceModel, row, names, 8);
  return {
    source: src,
    sourceScore: scoresMany(sourceModel, [row])[0]!,
    sourceProba: proba[1]!,
    topic: topicScores[0]!.topic,
    topicScores,
    stylo: STYLO_NAMES.map((name, i) => ({ name, value: raw[i]! })),
    evidence: { llm: ev.pos, human: ev.neg },
  };
}

export function docsToCsv(docs: Doc[]): string {
  const header = ["doc_id", "text", "topic", "source", "split", "generator", "n_tok"];
  const esc = (s: string) => `"${s.replaceAll('"', '""')}"`;
  const lines = [header.join(",")];
  for (const d of docs) {
    lines.push([d.doc_id, esc(d.text), d.topic, d.source, d.split, d.generator, String(d.n_tok)].join(","));
  }
  return lines.join("\n");
}
