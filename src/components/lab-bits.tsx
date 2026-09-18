import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function PageHead({
  kicker,
  title,
  lede,
}: {
  kicker: string;
  title: string;
  lede?: ReactNode;
}) {
  return (
    <header className="mb-8 max-w-3xl">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{kicker}</div>
      <h1 className="mt-2 font-display text-4xl leading-tight tracking-tight sm:text-5xl">{title}</h1>
      {lede ? <p className="mt-4 text-base text-muted-foreground">{lede}</p> : null}
    </header>
  );
}

export function Panel({
  children,
  className,
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-5 sm:p-6", className)}>
      {title ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium tracking-wide">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/50 px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-2xl tabular-nums tracking-tight">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

export function SourceBadge({ source }: { source: "human" | "llm" }) {
  return (
    <Badge variant={source === "human" ? "human" : "llm"}>
      {source === "human" ? "human" : "llm"}
    </Badge>
  );
}

export function EthicsBanner() {
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
      <span className="font-medium text-foreground">Ethics lock.</span> Public proxy corpus
      only. No live hidden-service collection. Masks stay intact. No operational instructions.
    </div>
  );
}

export function FittingState({ detail }: { detail: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-6 py-16 text-center">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Fitting sparse models</div>
      <p className="mt-3 font-display text-2xl">{detail || "Working"}</p>
      <p className="mt-2 text-sm text-muted-foreground">Word TF–IDF, character n-grams, LinearSVC.</p>
    </div>
  );
}
