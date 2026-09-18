import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { EthicsBanner, FittingState, PageHead, Panel, SourceBadge } from "@/components/lab-bits";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { pairFor } from "@/lib/coda/corpus";
import { downloadText } from "@/lib/coda/format";
import { docsToCsv } from "@/lib/coda/pipeline";
import { useLab } from "@/lib/coda/store";
import { TOPICS, type Doc, type Source, type Split } from "@/lib/coda/types";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/corpus")({ component: CorpusPage });

function CorpusPage() {
  const { experiment, status, detail } = useLab();
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState<string>("all");
  const [source, setSource] = useState<string>("all");
  const [selected, setSelected] = useState<Doc | null>(null);

  const docs = experiment?.docs ?? [];
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return docs.filter((d) => {
      if (topic !== "all" && d.topic !== topic) return false;
      if (source !== "all" && d.source !== source) return false;
      if (query && !`${d.doc_id} ${d.text}`.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [docs, q, topic, source]);

  if (status !== "ready" || !experiment) {
    return (
      <div>
        <PageHead kicker="Deliverable" title="Cleaned table." />
        <FittingState detail={detail} />
      </div>
    );
  }

  const pair = selected ? pairFor(selected, docs) : undefined;

  return (
    <div>
      <PageHead
        kicker="id · text · topic · source · split · generator"
        title="Proxy corpus."
        lede="320 human documents across CoDA’s ten topic names, half the ids rewritten by two generators. Split is by original id so a document and its paraphrase never leak across train and test."
      />
      <EthicsBanner />

      <div className="mt-6 mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search id or text"
          aria-label="Search corpus"
        />
        <div className="flex flex-wrap gap-2">
          <select
            className="h-11 rounded-md border border-border bg-card px-3 text-sm"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            aria-label="Topic"
          >
            <option value="all">All topics</option>
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-md border border-border bg-card px-3 text-sm"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            aria-label="Source"
          >
            <option value="all">All sources</option>
            <option value="human">human</option>
            <option value="llm">llm</option>
          </select>
          <Button
            variant="secondary"
            onClick={() => downloadText("coda_synth.csv", docsToCsv(docs), "text/csv")}
          >
            Download CSV
          </Button>
        </div>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        Showing {filtered.length} of {docs.length} rows · {experiment.counts.human} human ·{" "}
        {experiment.counts.llm} llm
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel>
          <ul className="divide-y divide-border">
            {filtered.slice(0, 80).map((d) => (
              <li key={`${d.doc_id}-${d.source}-${d.generator}`}>
                <button
                  type="button"
                  onClick={() => setSelected(d)}
                  className="flex w-full flex-col gap-1 py-3 text-left hover:bg-muted/40"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{d.doc_id}</span>
                    <SourceBadge source={d.source as Source} />
                    <Badge>{d.topic}</Badge>
                    <Badge>{d.split as Split}</Badge>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{d.text}</p>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title={selected ? selected.doc_id : "Select a row"}>
          {selected ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <SourceBadge source={selected.source} />
                <Badge>{selected.topic}</Badge>
                <Badge>{selected.generator}</Badge>
                <Badge>{selected.n_tok} tokens</Badge>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{selected.text}</p>
              {pair ? (
                <div className="border-t border-border pt-4">
                  <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Paired {pair.source} · {pair.generator}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {pair.text}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No rewrite for this id (held as human-only).</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Open a document to compare the human row with its paraphrase when one exists.
            </p>
          )}
        </Panel>
      </div>
    </div>
  );
}
