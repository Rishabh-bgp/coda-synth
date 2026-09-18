import { createFileRoute } from "@tanstack/react-router";
import { FittingState, PageHead, Panel, Stat } from "@/components/lab-bits";
import { Progress } from "@/components/ui/progress";
import { useLab } from "@/lib/coda/store";
import type { Stage } from "@/lib/coda/pipeline";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/method")({ component: MethodPage });

const STAGES: { id: Stage; title: string; tool: string; output: string }[] = [
  { id: "load", title: "Load", tool: "proxy generator", output: "raw table" },
  { id: "clean", title: "Clean", tool: "regex, token floor", output: "n_tok ≥ 40" },
  { id: "synth", title: "Synthesize", tool: "polish-A / rhythm-B", output: "coda_synth" },
  { id: "split", title: "Id-safe split", tool: "stratified on doc_id", output: "70 / 15 / 15" },
  { id: "features", title: "Features", tool: "TfidfVectorizer, stylo", output: "sparse + scaled" },
  { id: "train", title: "Classify", tool: "LinearSVC, logistic", output: "two models" },
  { id: "ablate", title: "Ablate", tool: "word / +char / +stylo", output: "three F1s" },
  { id: "eval", title: "Evaluate", tool: "held-out test", output: "reports + plots" },
];

function MethodPage() {
  const { status, stage, detail, experiment } = useLab();
  const idx = Math.max(0, STAGES.findIndex((s) => s.id === stage));
  const progress = status === "ready" ? 100 : status === "running" ? ((idx + 1) / STAGES.length) * 100 : 12;

  return (
    <div>
      <PageHead
        kicker="Table 2 · pipeline"
        title="Load, paraphrase, split, stack, classify."
        lede="The Colab method, running here on CPU-class sparse models. GPU is only needed for a live rewrite in the probe. A document and its rewrite always share a split."
      />

      <Progress value={progress} className="mb-8" />

      <ol className="grid gap-3 sm:grid-cols-2">
        {STAGES.map((s, i) => {
          const done = status === "ready" || i < idx;
          const current = status === "running" && s.id === stage;
          return (
            <li
              key={s.id}
              className={cn(
                "rounded-xl border px-4 py-4",
                current ? "border-primary bg-card" : "border-border bg-card",
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {done && !current ? "done" : current ? "running" : "queued"}
                </span>
              </div>
              <h2 className="mt-2 font-display text-2xl">{s.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{s.tool}</p>
              <p className="mt-2 font-mono text-xs">{s.output}</p>
            </li>
          );
        })}
      </ol>

      {status === "running" ? (
        <div className="mt-8">
          <FittingState detail={detail} />
        </div>
      ) : null}

      {experiment ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-4">
          <Stat label="Train" value={String(experiment.counts.train)} />
          <Stat label="Val" value={String(experiment.counts.val)} />
          <Stat label="Test" value={String(experiment.counts.test)} />
          <Stat label="Fit time" value={`${(experiment.durationMs / 1000).toFixed(1)}s`} />
        </div>
      ) : null}

      <Panel className="mt-8" title="Leakage control">
        <p className="text-sm leading-relaxed text-muted-foreground">
          A document and its rewrite share content. If one is in train and the other in test, the
          classifier cheats on topic words. We split on original <span className="font-mono text-foreground">doc_id</span> first
          (70 / 15 / 15), stratify by topic, then attach each id’s human and llm rows to the same
          split.
        </p>
      </Panel>

      <Panel className="mt-4" title="Rewrite prompt">
        <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted-foreground">
          {`Rewrite the following document in a different wording and sentence rhythm.
Keep the same facts, names that are already masked, and the same topic.
Do not add products, prices, instructions, or new claims.
Do not mention that you are an AI.

DOCUMENT:
{text}`}
        </pre>
      </Panel>
    </div>
  );
}
