import { pathToFileURL } from "node:url";

const ts = new URL("../src/lib/coda/pipeline.ts", import.meta.url);
const { runExperiment } = await import(pathToFileURL(ts.pathname).href);
const t0 = Date.now();
const { experiment } = await runExperiment((s, d) => console.log(s, d ?? ""));
console.log(JSON.stringify({
  ms: Date.now() - t0,
  counts: experiment.counts,
  source: { f1: experiment.source.f1, auc: experiment.source.auc, acc: experiment.source.accuracy },
  topic: { wF1: experiment.topic.weightedF1, acc: experiment.topic.accuracy, macro: experiment.topic.macroF1 },
  ablations: experiment.ablations,
  rq3: { human: experiment.topicHumanOnly, mixed: experiment.topicMixed },
  rq4: experiment.rq4,
  topLlm: experiment.topSourceCoeffs.llm.slice(0, 6),
  topHuman: experiment.topSourceCoeffs.human.slice(0, 6),
}, null, 2));
