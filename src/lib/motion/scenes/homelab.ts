/** Motion for the homelab scene and the homelab homepage card. */
import { CL, H } from "~/lib/art/scenes/homelab.layout";
import { fade, hideStill, move, parts } from "../dom";
import { blinker, restLeds } from "../leds";
import { clamp, ease as E, lerp, seg } from "../math";
import { courier, prime, track } from "../packets";
import { hotRoutes, lightRoute } from "../routes";
import { firstAlong } from "~/lib/art/geometry";
import type { SceneFactory } from "../types";

type Path = SVGPathElement;

/**
 * One change, git push to running. Scroll moves a single packet along its journey. The route
 * it's on lights up in amber with a dash flowing its way, and each machine's label nods as the
 * packet arrives, so something answers every bit of scroll.
 */
const loop: SceneFactory = (svg) => {
  const K = parts(svg),
    blink = blinker(svg);
  hideStill(svg);
  const put = courier(K["pk"] as SVGGElement);
  const r = (k: keyof typeof H.routes): Path => K[`route-${k}`] as Path;
  // how far along repo → Actions the gate sits: the looping build waits there
  const push = r("push"),
    pushTrack = track(push),
    stopF = firstAlong(pushTrack, (_, y) => y >= H.gateY - 12) / pushTrack.len;
  // the journey: [route, start, end, packet class, where it arrives]; gaps are inside a machine
  const legs: [Path, number, number, string, string][] = [
    [push, 0.05, 0.16, "pk--ink", "lbl-build"],
    [r("ship"), 0.24, 0.31, "", "lbl-reg"],
    [r("watch"), 0.34, 0.43, "pk--cool", "upd"],
    [r("tag"), 0.46, 0.52, "pk--ink", "lbl-repo"],
    [r("sync"), 0.52, 0.58, "pk--ink", "argo"],
    [r("roll"), 0.58, 0.65, "pk--ink", "lbl-lap"],
  ];
  prime(...legs.map((l) => l[0]));
  // an amber copy of each route, laid over it, that shows while the packet is on it
  const hot = hotRoutes(legs.map((l) => l[0]));
  const arrivals = legs.map(([, , end, , key]) => ({ el: K[key], end }));
  const {
    "commit-push": commitPush,
    "commit-tag": commitTag,
    hatch,
    buildled,
    crate,
    "route-watch": watchRoute,
    oldpod,
    newpod,
    gate,
    bar,
  } = K;
  return (p, dt, t, _s, rest) => {
    blink(dt, rest);
    legs.forEach(([, a0, a1], i) => {
      // lit from just before the packet sets off until just after it arrives; the push route
      // lights again when the tag commit's build comes back round to the gate
      const on = (p > a0 - 0.01 && p < a1 + 0.015) || (i === 0 && p > 0.77 && p < 0.92);
      lightRoute(hot[i], on, dt, t);
    });
    for (const { el, end } of arrivals) {
      const u = seg(p, end - 0.004, end + 0.045),
        bump = Math.sin(Math.PI * u);
      move(el, 0, 0, 1 + 0.1 * bump);
      el?.classList.toggle("is-ping", bump > 0.15);
    }
    const a = seg(p, 0, 0.05);
    move(commitPush, 0, 0, lerp(0.3, 1, E.outBack(a, 2.4)));
    fade(commitPush, Math.min(1, a * 3));
    // the build works while the packet is inside (and stops working when the reader does)
    const bw = seg(p, 0.16, 0.24),
      busy = bw > 0 && bw < 1 && !rest;
    move(hatch, 0, busy ? Math.sin(t * 40) * 1.2 : 0);
    buildled?.classList.toggle("is-blink", busy && Math.sin(t * 30) > 0);
    const cr = seg(p, 0.29, 0.35);
    move(crate, 0, -26 * (1 - E.outBack(cr, 1.8)));
    fade(crate, Math.min(1, cr * 3));
    fade(watchRoute, 0.35 + 0.65 * Math.sin(Math.PI * seg(p, 0.33, 0.44)));
    const tg = seg(p, 0.5, 0.55);
    move(commitTag, 0, 0, lerp(0.3, 1, E.outBack(tg, 2.4)));
    fade(commitTag, Math.min(1, tg * 3));
    const sw = seg(p, 0.64, 0.74);
    fade(oldpod, 1 - seg(sw, 0, 0.4));
    move(oldpod, 0, 0, lerp(1, 0.6, seg(sw, 0, 0.4)));
    move(newpod, 0, 0, lerp(0.4, 1, E.outBack(seg(sw, 0.3, 1), 2.2)));
    fade(newpod, seg(sw, 0.3, 0.6));
    // the loop: the gate shows up, closes, and the tag commit's build waits there and gives up
    const gs = seg(p, 0.74, 0.8),
      gc = seg(p, 0.76, 0.86);
    fade(gate, gs);
    move(
      bar,
      0,
      0,
      1,
      clamp(gc < 0.8 ? lerp(0.05, 1.08, E.outCubic(gc / 0.8)) : lerp(1.08, 1, (gc - 0.8) / 0.2), 0.02, 1.1),
    );
    if (p >= 0.78) {
      const w = seg(p, 0.78, 0.86),
        wait = seg(p, 0.86, 0.97);
      put(
        push,
        stopF * E.outCubic(w) + (wait > 0 && wait < 1 && !rest ? Math.sin(t * 22) * 0.012 : 0),
        "pk--ink",
        1 - E.inCubic(seg(p, 0.9, 0.98)),
      );
      return false;
    }
    let leg: (typeof legs)[number] | undefined;
    for (const l of legs) if (p >= l[1] && p < l[2]) leg = l;
    if (leg) put(leg[0], E.inOutCubic(seg(p, leg[1], leg[2])), leg[3]);
    else put();
    return false;
  };
};

/**
 * Homepage card: one change goes round the loop, once. `p` is the card's pass (0..1, see
 * controller.ts): a new commit, the build, the pod landing on the laptop, and the packet
 * heading home and fading out. It rests on the new pod running.
 */
const cardLoop: SceneFactory = (svg) => {
  const K = parts(svg),
    blink = blinker(svg);
  hideStill(svg);
  const loopPath = K["loop"] as Path,
    put = courier(K["pk"] as SVGGElement);
  const fBuild = CL.buildAt,
    fLap = CL.laptopAt,
    { "commit-new": commitNew, hatch, buildled, newpod } = K;
  return (p, dt, t, _s, rest) => {
    // at rest (or at the end of the pass) the LEDs go back to their drawn state and stay
    // there: blinking on would toggle them at random on a frame that should write nothing
    if (p >= 1) restLeds(svg);
    else blink(dt, rest);
    const f = 0.9 * p;
    put(loopPath, f, f > fLap ? "pk--ink" : "", 1 - seg(p, 0.86, 1));
    move(commitNew, 0, 0, 1 + 0.35 * Math.sin(Math.PI * seg(f, 0, 0.06)));
    const inBuild = Math.abs(f - fBuild) < 0.05 && !rest;
    move(hatch, 0, inBuild ? Math.sin(t * 40) : 0);
    buildled?.classList.toggle("is-blink", inBuild && Math.sin(t * 30) > 0);
    const pp = seg(f, fLap, fLap + 0.08),
      out = seg(f, 0.94, 1);
    move(newpod, 0, 0, pp > 0 ? lerp(0.4, 1, E.outBack(pp, 2.2)) : 0.4);
    fade(newpod, Math.min(pp * 2.5, 1) * (1 - out));
    return false;
  };
};

/** The homelab family's animators, by drawing id (data-scene / data-card). */
export const animators = { loop, cardloop: cardLoop };
