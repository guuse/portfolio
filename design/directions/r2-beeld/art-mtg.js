/*
 * r2-beeld · round 17: the MTG suite scenes, drawn with the round-16 kit (art.js).
 * Same hand as the platform page: front elevation from slightly above for objects, a top view
 * for card tables, lit top planes, 1.5-unit outlines, flat shadows, navy + ink + one amber.
 * Cards are generic shapes (frame, art box, text lines): no real card art, names or symbols.
 * Each scene is drawn in a meaningful still state (the no-JS and reduced-motion frame);
 * scenes.js animates it by scroll progress.
 */
"use strict";
const A = require("./art.js").kit;
const { n, g, rect, path, circle, text, shadow, slab, svg, commit, crate, laptop, server } = A;

/* ------------------------------------------------------------------ new parts for this page */
// A playing card, upright. w is the width; height follows the real 63:88 ratio.
function card(x, y, w, o) {
  o = o || {};
  const h = w * 1.4, r = Math.max(1.5, w * 0.07), i = w * 0.08;
  let s;
  if (o.back) {
    s = rect(x, y, w, h, "c-back", r) + rect(x + i, y + i, w - 2 * i, h - 2 * i, "c-back-in", r * 0.6) +
      path("M" + n(x + w / 2) + " " + n(y + h * 0.3) + "L" + n(x + w * 0.72) + " " + n(y + h / 2) + "L" + n(x + w / 2) + " " + n(y + h * 0.7) + "L" + n(x + w * 0.28) + " " + n(y + h / 2) + "Z", "c-back-mark");
  } else {
    s = rect(x, y, w, h, "c-face" + (o.hl ? " c-face--hl" : ""), r) +
      rect(x + i, y + i * 1.2, w * 0.56, Math.max(1.6, h * 0.05), "c-txt c-txt--b", 0.8) +
      rect(x + i, y + h * 0.15, w - 2 * i, h * 0.38, "c-art", r * 0.5) +
      path("M" + n(x + i + 1.5) + " " + n(y + h * 0.5) + "L" + n(x + w * 0.36) + " " + n(y + h * 0.3) + "L" + n(x + w * 0.56) + " " + n(y + h * 0.43) + "L" + n(x + w * 0.7) + " " + n(y + h * 0.34) + "L" + n(x + w - i - 1.5) + " " + n(y + h * 0.5), "c-artline") +
      rect(x + i, y + h * 0.58, w - 2 * i, Math.max(1.2, h * 0.035), "c-txt", 0.6);
    if (w >= 16) for (let k = 0; k < 3; k++) s += rect(x + i, y + h * (0.68 + k * 0.08), (w - 2 * i) * (k === 2 ? 0.55 : 1), Math.max(1.1, h * 0.03), "c-txt", 0.6);
  }
  if (o.rot) s = g({ transform: "rotate(" + n(o.rot) + " " + n(x + w / 2) + " " + n(y + h) + ")" }, s);
  return o.key || o.op !== undefined ? g({ "data-k": o.key, class: o.cls || undefined, opacity: o.op }, s) : s;
}
// A fan of cards, rotating around a point below their bottom edge.
function fan(cx, by, w, count, spread, o) {
  o = o || {};
  let s = "";
  for (let i = 0; i < count; i++) {
    const a = count === 1 ? 0 : -spread / 2 + (spread * i) / (count - 1);
    s += g({ transform: "rotate(" + n(a) + " " + n(cx) + " " + n(by + w * 1.6) + ")" },
      g({ "data-k": o.keys ? o.keys + i : undefined, opacity: o.hide && o.hide(i) ? 0 : undefined, class: o.keys ? "k-origin-b" : undefined }, card(cx - w / 2, by - w * 1.4, w, { back: o.back, hl: o.hl === i })));
  }
  return s;
}
// A friend at the table, seen from the front: shoulders, neck, head, hair. No face.
const HAIR = {
  short: (cx, hy, r) => path("M" + n(cx - r) + " " + n(hy + 1) + "C" + n(cx - r) + " " + n(hy - r * 1.25) + " " + n(cx + r) + " " + n(hy - r * 1.25) + " " + n(cx + r) + " " + n(hy + 1) + "C" + n(cx + r * 0.5) + " " + n(hy - r * 0.45) + " " + n(cx - r * 0.5) + " " + n(hy - r * 0.45) + " " + n(cx - r) + " " + n(hy + 1) + "Z", "p-hair"),
  long: (cx, hy, r) => path("M" + n(cx - r - 2) + " " + n(hy + r * 1.1) + "C" + n(cx - r - 3) + " " + n(hy - r * 1.4) + " " + n(cx + r + 3) + " " + n(hy - r * 1.4) + " " + n(cx + r + 2) + " " + n(hy + r * 1.1) + "H" + n(cx + r - 3) + "C" + n(cx + r - 2) + " " + n(hy - r * 0.2) + " " + n(cx - r * 0.2) + " " + n(hy - r * 0.6) + " " + n(cx - r + 3) + " " + n(hy + r * 1.1) + "Z", "p-hair"),
  bun: (cx, hy, r) => circle(cx + r * 0.2, hy - r * 1.05, r * 0.45, "p-hair") + HAIR.short(cx, hy, r),
  cap: (cx, hy, r) => path("M" + n(cx - r - 1) + " " + n(hy - 1) + "C" + n(cx - r) + " " + n(hy - r * 1.3) + " " + n(cx + r) + " " + n(hy - r * 1.3) + " " + n(cx + r + 1) + " " + n(hy - 1) + "H" + n(cx + r + 9) + "V" + n(hy + 2) + "H" + n(cx - r - 1) + "Z", "p-cap")
};
function person(cx, by, o) {
  o = o || {};
  const s = o.s || 1, w = 30 * s, hr = 14 * s, hy = by - 66 * s;
  let b = path("M" + n(cx - w) + " " + n(by) + "V" + n(by - 26 * s) + "C" + n(cx - w) + " " + n(by - 44 * s) + " " + n(cx - w * 0.5) + " " + n(by - 48 * s) + " " + n(cx - 9 * s) + " " + n(by - 48 * s) + "H" + n(cx + 9 * s) + "C" + n(cx + w * 0.5) + " " + n(by - 48 * s) + " " + n(cx + w) + " " + n(by - 44 * s) + " " + n(cx + w) + " " + n(by - 26 * s) + "V" + n(by) + "Z", "p-shirt p-shirt--" + (o.shirt || 1));
  b += path("M" + n(cx - w * 0.78) + " " + n(by - 36 * s) + "C" + n(cx - w * 0.6) + " " + n(by - 45 * s) + " " + n(cx - w * 0.3) + " " + n(by - 46.5 * s) + " " + n(cx - 9 * s) + " " + n(by - 46.5 * s), "p-hl");
  b += rect(cx - 5 * s, by - 54 * s, 10 * s, 8 * s, "p-neck", 2);
  b += circle(cx, hy, hr, "p-head");
  b += (HAIR[o.hair || "short"])(cx, hy, hr);
  return b;
}
// From behind: the back of a head and shoulders, for the friend nearest to us.
function personBack(cx, by, s) {
  return path("M" + n(cx - 34 * s) + " " + n(by) + "V" + n(by - 22 * s) + "C" + n(cx - 34 * s) + " " + n(by - 40 * s) + " " + n(cx - 16 * s) + " " + n(by - 44 * s) + " " + n(cx - 8 * s) + " " + n(by - 44 * s) + "H" + n(cx + 8 * s) + "C" + n(cx + 16 * s) + " " + n(by - 44 * s) + " " + n(cx + 34 * s) + " " + n(by - 40 * s) + " " + n(cx + 34 * s) + " " + n(by - 22 * s) + "V" + n(by) + "Z", "p-shirt p-shirt--3") +
    circle(cx, by - 58 * s, 15 * s, "p-hair") + path("M" + n(cx - 9 * s) + " " + n(by - 47 * s) + "C" + n(cx - 4 * s) + " " + n(by - 44 * s) + " " + n(cx + 4 * s) + " " + n(by - 44 * s) + " " + n(cx + 9 * s) + " " + n(by - 47 * s), "p-hl");
}
// A rulebook lying flat: cover, page edges, spine band.
function book(x, y, w, h, o) {
  o = o || {};
  return slab(x, y, w, h, { top: 4, inset: 3, cls: "b-cover" + (o.tone ? " b-cover--" + o.tone : "") }) +
    rect(x + w - 10, y + 2, 7, h - 4, "b-pages", 1) +
    path("M" + n(x + w - 9) + " " + n(y + h * 0.36) + "H" + n(x + w - 4) + "M" + n(x + w - 9) + " " + n(y + h * 0.64) + "H" + n(x + w - 4), "b-pageline") +
    rect(x + 8, y + h / 2 - 1.5, w * 0.32, 3, "b-title", 1.5);
}
// A loose sheet of rules: a page with text lines.
function sheet(x, y, w, key, rot) {
  const h = w * 1.3;
  let s = rect(x, y, w, h, "b-sheet", 1.5);
  for (let k = 0; k < 5; k++) s += rect(x + 4, y + 6 + k * (h - 10) / 5, (w - 8) * (k === 4 ? 0.5 : 1), 1.6, "b-sheetline", 0.8);
  return g({ "data-k": key, class: "k-origin-c" }, g({ transform: "rotate(" + n(rot || 0) + " " + n(x + w / 2) + " " + n(y + h / 2) + ")" }, s));
}
// A speech bubble with a question mark.
function bubble(cx, by, key, label) {
  const w = label ? 22 + label.length * 9 : 34, h = 30;
  return g({ "data-k": key, class: "k-origin-b" },
    path("M" + n(cx - w / 2 + 6) + " " + n(by - h - 8) + "H" + n(cx + w / 2 - 6) + "Q" + n(cx + w / 2) + " " + n(by - h - 8) + " " + n(cx + w / 2) + " " + n(by - h - 2) + "V" + n(by - 14) + "Q" + n(cx + w / 2) + " " + n(by - 8) + " " + n(cx + w / 2 - 6) + " " + n(by - 8) + "H" + n(cx + 5) + "L" + n(cx - 3) + " " + n(by) + "L" + n(cx - 3) + " " + n(by - 8) + "H" + n(cx - w / 2 + 6) + "Q" + n(cx - w / 2) + " " + n(by - 8) + " " + n(cx - w / 2) + " " + n(by - 14) + "V" + n(by - h - 2) + "Q" + n(cx - w / 2) + " " + n(by - h - 8) + " " + n(cx - w / 2 + 6) + " " + n(by - h - 8) + "Z", "m-bubble") +
    text(cx, by - 17, label || "?", "lb-q", "middle"));
}
// A player's nameplate at a table: a pill with an avatar.
function plate(cx, cy, key, o) {
  o = o || {};
  const w = 76, h = 24;
  return g({ "data-k": key, class: "k-origin-c" },
    rect(cx - w / 2 - 4, cy - h / 2 - 4, w + 8, h + 8, "m-ring", (h + 8) / 2, { "data-k": key + "-ring", opacity: o.ring ? undefined : 0 }) +
    rect(cx - w / 2, cy - h / 2, w, h, o.empty ? "m-plate m-plate--empty" : "m-plate", h / 2) +
    (o.empty ? "" : circle(cx - w / 2 + 12, cy, 6.5, "m-avatar m-avatar--" + (o.tone || 1)) + rect(cx - w / 2 + 24, cy - 2, w - 38, 4, "m-plateline", 2)));
}
// A card table from above: a rounded felt top with a rim.
function tableTop(x, y, w, h) {
  return rect(x + 4, y + 6, w, h, "k-shadow", 26) + rect(x, y, w, h, "m-rim", 26) + rect(x + 9, y + 9, w - 18, h - 18, "m-felt", 19) +
    rect(x + 9, y + 9, w - 18, h - 18, "m-felt-edge", 19);
}
// A browser window frame: title bar and one tab.
function browser(x, y, w, h) {
  return rect(x, y, w, h, "k-win", 5) + path("M" + n(x) + " " + n(y + 22) + "H" + n(x + w), "k-edge-line") +
    path("M" + n(x + 6) + " " + n(y + 22) + "V" + n(y + 9) + "Q" + n(x + 6) + " " + n(y + 5) + " " + n(x + 10) + " " + n(y + 5) + "H" + n(x + 70) + "Q" + n(x + 74) + " " + n(y + 5) + " " + n(x + 75) + " " + n(y + 9) + "L" + n(x + 78) + " " + n(y + 22), "k-tab") +
    [0, 1, 2, 3, 4, 5].map((i) => rect(x + 16 + i * 8, y + 11, 6, 7, "m-code", 1.2)).join("") +
    rect(x + 92, y + 8, w - 120, 9, "k-field", 4.5);
}
// A deck box: a slab with a label strip and card tops showing above it.
function deckBox(x, y, o) {
  o = o || {};
  const w = 30, h = 42;
  return g({ "data-k": o.key, class: "k-origin-b", opacity: o.hide ? 0 : undefined },
    rect(x + 4, y - 5, w - 8, 6, "c-face", 1) + slab(x, y, w, h, { top: 4, inset: 3, cls: "m-box" + (o.hl ? " m-box--hl" : "") }) +
    rect(x + 5, y + 8, w - 10, 7, "m-boxlabel", 1.5) + rect(x + 5, y + h - 9, w * 0.4, 2.5, "c-txt", 1));
}
// A binder standing on a shelf: cover, ring spine, owner's avatar.
function binder(x, y, tone, key) {
  const w = 40, h = 76;
  return g({ "data-k": key, class: "k-origin-b" },
    slab(x, y, w, h, { top: 5, inset: 4, cls: "m-binder" }) + rect(x + 5, y + 6, 6, h - 12, "m-spine", 2) +
    [0.25, 0.5, 0.75].map((f) => circle(x + 8, y + h * f, 1.6, "m-ringhole")).join("") +
    rect(x + 16, y + 12, w - 22, 26, "m-pocket", 2) + rect(x + 16, y + 42, w - 22, 26, "m-pocket", 2) +
    circle(x + w - 6, y + h - 6, 7, "m-avatar m-avatar--" + tone));
}
const cub = (a, b, c, d) => ({ f: "M" + a + "C" + b + " " + c + " " + d, r: "M" + d + "C" + c + " " + b + " " + a });

