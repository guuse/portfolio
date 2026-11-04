/** Motion for the six MTG suite scenes. */
import { random } from "../random";
import { M1, M2, M3, M4, M5 } from "~/lib/art/scenes/mtg.layout";
import { centre, fade, fadeTowards, hideStill, move, parts } from "../dom";
import { blinker, restLeds } from "../leds";
import { clamp, ease as E, lerp, seg } from "../math";
import { courier, emitter, packets, prime, type Segment } from "../packets";
import type { SceneFactory } from "../types";

type Path = SVGPathElement;
const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i);

/* The itch: friends sit down, cards are dealt, the rules pile up. */
const itch: SceneFactory = (svg) => {
  const K = parts(svg);
  const cards = range(7).map((i) => K[`tablecard${i}`]);
  const deal = cards.map((el) => {
    const c = centre(el!);
    return { dx: M1.dealFrom.x - c.x, dy: M1.dealFrom.y - c.y };
  });
  const friends = range(4).map((f) => K[`friend${f}`]),
    books = M1.books.map((_, j) => K[`book${j}`]),
    sheets = range(3).map((h) => K[`rulesheet${h}`]),
    { question0, question1 } = K;
  return (p) => {
    for (let f = 0; f < 3; f++) {
      const a = seg(p, f * 0.05, 0.16 + f * 0.05);
      move(friends[f], 0, 18 * (1 - E.outBack(a, 1.4)));
      fade(friends[f], Math.min(1, a * 2.5));
    }
    const b4 = seg(p, 0.08, 0.24);
    move(friends[3], 0, 30 * (1 - E.outCubic(b4)));
    fade(friends[3], b4);
    deal.forEach(({ dx, dy }, k) => {
      const d = seg(p, 0.16 + k * 0.025, 0.28 + k * 0.025),
        e = E.outCubic(d);
      move(cards[k], dx * (1 - e), dy * (1 - e) - 14 * Math.sin(Math.PI * d), null, null, (1 - e) * 40);
      fade(cards[k], Math.min(1, d * 4));
    });
    // the rules pile up, one book at a time, each landing with a small bounce
    for (let j = 0; j < books.length; j++) {
      const q = seg(p, 0.32 + j * 0.045, 0.4 + j * 0.045);
      move(books[j], 0, -46 * (1 - E.outBack(q, 1.8)), null, null, (1 - q) * (j % 2 ? 4 : -4));
      fade(books[j], Math.min(1, q * 5));
    }
    // loose sheets flutter down on top
    for (let h = 0; h < 3; h++) {
      const r = seg(p, 0.7 + h * 0.05, 0.84 + h * 0.05);
      move(
        sheets[h],
        Math.sin(r * 7 + h) * 10 * (1 - r),
        -70 * (1 - E.outCubic(r)),
        null,
        null,
        Math.sin(r * 9 + h * 2) * 14 * (1 - r),
      );
      fade(sheets[h], Math.min(1, r * 3));
    }
    const q0 = seg(p, 0.84, 0.92),
      q1 = seg(p, 0.89, 0.97);
    move(question0, 0, 0, lerp(0.3, 1, E.outBack(q0, 2.4)));
    fade(question0, Math.min(1, q0 * 3));
    move(question1, 0, 0, lerp(0.3, 1, E.outBack(q1, 2.4)));
    fade(question1, Math.min(1, q1 * 3));
    return false;
  };
};

