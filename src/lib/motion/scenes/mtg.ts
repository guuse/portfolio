/** Motion for the six MTG suite scenes. */
import { M1, M2, M3, M4, M5 } from "~/lib/art/scenes/mtg.layout";
import { centre, fade, fadeTowards, hideStill, move, parts } from "../dom";
import { blinker } from "../leds";
import { clamp, ease as E, lerp, seg } from "../math";
import { courier, emitter, packets } from "../packets";
import type { SceneFactory } from "../types";

type Path = SVGPathElement;
const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i);

/* The itch: friends sit down, cards are dealt, the rules pile up. */
export const itch: SceneFactory = (svg) => {
  const K = parts(svg);
  const deal = range(7).map((i) => {
    const c = centre(K[`t${i}`]!);
    return { dx: M1.dealFrom.x - c.x, dy: M1.dealFrom.y - c.y };
  });
  return (p) => {
    for (let f = 0; f < 3; f++) {
      const a = seg(p, f * 0.05, 0.16 + f * 0.05);
      move(K[`f${f}`], 0, 18 * (1 - E.outBack(a, 1.4)));
      fade(K[`f${f}`], Math.min(1, a * 2.5));
    }
    const b4 = seg(p, 0.08, 0.24);
    move(K["f3"], 0, 30 * (1 - E.outCubic(b4)));
    fade(K["f3"], b4);
    deal.forEach(({ dx, dy }, k) => {
      const d = seg(p, 0.16 + k * 0.025, 0.28 + k * 0.025),
        e = E.outCubic(d);
      move(K[`t${k}`], dx * (1 - e), dy * (1 - e) - 14 * Math.sin(Math.PI * d), null, null, (1 - e) * 40);
      fade(K[`t${k}`], Math.min(1, d * 4));
    });
    // the rules pile up, one book at a time, each landing with a small bounce
    for (let j = 0; j < M1.books.length; j++) {
      const q = seg(p, 0.32 + j * 0.045, 0.4 + j * 0.045);
      move(K[`bk${j}`], 0, -46 * (1 - E.outBack(q, 1.8)), null, null, (1 - q) * (j % 2 ? 4 : -4));
      fade(K[`bk${j}`], Math.min(1, q * 5));
    }
    // loose sheets flutter down on top
    for (let h = 0; h < 3; h++) {
      const r = seg(p, 0.7 + h * 0.05, 0.84 + h * 0.05);
      move(
        K[`sh${h}`],
        Math.sin(r * 7 + h) * 10 * (1 - r),
        -70 * (1 - E.outCubic(r)),
        null,
        null,
        Math.sin(r * 9 + h * 2) * 14 * (1 - r),
      );
      fade(K[`sh${h}`], Math.min(1, r * 3));
    }
    const q0 = seg(p, 0.84, 0.92),
      q1 = seg(p, 0.89, 0.97);
    move(K["q0"], 0, 0, lerp(0.3, 1, E.outBack(q0, 2.4)));
    fade(K["q0"], Math.min(1, q0 * 3));
    move(K["q1"], 0, 0, lerp(0.3, 1, E.outBack(q1, 2.4)));
    fade(K["q1"], Math.min(1, q1 * 3));
  };
};