/* ================================================================== 1. the itch */
const M1 = { table: { x: 40, y: 340, w: 520 }, pile: { x: 420, y: 334 } };
M1.books = [ // bottom to top: x offset, width, height, tone
  [0, 108, 16, 1], [6, 96, 14, 2], [-4, 104, 15, 3], [10, 88, 13, 1], [2, 100, 15, 2], [-2, 92, 14, 3], [8, 98, 16, 1], [4, 84, 13, 2]
];
function scene1() {
  const T = M1.table;
  let b = "";
  // friends behind the table
  b += g({ "data-k": "f0", class: "k-origin-b" }, person(112, 320, { shirt: 1, hair: "long", s: 1.4 }));
  b += g({ "data-k": "f1", class: "k-origin-b" }, person(226, 320, { shirt: 2, hair: "cap", s: 1.4 }));
  b += g({ "data-k": "f2", class: "k-origin-b" }, person(340, 320, { shirt: 4, hair: "bun", s: 1.4 }));
  // the table: a thick top, seen slightly from above, with legs
  b += shadow(300, 438, 500) + rect(T.x + 20, T.y + 18, 12, 84, "k-face", 2) + rect(T.x + T.w - 32, T.y + 18, 12, 84, "k-face", 2);
  b += slab(T.x, T.y, T.w, 18, { top: 28, inset: 24, cls: "m-tableface" }).replace('class="k-top"', 'class="m-tabletop"');
  // cards on the table, lying flat (squashed by the view)
  const flat = (cx, cy, rot, back, key) => g({ "data-k": key, class: "k-origin-c" }, g({ transform: "translate(" + n(cx) + " " + n(cy) + ") scale(1 0.42) rotate(" + n(rot) + ")" }, card(-11, -15, 22, { back })));
  b += flat(104, 326, -8, false, "t0") + flat(130, 330, 6, false, "t1") + flat(222, 325, 3, false, "t2") + flat(248, 331, -10, true, "t3") +
    flat(340, 327, 9, false, "t4") + flat(300, 334, -3, true, "t5") + flat(176, 335, 14, false, "t6");
  // the pile of rules, growing on the right end
  let y = M1.pile.y;
  M1.books.forEach((bk, i) => {
    y -= bk[2] + 4;
    b += g({ "data-k": "bk" + i, class: "k-origin-b" }, book(M1.pile.x + bk[0], y + 4, bk[1], bk[2], { tone: bk[3] }));
  });
  M1.top = y;
  b += sheet(M1.pile.x + 20, y - 18, 30, "sh0", -9) + sheet(M1.pile.x + 54, y - 22, 30, "sh1", 12) + sheet(M1.pile.x + 34, y - 36, 28, "sh2", -2);
  // the friend nearest to us, from behind
  b += g({ "data-k": "f3", class: "k-origin-b" }, personBack(206, 458, 1.4));
  // two questions
  b += bubble(126, 186, "q0") + bubble(354, 186, "q1");
  return svg("itch", "0 0 600 440", "Four friends around a table with cards in front of them, next to a pile of rulebooks and loose rule sheets that is taller than they are. Two of them have a question.", b);
}