/* A table in the browser: cards go on the stack, priority goes round, the stack resolves. */
const table: SceneFactory = (svg) => {
  const K = parts(svg);
  hideStill(svg);
  const P = packets(K["pk"] as SVGGElement),
    emit = emitter(),
    blink = blinker(svg);
  const lanes = range(4).map((q) => K[`lane${q}`] as Path),
    backs = range(4).map((q) => K[`back${q}`] as Path);
  prime(...lanes, ...backs);
  const stack = M2.playedFrom.map((_, i) => K[`stackcard${i}`]);
  const to = M2.playedFrom.map(([x, y], i) => {
    const c = centre(stack[i]!);
    return { dx: x - c.x, dy: y - c.y };
  });
  const seats = range(4).map((s) => K[`seat${s}`]),
    rings = range(4).map((q) => K[`seat${q}-ring`]),
    { handcard2, stacklbl, auto: autoLabel } = K;
  // each seat's answer: out on its lane, back as ink; with auto-resolve on, the last seat has
  // nothing to play and doesn't answer
  const answer = range(4).map((q): Segment[] => [
    { el: lanes[q]!, cls: "" },
    { el: backs[q]!, cls: "pk--ink" },
  ]);
  const unanswered: Segment[] = [{ el: lanes[3]!, cls: "" }];
  // who holds priority when: [from, to, seats in turn]; the last round is auto-resolve
  const rounds: [number, number, number[]][] = [
    [0.18, 0.34, [1, 2, 3]],
    [0.42, 0.52, [2, 3, 0]],
    [0.6, 0.67, [3, 0, 1]],
    [0.68, 0.97, [1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0]],
  ];
  const plays = [
    [0.08, 0.18],
    [0.34, 0.42],
    [0.52, 0.6],
  ] as const;
  // last in, first out
  const resolves = [
    [0.88, 0.96],
    [0.78, 0.86],
    [0.68, 0.76],
  ] as const;
  return (p, dt, t, _s, rest, flow = 1) => {
    blink(dt, rest);
    for (let s = 0; s < 4; s++) {
      const a = seg(p, s * 0.025, 0.08 + s * 0.025);
      move(seats[s], 0, 0, lerp(0.7, 1, E.outBack(a, 2)));
      fade(seats[s], a);
    }
    let onStack = 0;
    to.forEach(({ dx, dy }, k) => {
      const pl = seg(p, plays[k]![0], plays[k]![1]),
        rs = seg(p, resolves[k]![0], resolves[k]![1]),
        e = E.inOutCubic(pl);
      move(
        stack[k],
        dx * (1 - e),
        dy * (1 - e) - 26 * Math.sin(Math.PI * pl) - 12 * E.outCubic(rs),
        lerp(0.85, 1, e) * lerp(1, 1.08, rs),
        null,
        (1 - e) * (k === 1 ? 20 : -14),
      );
      fade(stack[k], (pl > 0 ? 1 : 0) * (1 - E.inCubic(rs)));
      if (pl > 0 && rs < 1) onStack++;
    });
    fade(handcard2, 1 - seg(p, 0.08, 0.1));
    fade(stacklbl, onStack ? 1 : 0.35);
    let who = -1,
      auto = false;
    rounds.forEach(([a, b, seats], ri) => {
      if (p >= a && p < b) {
        who = seats[Math.min(seats.length - 1, Math.floor(seg(p, a, b) * seats.length))]!;
        auto = ri === 3;
      }
    });
    for (let q = 0; q < 4; q++) fadeTowards(rings[q], q === who ? 1 : 0, dt, 14);
    fadeTowards(autoLabel, p > 0.68 && p < 0.98 ? 1 : 0, dt, 6);
    emit(dt, who >= 0 && !rest ? 2.2 * flow : 0, () => {
      if (who === 3 && auto) P.spawn(unanswered, { speed: 230, autofade: true });
      else P.spawn(answer[who]!, { speed: 260 + random() * 60 });
    });
    return P.update(dt, t, rest);
  };
};

/* Four players, one game: each screen gets its own view, one reloads, a replay rewinds. */
const hands: SceneFactory = (svg) => {
  const K = parts(svg);
  hideStill(svg);
  const P = packets(K["pk"] as SVGGElement),
    emit = emitter(),
    emit3 = emitter(),
    blink = blinker(svg);
  const lanes = range(4).map((q): Segment[] => [{ el: K[`lane${q}`] as Path, cls: "" }]);
  prime(...lanes.map((l) => l[0]!.el));
  const screens = range(4).map((i) => K[`screen${i}`]),
    views = range(4).map((i) => K[`screen${i}-cards`]),
    boards = range(4).map((s) => range(5).map((k) => K[`screen${s}-card${k}`])),
    { "screen3-reload": reload, bar, mark } = K;
  let lane = 0;
  return (p, dt, t, _s, rest, flow = 1) => {
    blink(dt, rest);
    for (let i = 0; i < 4; i++) {
      const a = seg(p, i * 0.03, 0.12 + i * 0.03);
      move(screens[i], 0, 12 * (1 - E.outBack(a, 1.6)));
      fade(screens[i], a);
      let c = seg(p, 0.18 + i * 0.03, 0.28 + i * 0.03);
      // the fourth player reloads: their view blanks, then comes back
      if (i === 3) c *= 1 - seg(p, 0.4, 0.45) * (1 - seg(p, 0.56, 0.62));
      fade(views[i], c);
    }
    const re = seg(p, 0.42, 0.46) * (1 - seg(p, 0.55, 0.59));
    fade(reload, re);
    // the spinner turns on the clock, which stands still once the scene rests
    move(reload, 0, 0, 1, 1, (t * 300) % 360);
    emit(dt, !rest && p > 0.1 && p < 0.34 ? 6 * flow : 0, () => {
      P.spawn(lanes[lane]!, { speed: 240 });
      lane = (lane + 1) % 4;
    });
    emit3(dt, !rest && p > 0.5 && p < 0.6 ? 4 * flow : 0, () => P.spawn(lanes[3]!, { speed: 240 }));
    // replay: the bar slides in, the marker scrubs back, the boards rewind
    const bs = seg(p, 0.62, 0.7),
      r = E.inOutCubic(seg(p, 0.72, 0.98));
    move(bar, 0, 14 * (1 - E.outCubic(bs)));
    fade(bar, bs);
    move(mark, -M3.bar.w * r, 0);
    for (let s = 0; s < 4; s++) {
      for (let k = 0; k < 5; k++) {
        const v = clamp(((5 - k) / 6 - r) * 10, 0, 1),
          el = boards[s]![k];
        fade(el, v);
        move(el, 0, (1 - v) * -6, lerp(0.7, 1, v));
      }
    }
    return P.update(dt, t, rest);
  };
};

