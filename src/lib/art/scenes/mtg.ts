/**
 * The MTG suite case study in six scenes, drawn with the same kit as the platform page.
 * Each is drawn in a meaningful still state; src/lib/motion/scenes/mtg.ts animates them.
 */
import { commit, crate, laptop, packetAt, server, shadow, slab } from "../kit";
import {
  binder,
  book,
  browser,
  bubble,
  card,
  deckBox,
  fan,
  person,
  personBack,
  plate,
  sheet,
  tableTop,
} from "../kit-tabletop";
import { circle, g, n, path, rect, svg, text } from "../svg";
import { M1, M2, M3, M4, M5, M6 } from "./mtg.layout";

/* ------------------------------------------------------------ 1. the itch */
export function itch(): string {
  const T = M1.table;
  let b = "";
  // friends behind the table
  b += g({ "data-k": "f0", class: "k-origin-b" }, person(112, 320, { shirt: 1, hair: "long", s: 1.4 }));
  b += g({ "data-k": "f1", class: "k-origin-b" }, person(226, 320, { shirt: 2, hair: "cap", s: 1.4 }));
  b += g({ "data-k": "f2", class: "k-origin-b" }, person(340, 320, { shirt: 4, hair: "bun", s: 1.4 }));
  // the table: a thick top, seen slightly from above, with legs
  b +=
    shadow(300, 438, 500) +
    rect(T.x + 20, T.y + 18, 12, 84, "k-face", 2) +
    rect(T.x + T.w - 32, T.y + 18, 12, 84, "k-face", 2);
  b += slab(T.x, T.y, T.w, 18, { top: 28, inset: 24, cls: "m-tableface" }).replace(
    'class="k-top"',
    'class="m-tabletop"',
  );
  // cards on the table, lying flat (squashed by the view)
  const flat = (cx: number, cy: number, rot: number, back: boolean, key: string): string =>
    g(
      { "data-k": key, class: "k-origin-c" },
      g(
        { transform: `translate(${n(cx)} ${n(cy)}) scale(1 0.42) rotate(${n(rot)})` },
        card(-11, -15, 22, { back }),
      ),
    );
  b +=
    flat(104, 326, -8, false, "t0") +
    flat(130, 330, 6, false, "t1") +
    flat(222, 325, 3, false, "t2") +
    flat(248, 331, -10, true, "t3") +
    flat(340, 327, 9, false, "t4") +
    flat(300, 334, -3, true, "t5") +
    flat(176, 335, 14, false, "t6");
  // the pile of rules, growing on the right end
  let y = M1.pile.y;
  M1.books.forEach(([dx, w, h, tone], i) => {
    y -= h + 4;
    b += g({ "data-k": `bk${i}`, class: "k-origin-b" }, book(M1.pile.x + dx, y + 4, w, h, tone));
  });
  b +=
    sheet(M1.pile.x + 20, y - 18, 30, "sh0", -9) +
    sheet(M1.pile.x + 54, y - 22, 30, "sh1", 12) +
    sheet(M1.pile.x + 34, y - 36, 28, "sh2", -2);
  // the friend nearest to us, from behind
  b += g({ "data-k": "f3", class: "k-origin-b" }, personBack(206, 458, 1.4));
  // two questions
  b += bubble(126, 186, "q0") + bubble(354, 186, "q1");
  return svg(
    "itch",
    "0 0 600 440",
    "Four friends around a table with cards in front of them, next to a pile of rulebooks and loose rule sheets that is taller than they are. Two of them have a question.",
    b,
  );
}