/* ================================================================== 2. a table in the browser */
const M2 = {
  seats: [[236, 382], [80, 236], [236, 90], [392, 236]], // you (bottom), left, top, right: clockwise from you
  stack: [236, 222],
  forge: { x: 492, y: 202, w: 92, h: 40 }
};
M2.lanes = [
  cub("526 246", "526 340", "420 384", "278 384"),
  cub("540 202", "540 20", "100 8", "84 220"),
  cub("520 202", "520 120", "420 92", "278 92"),
  cub("492 224", "466 224", "450 236", "434 236")
];
M2.back = [
  cub("268 374", "400 360", "506 330", "506 246"),
  cub("94 220", "120 30", "520 40", "526 202"),
  cub("268 100", "400 104", "500 130", "506 202"),
  cub("432 244", "452 248", "470 236", "492 236")
];
M2.stackPos = (i) => [M2.stack[0] - 16 + i * 7, M2.stack[1] - 22 - i * 9];
M2.plays = [ // which seat plays the card on the stack, and where its hand sits
  { seat: 0, from: [236, 336] }, { seat: 1, from: [130, 236] }, { seat: 2, from: [236, 128] }
];
function scene2() {
  let b = browser(16, 26, 444, 400) + tableTop(40, 62, 392, 352);
  b += text(236, 300, "the stack", "lb lb--s m-stacklabel", "middle", { "data-k": "stacklbl" });
  // hands: yours face up at the bottom, the others' backs
  b += g({ "data-k": "h0" }, fan(236, 352, 26, 5, 30, { keys: "hc", hide: (i) => i === 2, hl: undefined }));
  b += g({ transform: "rotate(90 118 236)" }, fan(118, 252, 22, 4, 34, { back: true }));
  b += g({ transform: "rotate(180 236 124)" }, fan(236, 140, 22, 4, 34, { back: true }));
  b += g({ transform: "rotate(-90 354 236)" }, fan(354, 252, 22, 4, 34, { back: true }));
  // seats
  M2.seats.forEach((s, i) => { b += plate(s[0], s[1], "seat" + i, { tone: i + 1, ring: i === 1 }); });
  // the engine
  const F = M2.forge;
  b += shadow(F.x + F.w / 2, F.y + F.h + 6, F.w + 16) + server(F.x, F.y, F.w, F.h, { bays: 2 }) + text(F.x + F.w / 2, F.y + F.h + 30, "Forge", "lb", "middle");
  b += M2.lanes.map((l, i) => path(l.f, "k-route", { "data-k": "lane" + i })).join("") + M2.back.map((l, i) => path(l.f, "k-none", { "data-k": "back" + i })).join("");
  // the stack: three cards, the last one played on top
  M2.plays.forEach((pl, i) => {
    const [x, y] = M2.stackPos(i);
    b += g({ "data-k": "st" + i, class: "k-origin-c" }, shadow(x + 15, y + 46, 34) + card(x, y, 30, { hl: i === 2 }));
  });
  b += g({ "data-k": "auto", opacity: 0 }, text(392, 276, "auto", "lb-m", "middle"));
  b += '<g class="pk-layer" data-k="pk"></g>';
  b += g({ class: "pk-still" }, A.packetAt(M2.lanes[1].f, 0.55) + A.packetAt(M2.back[3].f, 0.5, "pk--ink"));
  return svg("table", "0 0 600 440", "A card table in a browser window, seen from above, with four seats. Three cards sit on the stack in the middle. A box labelled Forge, the rules engine, sends a question to each seat in turn and gets an answer back.", b);
}

