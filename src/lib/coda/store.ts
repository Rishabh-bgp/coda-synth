import { create } from "zustand";
import { getBundle, runExperiment, type Stage } from "./pipeline";
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
      try {
        const fitted = await runExperiment((stage, detail) => {
          set({ stage, detail: detail ?? "" });
        });
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
