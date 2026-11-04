/**
 * Where things sit in the infrastructure delivery scenes (shared with motion, so the drawings
 * and the animators can't drift apart). Plain data only: this file ships to the browser.
 */

/** 1. The plan check: a pull request saves its plan, a reviewer approves, merge applies it. */
export const D1 = {
  pr: { x: 30, y: 70, w: 180, h: 120 },
  /** The diff rows in the pull request: y of each row and its length. */
  rows: [
    { y: 96, w: 92 },
    { y: 116, w: 118 },
    { y: 136, w: 70 },
    { y: 156, w: 104 },
  ],
  review: { x: 56, y: 230, w: 128 },
  ok: { cx: 204, cy: 245 },
  store: { x: 400, y: 170, w: 160 },
  /** The crate the pull request's plan lands in (the leftmost slot on the shelf). */
  crateX: 412,
  check: { x: 434, y: 262, w: 92, h: 40 },
  prod: { x: 420, y: 348, w: 120, h: 50 },
  routes: {
    /** The pull request saves its plan to the store. */
    save: "M210 120C300 120 320 155 404 155",
    /** The reviewer reads the plan in the pull request. */
    approve: "M120 190V230",
    /** Merge: the deploy starts. */
    merge: "M120 260C120 304 250 282 428 282",
    /** The deploy fetches the approved plan. */
    fetch: "M480 202V254",
    /** It applies that plan to production. */
    apply: "M480 302V338",
  },
} as const;

/** 2. Policy first: a mandatory policy stops the expiry rule before it reaches the log bucket. */
export const D2 = {
  pr: { x: 30, y: 170, w: 150, h: 100 },
  pack: { x: 240, y: 64, w: 136 },
  gate: { x: 308, y0: 184, y1: 256 },
  bucket: { cx: 506, top: 176, w: 104, h: 96 },
  routes: {
    /** The change on its way from the pull request to the bucket. */
    change: "M180 220H448",
    /** The policy pack runs at the gate. */
    link: "M308 94V160",
  },
  /** How far along `change` the packet waits at the closed gate (its nose just short of the bar). */
  stopAt: 0.4,
} as const;

/** 3. Separate foundations, one writer: the pipeline deploys, the CLI only reads. */
export const D3 = {
  ci: { x: 36, y: 60, w: 172 },
  envs: [
    { x: 330, y: 84, label: "acceptance" },
    { x: 330, y: 238, label: "production" },
  ],
  env: { w: 230, h: 82 },
  lap: { cx: 130, by: 382, w: 172 },
  routes: {
    /** The pipeline deploys to acceptance. */
    acc: "M208 75C276 75 270 125 330 125",
    /** The pipeline deploys to production. */
    prod: "M122 90V150C122 210 250 270 330 270",
    /** The CLI reads production (preview, status), and never writes. */
    read: "M220 318C276 318 290 300 330 300",
  },
} as const;
