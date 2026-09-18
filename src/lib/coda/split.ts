import { mulberry32, shuffle } from "./rng";
import type { Split, Topic } from "./types";

function stratifiedIds(
  items: { id: string; topic: Topic }[],
  frac: number,
  rng: () => number,
): { keep: string[]; rest: string[] } {
  const by = new Map<Topic, string[]>();
  for (const it of items) {
    const arr = by.get(it.topic) ?? [];
    arr.push(it.id);
    by.set(it.topic, arr);
  }
  const keep: string[] = [];
  const rest: string[] = [];
  for (const ids of by.values()) {
    shuffle(ids, rng);
    const nRest = Math.round(ids.length * frac);
    rest.push(...ids.slice(0, nRest));
    keep.push(...ids.slice(nRest));
  }
  return { keep, rest };
}

/** Split on original doc_id (70/15/15), stratify by topic, then attach pairs. */
export function idSafeSplit<T extends { doc_id: string; topic: Topic }>(
  docs: T[],
  seed = 42,
): (T & { split: Split })[] {
  const rng = mulberry32(seed);
  const meta = new Map<string, Topic>();
  for (const d of docs) if (!meta.has(d.doc_id)) meta.set(d.doc_id, d.topic);
  const items = [...meta.entries()].map(([id, topic]) => ({ id, topic }));
  const { keep: train, rest: tmp } = stratifiedIds(items, 0.3, rng);
  const tmpItems = tmp.map((id) => ({ id, topic: meta.get(id)! }));
  const { keep: val, rest: test } = stratifiedIds(tmpItems, 0.5, rng);
  const tag = new Map<string, Split>();
  for (const id of train) tag.set(id, "train");
  for (const id of val) tag.set(id, "val");
  for (const id of test) tag.set(id, "test");
  return docs.map((d) => ({ ...d, split: tag.get(d.doc_id) ?? "train" }));
}