/* ================================================================== 3. four players, one game */
const M3 = {
  screens: [[22, 34], [410, 34], [22, 262], [410, 262]], sw: 168, sh: 132,
  server: { x: 236, y: 184, w: 128, h: 46 },
  bar: { x: 186, y: 402, w: 228 }
};
M3.lanes = [cub("246 184", "246 130", "220 100", "192 100"), cub("354 184", "354 130", "380 100", "408 100"), cub("246 230", "246 290", "220 328", "192 328"), cub("354 230", "354 290", "380 328", "408 328")];
function screen(x, y, i, o) {
  const w = M3.sw, h = M3.sh;
  let b = browser(x, y, w, h).replace(/<rect[^>]*class="m-code"[^>]*\/>/g, "");
  let c = "";
  // the other three: face-down backs with a count
  for (let k = 0; k < 3; k++) {
    const ox = x + 14 + k * 52;
    c += card(ox, y + 32, 12, { back: true }) + card(ox + 6, y + 32, 12, { back: true }) + text(ox + 28, y + 46, String([5, 4, 6][(k + i) % 3]), "lb-count");
  }
  // the battlefield in the middle
  for (let k = 0; k < 5; k++) c += card(x + 22 + k * 26, y + 60, 15, { key: o.key + "-bf" + k });
  // your own hand, face up
  for (let k = 0; k < 4; k++) c += card(x + 40 + k * 22, y + h - 34, 17, { hl: i === 0 && k === 1 });
  b += g({ "data-k": o.key + "-c" }, c);
  b += g({ "data-k": o.key + "-re", opacity: 0, class: "k-origin-c" }, path("M" + n(x + w / 2 + 9) + " " + n(y + h / 2 + 8) + "A10 10 0 1 1 " + n(x + w / 2 + 10) + " " + n(y + h / 2 - 2), "m-reload") + path("M" + n(x + w / 2 + 6) + " " + n(y + h / 2 - 4) + "L" + n(x + w / 2 + 11) + " " + n(y + h / 2 - 2) + "L" + n(x + w / 2 + 13) + " " + n(y + h / 2 - 7), "m-reload"));
  return g({ "data-k": o.key }, b);
}
function scene3() {
  let b = M3.lanes.map((l, i) => path(l.f, "k-route", { "data-k": "lane" + i })).join("");
  M3.screens.forEach((s, i) => { b += screen(s[0], s[1], i, { key: "scr" + i }); });
  const S = M3.server;
  b += shadow(S.x + S.w / 2, S.y + S.h + 6, S.w + 18) + server(S.x, S.y, S.w, S.h, { bays: 3 });
  // the server holds all four hands
  for (let k = 0; k < 4; k++) b += fan(S.x + 18 + k * 31, S.y - 6, 11, 3, 26, { back: true });
  b += text(S.x + S.w / 2, S.y + S.h + 30, "the server holds the game", "lb lb--s", "middle");
  // replay: a timeline of turns and a marker that scrubs back
  const B = M3.bar;
  b += g({ "data-k": "bar" }, rect(B.x, B.y - 2, B.w, 4, "m-track", 2) + Array.from({ length: 9 }, (_, k) => rect(B.x + k * (B.w / 8) - 1, B.y - 6, 2, 12, "m-tick", 1)).join("") +
    g({ "data-k": "mark" }, rect(B.x + B.w - 6, B.y - 10, 12, 20, "m-mark", 3)) + text(B.x - 12, B.y + 5, "replay", "lb lb--s", "end"));
  b += '<g class="pk-layer" data-k="pk"></g>';
  b += g({ class: "pk-still" }, A.packetAt(M3.lanes[0].f, 0.5) + A.packetAt(M3.lanes[3].f, 0.4));
  return svg("hands", "0 0 600 440", "The server in the middle holds all four hands. Each of the four players' screens shows their own hand face up, the other hands only as face-down backs with a count, and the shared battlefield. A replay timeline runs underneath.", b);
}

