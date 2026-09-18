import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { EthicsBanner, FittingState, PageHead, Panel, SourceBadge, Stat } from "@/components/lab-bits";
import { BarList } from "@/components/viz";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { rewriteDocument } from "@/lib/coda/rewrite";
import { probeText } from "@/lib/coda/pipeline";
import { useLab } from "@/lib/coda/store";
import { f3, pct } from "@/lib/coda/format";
import type { ProbeResult } from "@/lib/coda/types";

export const Route = createFileRoute("/detect")({ component: DetectPage });

const SAMPLES = {
  human:
    "wts laptop 15 inch i7 16gb  pretty clean screen small scratch.  220 shipped. dont lowball. pm [PERSON]  i got more electronics too. ESCROW only. if u flake twice i am DONE...",
  llm: "Offering a 15-inch laptop with an i7 processor and 16 GB of memory. The screen is largely clean aside from a small scratch. The listed price is 220, shipped. Please message [PERSON] if interested. Escrow is required.",
};

function DetectPage() {
  const { status, detail, experiment } = useLab();
  const [text, setText] = useState(SAMPLES.human);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const result: ProbeResult | null = useMemo(() => {
    if (status !== "ready") return null;
    const t = text.trim();
    if (t.length < 20) return null;
    return probeText(t);
  }, [text, status]);

  async function onRewrite() {
    setBusy(true);
    setErr(null);
    const res = await rewriteDocument({ data: { text } });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setText(res.text);
  }

  if (status !== "ready" || !experiment) {
    return (
      <div>
        <PageHead kicker="Live probe" title="Score a paragraph." />
        <FittingState detail={detail} />
      </div>
    );
  }

  return (
    <div>
      <PageHead
        kicker="Same vectorizers, same LinearSVC"
        title="Paste public text. See source and topic."
        lede="The probe uses the models fitted on the proxy. It is not an operational detector for live markets. Paraphrase uses the guide’s wording, capped and user-initiated."
      />
      <EthicsBanner />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Panel title="Document">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Document to score"
            maxLength={4000}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => setText(SAMPLES.human)} variant="secondary" size="sm" type="button">
              Human-like sample
            </Button>
            <Button onClick={() => setText(SAMPLES.llm)} variant="secondary" size="sm" type="button">
              Polished sample
            </Button>
            <Button onClick={onRewrite} variant="outline" size="sm" type="button" disabled={busy}>
              {busy ? "Rewriting…" : "Paraphrase with Grok"}
            </Button>
          </div>
          {err ? <p className="mt-3 text-sm text-destructive">{err}</p> : null}
        </Panel>

        <div className="space-y-4">
          {result ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Stat
                  label="Source"
                  value={result.source === "llm" ? "LLM" : "Human"}
                  hint={`P(llm) ${pct(result.sourceProba)}`}
                />
                <Stat label="Topic" value={result.topic} hint={`score ${f3(result.topicScores[0]!.score)}`} />
              </div>
              <Panel title="Decision">
                <div className="mb-3">
                  <SourceBadge source={result.source} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Margin {f3(result.sourceScore)}. Positive pushes toward llm. This is a proxy
                  benchmark — a specialised uncensored model will not look like polish-A.
                </p>
              </Panel>
            </>
          ) : (
            <Panel>
              <p className="text-sm text-muted-foreground">Type at least a short paragraph to score.</p>
            </Panel>
          )}
        </div>
      </div>

      {result ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel title="Evidence toward llm">
            <BarList items={result.evidence.llm.map((c) => ({ name: c.name, value: c.weight, positive: true }))} />
          </Panel>
          <Panel title="Evidence toward human">
            <BarList
              items={result.evidence.human.map((c) => ({ name: c.name, value: c.weight, positive: false }))}
            />
          </Panel>
        </div>
      ) : null}

      {result ? (
        <Panel className="mt-6" title="Topic ranking">
          <ol className="grid gap-2 sm:grid-cols-2">
            {result.topicScores.slice(0, 6).map((t, i) => (
              <li key={t.topic} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                <span>
                  <span className="mr-2 font-mono text-xs text-muted-foreground">{i + 1}</span>
                  {t.topic}
                </span>
                <span className="font-mono text-xs tabular-nums">{f3(t.score)}</span>
              </li>
            ))}
          </ol>
        </Panel>
      ) : null}
    </div>
  );
}
