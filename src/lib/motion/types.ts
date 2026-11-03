/**
 * An animator drives one drawing. `p` is scroll progress through its step (0..1, smoothed),
 * `dt` the frame time in seconds, `t` a running clock for things that keep moving (packets,
 * LEDs), and `speed` how fast that clock runs (homepage cards run faster on hover).
 */
export type Animator = (p: number, dt: number, t: number, speed: number) => void;

/** Builds the animator for a drawing that is already in the DOM. */
export type SceneFactory = (svg: SVGSVGElement) => Animator;