/* ================================================================== 4. decks */
const M4 = { unit: { x: 26, y: 36, w: 280, h: 352 }, shelves: [140, 250, 372], table: { x: 348, y: 140, w: 204, h: 180 } };
M4.boxes = [];
[0, 1].forEach((r) => { for (let k = 0; k < 7; k++) M4.boxes.push([M4.unit.x + 16 + k * 36, M4.shelves[r] - 42]); });
M4.pick = 9; // the deck that goes to the table
M4.seat = [M4.table.x + 6, M4.table.y + M4.table.h / 2];
function scene4() {
  const U = M4.unit;
  let b = "";
  // the shelving unit
  b += shadow(U.x + U.w / 2, U.y + U.h + 4, U.w + 20) + rect(U.x, U.y, U.w, U.h, "m-unitback", 3);
  b += rect(U.x - 6, U.y, 8, U.h, "k-face", 2) + rect(U.x + U.w - 2, U.y, 8, U.h, "k-face", 2) + slab(U.x - 8, U.y, U.w + 16, 10, { top: 6 });
  M4.shelves.forEach((y) => { b += slab(U.x - 2, y, U.w + 4, 8, { top: 5, inset: 3 }); });
  b += text(U.x + U.w / 2, U.y - 18, "Tutor", "lb", "middle");
  // deck boxes on the two top shelves
  M4.boxes.forEach((p, i) => { b += i === M4.pick ? g({ "data-k": "gap" }, "") : deckBox(p[0], p[1], { key: "bx" + i }); });
  // the playgroup shelf: four friends' binders
  for (let k = 0; k < 4; k++) b += binder(U.x + 22 + k * 50, M4.shelves[2] - 76, k + 1, "bd" + k);
  b += text(U.x + U.w - 14, M4.shelves[1] + 34, "playgroup", "lb lb--s", "end");
  // the Rules of 99 table, one seat waiting
  const T = M4.table;
  b += tableTop(T.x, T.y, T.w, T.h);
  b += plate(T.x + T.w / 2, T.y - 4, "s1", { tone: 2 }) + plate(T.x + T.w - 6, T.y + T.h / 2, "s2", { tone: 3 }) + plate(T.x + T.w / 2, T.y + T.h + 4, "s3", { tone: 4 }) +
    plate(M4.seat[0], M4.seat[1], "s0", { empty: false, tone: 1, ring: true });
  b += text(T.x + T.w / 2, T.y + T.h + 46, "Rules of 99", "lb", "middle");
  // the travelling deck, drawn where it lands: next to the seat on the table
  b += g({ "data-k": "deck", class: "k-origin-b" }, deckBox(M4.seat[0] + 46, M4.seat[1] - 22, { hl: true }));
  M4.route = "M" + (M4.boxes[M4.pick][0] + 15) + " " + (M4.boxes[M4.pick][1] - 10) + "C" + 330 + " " + 40 + " " + 420 + " " + 120 + " " + (M4.seat[0] + 61) + " " + (M4.seat[1] - 2);
  b += path(M4.route, "k-route k-route--dash", { "data-k": "route" });
  return svg("decks", "0 0 600 440", "Tutor as a shelving unit: two shelves of deck boxes and a playgroup shelf with four friends' binders. One deck box has moved from the shelf to an empty seat at the Rules of 99 table.", b);
}

