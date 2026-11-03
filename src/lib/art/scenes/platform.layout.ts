/**
 * Where things sit in the platform scenes. Shared by the build-time drawings and the client
 * motion, so the two can't drift apart. Plain data only: this file ships to the browser.
 */
import type { WindowKind } from "../kit";

export const S1 = {
  ground: 384,
  /** Centre x of each dock on the shared platform. */
  docks: [92, 196, 300, 404, 508],
  win: { w: 90, h: 64 },
  /** Window top when docked. */
  dockY: 222,
  /** Where each app sat before: centre x, window top, tilt. */
  old: [
    { cx: 92, y: 196, r: -3 },
    { cx: 222, y: 232, r: 2 },
    { cx: 350, y: 262, r: 3.5 },
    { cx: 482, y: 232, r: -2 },
  ],
  kinds: ["hero", "shop", "list", "article", "form"] as WindowKind[],
} as const;

const S2top = 172,
  S2h = 218,
  S2nh = 44;
const racks = [60, 236, 412];
export const S2 = {
  racks,
  rw: 128,
  top: S2top,
  h: S2h,
  slots: 4,
  nw: 108,
  nh: S2nh,
  lb: { x: 210, y: 88, w: 180, h: 24 },
  /** Which pods are drawn in the still frame, per zone (4 per node, bottom node first). */
  baked: [
    [1, 1, 1, 1, 1, 1, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 0, 0, 0],
  ],
  nodesBaked: [2, 3, 2],
  /** Top of node slot k, where k = 0 is the bottom slot. */
  slotY: (k: number): number => S2top + S2h - 12 - (k + 1) * (S2nh + 6) + 2,
  inPaths: ["M226 -24C226 30 268 40 274 84", "M300 -24V84", "M374 -24C374 30 332 40 326 84"],
  outPaths: racks.map((rx) => `M300 114C300 150 ${rx + 64} 136 ${rx + 64} 170`),
};

const S3R = 540,
  S3cx = 300,
  S3cy = 860;
/** A point on the globe's horizon arc at x, and the angle that stands a building upright there. */
const onArc = (x: number): { x: number; y: number; ang: number } => {
  const dx = x - S3cx;
  return { x, y: S3cy - Math.sqrt(S3R * S3R - dx * dx), ang: (Math.asin(dx / S3R) * 180) / Math.PI };
};
/** The point 70 units above a building, perpendicular to the arc: where its route lands. */
const roof = (pt: { x: number; y: number; ang: number }): { x: number; y: number } => {
  const r = (pt.ang * Math.PI) / 180;
  return { x: pt.x + 70 * Math.sin(r), y: pt.y - 70 * Math.cos(r) };
};
const r2 = (v: number): number => +v.toFixed(2);
const ie = onArc(148),
  jp = onArc(452);
const rIE = roof(ie),
  rJP = roof(jp);
export const S3 = {
  R: S3R,
  cx: S3cx,
  cy: S3cy,
  lat0: 14,
  lon0: 66,
  ie,
  jp,
  door: { cx: 300, y: 112, w: 78, h: 80 },
  toIE: `M288 200C276 236 ${r2(rIE.x + 40)} ${r2(rIE.y - 70)} ${r2(rIE.x)} ${r2(rIE.y)}`,
  toJP: `M312 200C324 236 ${r2(rJP.x - 40)} ${r2(rJP.y - 70)} ${r2(rJP.x)} ${r2(rJP.y)}`,
  inPaths: ["M196 46C196 80 276 84 288 122", "M300 50V122", "M404 46C404 80 324 84 312 122"],
  /** The three lanes through the door, which fan out to the two regions. */
  lanes: [288, 300, 312],
};

export const S4 = {
  toX: "M152 196C204 196 206 112 254 112",
  fromX: "M346 112C392 112 404 118 452 118",
  /** The hidden hop through the translator. */
  thruX: "M254 112H346",
  toDB: "M152 262C228 262 248 344 312 344H446",
  gateX: 382,
};

const S5cols = [236, 320, 404, 488],
  S5cw = 64;
export const S5 = {
  y: 236,
  x0: 196,
  x1: 572,
  cols: S5cols,
  cw: S5cw,
  /** Stub lengths up and down from the spine to the clusters. */
  stubUp: 54,
  stubDown: 40,
  stubs: S5cols.flatMap((x, i) => [
    { x: x + S5cw / 2, up: true, i: i * 2 },
    { x: x + S5cw / 2, up: false, i: i * 2 + 1 },
  ]),
};