/* Decks: the library fills in, the playgroup shelf arrives, one deck goes to the table. */
const decks: SceneFactory = (svg) => {
  const K = parts(svg);
  // from its shelf slot to where it is drawn, next to the seat
  const slot = M4.boxes[M4.pick]!;
  const dx = slot[0] - M4.deckLanding[0],
    dy = slot[1] - M4.deckLanding[1];
  // the picked deck's slot is drawn empty (the gap): that deck is the one that travels
  const boxes = M4.boxes.map((_, i) => (i === M4.pick ? undefined : K[`deckbox${i}`])),
    binders = range(4).map((k) => K[`binder${k}`]),
    plates = range(4).map((s) => K[`plate${s}`]),
    { deck, route, "plate0-ring": ring, gap } = K;
  return (p, dt) => {
    boxes.forEach((box, i) => {
      const a = seg(p, 0.02 + i * 0.022, 0.12 + i * 0.022);
      move(box, 0, -34 * (1 - E.outBack(a, 1.8)));
      fade(box, Math.min(1, a * 4));
    });
    for (let k = 0; k < 4; k++) {
      const b = seg(p, 0.34 + k * 0.045, 0.46 + k * 0.045);
      move(binders[k], 36 * (1 - E.outBack(b, 1.5)), 0);
      fade(binders[k], b);
    }
    for (let s = 1; s < 4; s++) {
      const c = seg(p, 0.44 + s * 0.03, 0.54 + s * 0.03);
      move(plates[s], 0, 0, lerp(0.7, 1, E.outBack(c, 2)));
      fade(plates[s], c);
    }
    fade(plates[0], seg(p, 0.46, 0.56));
    // the deck lifts out of its slot, travels on an arc and lands next to the empty seat
    const up = seg(p, 0.56, 0.62),
      go = seg(p, 0.62, 0.86),
      land = seg(p, 0.84, 0.92),
      gx = E.inOutCubic(go);
    move(
      deck,
      dx * (1 - gx),
      dy -
        12 * E.outCubic(up) * (1 - go) -
        110 * Math.sin(Math.PI * gx) +
        6 * Math.sin(Math.PI * land) * (1 - land),
      null,
      null,
      Math.sin(Math.PI * go) * 8,
    );
    fade(deck, Math.min(1, seg(p, 0.5, 0.56) * 2));
    fade(route, 0.8 * seg(p, 0.58, 0.64) * (1 - seg(p, 0.9, 0.98)));
    fadeTowards(ring, p > 0.88 ? 1 : 0, dt, 8);
    fade(gap, 1);
    return false;
  };
};

