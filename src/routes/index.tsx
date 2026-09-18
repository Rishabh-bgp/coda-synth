import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Download } from "lucide-react";
import { EthicsBanner, PageHead, Panel, Stat } from "@/components/lab-bits";
import { Button } from "@/components/ui/button";
import { useLab } from "@/lib/coda/store";
import { f3, pct } from "@/lib/coda/format";

export const Route = createFileRoute("/")({ component: Home });

const RQS = [
  {
    id: "RQ1",
    q: "Can TF–IDF + character n-grams + cheap stylometry separate human text from LLM rewrites of the same documents?",
  },
  {
    id: "RQ2",
    q: "Does adding stylometry improve source detection over TF–IDF alone?",
  },
  {
    id: "RQ3",
    q: "Does source-aware training hurt or help the original 10-way topic task?",
  },
  {
    id: "RQ4",
    q: "Does a detector trained on Model-A rewrites transfer to Model-B rewrites?",
  },
];

function Home() {
  const ex = useLab((s) => s.experiment);
  return (
    <div>
      <p className="mb-6 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        Research use only · public proxy corpus
      </p>
      <PageHead
        kicker="Sparse traditional ML"
        title="Stylometric detection of LLM-rewritten dark-web documents."
        lede="A Colab-faithful lab: word TF–IDF, character n-grams, eleven stylometric features, LinearSVC and logistic regression. Two tasks — human vs rewrite, and the original ten-way topic. No live Tor collection."
      />

      <div className="mb-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/method">
            Run the pipeline <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/detect">Probe a paragraph</Link>
        </Button>
        <Button asChild variant="outline">
          <a href="/coda-synth-github.zip" download="coda-synth-github.zip">
            Download source zip <Download className="size-4" />
          </a>
        </Button>
      </div>

      <EthicsBanner />

      {ex ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Stat label="Source F1" value={f3(ex.source.f1)} hint="positive = llm" />
          <Stat label="Source AUC" value={f3(ex.source.auc)} hint="logistic scores" />
          <Stat label="Topic weighted F1" value={f3(ex.topic.weightedF1)} hint="10-way LinearSVC" />
        </div>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Stat label="Rows" value="—" hint="Fitting on first visit" />
          <Stat label="Human / LLM" value="—" />
          <Stat label="Id-safe split" value="70 / 15 / 15" />
        </div>
      )}

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {RQS.map((r) => (
          <Panel key={r.id} title={r.id}>
            <p className="text-sm leading-relaxed text-muted-foreground">{r.q}</p>
          </Panel>
        ))}
      </div>

      <Panel className="mt-8" title="What this is — and is not">
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            CoDA (Jin et al., NAACL 2022) is gated for research use. This lab trains on a{" "}
            <span className="text-foreground">synthetic proxy</span> with the same ten topic
            names, masked identifiers, and a controlled paraphrase protocol. It is a measurement
            bench, not a dump of hidden-service pages.
          </p>
          <p>
            Underground markets increasingly polish listings with language models. Most published
            work classifies topic. The second question: can sparse stylometry tell a human-authored
            document from an LLM paraphrase of the same document, without fine-tuning a transformer?
          </p>
          {ex ? (
            <p>
              On this proxy, stylometry lifts source F1 from {f3(ex.ablations[0]!.sourceF1)} (word
              TF–IDF) to {f3(ex.ablations[2]!.sourceF1)} (full stack). Topic labels remain almost
              linearly separable — the interesting gradient is authorship, not category.
            </p>
          ) : null}
        </div>
      </Panel>

      {ex ? (
        <p className="mt-6 text-xs text-muted-foreground">
          Last fit {pct(ex.source.accuracy)} source accuracy · {ex.counts.train}/{ex.counts.val}/
          {ex.counts.test} id-safe split · seed {ex.seeds}.
        </p>
      ) : null}
    </div>
  );
}
