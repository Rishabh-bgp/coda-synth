import type { Experiment } from "./types";

export function pct(n: number, digits = 1) {
  return `${(n * 100).toFixed(digits)}%`;
}

export function f3(n: number) {
  return Number.isFinite(n) ? n.toFixed(3) : "—";
}

export function downloadText(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export function reportMarkdown(ex: Experiment): string {
  const a = ex.ablations;
  return `# Stylometric detection of LLM-rewritten dark-web documents with sparse features

**Short name:** CoDA-Synth  
**Scope:** public proxy corpus · traditional ML · two tasks  
**Seed:** ${ex.seeds} · fitted in ${(ex.durationMs / 1000).toFixed(1)}s

## Problem

Topic classifiers ignore authorship shift toward generated underground copy. This project asks whether classical sparse features can detect LLM paraphrases of public dark-web-style documents while still classifying the original CoDA topic.

## Constraint

No live collection. CoDA is request-gated (\`s2w-ai/CoDA\`); this lab uses a synthetic proxy with the same ten labels, CoDA-style masks, and a controlled rewrite protocol. Do not republish a raw CoDA dump.

## Method

Word TF–IDF (1–2), character n-grams (3–5, char_wb), eleven stylometric features. LinearSVC (balanced hinge) for both heads; logistic regression for source probabilities and AUC. Vectorizers and the stylo scaler fit on train only. Split by original document id, 70 / 15 / 15, stratified by topic.

Rows: ${ex.counts.human} human · ${ex.counts.llm} llm · split ${ex.counts.train} / ${ex.counts.val} / ${ex.counts.test}.

## Results

- Source F1 ${f3(ex.source.f1)}, precision ${f3(ex.source.precision)}, recall ${f3(ex.source.recall)}, AUC ${f3(ex.source.auc)}, accuracy ${f3(ex.source.accuracy)} (${ex.counts.test} test rows).
- Ablation source F1: word ${f3(a[0]!.sourceF1)} → word+char ${f3(a[1]!.sourceF1)} → full ${f3(a[2]!.sourceF1)} (Δ ${f3(a[2]!.sourceF1 - a[0]!.sourceF1)}).
- Topic weighted F1 ${f3(ex.topic.weightedF1)}, macro ${f3(ex.topic.macroF1)}, accuracy ${f3(ex.topic.accuracy)}.
- RQ3: human-only topic F1 ${f3(ex.topicHumanOnly.weightedF1)} vs mixed ${f3(ex.topicMixed.weightedF1)} on human test documents.
- RQ4: train polish-A, test rhythm-B → F1 ${f3(ex.rq4.f1)}, AUC ${f3(ex.rq4.auc)} (n=${ex.rq4.nTest}).

## Limits

CoDA-Synth is a proxy benchmark. A detector that sees these paraphrases may not see a specialised uncensored model. Character n-grams can overfit generator punctuation. Topic labels on rewritten text assume the rewriter kept the topic. English-heavy; masks change surface form. Sample size is a pilot.

## Ethics

Research terms only. No redistribution of the gated CoDA dump. No operational targeting. No live .onion crawl. Synthesis paraphrases existing public proxy text — no new criminal how-to.

## Citations

- Jin, Y., Jang, E., Lee, Y., Shin, S., & Chung, J.-W. (2022). Shedding New Light on the Language of the Dark Web. NAACL.
- Al-Nabki, M. W., Fidalgo, E., Alegre, E., & Fernández-Robles, L. (2017/2019). DUTA / DUTA-10K.
- Jin et al. (2023). DarkBERT. ACL. Related work — this lab does not run DarkBERT.
`;
}