/* A table in the browser: cards go on the stack, priority goes round, the stack resolves. */
export const table: SceneFactory = (svg) => {
  const K = parts(svg);
  hideStill(svg);
  const P = packets(K["pk"] as SVGGElement),
    emit = emitter(),
    blink = blinker(svg);
  const to = M2.playedFrom.map(([x, y], i) => {
    const c = centre(K[`st${i}`]!);
    return { dx: x - c.x, dy: y - c.y };
  });
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
  return (p, dt, t) => {
    blink(dt);
    for (let s = 0; s < 4; s++) {
      const a = seg(p, s * 0.025, 0.08 + s * 0.025);
      move(K[`seat${s}`], 0, 0, lerp(0.7, 1, E.outBack(a, 2)));
      fade(K[`seat${s}`], a);
    }
    let onStack = 0;
    to.forEach(({ dx, dy }, k) => {
      const pl = seg(p, plays[k]![0], plays[k]![1]),
        rs = seg(p, resolves[k]![0], resolves[k]![1]),
        e = E.inOutCubic(pl);
      move(
        K[`st${k}`],
        dx * (1 - e),
        dy * (1 - e) - 26 * Math.sin(Math.PI * pl) - 12 * E.outCubic(rs),
        lerp(0.85, 1, e) * lerp(1, 1.08, rs),
        null,
        (1 - e) * (k === 1 ? 20 : -14),
      );
      fade(K[`st${k}`], (pl > 0 ? 1 : 0) * (1 - E.inCubic(rs)));
      if (pl > 0 && rs < 1) onStack++;
    });
    fade(K["hc2"], 1 - seg(p, 0.08, 0.1));
    fade(K["stacklbl"], onStack ? 1 : 0.35);
    let who = -1,
      auto = false;
    rounds.forEach(([a, b, seats], ri) => {
      if (p >= a && p < b) {
        who = seats[Math.min(seats.length - 1, Math.floor(seg(p, a, b) * seats.length))]!;
        auto = ri === 3;
      }
    });
    for (let q = 0; q < 4; q++) fadeTowards(K[`seat${q}-ring`], q === who ? 1 : 0, dt, 14);
    fadeTowards(K["auto"], p > 0.68 && p < 0.98 ? 1 : 0, dt, 6);
    emit(dt, who >= 0 ? 2.2 : 0, () => {
      // with auto-resolve on, the seat with nothing to play doesn't answer
      if (who === 3 && auto) P.spawn([{ el: K["lane3"] as Path, cls: "" }], { speed: 230, autofade: true });
      else
        P.spawn(
          [
            { el: K[`lane${who}`] as Path, cls: "" },
            { el: K[`back${who}`] as Path, cls: "pk--ink" },
          ],
          { speed: 260 + Math.random() * 60 },
        );
    });
    P.update(dt, t);
  };
};

/* Four players, one game: each screen gets its own view, one reloads, a replay rewinds. */
export const hands: SceneFactory = (svg) => {
  const K = parts(svg);
  hideStill(svg);
  const P = packets(K["pk"] as SVGGElement),
    emit = emitter(),
    emit3 = emitter(),
    blink = blinker(svg);
  let lane = 0;
  return (p, dt, t) => {
    blink(dt);
    for (let i = 0; i < 4; i++) {
      const a = seg(p, i * 0.03, 0.12 + i * 0.03);
      move(K[`scr${i}`], 0, 12 * (1 - E.outBack(a, 1.6)));
      fade(K[`scr${i}`], a);
      let c = seg(p, 0.18 + i * 0.03, 0.28 + i * 0.03);
      // the fourth player reloads: their view blanks, then comes back
      if (i === 3) c *= 1 - seg(p, 0.4, 0.45) * (1 - seg(p, 0.56, 0.62));
      fade(K[`scr${i}-c`], c);
    }
    const re = seg(p, 0.42, 0.46) * (1 - seg(p, 0.55, 0.59));
    fade(K["scr3-re"], re);
    move(K["scr3-re"], 0, 0, 1, 1, (t * 300) % 360);
    emit(dt, p > 0.1 && p < 0.34 ? 6 : 0, () => {
      P.spawn([{ el: K[`lane${lane}`] as Path, cls: "" }], { speed: 240 });
      lane = (lane + 1) % 4;
    });
    emit3(dt, p > 0.5 && p < 0.6 ? 4 : 0, () =>
      P.spawn([{ el: K["lane3"] as Path, cls: "" }], { speed: 240 }),
    );
    // replay: the bar slides in, the marker scrubs back, the boards rewind
    const bs = seg(p, 0.62, 0.7),
      r = E.inOutCubic(seg(p, 0.72, 0.98));
    move(K["bar"], 0, 14 * (1 - E.outCubic(bs)));
    fade(K["bar"], bs);
    move(K["mark"], -M3.bar.w * r, 0);
    for (let s = 0; s < 4; s++) {
      for (let k = 0; k < 5; k++) {
        const v = clamp(((5 - k) / 6 - r) * 10, 0, 1),
          el = K[`scr${s}-bf${k}`];
        fade(el, v);
        move(el, 0, (1 - v) * -6, lerp(0.7, 1, v));
      }
    }
    P.update(dt, t);
  };
};

