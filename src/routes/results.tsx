import { createFileRoute } from "@tanstack/react-router";
import { FittingState, PageHead, Panel, Stat } from "@/components/lab-bits";
import { Heatmap, RocChart } from "@/components/viz";
import { downloadText, f3 } from "@/lib/coda/format";
import { useLab } from "@/lib/coda/store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/results")({ component: ResultsPage });

function ResultsPage() {
  const { experiment, status, detail } = useLab();
  if (status !== "ready" || !experiment) {
    return (
      <div>
        <PageHead kicker="Held-out test" title="Results." />
        <FittingState detail={detail} />
      </div>
    );
  }

  const { source, topic, ablations, rq4, topicHumanOnly, topicMixed } = experiment;
  const csv = [
    "ablation,source_f1,source_auc,topic_weighted_f1",
    ...ablations.map((a) => `${a.id},${a.sourceF1},${a.sourceAuc},${a.topicWeightedF1}`),
  ].join("\n");

  return (
    <div>
      <PageHead
        kicker="The ablation table is the centre of the results section"
        title="Source detection moves. Topic saturates."
        lede="Positive class for source is llm. Topic is the original ten-way label, inherited by rewrites. Id-safe held-out test."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Source F1" value={f3(source.f1)} hint={`P ${f3(source.precision)} · R ${f3(source.recall)}`} />
        <Stat label="Source AUC" value={f3(source.auc)} />
        <Stat label="Topic w-F1" value={f3(topic.weightedF1)} hint={`macro ${f3(topic.macroF1)}`} />
        <Stat label="Topic acc." value={f3(topic.accuracy)} />
      </div>

      <Panel
        className="mt-8"
        title="Ablation A / B / C"
        action={
          <Button variant="secondary" size="sm" onClick={() => downloadText("ablation.csv", csv, "text/csv")}>
            Save CSV
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="py-2 pr-4 font-medium">Stack</th>
                <th className="py-2 pr-4 font-medium">Source F1</th>
                <th className="py-2 pr-4 font-medium">Source AUC</th>
                <th className="py-2 font-medium">Topic w-F1</th>
              </tr>
            </thead>
            <tbody>
              {ablations.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="py-3 pr-4">{a.label}</td>
                  <td className="py-3 pr-4 font-mono tabular-nums">{f3(a.sourceF1)}</td>
                  <td className="py-3 pr-4 font-mono tabular-nums">{f3(a.sourceAuc)}</td>
                  <td className="py-3 font-mono tabular-nums">{f3(a.topicWeightedF1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          RQ2: stylometry {ablations[2]!.sourceF1 > ablations[0]!.sourceF1 ? "improves" : "does not improve"}{" "}
          source F1 over word TF–IDF alone (Δ {f3(ablations[2]!.sourceF1 - ablations[0]!.sourceF1)}).
        </p>
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Source confusion">
          <Heatmap matrix={source.confusion} labels={source.labels} />
        </Panel>
        <Panel title="ROC (logistic)">
          <RocChart fpr={experiment.roc.fpr} tpr={experiment.roc.tpr} />
        </Panel>
      </div>

      <Panel className="mt-6" title="Topic confusion">
        <Heatmap matrix={topic.confusion} labels={topic.labels} compact />
        <p className="mt-3 text-sm text-muted-foreground">
          On this proxy the ten topic lexicons are nearly disjoint, so the topic task saturates. Real
          CoDA is noisier. The measurement of interest is source, not category.
        </p>
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="RQ3 · topic on human test">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Human-only train" value={f3(topicHumanOnly.weightedF1)} />
            <Stat label="Mixed human+llm" value={f3(topicMixed.weightedF1)} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Source-aware (mixed) training {topicMixed.weightedF1 + 1e-9 >= topicHumanOnly.weightedF1 ? "does not hurt" : "hurts"}{" "}
            the original topic task on human held-out documents.
          </p>
        </Panel>
        <Panel title="RQ4 · train A, test B">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Transfer F1" value={f3(rq4.f1)} hint={`${rq4.nTest} rows`} />
            <Stat label="Transfer AUC" value={f3(rq4.auc)} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Detector trained on polish-A rewrites, tested on rhythm-B. Drop versus in-generator
            source F1 is {f3(source.f1 - rq4.f1)}.
          </p>
        </Panel>
      </div>
    </div>
  );
}