/* ------------------------------------------------------------ 2. a table in the browser */
export function table(): string {
  let b = browser(16, 26, 444, 400) + tableTop(40, 62, 392, 352);
  b += text(236, 300, "the stack", "lb lb--s m-stacklabel", "middle", { "data-k": "stacklbl" });
  // hands: yours face up at the bottom, the others' backs
  b += g({ "data-k": "h0" }, fan(236, 352, 26, 5, 30, { keys: "hc", hide: (i) => i === 2 }));
  b += g({ transform: "rotate(90 118 236)" }, fan(118, 252, 22, 4, 34, { back: true }));
  b += g({ transform: "rotate(180 236 124)" }, fan(236, 140, 22, 4, 34, { back: true }));
  b += g({ transform: "rotate(-90 354 236)" }, fan(354, 252, 22, 4, 34, { back: true }));
  // seats
  M2.seats.forEach(([x, y], i) => {
    b += plate(x, y, `seat${i}`, { tone: i + 1, ring: i === 1 });
  });
  // the engine
  const F = M2.engine;
  b +=
    shadow(F.x + F.w / 2, F.y + F.h + 6, F.w + 16) +
    server(F.x, F.y, F.w, F.h, { bays: 2 }) +
    text(F.x + F.w / 2, F.y + F.h + 30, "the engine", "lb", "middle");
  b +=
    M2.lanes.map((l, i) => path(l.f, "k-route", { "data-k": `lane${i}` })).join("") +
    M2.back.map((l, i) => path(l.f, "k-none", { "data-k": `back${i}` })).join("");
  // the stack: three cards, the last one played on top
  M2.playedFrom.forEach((_, i) => {
    const [x, y] = M2.stackPos(i);
    b += g(
      { "data-k": `st${i}`, class: "k-origin-c" },
      shadow(x + 15, y + 46, 34) + card(x, y, 30, { hl: i === 2 }),
    );
  });
  b += g({ "data-k": "auto", opacity: 0 }, text(392, 276, "auto", "lb-m", "middle"));
  b += '<g class="pk-layer" data-k="pk"></g>';
  b += g({ class: "pk-still" }, packetAt(M2.lanes[1]!.f, 0.55) + packetAt(M2.back[3]!.f, 0.5, "pk--ink"));
  return svg(
    "table",
    "0 0 600 440",
    "A card table in a browser window, seen from above, with four seats. Three cards sit on the stack in the middle. A box labelled the engine sends a question to each seat in turn and gets an answer back.",
    b,
  );
}

/* ------------------------------------------------------------ 3. four players, one game */
function screen(x: number, y: number, i: number, key: string): string {
  const w = M3.sw,
    h = M3.sh;
  let b = browser(x, y, w, h, { favicons: false });
  let c = "";
  // the other three: face-down backs with a count
  for (let k = 0; k < 3; k++) {
    const ox = x + 14 + k * 52;
    c +=
      card(ox, y + 32, 12, { back: true }) +
      card(ox + 6, y + 32, 12, { back: true }) +
      text(ox + 28, y + 46, String([5, 4, 6][(k + i) % 3]), "lb-count");
  }
  // the battlefield in the middle
  for (let k = 0; k < 5; k++) c += card(x + 22 + k * 26, y + 60, 15, { key: `${key}-bf${k}` });
  // your own hand, face up
  for (let k = 0; k < 4; k++) c += card(x + 40 + k * 22, y + h - 34, 17, { hl: i === 0 && k === 1 });
  b += g({ "data-k": `${key}-c` }, c);
  const mx = x + w / 2,
    my = y + h / 2;
  b += g(
    { "data-k": `${key}-re`, opacity: 0, class: "k-origin-c" },
    path(`M${n(mx + 9)} ${n(my + 8)}A10 10 0 1 1 ${n(mx + 10)} ${n(my - 2)}`, "m-reload") +
      path(`M${n(mx + 6)} ${n(my - 4)}L${n(mx + 11)} ${n(my - 2)}L${n(mx + 13)} ${n(my - 7)}`, "m-reload"),
  );
  return g({ "data-k": key }, b);
}

export function hands(): string {
  let b = M3.lanes.map((l, i) => path(l.f, "k-route", { "data-k": `lane${i}` })).join("");
  M3.screens.forEach(([x, y], i) => {
    b += screen(x, y, i, `scr${i}`);
  });
  const S = M3.server;
  b += shadow(S.x + S.w / 2, S.y + S.h + 6, S.w + 18) + server(S.x, S.y, S.w, S.h, { bays: 3 });
  // the server holds all four hands
  for (let k = 0; k < 4; k++) b += fan(S.x + 18 + k * 31, S.y - 6, 11, 3, 26, { back: true });
  b += text(S.x + S.w / 2, S.y + S.h + 30, "the server holds the game", "lb lb--s", "middle");
  // replay: a timeline of turns and a marker that scrubs back
  const B = M3.bar;
  b += g(
    { "data-k": "bar" },
    rect(B.x, B.y - 2, B.w, 4, "m-track", 2) +
      Array.from({ length: 9 }, (_, k) => rect(B.x + k * (B.w / 8) - 1, B.y - 6, 2, 12, "m-tick", 1)).join(
        "",
      ) +
      g({ "data-k": "mark" }, rect(B.x + B.w - 6, B.y - 10, 12, 20, "m-mark", 3)) +
      text(B.x - 12, B.y + 5, "replay", "lb lb--s", "end"),
  );
  b += '<g class="pk-layer" data-k="pk"></g>';
  b += g({ class: "pk-still" }, packetAt(M3.lanes[0]!.f, 0.5) + packetAt(M3.lanes[3]!.f, 0.4));
  return svg(
    "hands",
    "0 0 600 440",
    "The server in the middle holds all four hands. Each of the four players' screens shows their own hand face up, the other hands only as face-down backs with a count, and the shared battlefield. A replay timeline runs underneath.",
    b,
  );
}