/* Decks: the library fills in, the playgroup shelf arrives, one deck goes to the table. */
export const decks: SceneFactory = (svg) => {
  const K = parts(svg);
  // from its shelf slot to where it is drawn, next to the seat
  const slot = M4.boxes[M4.pick]!;
  const dx = slot[0] - M4.deckLanding[0],
    dy = slot[1] - M4.deckLanding[1];
  return (p) => {
    M4.boxes.forEach((_, i) => {
      const a = seg(p, 0.02 + i * 0.022, 0.12 + i * 0.022);
      move(K[`bx${i}`], 0, -34 * (1 - E.outBack(a, 1.8)));
      fade(K[`bx${i}`], Math.min(1, a * 4));
    });
    for (let k = 0; k < 4; k++) {
      const b = seg(p, 0.34 + k * 0.045, 0.46 + k * 0.045);
      move(K[`bd${k}`], 36 * (1 - E.outBack(b, 1.5)), 0);
      fade(K[`bd${k}`], b);
    }
    for (let s = 1; s < 4; s++) {
      const c = seg(p, 0.44 + s * 0.03, 0.54 + s * 0.03);
      move(K[`s${s}`], 0, 0, lerp(0.7, 1, E.outBack(c, 2)));
      fade(K[`s${s}`], c);
    }
    fade(K["s0"], seg(p, 0.46, 0.56));
    // the deck lifts out of its slot, travels on an arc and lands next to the empty seat
    const up = seg(p, 0.56, 0.62),
      go = seg(p, 0.62, 0.86),
      land = seg(p, 0.84, 0.92),
      gx = E.inOutCubic(go);
    move(
      K["deck"],
      dx * (1 - gx),
      dy -
        12 * E.outCubic(up) * (1 - go) -
        110 * Math.sin(Math.PI * gx) +
        6 * Math.sin(Math.PI * land) * (1 - land),
      null,
      null,
      Math.sin(Math.PI * go) * 8,
    );
    fade(K["deck"], Math.min(1, seg(p, 0.5, 0.56) * 2));
    fade(K["route"], 0.8 * seg(p, 0.58, 0.64) * (1 - seg(p, 0.9, 0.98)));
    fadeTowards(K["s0-ring"], p > 0.88 ? 1 : 0, 1 / 60, 8);
    fade(K["gap"], 1);
  };
};

