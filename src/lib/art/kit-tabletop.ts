/**
 * Parts for the MTG suite scenes, in the same hand as the kit: a top view for card tables,
 * front elevation for objects. Cards are generic shapes (frame, art box, text lines): no real
 * card art, names or symbols. People have no faces.
 */
import { slab } from "./kit";
import { circle, g, n, path, rect, text } from "./svg";

export interface CardOptions {
  back?: boolean;
  /** Highlight the frame in amber (the card being played). */
  hl?: boolean;
  rot?: number;
  key?: string;
  cls?: string;
  op?: number;
}

/** A playing card, upright. `w` is the width; the height follows the real 63:88 ratio. */
export function card(x: number, y: number, w: number, o: CardOptions = {}): string {
  const h = w * 1.4,
    r = Math.max(1.5, w * 0.07),
    i = w * 0.08;
  let s: string;
  if (o.back) {
    s =
      rect(x, y, w, h, "c-back", r) +
      rect(x + i, y + i, w - 2 * i, h - 2 * i, "c-back-in", r * 0.6) +
      path(
        `M${n(x + w / 2)} ${n(y + h * 0.3)}L${n(x + w * 0.72)} ${n(y + h / 2)}L${n(x + w / 2)} ${n(y + h * 0.7)}L${n(x + w * 0.28)} ${n(y + h / 2)}Z`,
        "c-back-mark",
      );
  } else {
    s =
      rect(x, y, w, h, `c-face${o.hl ? " c-face--hl" : ""}`, r) +
      rect(x + i, y + i * 1.2, w * 0.56, Math.max(1.6, h * 0.05), "c-txt c-txt--b", 0.8) +
      rect(x + i, y + h * 0.15, w - 2 * i, h * 0.38, "c-art", r * 0.5) +
      path(
        `M${n(x + i + 1.5)} ${n(y + h * 0.5)}L${n(x + w * 0.36)} ${n(y + h * 0.3)}L${n(x + w * 0.56)} ${n(y + h * 0.43)}L${n(x + w * 0.7)} ${n(y + h * 0.34)}L${n(x + w - i - 1.5)} ${n(y + h * 0.5)}`,
        "c-artline",
      ) +
      rect(x + i, y + h * 0.58, w - 2 * i, Math.max(1.2, h * 0.035), "c-txt", 0.6);
    if (w >= 16)
      for (let k = 0; k < 3; k++)
        s += rect(
          x + i,
          y + h * (0.68 + k * 0.08),
          (w - 2 * i) * (k === 2 ? 0.55 : 1),
          Math.max(1.1, h * 0.03),
          "c-txt",
          0.6,
        );
  }
  if (o.rot) s = g({ transform: `rotate(${n(o.rot)} ${n(x + w / 2)} ${n(y + h)})` }, s);
  return o.key || o.op !== undefined
    ? g({ "data-k": o.key, class: o.cls || undefined, opacity: o.op }, s)
    : s;
}

export interface FanOptions {
  back?: boolean;
  /** Key prefix: each card gets `<keys><i>`. */
  keys?: string;
  hide?: (i: number) => boolean;
  /** Index of the highlighted card. */
  hl?: number;
}

/** A fan of cards, rotating around a point below their bottom edge. */
export function fan(
  cx: number,
  by: number,
  w: number,
  count: number,
  spread: number,
  o: FanOptions = {},
): string {
  let s = "";
  for (let i = 0; i < count; i++) {
    const a = count === 1 ? 0 : -spread / 2 + (spread * i) / (count - 1);
    s += g(
      { transform: `rotate(${n(a)} ${n(cx)} ${n(by + w * 1.6)})` },
      g(
        {
          "data-k": o.keys ? o.keys + i : undefined,
          opacity: o.hide?.(i) ? 0 : undefined,
          class: o.keys ? "k-origin-b" : undefined,
        },
        card(cx - w / 2, by - w * 1.4, w, { back: o.back ?? false, hl: o.hl === i }),
      ),
    );
  }
  return s;
}

type HairStyle = "short" | "long" | "bun" | "cap";
const HAIR: Record<HairStyle, (cx: number, hy: number, r: number) => string> = {
  short: (cx, hy, r) =>
    path(
      `M${n(cx - r)} ${n(hy + 1)}C${n(cx - r)} ${n(hy - r * 1.25)} ${n(cx + r)} ${n(hy - r * 1.25)} ${n(cx + r)} ${n(hy + 1)}C${n(cx + r * 0.5)} ${n(hy - r * 0.45)} ${n(cx - r * 0.5)} ${n(hy - r * 0.45)} ${n(cx - r)} ${n(hy + 1)}Z`,
      "p-hair",
    ),
  long: (cx, hy, r) =>
    path(
      `M${n(cx - r - 2)} ${n(hy + r * 1.1)}C${n(cx - r - 3)} ${n(hy - r * 1.4)} ${n(cx + r + 3)} ${n(hy - r * 1.4)} ${n(cx + r + 2)} ${n(hy + r * 1.1)}H${n(cx + r - 3)}C${n(cx + r - 2)} ${n(hy - r * 0.2)} ${n(cx - r * 0.2)} ${n(hy - r * 0.6)} ${n(cx - r + 3)} ${n(hy + r * 1.1)}Z`,
      "p-hair",
    ),
  bun: (cx, hy, r) => circle(cx + r * 0.2, hy - r * 1.05, r * 0.45, "p-hair") + HAIR.short(cx, hy, r),
  cap: (cx, hy, r) =>
    path(
      `M${n(cx - r - 1)} ${n(hy - 1)}C${n(cx - r)} ${n(hy - r * 1.3)} ${n(cx + r)} ${n(hy - r * 1.3)} ${n(cx + r + 1)} ${n(hy - 1)}H${n(cx + r + 9)}V${n(hy + 2)}H${n(cx - r - 1)}Z`,
      "p-cap",
    ),
};

