/**
 * Motion for the infrastructure delivery scenes (drawn by src/lib/art/scenes/delivery.ts) and
 * its card. Each scene follows one change, so scroll moves a single packet along its way: the
 * route it's on lights up, and what it arrives at gives a small hop or lights its LED.
 */
import { D1, D2 } from "~/lib/art/scenes/delivery.layout";
import { attr, fade, fadeTowards, hideStill, move, parts, type Parts } from "../dom";
import { blinker, restLeds } from "../leds";
import { ease as E, lerp, seg } from "../math";
import { courier, prime } from "../packets";
import type { SceneFactory } from "../types";

type Path = SVGPathElement;

/** The lit route's dash pattern (art.css: 5 on, 7 off), and how fast it flows, per second. */
const DASH = 12,
  DASH_SPEED = DASH / 0.7;

/**
 * A leg of the journey: the route, when the packet is on it, its class, and the part it
 * reaches ("" for none: that part moves on its own).
 */
type Leg = [route: string, from: number, to: number, cls: string, reaches: string];

/** Lays an amber copy over each route of the journey, shown while the packet is on it. */
function hotRoutes(K: Parts, legs: readonly Leg[]): Path[] {
  return legs.map(([route]) => {
    const r = K[`route-${route}`] as Path,
      h = r.cloneNode() as Path;
    h.removeAttribute("data-k");
    h.setAttribute("data-rt", "");
    h.setAttribute("class", "k-route-hot");
    h.style.opacity = "0";
    r.after(h);
    return h;
  });
}

/**
 * The journey for the scenes that follow one packet: lights the route it's on, hops what it
 * arrives at, and puts the packet where progress says. Returns whether a leg is playing.
 */
function journey(svg: SVGSVGElement, K: Parts, legs: readonly Leg[]) {
  const put = courier(K["pk"] as SVGGElement),
    routes = legs.map(([route]) => K[`route-${route}`] as Path);
  prime(...routes);
  const hot = hotRoutes(K, legs),
    // what each leg reaches, once per element (two legs can end at the same machine)
    targets = [...new Set(legs.flatMap((l) => (l[4] ? [l[4]] : [])))].map((k) => ({
      el: K[k],
      ends: legs.filter((l) => l[4] === k).map((l) => l[2]),
    }));
  hideStill(svg);
  return (p: number, dt: number, t: number) => {
    legs.forEach(([, a0, a1], i) => {
      const on = p > a0 - 0.01 && p < a1 + 0.015;
      fadeTowards(hot[i], on ? 0.95 : 0, dt, 9);
      // the dash flows on the scene's clock, so it stands still whenever the scene does
      if (on) attr(hot[i], "stroke-dashoffset", -((t * DASH_SPEED) % DASH));
    });
    for (const { el, ends } of targets) {
      const bump = Math.max(...ends.map((to) => Math.sin(Math.PI * seg(p, to - 0.004, to + 0.05))));
      move(el, 0, -4 * bump);
      el?.classList.toggle("is-ping", bump > 0.15);
    }
    let i = -1;
    legs.forEach((l, k) => {
      if (p >= l[1] && p < l[2]) i = k;
    });
    const leg = legs[i];
    if (leg) put(routes[i], E.inOutCubic(seg(p, leg[1], leg[2])), leg[3]);
    else put();
  };
}

/**
 * 1. Approved should mean applied. The first half (the pull request) writes the diff, saves
 * the plan and gets the review; the second half (the merge) fetches that plan, checks for
 * drift and applies it. It rests with production on the new version.
 */
const plan: SceneFactory = (svg) => {
  const K = parts(svg),
    blink = blinker(svg);
  const go = journey(svg, K, [
    ["save", 0.12, 0.28, "", ""],
    ["approve", 0.32, 0.4, "pk--ink", "review"],
    ["merge", 0.52, 0.64, "pk--ink", "check"],
    ["fetch", 0.66, 0.72, "", "check"],
    ["apply", 0.8, 0.88, "", "prod"],
  ]);
  const rows = D1.rows.map((_, i) => K[`row${i}`]);
  const { plancrate, ok, "prod-old": prodOld, "prod-new": prodNew } = K;
  return (p, dt, t, _s, rest) => {
    blink(dt, rest);
    rows.forEach((r, i) => fade(r, seg(p, 0.02 + i * 0.022, 0.05 + i * 0.022)));
    // the plan drops onto the shelf as the packet gets there
    const cr = seg(p, 0.27, 0.33);
    move(plancrate, 0, -24 * (1 - E.outBack(cr, 1.8)));
    fade(plancrate, Math.min(1, cr * 3));
    const ap = seg(p, 0.4, 0.47);
    move(ok, 0, 0, Math.max(0.001, E.outBack(ap, 2.4)));
    fade(ok, Math.min(1, ap * 3));
    // production moves to the new version once the plan is applied
    const up = seg(p, 0.88, 0.95);
    fade(prodOld, 1 - up);
    move(prodNew, 0, 0, 1, Math.max(0.001, E.outBack(up, 2.4)));
    fade(prodNew, Math.min(1, up * 3));
    go(p, dt, t);
    return false;
  };
};

