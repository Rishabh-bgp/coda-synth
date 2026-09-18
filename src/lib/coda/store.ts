import { create } from "zustand";
import { unpackBundle } from "./pack";
import { getBundle, runExperiment, setBundle, type Stage } from "./pipeline";
import type { Experiment } from "./types";

type Status = "idle" | "running" | "ready" | "error";

type LabState = {
  status: Status;
  stage: Stage | null;
  detail: string;
  error: string | null;
  experiment: Experiment | null;
  ensure: () => Promise<void>;
};

let inflight: Promise<void> | null = null;

function fitInWorker(onStage: (stage: Stage, detail?: string) => void) {
  return new Promise<ReturnType<typeof unpackBundle>>((resolve, reject) => {
    const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    const fail = (err: Error) => {
      worker.terminate();
      reject(err);
    };
    worker.onmessage = (ev: MessageEvent) => {
      const msg = ev.data as
        | { type: "stage"; stage: Stage; detail?: string }
        | { type: "done"; pack: Parameters<typeof unpackBundle>[0] }
        | { type: "error"; error: string };
      if (msg.type === "stage") onStage(msg.stage, msg.detail);
      else if (msg.type === "done") {
        worker.terminate();
        resolve(unpackBundle(msg.pack));
      } else if (msg.type === "error") fail(new Error(msg.error));
    };
    worker.onerror = (e) => fail(e.error instanceof Error ? e.error : new Error(e.message || "Worker failed"));
    worker.postMessage({ cmd: "fit" });
  });
}

export const useLab = create<LabState>((set, get) => ({
  status: "idle",
  stage: null,
  detail: "",
  error: null,
  experiment: getBundle()?.experiment ?? null,
  ensure: async () => {
    if (get().status === "ready" && get().experiment) return;
    if (inflight) return inflight;
    inflight = (async () => {
      set({ status: "running", error: null, stage: "load", detail: "Starting" });
      const onStage = (stage: Stage, detail?: string) => {
        set({ stage, detail: detail ?? "" });
      };
      try {
        let fitted;
        try {
          fitted = await fitInWorker(onStage);
        } catch {
          fitted = await runExperiment(onStage);
        }
        setBundle(fitted);
        set({
          status: "ready",
          experiment: fitted.experiment,
          stage: "eval",
          detail: "Held-out evaluation complete",
        });
      } catch (err) {
        set({
          status: "error",
          error: err instanceof Error ? err.message : "Training failed",
        });
      } finally {
        inflight = null;
      }
    })();
    return inflight;
  },
}));
