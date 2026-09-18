import { Link, useRouterState } from "@tanstack/react-router";
import {
  AudioLines,
  ChartNoAxesCombined,
  Files,
  FileText,
  GitBranch,
  LayoutGrid,
  Menu,
  ScanText,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useLab } from "@/lib/coda/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutGrid },
  { to: "/corpus", label: "Corpus", icon: Files },
  { to: "/method", label: "Pipeline", icon: GitBranch },
  { to: "/features", label: "Features", icon: AudioLines },
  { to: "/results", label: "Results", icon: ChartNoAxesCombined },
  { to: "/detect", label: "Live probe", icon: ScanText },
  { to: "/report", label: "Report", icon: FileText },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const ensure = useLab((s) => s.ensure);
  const status = useLab((s) => s.status);

  useEffect(() => {
    void ensure();
  }, [ensure]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-sm md:hidden">
        <Link to="/" className="font-display text-lg tracking-tight">
          CoDA-Synth
        </Link>
        <Button
          variant="ghost"
          size="icon"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </header>

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-border bg-background md:flex">
        <Brand />
        <Nav pathname={pathname} />
        <StatusChip status={status} />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-20 bg-background/95 p-4 pt-16 md:hidden">
          <Nav pathname={pathname} />
        </div>
      ) : null}

      <div className="md:pl-56">
        <main id="main" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="border-b border-border px-5 py-5">
      <Link to="/" className="block">
        <div className="font-display text-2xl leading-none tracking-tight">CoDA-Synth</div>
        <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Research lab
        </div>
      </Link>
    </div>
  );
}

function Nav({ pathname }: { pathname: string }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Lab">
      {NAV.map((item) => {
        const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors duration-150",
              active
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" strokeWidth={1.75} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function StatusChip({ status }: { status: string }) {
  const label =
    status === "ready" ? "Models fitted" : status === "running" ? "Fitting…" : status === "error" ? "Fit failed" : "Idle";
  return (
    <div className="border-t border-border px-5 py-4 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
      <span
        className={cn(
          "mr-2 inline-block size-1.5 rounded-full",
          status === "ready" ? "bg-human" : status === "running" ? "bg-primary" : "bg-border",
        )}
      />
      {label}
    </div>
  );
}