/* Plain words: the sentence breaks into a query, Scryfall checks it, two readings fan out. */
export const search: SceneFactory = (svg) => {
  const K = parts(svg),
    put = courier(K["pk"] as SVGGElement);
  return (p) => {
    const b = seg(p, 0, 0.12);
    move(K["bub"], 0, 0, lerp(0.6, 1, E.outBack(b, 2)));
    fade(K["bub"], Math.min(1, b * 3));
    fade(K["words"], 1 - 0.6 * seg(p, 0.16, 0.34));
    M5.tokens.forEach((_, i) => {
      const a = seg(p, 0.14 + i * 0.06, 0.3 + i * 0.06);
      move(K[`tk${i}`], 0, -92 * (1 - E.outBack(a, 1.4)), lerp(0.6, 1, E.outCubic(a)));
      fade(K[`tk${i}`], Math.min(1, a * 3));
      const l = seg(p, 0.26 + i * 0.06, 0.36 + i * 0.06);
      move(K[`tl${i}`], 0, 6 * (1 - l));
      fade(K[`tl${i}`], l);
    });
    fade(K["rq"], seg(p, 0.36, 0.4));
    fade(K["rb"], seg(p, 0.48, 0.52));
    if (p > 0.4 && p < 0.47) put(K["rq"] as Path, E.inOutCubic(seg(p, 0.4, 0.47)), "pk--cool");
    else if (p > 0.5 && p < 0.57) put(K["rb"] as Path, E.inOutCubic(seg(p, 0.5, 0.57)), "pk--ink");
    else put();
    const tk = seg(p, 0.47, 0.53);
    move(K["tick"], 0, 0, lerp(0.2, 1, E.outBack(tk, 2.6)));
    fade(K["tick"], Math.min(1, tk * 3));
    // both readings start as one pile in the middle, fan out, then move apart
    const apart = E.inOutCubic(seg(p, 0.74, 0.94));
    (
      [
        [0, 126],
        [1, -126],
      ] as const
    ).forEach(([j, offset]) => {
      move(K[`fan${j}`], offset * (1 - apart), 0);
      fade(K[`fan${j}`], seg(p, 0.56, 0.62));
      M5.fanAngles.forEach((angle, c) => {
        const fo = E.outBack(seg(p, 0.58 + c * 0.02, 0.7 + c * 0.02), 1.6);
        move(K[`fc${j}-${c}`], 0, 0, null, null, -angle * (1 - fo));
      });
    });
  };
};

/* Building for friends: a report goes round the loop and comes back as a fix. */
export const friends: SceneFactory = (svg) => {
  const K = parts(svg);
  hideStill(svg);
  const put = courier(K["pk"] as SVGGElement),
    blink = blinker(svg);
  const legs: [string, number, number, string][] = [
    ["r0", 0.12, 0.3, "pk--ink"],
    ["r1", 0.36, 0.44, "pk--ink"],
    ["r2", 0.5, 0.62, ""],
    ["r3", 0.68, 0.84, ""],
  ];
  return (p, dt) => {
    blink(dt);
    move(K["moon"], lerp(-260, 200, p), -10 * Math.sin(Math.PI * p));
    const fl = seg(p, 0.04, 0.12);
    move(K["flag"], 0, 0, 1, Math.max(0.001, E.outBack(fl, 2.4)));
    fade(K["flag"], Math.min(1, fl * 3));
    const is = seg(p, 0.3, 0.36);
    move(K["issue"], 0, 0, lerp(0.7, 1, E.outBack(is, 2)));
    fade(K["issue"], Math.min(1, is * 3));
    const fx = seg(p, 0.44, 0.5);
    move(K["fix"], 0, 0, lerp(0.2, 1, E.outBack(fx, 2.6)));
    fade(K["fix"], Math.min(1, fx * 3));
    const im = seg(p, 0.62, 0.68);
    move(K["img"], 0, -22 * (1 - E.outBack(im, 1.8)));
    fade(K["img"], Math.min(1, im * 3));
    const pc = seg(p, 0.4, 0.54);
    move(K["parcel"], 0, -80 * (1 - E.outBack(pc, 1.3)), null, null, (1 - pc) * 18);
    fade(K["parcel"], Math.min(1, pc * 3) * (1 - seg(p, 0.62, 0.7)));
    const leg = legs.find(([, a, b]) => p > a && p < b);
    if (leg) put(K[leg[0]] as Path, E.inOutCubic(seg(p, leg[1], leg[2])), leg[3]);
    else put();
    const lit = seg(p, 0.84, 0.9);
    fade(K["p0-ring"], lit);
    move(K["p0"], 0, 0, 1 + 0.08 * Math.sin(Math.PI * lit));
  };
};
