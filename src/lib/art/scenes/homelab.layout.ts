/** Where things sit in the homelab scene and its homepage card (shared with motion). */

export const H = {
  repo: { x: 34, y: 54, w: 172, h: 82 },
  build: { x: 44, y: 212, w: 152, h: 52 },
  reg: { x: 34, y: 352, w: 172 },
  lap: { cx: 432, by: 368, w: 232 },
  /** y of the paths-ignore gate on repo → Actions. */
  gateY: 160,
  routes: {
    /** repo → Actions */
    push: "M120 136V206",
    /** Actions → GHCR */
    ship: "M120 266V318",
    /** Image Updater watches GHCR */
    watch: "M206 340C296 340 340 260 340 182",
    /** Image Updater commits the tag back to the repo */
    tag: "M296 160C250 160 246 118 206 118",
    /** Argo CD syncs from the repo */
    sync: "M206 76C300 76 376 84 440 84",
    /** Argo CD rolls the app on the laptop */
    roll: "M494 100V246",
  },
} as const;

/** The homepage card: one packet going round repo → build → laptop. */
export const CL = {
  loop: "M86 120C86 170 86 196 96 214C112 244 160 250 214 250C262 250 280 206 296 172C312 138 300 92 262 78C220 62 132 58 104 70C92 76 86 92 86 120",
  /**
   * How far round the loop (0..1) the build happens and the pod lands: the points nearest
   * (112, 243) and (250, 180). Precomputed so the browser doesn't search the path on load;
   * tests/unit/art.test.ts checks them.
   */
  buildAt: 0.186,
  laptopAt: 0.4705,
} as const;