/** A friend at the table, seen from the front: shoulders, neck, head and hair. */
export function person(
  cx: number,
  by: number,
  o: { s?: number; shirt?: number; hair?: HairStyle } = {},
): string {
  const s = o.s ?? 1,
    w = 30 * s,
    hr = 14 * s,
    hy = by - 66 * s;
  let b = path(
    `M${n(cx - w)} ${n(by)}V${n(by - 26 * s)}C${n(cx - w)} ${n(by - 44 * s)} ${n(cx - w * 0.5)} ${n(by - 48 * s)} ${n(cx - 9 * s)} ${n(by - 48 * s)}H${n(cx + 9 * s)}C${n(cx + w * 0.5)} ${n(by - 48 * s)} ${n(cx + w)} ${n(by - 44 * s)} ${n(cx + w)} ${n(by - 26 * s)}V${n(by)}Z`,
    `p-shirt p-shirt--${o.shirt ?? 1}`,
  );
  b += path(
    `M${n(cx - w * 0.78)} ${n(by - 36 * s)}C${n(cx - w * 0.6)} ${n(by - 45 * s)} ${n(cx - w * 0.3)} ${n(by - 46.5 * s)} ${n(cx - 9 * s)} ${n(by - 46.5 * s)}`,
    "p-hl",
  );
  b += rect(cx - 5 * s, by - 54 * s, 10 * s, 8 * s, "p-neck", 2);
  b += circle(cx, hy, hr, "p-head");
  b += HAIR[o.hair ?? "short"](cx, hy, hr);
  return b;
}

/** The friend nearest to us, from behind: the back of a head and shoulders. */
export function personBack(cx: number, by: number, s: number): string {
  return (
    path(
      `M${n(cx - 34 * s)} ${n(by)}V${n(by - 22 * s)}C${n(cx - 34 * s)} ${n(by - 40 * s)} ${n(cx - 16 * s)} ${n(by - 44 * s)} ${n(cx - 8 * s)} ${n(by - 44 * s)}H${n(cx + 8 * s)}C${n(cx + 16 * s)} ${n(by - 44 * s)} ${n(cx + 34 * s)} ${n(by - 40 * s)} ${n(cx + 34 * s)} ${n(by - 22 * s)}V${n(by)}Z`,
      "p-shirt p-shirt--3",
    ) +
    circle(cx, by - 58 * s, 15 * s, "p-hair") +
    path(
      `M${n(cx - 9 * s)} ${n(by - 47 * s)}C${n(cx - 4 * s)} ${n(by - 44 * s)} ${n(cx + 4 * s)} ${n(by - 44 * s)} ${n(cx + 9 * s)} ${n(by - 47 * s)}`,
      "p-hl",
    )
  );
}

/** A rulebook lying flat: cover, page edges and a title band. */
export function book(x: number, y: number, w: number, h: number, tone: number): string {
  return (
    slab(x, y, w, h, { top: 4, inset: 3, cls: `b-cover b-cover--${tone}` }) +
    rect(x + w - 10, y + 2, 7, h - 4, "b-pages", 1) +
    path(
      `M${n(x + w - 9)} ${n(y + h * 0.36)}H${n(x + w - 4)}M${n(x + w - 9)} ${n(y + h * 0.64)}H${n(x + w - 4)}`,
      "b-pageline",
    ) +
    rect(x + 8, y + h / 2 - 1.5, w * 0.32, 3, "b-title", 1.5)
  );
}

/** A loose sheet of rules: a page with text lines. */
export function sheet(x: number, y: number, w: number, key: string, rot = 0): string {
  const h = w * 1.3;
  let s = rect(x, y, w, h, "b-sheet", 1.5);
  for (let k = 0; k < 5; k++)
    s += rect(x + 4, y + 6 + (k * (h - 10)) / 5, (w - 8) * (k === 4 ? 0.5 : 1), 1.6, "b-sheetline", 0.8);
  return g(
    { "data-k": key, class: "k-origin-c" },
    g({ transform: `rotate(${n(rot)} ${n(x + w / 2)} ${n(y + h / 2)})` }, s),
  );
}

