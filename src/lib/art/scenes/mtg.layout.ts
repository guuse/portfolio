/** Where things sit in the MTG suite scenes (shared with motion). */

/** A cubic route in both directions. */
const cub = (a: string, b: string, c: string, d: string): { f: string; r: string } => ({
  f: `M${a}C${b} ${c} ${d}`,
  r: `M${d}C${c} ${b} ${a}`,
});

export const M1 = {
  table: { x: 40, y: 340, w: 520 },
  pile: { x: 420, y: 334 },
  /** Rulebooks, bottom to top: x offset, width, height, tone. */
  books: [
    [0, 108, 16, 1],
    [6, 96, 14, 2],
    [-4, 104, 15, 3],
    [10, 88, 13, 1],
    [2, 100, 15, 2],
    [-2, 92, 14, 3],
    [8, 98, 16, 1],
    [4, 84, 13, 2],
  ] as const,
  /** Where the dealer stands: cards fly from here to their place. */
  dealFrom: { x: 300, y: 334 },
};

export const M2 = {
  /** You (bottom), left, top, right: clockwise from you. */
  seats: [
    [236, 382],
    [80, 236],
    [236, 90],
    [392, 236],
  ] as const,
  stack: [236, 222] as const,
  engine: { x: 492, y: 202, w: 92, h: 40 },
  /** Questions from the engine to each seat... */
  lanes: [
    cub("526 246", "526 340", "420 384", "278 384"),
    cub("540 202", "540 20", "100 8", "84 220"),
    cub("520 202", "520 120", "420 92", "278 92"),
    cub("492 224", "466 224", "450 236", "434 236"),
  ],
  /** ...and each seat's answer back. */
  back: [
    cub("268 374", "400 360", "506 330", "506 246"),
    cub("94 220", "120 30", "520 40", "526 202"),
    cub("268 100", "400 104", "500 130", "506 202"),
    cub("432 244", "452 248", "470 236", "492 236"),
  ],
  /** Which hand plays each card on the stack (seat 0, 1, 2), and where that hand sits. */
  playedFrom: [
    [236, 336],
    [130, 236],
    [236, 128],
  ] as const,
  stackPos: (i: number): [number, number] => [236 - 16 + i * 7, 222 - 22 - i * 9],
};

export const M3 = {
  screens: [
    [22, 34],
    [410, 34],
    [22, 262],
    [410, 262],
  ] as const,
  sw: 168,
  sh: 132,
  server: { x: 236, y: 184, w: 128, h: 46 },
  bar: { x: 186, y: 402, w: 228 },
  lanes: [
    cub("246 184", "246 130", "220 100", "192 100"),
    cub("354 184", "354 130", "380 100", "408 100"),
    cub("246 230", "246 290", "220 328", "192 328"),
    cub("354 230", "354 290", "380 328", "408 328"),
  ],
};

const unit = { x: 26, y: 36, w: 280, h: 352 };
const shelves = [140, 250, 372];
const table = { x: 348, y: 140, w: 204, h: 180 };
const boxes: [number, number][] = [];
for (const r of [0, 1]) for (let k = 0; k < 7; k++) boxes.push([unit.x + 16 + k * 36, shelves[r]! - 42]);
const pick = 9;
const seat: [number, number] = [table.x + 6, table.y + table.h / 2];
export const M4 = {
  unit,
  shelves,
  table,
  boxes,
  /** The deck that goes to the table. */
  pick,
  seat,
  /** The deck is drawn where it lands, next to the seat; this is how far it travels from its slot. */
  deckLanding: [seat[0] + 46, seat[1] - 22] as const,
  route: `M${boxes[pick]![0] + 15} ${boxes[pick]![1] - 10}C330 40 420 120 ${seat[0] + 61} ${seat[1] - 2}`,
};

export const M5 = {
  tokens: [
    { x: 60, w: 62, q: "c:g", l: "green" },
    { x: 140, w: 118, q: "t:creature", l: "a creature" },
    { x: 276, w: 84, q: "o:draw", l: "draws cards" },
  ],
  ty: 160,
  scryfall: { x: 470, y: 144, w: 100, h: 42 },
  fans: [
    { cx: 168, l: "best match" },
    { cx: 420, l: "alternatives" },
  ],
  /** Each fan's six cards, from left to right, in degrees. */
  fanAngles: [-28, -16.8, -5.6, 5.6, 16.8, 28],
  q: "M362 175C410 175 430 168 470 168",
  back: "M470 178C430 186 410 196 362 194",
};

export const M6 = {
  table: { x: 30, y: 196, w: 170, h: 130 },
  issue: { x: 238, y: 86, w: 134, h: 64 },
  git: { y: 112, x0: 420, x1: 568 },
  lap: { cx: 470, by: 372, w: 132 },
  engine: { x: 262, y: 318, w: 104, h: 38 },
  routes: [
    /** report → issue */
    "M160 236C186 180 200 118 236 118",
    /** issue → commit */
    "M374 118C396 118 404 112 420 112",
    /** commit → homelab */
    "M568 112C600 120 596 250 540 292",
    /** homelab → the table */
    "M404 332C330 400 200 380 150 330",
  ],
};
