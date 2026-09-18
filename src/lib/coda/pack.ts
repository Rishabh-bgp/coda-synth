import type { LinearModel } from "./linear";
import type { FittedBundle } from "./pipeline";
import { StandardScaler } from "./sparse";
import { TfidfVectorizer, type Analyzer } from "./tfidf";
import type { Experiment } from "./types";

export type PackedVectorizer = {
  analyzer: Analyzer;
  ngramRange: [number, number];
  minDf: number;
  maxDf: number;
  maxFeatures: number;
  sublinearTf: boolean;
  lowercase: boolean;
  vocabulary: Map<string, number> | [string, number][];
  idf: Float64Array | number[];
  names: string[];
};

export type PackedBundle = {
  word: PackedVectorizer;
  char: PackedVectorizer;
  scaler: { mean: number[]; std: number[] };
  sourceModel: LinearModel;
  sourceLogit: LinearModel;
  topicModel: LinearModel;
  names: string[];
  experiment: Experiment;
};

function packVec(v: TfidfVectorizer): PackedVectorizer {
  return {
    analyzer: v.analyzer,
    ngramRange: v.ngramRange,
    minDf: v.minDf,
    maxDf: v.maxDf,
    maxFeatures: v.maxFeatures,
    sublinearTf: v.sublinearTf,
    lowercase: v.lowercase,
    vocabulary: v.vocabulary,
    idf: v.idf,
    names: v.names,
  };
}

function unpackVec(raw: PackedVectorizer): TfidfVectorizer {
  const v = new TfidfVectorizer({
    analyzer: raw.analyzer,
    ngramRange: raw.ngramRange,
    minDf: raw.minDf,
    maxDf: raw.maxDf,
    maxFeatures: raw.maxFeatures,
    sublinearTf: raw.sublinearTf,
    lowercase: raw.lowercase,
  });
  v.vocabulary = raw.vocabulary instanceof Map ? raw.vocabulary : new Map(raw.vocabulary);
  v.idf = raw.idf instanceof Float64Array ? raw.idf : Float64Array.from(raw.idf);
  v.names = raw.names;
  return v;
}

export function packBundle(b: FittedBundle): PackedBundle {
  return {
    word: packVec(b.word),
    char: packVec(b.char),
    scaler: { mean: b.scaler.mean, std: b.scaler.std },
    sourceModel: b.sourceModel,
    sourceLogit: b.sourceLogit,
    topicModel: b.topicModel,
    names: b.names,
    experiment: b.experiment,
  };
}

export function unpackBundle(p: PackedBundle): FittedBundle {
  const scaler = new StandardScaler();
  scaler.mean = p.scaler.mean;
  scaler.std = p.scaler.std;
  return {
    word: unpackVec(p.word),
    char: unpackVec(p.char),
    scaler,
    sourceModel: p.sourceModel,
    sourceLogit: p.sourceLogit,
    topicModel: p.topicModel,
    names: p.names,
    experiment: p.experiment,
  };
}