/**
 * 2. Make the wrong change impossible. The policy comes first, then the gate it guards; the
 * expiry rule sets off, waits at the closed gate and gives up. It rests with the gate closed
 * and the bucket untouched.
 */
const policy: SceneFactory = (svg) => {
  const K = parts(svg),
    blink = blinker(svg),
    put = courier(K["pk"] as SVGGElement);
  hideStill(svg);
  const change = K["route-change"] as Path;
  prime(change);
  const { pack, "route-link": link, gate, bar, "lbl-rule": label } = K;
  return (p, dt, t, _s, rest) => {
    blink(dt, rest);
    const pk = seg(p, 0.04, 0.16);
    move(pack, 0, -14 * (1 - E.outBack(pk, 1.6)), lerp(0.85, 1, E.outBack(pk, 1.6)));
    fade(pack, Math.min(1, pk * 3));
    fade(link, seg(p, 0.14, 0.22));
    // the gate drops in, and its bar comes down
    const gs = seg(p, 0.2, 0.3),
      gc = seg(p, 0.24, 0.36);
    move(gate, 0, -12 * (1 - E.outBack(gs, 1.6)));
    fade(gate, gs);
    move(
      bar,
      0,
      0,
      1,
      Math.max(0.02, gc < 0.8 ? lerp(0.05, 1.08, E.outCubic(gc / 0.8)) : lerp(1.08, 1, (gc - 0.8) / 0.2)),
    );
    fade(label, seg(p, 0.36, 0.42));
    // the expiry rule sets off, waits at the bar and fades
    const go = seg(p, 0.38, 0.56),
      wait = seg(p, 0.56, 0.8),
      waiting = wait > 0 && wait < 1 && !rest;
    if (p >= 0.38 && p < 0.9)
      put(
        change,
        D2.stopAt * E.outCubic(go) + (waiting ? Math.sin(t * 22) * 0.006 : 0),
        "",
        1 - E.inCubic(seg(p, 0.8, 0.9)),
      );
    else if (p >= 0.9) put(change, D2.stopAt, "", 0);
    else put();
    return false;
  };
};

/**
 * 3. Separate foundations, one writer. The first half: the two environments, each with its
 * own state, key and role, and the pipeline deploying to each. The second half: the CLI, which
 * reads production and never writes to it.
 */
const writer: SceneFactory = (svg) => {
  const K = parts(svg),
    blink = blinker(svg),
    put = courier(K["pk"] as SVGGElement);
  hideStill(svg);
  const acc = K["route-acc"] as Path,
    prod = K["route-prod"] as Path,
    read = K["route-read"] as Path;
  prime(acc, prod, read);
  const { env0, env1, ci, lap, term } = K;
  return (p, _dt, _t, _s, rest) => {
    blink(_dt, rest);
    const e0 = seg(p, 0.02, 0.12),
      e1 = seg(p, 0.08, 0.18);
    fade(env0, e0);
    fade(env1, e1);
    const hop = (a: number): number => -5 * Math.sin(Math.PI * seg(p, a, a + 0.05));
    move(env0, 0, 14 * (1 - E.outBack(e0, 1.6)) + hop(0.33));
    move(env1, 0, 14 * (1 - E.outBack(e1, 1.6)) + hop(0.47));
    ci?.classList.toggle("is-ping", (p > 0.2 && p < 0.24) || (p > 0.34 && p < 0.38));
    const l = seg(p, 0.52, 0.62);
    move(lap, 0, 18 * (1 - E.outBack(l, 1.4)));
    fade(lap, l);
    fade(term, seg(p, 0.6, 0.68));
    fade(read, seg(p, 0.6, 0.7));
    if (p >= 0.22 && p < 0.33) put(acc, E.inOutCubic(seg(p, 0.22, 0.33)), "pk--ink");
    else if (p >= 0.36 && p < 0.47) put(prod, E.inOutCubic(seg(p, 0.36, 0.47)), "pk--ink");
    else if (p >= 0.72 && p < 0.82) put(read, E.inOutCubic(seg(p, 0.72, 0.82)), "pk--cool");
    else if (p >= 0.82 && p < 0.92) put(read, 1 - E.inOutCubic(seg(p, 0.82, 0.92)), "pk--cool");
    else put();
    return false;
  };
};

/**
 * The card: the plan check, once. `p` is the card's pass (0..1, see controller.ts); it rests
 * on production running the applied plan, with the LEDs back in their drawn state.
 */
const cardPlan: SceneFactory = (svg) => {
  const run = plan(svg);
  return (p, dt, t, s, rest) => {
    if (p >= 1) {
      restLeds(svg);
      return run(1, dt, t, s, true);
    }
    return run(p, dt, t, s, rest);
  };
};

/** The delivery family's animators, by drawing id (data-scene / data-card). */
export const animators = { plan, policy, writer, cardplan: cardPlan };