/** A speech bubble with a question mark. */
export function bubble(cx: number, by: number, key: string): string {
  const w = 34,
    h = 30;
  return g(
    { "data-k": key, class: "k-origin-b" },
    path(
      `M${n(cx - w / 2 + 6)} ${n(by - h - 8)}H${n(cx + w / 2 - 6)}Q${n(cx + w / 2)} ${n(by - h - 8)} ${n(cx + w / 2)} ${n(by - h - 2)}V${n(by - 14)}Q${n(cx + w / 2)} ${n(by - 8)} ${n(cx + w / 2 - 6)} ${n(by - 8)}H${n(cx + 5)}L${n(cx - 3)} ${n(by)}L${n(cx - 3)} ${n(by - 8)}H${n(cx - w / 2 + 6)}Q${n(cx - w / 2)} ${n(by - 8)} ${n(cx - w / 2)} ${n(by - 14)}V${n(by - h - 2)}Q${n(cx - w / 2)} ${n(by - h - 8)} ${n(cx - w / 2 + 6)} ${n(by - h - 8)}Z`,
      "m-bubble",
    ) + text(cx, by - 17, "?", "lb-q", "middle"),
  );
}

/** A player's nameplate at a table: a pill with an avatar, and a ring for "your turn". */
export function plate(
  cx: number,
  cy: number,
  key: string,
  o: { ring?: boolean; empty?: boolean; tone?: number } = {},
): string {
  const w = 76,
    h = 24;
  return g(
    { "data-k": key, class: "k-origin-c" },
    rect(cx - w / 2 - 4, cy - h / 2 - 4, w + 8, h + 8, "m-ring", (h + 8) / 2, {
      "data-k": `${key}-ring`,
      opacity: o.ring ? undefined : 0,
    }) +
      rect(cx - w / 2, cy - h / 2, w, h, o.empty ? "m-plate m-plate--empty" : "m-plate", h / 2) +
      (o.empty
        ? ""
        : circle(cx - w / 2 + 12, cy, 6.5, `m-avatar m-avatar--${o.tone ?? 1}`) +
          rect(cx - w / 2 + 24, cy - 2, w - 38, 4, "m-plateline", 2)),
  );
}

/** A card table from above: a rounded felt top with a rim. */
export const tableTop = (x: number, y: number, w: number, h: number): string =>
  rect(x + 4, y + 6, w, h, "k-shadow", 26) +
  rect(x, y, w, h, "m-rim", 26) +
  rect(x + 9, y + 9, w - 18, h - 18, "m-felt", 19) +
  rect(x + 9, y + 9, w - 18, h - 18, "m-felt-edge", 19);

/** A browser window frame: a title bar with one tab and an address bar. */
export function browser(x: number, y: number, w: number, h: number, o: { favicons?: boolean } = {}): string {
  return (
    rect(x, y, w, h, "k-win", 5) +
    path(`M${n(x)} ${n(y + 22)}H${n(x + w)}`, "k-edge-line") +
    path(
      `M${n(x + 6)} ${n(y + 22)}V${n(y + 9)}Q${n(x + 6)} ${n(y + 5)} ${n(x + 10)} ${n(y + 5)}H${n(x + 70)}Q${n(x + 74)} ${n(y + 5)} ${n(x + 75)} ${n(y + 9)}L${n(x + 78)} ${n(y + 22)}`,
      "k-tab",
    ) +
    (o.favicons === false
      ? ""
      : [0, 1, 2, 3, 4, 5].map((i) => rect(x + 16 + i * 8, y + 11, 6, 7, "m-code", 1.2)).join("")) +
    rect(x + 92, y + 8, w - 120, 9, "k-field", 4.5)
  );
}

/** A deck box: a slab with a label strip and card tops showing above it. */
export function deckBox(x: number, y: number, o: { key?: string; hl?: boolean } = {}): string {
  const w = 30,
    h = 42;
  return g(
    { "data-k": o.key, class: "k-origin-b" },
    rect(x + 4, y - 5, w - 8, 6, "c-face", 1) +
      slab(x, y, w, h, { top: 4, inset: 3, cls: `m-box${o.hl ? " m-box--hl" : ""}` }) +
      rect(x + 5, y + 8, w - 10, 7, "m-boxlabel", 1.5) +
      rect(x + 5, y + h - 9, w * 0.4, 2.5, "c-txt", 1),
  );
}

/** A binder standing on a shelf: cover, ring spine and the owner's avatar. */
export function binder(x: number, y: number, tone: number, key: string): string {
  const w = 40,
    h = 76;
  return g(
    { "data-k": key, class: "k-origin-b" },
    slab(x, y, w, h, { top: 5, inset: 4, cls: "m-binder" }) +
      rect(x + 5, y + 6, 6, h - 12, "m-spine", 2) +
      [0.25, 0.5, 0.75].map((f) => circle(x + 8, y + h * f, 1.6, "m-ringhole")).join("") +
      rect(x + 16, y + 12, w - 22, 26, "m-pocket", 2) +
      rect(x + 16, y + 42, w - 22, 26, "m-pocket", 2) +
      circle(x + w - 6, y + h - 6, 7, `m-avatar m-avatar--${tone}`),
  );
}
