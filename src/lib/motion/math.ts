/** Small numeric helpers and the easing curves every scene uses. */

export const clamp = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Where p sits between a and b, as 0..1. The building block of every choreography. */
export const seg = (p: number, a: number, b: number): number => clamp((p - a) / (b - a), 0, 1);

/** Frame-rate independent smoothing: the fraction of the way to go after dt seconds at `rate`. */
export const approach = (dt: number, rate: number): number => 1 - Math.exp(-dt * rate);

export const ease = {
  outCubic: (t: number): number => 1 - Math.pow(1 - t, 3),
  inCubic: (t: number): number => t * t * t,
  inOutCubic: (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  /** Overshoots then settles; `s` sets how far (1.70158 is the classic 10%). */
  outBack: (t: number, s = 1.70158): number => {
    const c = s + 1;
    return 1 + c * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
  },
  inOutBack: (t: number): number => {
    const c = 1.70158 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c + 1) * 2 * t - c)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c + 1) * (t * 2 - 2) + c) + 2) / 2;
  },
  outQuad: (t: number): number => 1 - (1 - t) * (1 - t),
} as const;