/* ================================================================== 5. plain-words search */
const M5 = {
  tokens: [{ x: 60, w: 62, q: "c:g", l: "green" }, { x: 140, w: 118, q: "t:creature", l: "a creature" }, { x: 276, w: 84, q: "o:draw", l: "draws cards" }],
  ty: 160, sf: { x: 470, y: 144, w: 100, h: 42 },
  fans: [{ cx: 168, n: 3, l: "stricter" }, { cx: 420, n: 6, l: "broader" }]
};
M5.q = "M362 175C410 175 430 168 470 168";
M5.back = "M470 178C430 186 410 196 362 194";
function scene5() {
  let b = "";
  // the request in plain words
  b += g({ "data-k": "bub", class: "k-origin-b" },
    path("M54 28H418Q430 28 430 40V82Q430 94 418 94H92L72 112L74 94H54Q42 94 42 82V40Q42 28 54 28Z", "m-bubble") +
    g({ "data-k": "words" }, text(236, 68, "green creatures that draw cards", "lb-say", "middle")));
  // the query it becomes, piece by piece, with what each piece means
  M5.tokens.forEach((t, i) => {
    b += g({ "data-k": "tk" + i, class: "k-origin-c" }, rect(t.x, M5.ty - 18, t.w, 32, "m-token", 6) + text(t.x + t.w / 2, M5.ty + 3, t.q, "lb-q-m", "middle"));
    b += g({ "data-k": "tl" + i }, text(t.x + t.w / 2, M5.ty + 38, t.l, "lb lb--s", "middle"));
  });
  // checked against Scryfall first
  const S = M5.sf;
  b += path(M5.q, "k-route", { "data-k": "rq" }) + path(M5.back, "k-route k-route--faint", { "data-k": "rb" });
  b += shadow(S.x + S.w / 2, S.y + S.h + 6, S.w + 16) + server(S.x, S.y, S.w, S.h, { bays: 2 }) + text(S.x + S.w / 2, S.y + S.h + 30, "Scryfall", "lb", "middle");
  b += g({ "data-k": "tick", class: "k-origin-c" }, circle(S.x + S.w - 2, S.y - 4, 11, "m-tickbg") + path("M" + (S.x + S.w - 7) + " " + (S.y - 4) + "l3.5 3.5 6.5 -7", "m-tickmark"));
  // two readings, each with its cards
  M5.fans.forEach((f, j) => {
    b += g({ "data-k": "fan" + j },
      g({}, fan(f.cx, 392, 38, 6, 56, { keys: "fc" + j + "-", hide: (i) => j === 0 && (i === 0 || i > 3) ? true : false, hl: undefined })) +
      text(f.cx, 430, f.l, "lb", "middle"));
  });
  b += '<g class="pk-layer" data-k="pk"></g>';
  return svg("search", "0 0 600 440", "A request in plain words, 'green creatures that draw cards', turns into a Scryfall query in three pieces, each with what it means. The query is checked against Scryfall, then comes back as two readings, a stricter one with fewer cards and a broader one with more.", b);
}

