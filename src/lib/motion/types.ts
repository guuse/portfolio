/**
 * An animator drives one drawing. `p` is scroll progress through its step (0..1, smoothed),
 * `dt` the frame time in seconds, `t` a running clock for things that keep moving (packets,
 * LEDs), and `speed` how fast that clock runs (homepage cards run faster on hover).
 *
 * `rest` is set once the reader has stopped scrolling for a while (controller.ts): the scene
 * then settles (no new packets, LEDs back to their drawn state, `t` stands still) and returns
 * whether anything is still on its way out. Once it returns false it isn't called again
 * until the reader scrolls (WCAG 2.2.2).
 */
export type Animator = (p: number, dt: number, t: number, speed: number, rest: boolean) => boolean;

/** Builds the animator for a drawing that is already in the DOM. */
export type SceneFactory = (svg: SVGSVGElement) => Animator;