/* Plain words: the sentence breaks into a query, Scryfall checks it, a best match and its alternatives fan out. */
const search: SceneFactory = (svg) => {
  const K = parts(svg),
    put = courier(K["pk"] as SVGGElement);
  const chips = M5.tokens.map((_, i) => K[`chip${i}`]),
    queries = M5.tokens.map((_, i) => K[`chipq${i}`]),
    labels = M5.tokens.map((_, i) => K[`chiplabel${i}`]),
    fans = [0, 1].map((j) => K[`fan${j}`]),
    fanCards = [0, 1].map((j) => M5.fanAngles.map((_, c) => K[`fancard${j}-${c}`])),
    { bubble, words, tick } = K,
    query = K["route-query"] as Path,
    back = K["route-back"] as Path;
  prime(query, back);
  return (p) => {
    const b = seg(p, 0, 0.12);
    move(bubble, 0, 0, lerp(0.6, 1, E.outBack(b, 2)));
    fade(bubble, Math.min(1, b * 3));
    // the words come with the bubble (fading, not scaling: see the drawing), and stay legible
    // behind the chips (it is still what the reader asked)
    fade(words, Math.min(1, b * 3) * (1 - 0.3 * seg(p, 0.16, 0.34)));
    M5.tokens.forEach((_, i) => {
      const a = seg(p, 0.14 + i * 0.06, 0.3 + i * 0.06),
        y = -92 * (1 - E.outBack(a, 1.4));
      move(chips[i], 0, y, lerp(0.6, 1, E.outCubic(a)));
      fade(chips[i], Math.min(1, a * 3));
      // the query moves with its chip, at full size: it only shows once the chip has grown
      move(queries[i], 0, y);
      fade(queries[i], seg(p, 0.2 + i * 0.06, 0.3 + i * 0.06));
      const l = seg(p, 0.26 + i * 0.06, 0.36 + i * 0.06);
      move(labels[i], 0, 6 * (1 - l));
      fade(labels[i], l);
    });
    fade(query, seg(p, 0.36, 0.4));
    fade(back, seg(p, 0.48, 0.52));
    if (p > 0.4 && p < 0.47) put(query, E.inOutCubic(seg(p, 0.4, 0.47)), "pk--cool");
    else if (p > 0.5 && p < 0.57) put(back, E.inOutCubic(seg(p, 0.5, 0.57)), "pk--ink");
    else put();
    const tk = seg(p, 0.47, 0.53);
    move(tick, 0, 0, lerp(0.2, 1, E.outBack(tk, 2.6)));
    fade(tick, Math.min(1, tk * 3));
    // the best match and its alternatives start as one pile in the middle, fan out, then move apart
    const apart = E.inOutCubic(seg(p, 0.74, 0.94));
    (
      [
        [0, 126],
        [1, -126],
      ] as const
    ).forEach(([j, offset]) => {
      move(fans[j], offset * (1 - apart), 0);
      fade(fans[j], seg(p, 0.56, 0.62));
      M5.fanAngles.forEach((angle, c) => {
        const fo = E.outBack(seg(p, 0.58 + c * 0.02, 0.7 + c * 0.02), 1.6);
        move(fanCards[j]![c], 0, 0, null, null, -angle * (1 - fo));
      });
    });
    return false;
  };
};

/* Building for friends: a report goes round the loop and comes back as a fix. */
const friends: SceneFactory = (svg) => {
  const K = parts(svg);
  hideStill(svg);
  const put = courier(K["pk"] as SVGGElement),
    blink = blinker(svg);
  const legs: [Path, number, number, string][] = [
    [K["route0"] as Path, 0.12, 0.3, "pk--ink"],
    [K["route1"] as Path, 0.36, 0.44, "pk--ink"],
    [K["route2"] as Path, 0.5, 0.62, ""],
    [K["route3"] as Path, 0.68, 0.84, ""],
  ];
  prime(...legs.map((l) => l[0]));
  const { moon, flag, issue, fix, img, parcel, "plate0-ring": ring, plate0 } = K;
  return (p, dt, _t, _s, rest) => {
    blink(dt, rest);
    move(moon, lerp(-260, 200, p), -10 * Math.sin(Math.PI * p));
    const fl = seg(p, 0.04, 0.12);
    move(flag, 0, 0, 1, Math.max(0.001, E.outBack(fl, 2.4)));
    fade(flag, Math.min(1, fl * 3));
    const is = seg(p, 0.3, 0.36);
    move(issue, 0, 0, lerp(0.7, 1, E.outBack(is, 2)));
    fade(issue, Math.min(1, is * 3));
    const fx = seg(p, 0.44, 0.5);
    move(fix, 0, 0, lerp(0.2, 1, E.outBack(fx, 2.6)));
    fade(fix, Math.min(1, fx * 3));
    const im = seg(p, 0.62, 0.68);
    move(img, 0, -22 * (1 - E.outBack(im, 1.8)));
    fade(img, Math.min(1, im * 3));
    const pc = seg(p, 0.4, 0.54);
    move(parcel, 0, -80 * (1 - E.outBack(pc, 1.3)), null, null, (1 - pc) * 18);
    fade(parcel, Math.min(1, pc * 3) * (1 - seg(p, 0.62, 0.7)));
    const leg = legs.find(([, a, b]) => p > a && p < b);
    if (leg) put(leg[0], E.inOutCubic(seg(p, leg[1], leg[2])), leg[3]);
    else put();
    const lit = seg(p, 0.84, 0.9);
    fade(ring, lit);
    move(plate0, 0, 0, 1 + 0.08 * Math.sin(Math.PI * lit));
    return false;
  };
};

/**
 * The MTG hero: the second half of a game, from the second spell to the stack resolving, with
 * auto-resolve on for the last round. It rests on the table with the stack cleared.
 */
const cardTable: SceneFactory = (svg) => {
  const run = table(svg),
    pk = parts(svg)["pk"];
  return (p, dt, t, speed, rest) => {
    const moving = run(0.3 + 0.69 * p, dt, t, speed, rest);
    fade(pk, 1 - seg(p, 0.9, 1));
    if (p >= 1) restLeds(svg);
    return moving;
  };
};

/** The MTG family's animators, by drawing id (data-scene / data-card). */
export const animators = { itch, table, hands, decks, search, friends, cardtable: cardTable };