/* ================================================================== 6. building for friends */
const M6 = {
  table: { x: 30, y: 196, w: 170, h: 130 },
  issue: { x: 238, y: 86, w: 134, h: 64 },
  git: { y: 112, x0: 420, x1: 568 },
  lap: { cx: 470, by: 372, w: 132 },
  engine: { x: 262, y: 318, w: 104, h: 38 }
};
M6.r = [
  "M160 236C186 180 200 118 236 118",        // report → issue
  "M374 118C396 118 404 112 420 112",        // issue → commit
  "M568 112C600 120 596 250 540 292",        // commit → homelab
  "M404 332C330 400 200 380 150 330"         // homelab → the table
];
function scene6() {
  let b = M6.r.map((d, i) => path(d, "k-route", { "data-k": "r" + i })).join("");
  // the night sky: a moon that crosses, dropping new cards in
  b += g({ "data-k": "moon" }, circle(330, 30, 13, "m-moon") + circle(336, 25, 11, "m-sky"));
  b += g({ "data-k": "parcel", class: "k-origin-c" }, slab(478, 70, 26, 16, { top: 4, inset: 3, cls: "m-box" }) + rect(489, 66, 4, 20, "m-strap", 1));
  // the table, one seat with a flag
  const T = M6.table;
  b += tableTop(T.x, T.y, T.w, T.h) + plate(T.x + T.w / 2, T.y - 2, "p1", { tone: 2 }) + plate(T.x + T.w / 2, T.y + T.h + 2, "p0", { tone: 1, ring: true });
  b += fan(T.x + T.w / 2, T.y + T.h - 30, 18, 4, 28) + card(T.x + 54, T.y + 40, 20, { back: true }) + card(T.x + 96, T.y + 44, 20, {});
  b += g({ "data-k": "flag", class: "k-origin-b" }, rect(T.x + T.w / 2 + 44, T.y + T.h - 22, 2.5, 30, "m-pole", 1) + path("M" + (T.x + T.w / 2 + 46.5) + " " + (T.y + T.h - 22) + "h18l-5 6 5 6h-18z", "m-flag"));
  // the report becomes an issue
  const I = M6.issue;
  b += g({ "data-k": "issue", class: "k-origin-c" }, slab(I.x, I.y, I.w, I.h, { top: 6 }) + circle(I.x + 20, I.y + 22, 8, "m-issue") + circle(I.x + 20, I.y + 22, 2.4, "m-issue-dot") +
    rect(I.x + 36, I.y + 18, 76, 5, "c-txt c-txt--b", 2.5) + rect(I.x + 14, I.y + 40, I.w - 28, 4, "k-txt", 2) + rect(I.x + 14, I.y + 50, (I.w - 28) * 0.6, 4, "k-txt", 2));
  b += text(I.x + I.w / 2, I.y - 16, "issue", "lb lb--s", "middle");
  // a commit, a container, the homelab
  const G = M6.git;
  b += path("M" + G.x0 + " " + G.y + "H" + G.x1, "k-git") + commit(440, G.y, 5, "k-commit-old") + commit(476, G.y, 5, "k-commit-old");
  b += g({ "data-k": "fix", class: "k-origin-c" }, commit(514, G.y, 8, "k-commit"));
  b += text(514, G.y + 30, "the fix", "lb lb--s", "middle");
  const L = laptop(M6.lap.cx, M6.lap.by, M6.lap.w);
  b += L.svg + g({ "data-k": "img", class: "k-origin-b" }, crate(M6.lap.cx - 16, L.screen.y + L.screen.h - 36, 32, 26));
  b += text(M6.lap.cx, M6.lap.by + 34, "homelab", "lb lb--s", "middle");
  // the engine only moves when I move it
  const E = M6.engine;
  b += shadow(E.x + E.w / 2, E.y + E.h + 6, E.w + 14) + server(E.x, E.y, E.w, E.h, { bays: 2 }) +
    g({ "data-k": "lock" }, rect(E.x + E.w - 18, E.y - 10, 18, 14, "m-lock", 2.5) + path("M" + (E.x + E.w - 14) + " " + (E.y - 10) + "V" + (E.y - 15) + "a5 5 0 0 1 10 0V" + (E.y - 10), "m-shackle")) +
    text(E.x + E.w / 2, E.y + E.h + 28, "engine, pinned", "lb lb--s", "middle");
  b += '<g class="pk-layer" data-k="pk"></g>';
  b += g({ class: "pk-still" }, A.packetAt(M6.r[3], 0.55));
  return svg("friends", "0 0 600 440", "A loop around the table: a player flags a bug at their seat, the report becomes a GitHub issue, then a fix commit and a container on the homelab, and it comes back to the same seat. Overnight a moon crosses and drops new card data in, while a padlock keeps the engine pinned.", b);
}

module.exports = { scenes: { itch: scene1, table: scene2, hands: scene3, decks: scene4, search: scene5, friends: scene6 }, M1, M2, M3, M4, M5, M6, card };
