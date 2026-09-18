import { createFileRoute } from "@tanstack/react-router";
import { FittingState, PageHead, Panel } from "@/components/lab-bits";
import { f3 } from "@/lib/coda/format";
import { useLab } from "@/lib/coda/store";

export const Route = createFileRoute("/report")({ component: ReportPage });

function ReportPage() {
  const { experiment, status, detail } = useLab();
  if (status !== "ready" || !experiment) {
    return (
      <div>
        <PageHead kicker="Writeup" title="Report." />
        <FittingState detail={detail} />
      </div>
    );
  }

  const a = experiment.ablations;

  return (
    <div className="max-w-3xl">
      <PageHead
        kicker="Method chapter, filled"
        title="Stylometric detection of LLM-rewritten dark-web documents with sparse features."
      />

      <article className="space-y-8 text-sm leading-relaxed text-muted-foreground">
        <Panel title="Problem">
          <p>
            Topic classifiers ignore authorship shift toward generated underground copy. This
            project asks whether classical sparse features can detect LLM paraphrases of public
            dark-web-style documents while still classifying the original CoDA topic.
          </p>
        </Panel>

        <Panel title="Constraint">
          <p>
            No live collection. CoDA is request-gated (s2w-ai/CoDA); this lab uses a synthetic
            proxy with the same ten labels, CoDA-style masks, and a controlled rewrite protocol.
            Do not republish a raw CoDA dump. If a document looks like CSAM or trafficking, drop
            it — we never generate that class of text.
          </p>
        </Panel>

        <Panel title="Method">
          <p>
            Word TF–IDF (1–2), character n-grams (3–5, char_wb), eleven stylometric features.
            LinearSVC (balanced hinge) for both heads; logistic regression for source probabilities
            and AUC. Vectorizers and the stylo scaler fit on train only. Split by original document
            id, 70 / 15 / 15, stratified by topic.
          </p>
        </Panel>

        <Panel title="Results">
          <ul className="list-disc space-y-2 pl-4">
            <li>
              Source F1 {f3(experiment.source.f1)}, AUC {f3(experiment.source.auc)} on the id-safe
              test set ({experiment.counts.test} rows).
            </li>
            <li>
              Ablation: word {f3(a[0]!.sourceF1)} → word+char {f3(a[1]!.sourceF1)} → full{" "}
              {f3(a[2]!.sourceF1)}. Stylometry is the main lift for source.
            </li>
            <li>
              Topic weighted F1 {f3(experiment.topic.weightedF1)}. Proxy lexicons saturate; treat
              as a ceiling, not a CoDA replica.
            </li>
            <li>
              RQ3: human-only topic F1 {f3(experiment.topicHumanOnly.weightedF1)} vs mixed{" "}
              {f3(experiment.topicMixed.weightedF1)} on human test documents.
            </li>
            <li>
              RQ4: train polish-A, test rhythm-B → F1 {f3(experiment.rq4.f1)} (n={experiment.rq4.nTest}
              ). Transfer drops. Paraphrase ≠ a specialised uncensored model.
            </li>
          </ul>
        </Panel>

        <Panel title="Limits">
          <p>
            CoDA-Synth is a proxy benchmark. A detector that sees our paraphrases may not see a
            tool sold on forums. Character n-grams can overfit generator punctuation. Topic labels
            on rewritten text assume the rewriter kept the topic. English-heavy, masks change
            surface form. Sample size is a pilot (hundreds, not 10,000).
          </p>
        </Panel>

        <Panel title="Ethics">
          <p>
            Research terms only. No redistribution of the gated CoDA dump. No operational targeting.
            No live .onion crawl. Synthesis paraphrases existing public proxy text — no new criminal
            how-to, no new product invention.
          </p>
        </Panel>

        <Panel title="Citations">
          <ul className="space-y-2">
            <li>
              Jin, Y., Jang, E., Lee, Y., Shin, S., & Chung, J.-W. (2022). Shedding New Light on
              the Language of the Dark Web. NAACL.
            </li>
            <li>
              Al-Nabki, M. W., Fidalgo, E., Alegre, E., & Fernández-Robles, L. (2017/2019). DUTA /
              DUTA-10K.
            </li>
            <li>
              Jin et al. (2023). DarkBERT. ACL. Related work — this lab does not run DarkBERT.
            </li>
          </ul>
        </Panel>

        <p className="text-xs">
          Scope is frozen: public data, traditional ML, two tasks. Fitted in{" "}
          {(experiment.durationMs / 1000).toFixed(1)}s · seed {experiment.seeds}.
        </p>
      </article>
    </div>
  );
}
