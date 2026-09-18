export const TOPICS = [
  "Arms",
  "Crypto",
  "Drugs",
  "Electronics",
  "Financial",
  "Gambling",
  "Hacking",
  "Pornography",
  "Violence",
  "Others",
] as const;

export type Topic = (typeof TOPICS)[number];

export type Source = "human" | "llm";

export type Split = "train" | "val" | "test";

export type GeneratorId = "original" | "polish-A" | "rhythm-B";

export type Doc = {
  doc_id: string;
  text: string;
  topic: Topic;
  source: Source;
  generator: GeneratorId;
  split: Split;
  n_tok: number;
};

export type StyloVector = number[];

export type StyloName =
  | "token_count"
  | "mean_word_len"
  | "mean_sent_len"
  | "type_token"
  | "hapax_ratio"
  | "stopword_ratio"
  | "punct_rate"
  | "digit_ratio"
  | "uppercase_ratio"
  | "exclaim_rate"
  | "question_rate";

export const STYLO_NAMES: StyloName[] = [
  "token_count",
  "mean_word_len",
  "mean_sent_len",
  "type_token",
  "hapax_ratio",
  "stopword_ratio",
  "punct_rate",
  "digit_ratio",
  "uppercase_ratio",
  "exclaim_rate",
  "question_rate",
];

export const STYLO_WHY: Record<StyloName, string> = {
  token_count: "Rewrites often lengthen or flatten text",
  mean_word_len: "LLM diction vs slang stubs",
  mean_sent_len: "Human fragments vs polished clauses",
  type_token: "Lexical diversity",
  hapax_ratio: "One-off jargon",
  stopword_ratio: "Function-word fingerprint",
  punct_rate: "Over-neat commas vs raw listings",
  digit_ratio: "Prices and versions",
  uppercase_ratio: "Shouting titles",
  exclaim_rate: "Marketing tone",
  question_rate: "Marketing tone",
};

export type SparseRow = { idx: number[]; val: number[] };

export type AblationId = "word" | "word_char" | "full";

export type ClassReport = {
  precision: number;
  recall: number;
  f1: number;
  support: number;
};

export type SourceMetrics = {
  precision: number;
  recall: number;
  f1: number;
  auc: number;
  accuracy: number;
  labels: ["human", "llm"];
  confusion: number[][];
  report: { human: ClassReport; llm: ClassReport };
};

export type TopicMetrics = {
  accuracy: number;
  weightedF1: number;
  macroF1: number;
  labels: string[];
  confusion: number[][];
  perClass: Record<string, ClassReport>;
};

export type AblationRow = {
  id: AblationId;
  label: string;
  sourceF1: number;
  sourceAuc: number;
  topicWeightedF1: number;
};

export type CoeffHit = { name: string; weight: number };

export type Experiment = {
  docs: Doc[];
  counts: {
    human: number;
    llm: number;
    train: number;
    val: number;
    test: number;
    byTopic: Record<string, number>;
    byGenerator: Record<string, number>;
  };
  ablations: AblationRow[];
  source: SourceMetrics;
  topic: TopicMetrics;
  topicHumanOnly: { weightedF1: number; accuracy: number };
  topicMixed: { weightedF1: number; accuracy: number };
  rq4: { trainOn: string; testOn: string; f1: number; auc: number; nTest: number };
  topSourceCoeffs: { llm: CoeffHit[]; human: CoeffHit[] };
  styloMeans: { human: number[]; llm: number[]; names: StyloName[] };
  roc: { fpr: number[]; tpr: number[] };
  seeds: number;
  trainedAt: number;
  durationMs: number;
};

export type ProbeResult = {
  source: Source;
  sourceScore: number;
  sourceProba: number;
  topic: Topic;
  topicScores: { topic: Topic; score: number }[];
  stylo: { name: StyloName; value: number }[];
  evidence: { llm: CoeffHit[]; human: CoeffHit[] };
};
