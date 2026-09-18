/** Mulberry32 — tiny seedable PRNG, deterministic across Node and browser. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = () => number;

export function randInt(rng: Rng, lo: number, hi: number) {
  return lo + Math.floor(rng() * (hi - lo));
}

export function pick<T>(rng: Rng, xs: readonly T[]): T {
  return xs[Math.floor(rng() * xs.length)]!;
}

export function pickN<T>(rng: Rng, xs: readonly T[], n: number): T[] {
  const copy = xs.slice();
  shuffle(copy, rng);
  return copy.slice(0, n);
}

export function shuffle<T>(xs: T[], rng: Rng): T[] {
  for (let i = xs.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = xs[i]!;
    xs[i] = xs[j]!;
    xs[j] = tmp;
  }
  return xs;
}

export function chance(rng: Rng, p: number) {
  return rng() < p;
}
