import { packBundle } from "./pack";
import { runExperiment, type Stage } from "./pipeline";

type InMsg = { cmd: "fit" };
type OutMsg =
  | { type: "stage"; stage: Stage; detail?: string }
  | { type: "done"; pack: ReturnType<typeof packBundle> }
  | { type: "error"; error: string };

const post = (msg: OutMsg) => {
  (self as unknown as { postMessage: (m: OutMsg) => void }).postMessage(msg);
};

self.addEventListener("message", (ev: MessageEvent<InMsg>) => {
  if (ev.data?.cmd !== "fit") return;
  void (async () => {
    try {
      const fitted = await runExperiment((stage, detail) => {
        post({ type: "stage", stage, detail });
      });
      post({ type: "done", pack: packBundle(fitted) });
    } catch (err) {
      post({
        type: "error",
        error: err instanceof Error ? err.message : "Training failed",
      });
    }
  })();
});