/* ------------------------------------------------------------ 4. decks */
export function decks(): string {
  const U = M4.unit;
  let b = "";
  // the shelving unit
  b += shadow(U.x + U.w / 2, U.y + U.h + 4, U.w + 20) + rect(U.x, U.y, U.w, U.h, "m-unitback", 3);
  b +=
    rect(U.x - 6, U.y, 8, U.h, "k-face", 2) +
    rect(U.x + U.w - 2, U.y, 8, U.h, "k-face", 2) +
    slab(U.x - 8, U.y, U.w + 16, 10, { top: 6 });
  for (const y of M4.shelves) b += slab(U.x - 2, y, U.w + 4, 8, { top: 5, inset: 3 });
  b += text(U.x + U.w / 2, U.y - 18, "Tutor", "lb", "middle");
  // deck boxes on the two top shelves
  M4.boxes.forEach(([x, y], i) => {
    b += i === M4.pick ? g({ "data-k": "gap" }, "") : deckBox(x, y, { key: `bx${i}` });
  });
  // the playgroup shelf: four friends' binders
  for (let k = 0; k < 4; k++) b += binder(U.x + 22 + k * 50, M4.shelves[2]! - 76, k + 1, `bd${k}`);
  b += text(U.x + U.w - 14, M4.shelves[1]! + 34, "playgroup", "lb lb--s", "end");
  // the Rules of 99 table, one seat waiting
  const T = M4.table;
  b += tableTop(T.x, T.y, T.w, T.h);
  b +=
    plate(T.x + T.w / 2, T.y - 4, "s1", { tone: 2 }) +
    plate(T.x + T.w - 6, T.y + T.h / 2, "s2", { tone: 3 }) +
    plate(T.x + T.w / 2, T.y + T.h + 4, "s3", { tone: 4 }) +
    plate(M4.seat[0], M4.seat[1], "s0", { empty: false, tone: 1, ring: true });
  b += text(T.x + T.w / 2, T.y + T.h + 46, "Rules of 99", "lb", "middle");
  // the travelling deck, drawn where it lands: next to the seat on the table
  b += g(
    { "data-k": "deck", class: "k-origin-b" },
    deckBox(M4.deckLanding[0], M4.deckLanding[1], { hl: true }),
  );
  b += path(M4.route, "k-route k-route--dash", { "data-k": "route" });
  return svg(
    "decks",
    "0 0 600 440",
    "Tutor as a shelving unit: two shelves of deck boxes and a playgroup shelf with four friends' binders. One deck box has moved from the shelf to an empty seat at the Rules of 99 table.",
    b,
  );
}

/* ------------------------------------------------------------ 5. plain-words search */
export function search(): string {
  let b = "";
  // the request in plain words
  b += g(
    { "data-k": "bub", class: "k-origin-b" },
    path(
      "M54 28H418Q430 28 430 40V82Q430 94 418 94H92L72 112L74 94H54Q42 94 42 82V40Q42 28 54 28Z",
      "m-bubble",
    ) + g({ "data-k": "words" }, text(236, 68, "green creatures that draw cards", "lb-say", "middle")),
  );
  // the query it becomes, piece by piece, with what each piece means
  M5.tokens.forEach((t, i) => {
    b += g(
      { "data-k": `tk${i}`, class: "k-origin-c" },
      rect(t.x, M5.ty - 18, t.w, 32, "m-token", 6) + text(t.x + t.w / 2, M5.ty + 3, t.q, "lb-q-m", "middle"),
    );
    b += g({ "data-k": `tl${i}` }, text(t.x + t.w / 2, M5.ty + 38, t.l, "lb lb--s", "middle"));
  });
  // checked against Scryfall first
  const S = M5.scryfall;
  b +=
    path(M5.q, "k-route", { "data-k": "rq" }) + path(M5.back, "k-route k-route--faint", { "data-k": "rb" });
  b +=
    shadow(S.x + S.w / 2, S.y + S.h + 6, S.w + 16) +
    server(S.x, S.y, S.w, S.h, { bays: 2 }) +
    text(S.x + S.w / 2, S.y + S.h + 30, "Scryfall", "lb", "middle");
  b += g(
    { "data-k": "tick", class: "k-origin-c" },
    circle(S.x + S.w - 2, S.y - 4, 11, "m-tickbg") +
      path(`M${S.x + S.w - 7} ${S.y - 4}l3.5 3.5 6.5 -7`, "m-tickmark"),
  );
  // two readings, each with its cards: the stricter one shows fewer
  M5.fans.forEach((f, j) => {
    b += g(
      { "data-k": `fan${j}` },
      g({}, fan(f.cx, 392, 38, 6, 56, { keys: `fc${j}-`, hide: (i) => j === 0 && (i === 0 || i > 3) })) +
        text(f.cx, 430, f.l, "lb", "middle"),
    );
  });
  b += '<g class="pk-layer" data-k="pk"></g>';
  return svg(
    "search",
    "0 0 600 440",
    "A request in plain words, 'green creatures that draw cards', turns into a Scryfall query in three pieces, each with what it means. The query is checked against Scryfall, then comes back as two readings, a stricter one with fewer cards and a broader one with more.",
    b,
  );
}

