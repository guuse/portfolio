/**
 * The one source of randomness for the motion runtime: which LED blinks when, packet timing
 * and speeds, the scaler's picks. Math.random by default; a test seeds it (seed()) so a run
 * can be replayed exactly, and settling at rest can be checked on many seeds.
 */
let source: () => number = Math.random;

/** A number in [0, 1), from the current source. */
export function random(): number {
  return source();
}

/**
 * Replaces the source with a seeded generator (mulberry32), or puts Math.random back when
 * called without a seed.
 */
export function seed(n?: number): void {
  if (n === undefined) {
    source = Math.random;
    return;
  }
  let a = n >>> 0;
  source = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
