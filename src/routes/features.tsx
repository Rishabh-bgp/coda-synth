import { createFileRoute } from "@tanstack/react-router";
import { FittingState, PageHead, Panel, Stat } from "@/components/lab-bits";
import { BarList } from "@/components/viz";
import { STYLO_WHY } from "@/lib/coda/types";
import { useLab } from "@/lib/coda/store";
import { f3 } from "@/lib/coda/format";

export const Route = createFileRoute("/features")({ component: FeaturesPage });

function FeaturesPage() {
  const { experiment, status, detail } = useLab();
  if (status !== "ready" || !experiment) {
    return (
      <div>
        <PageHead kicker="§9" title="Sparse features." />
        <FittingState detail={detail} />
      </div>
    );
  }

  const { styloMeans, topSourceCoeffs } = experiment;
  const styloRows = styloMeans.names.map((name, i) => ({
    name,
    human: styloMeans.human[i]!,
    llm: styloMeans.llm[i]!,
    why: STYLO_WHY[name],
  }));

  return (
    <div>
      <PageHead
        kicker="Word · char · stylo"
        title="The stack that does not need a transformer."
        lede="Word TF–IDF (1–2 grams), character n-grams (3–5, word-boundary), and eleven cheap stylometric scalars. Vectorizers fit on train only. Stylo is scaled, then hstacked."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Word n-grams" value="(1, 2)" hint="sublinear TF, min_df 2" />
        <Stat label="Char n-grams" value="(3, 5)" hint="analyzer char_wb" />
        <Stat label="Stylo" value="11" hint="regex + split, no APIs" />
      </div>

      <Panel className="mt-8" title="Stylometry means · human vs llm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="py-2 pr-4 font-medium">Feature</th>
                <th className="py-2 pr-4 font-medium">Human</th>
                <th className="py-2 pr-4 font-medium">LLM</th>
                <th className="py-2 font-medium">Why it may help</th>
              </tr>
            </thead>
            <tbody>
              {styloRows.map((r) => (
                <tr key={r.name} className="border-t border-border">
                  <td className="py-2 pr-4 font-mono text-xs">{r.name}</td>
                  <td className="py-2 pr-4 font-mono tabular-nums text-human">{f3(r.human)}</td>
                  <td className="py-2 pr-4 font-mono tabular-nums text-llm">{f3(r.llm)}</td>
                  <td className="py-2 text-muted-foreground">{r.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Top coefficients toward llm">
          <BarList items={topSourceCoeffs.llm.map((c) => ({ name: c.name, value: c.weight, positive: true }))} />
        </Panel>
        <Panel title="Top coefficients toward human">
          <BarList
            items={topSourceCoeffs.human.map((c) => ({ name: c.name, value: c.weight, positive: false }))}
          />
        </Panel>
      </div>
    </div>
  );
}