/* ------------------------------------------------------------ 6. building for friends */
export function friends(): string {
  let b = M6.routes.map((d, i) => path(d, "k-route", { "data-k": `r${i}` })).join("");
  // the night sky: a moon that crosses, dropping new cards in
  b += g({ "data-k": "moon" }, circle(330, 30, 13, "m-moon") + circle(336, 25, 11, "m-sky"));
  b += g(
    { "data-k": "parcel", class: "k-origin-c" },
    slab(478, 70, 26, 16, { top: 4, inset: 3, cls: "m-box" }) + rect(489, 66, 4, 20, "m-strap", 1),
  );
  // the table, one seat with a flag
  const T = M6.table;
  b +=
    tableTop(T.x, T.y, T.w, T.h) +
    plate(T.x + T.w / 2, T.y - 2, "p1", { tone: 2 }) +
    plate(T.x + T.w / 2, T.y + T.h + 2, "p0", { tone: 1, ring: true });
  b +=
    fan(T.x + T.w / 2, T.y + T.h - 30, 18, 4, 28) +
    card(T.x + 54, T.y + 40, 20, { back: true }) +
    card(T.x + 96, T.y + 44, 20, {});
  b += g(
    { "data-k": "flag", class: "k-origin-b" },
    rect(T.x + T.w / 2 + 44, T.y + T.h - 22, 2.5, 30, "m-pole", 1) +
      path(`M${T.x + T.w / 2 + 46.5} ${T.y + T.h - 22}h18l-5 6 5 6h-18z`, "m-flag"),
  );
  // the report becomes an issue
  const I = M6.issue;
  b += g(
    { "data-k": "issue", class: "k-origin-c" },
    slab(I.x, I.y, I.w, I.h, { top: 6 }) +
      circle(I.x + 20, I.y + 22, 8, "m-issue") +
      circle(I.x + 20, I.y + 22, 2.4, "m-issue-dot") +
      rect(I.x + 36, I.y + 18, 76, 5, "c-txt c-txt--b", 2.5) +
      rect(I.x + 14, I.y + 40, I.w - 28, 4, "k-txt", 2) +
      rect(I.x + 14, I.y + 50, (I.w - 28) * 0.6, 4, "k-txt", 2),
  );
  b += text(I.x + I.w / 2, I.y - 16, "issue", "lb lb--s", "middle");
  // a commit, a container, the homelab
  const G = M6.git;
  b +=
    path(`M${G.x0} ${G.y}H${G.x1}`, "k-git") +
    commit(440, G.y, 5, "k-commit-old") +
    commit(476, G.y, 5, "k-commit-old");
  b += g({ "data-k": "fix", class: "k-origin-c" }, commit(514, G.y, 8, "k-commit"));
  b += text(514, G.y + 30, "the fix", "lb lb--s", "middle");
  const L = laptop(M6.lap.cx, M6.lap.by, M6.lap.w);
  b +=
    L.svg +
    g({ "data-k": "img", class: "k-origin-b" }, crate(M6.lap.cx - 16, L.screen.y + L.screen.h - 36, 32, 26));
  b += text(M6.lap.cx, M6.lap.by + 34, "homelab", "lb lb--s", "middle");
  // the engine only moves when I move it
  const E = M6.engine;
  b +=
    shadow(E.x + E.w / 2, E.y + E.h + 6, E.w + 14) +
    server(E.x, E.y, E.w, E.h, { bays: 2 }) +
    g(
      { "data-k": "lock" },
      rect(E.x + E.w - 18, E.y - 10, 18, 14, "m-lock", 2.5) +
        path(`M${E.x + E.w - 14} ${E.y - 10}V${E.y - 15}a5 5 0 0 1 10 0V${E.y - 10}`, "m-shackle"),
    ) +
    text(E.x + E.w / 2, E.y + E.h + 28, "engine, pinned", "lb lb--s", "middle");
  b += '<g class="pk-layer" data-k="pk"></g>';
  b += g({ class: "pk-still" }, packetAt(M6.routes[3]!, 0.55));
  return svg(
    "friends",
    "0 0 600 440",
    "A loop around the table: a player flags a bug at their seat, the report becomes a GitHub issue, then a fix commit and a container on the homelab, and it comes back to the same seat. Overnight a moon crosses and drops new card data in, while a padlock keeps the engine pinned.",
    b,
  );
}
