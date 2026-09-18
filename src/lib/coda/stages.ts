import type { Stage } from "./pipeline";

export const STAGE_META: { id: Stage; title: string; tool: string; output: string }[] = [
  { id: "load", title: "Load", tool: "proxy generator", output: "raw table" },
  { id: "clean", title: "Clean", tool: "regex, token floor", output: "n_tok ≥ 40" },
  { id: "synth", title: "Synthesize", tool: "polish-A / rhythm-B", output: "coda_synth" },
  { id: "split", title: "Id-safe split", tool: "stratified on doc_id", output: "70 / 15 / 15" },
  { id: "features", title: "Features", tool: "TfidfVectorizer, stylo", output: "sparse + scaled" },
  { id: "train", title: "Classify", tool: "LinearSVC, logistic", output: "two models" },
  { id: "ablate", title: "Ablate", tool: "word / +char / +stylo", output: "three F1s" },
  { id: "eval", title: "Evaluate", tool: "held-out test", output: "reports + plots" },
];
