/** Motion for the homelab scene and the homelab homepage card. */
import { CL, H } from "~/lib/art/scenes/homelab.layout";
import { fade, fadeTowards, hideStill, move, parts } from "../dom";
import { blinker, restLeds } from "../leds";
import { clamp, ease as E, lerp, seg } from "../math";
import { courier, prime, track } from "../packets";
import { firstAlong } from "~/lib/art/geometry";
import type { SceneFactory } from "../types";

type Path = SVGPathElement;

/**
 * One change, git push to running. Scroll moves a single packet along its journey. The route
 * it's on lights up in amber with a dash flowing its way, and each machine's label nods as the
 * packet arrives, so something answers every bit of scroll.
 */
export const loop: SceneFactory = (svg) => {
  const K = parts(svg),
    blink = blinker(svg);
  hideStill(svg);
  const put = courier(K["pk"] as SVGGElement);
  const r = (k: keyof typeof H.routes): Path => K[`r-${k}`] as Path;
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
  const hot = legs.map(([route]) => {
    const h = route.cloneNode() as Path;
    h.removeAttribute("data-k");
    h.setAttribute("class", "k-route-hot");
    h.style.opacity = "0";
    route.after(h);
    return h;
  });
  const arrivals = legs.map(([, , end, , key]) => ({ el: K[key], end }));
  return (p, dt, t) => {
    blink(dt);
    legs.forEach(([, a0, a1], i) => {
      // lit from just before the packet sets off until just after it arrives; the push route
      // lights again when the tag commit's build comes back round to the gate
      const on = (p > a0 - 0.01 && p < a1 + 0.015) || (i === 0 && p > 0.77 && p < 0.92);
      fadeTowards(hot[i], on ? 0.95 : 0, dt, 9);
      hot[i]!.classList.toggle("is-hot", on);
    });
    for (const { el, end } of arrivals) {
      const u = seg(p, end - 0.004, end + 0.045),
        bump = Math.sin(Math.PI * u);
      move(el, 0, 0, 1 + 0.1 * bump);
      el?.classList.toggle("is-ping", bump > 0.15);
    }
    const a = seg(p, 0, 0.05);
    move(K["c-push"], 0, 0, lerp(0.3, 1, E.outBack(a, 2.4)));
    fade(K["c-push"], Math.min(1, a * 3));
    // the build works while the packet is inside
    const bw = seg(p, 0.16, 0.24),
      busy = bw > 0 && bw < 1;
    move(K["hatch"], 0, busy ? Math.sin(t * 40) * 1.2 : 0);
    K["buildled"]?.classList.toggle("is-blink", busy && Math.sin(t * 30) > 0);
    const cr = seg(p, 0.29, 0.35);
    move(K["crate"], 0, -26 * (1 - E.outBack(cr, 1.8)));
    fade(K["crate"], Math.min(1, cr * 3));
    fade(K["r-watch"], 0.35 + 0.65 * Math.sin(Math.PI * seg(p, 0.33, 0.44)));
    const tg = seg(p, 0.5, 0.55);
    move(K["c-tag"], 0, 0, lerp(0.3, 1, E.outBack(tg, 2.4)));
    fade(K["c-tag"], Math.min(1, tg * 3));
    const sw = seg(p, 0.64, 0.74);
    fade(K["oldpod"], 1 - seg(sw, 0, 0.4));
    move(K["oldpod"], 0, 0, lerp(1, 0.6, seg(sw, 0, 0.4)));
    move(K["newpod"], 0, 0, lerp(0.4, 1, E.outBack(seg(sw, 0.3, 1), 2.2)));
    fade(K["newpod"], seg(sw, 0.3, 0.6));
    // the loop: the gate shows up, closes, and the tag commit's build waits there and gives up
    const gs = seg(p, 0.74, 0.8),
      gc = seg(p, 0.76, 0.86);
    fade(K["gate"], gs);
    move(
      K["bar"],
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
        stopF * E.outCubic(w) + (wait > 0 && wait < 1 ? Math.sin(t * 22) * 0.012 : 0),
        "pk--ink",
        1 - E.inCubic(seg(p, 0.9, 0.98)),
      );
      return;
    }
    let leg: (typeof legs)[number] | undefined;
    for (const l of legs) if (p >= l[1] && p < l[2]) leg = l;
    if (leg) put(leg[0], E.inOutCubic(seg(p, leg[1], leg[2])), leg[3]);
    else put();
  };
};

/**
 * Homepage card: one change goes round the loop, once. `p` is the card's pass (0..1, see
 * controller.ts): a new commit, the build, the pod landing on the laptop, and the packet
 * heading home and fading out. It rests on the new pod running.
 */
export const cardLoop: SceneFactory = (svg) => {
  const K = parts(svg),
    blink = blinker(svg);
  hideStill(svg);
  const loopPath = K["loop"] as Path,
    put = courier(K["pk"] as SVGGElement);
  const fBuild = CL.buildAt,
    fLap = CL.laptopAt;
  return (p, dt, t) => {
    if (p >= 1) restLeds(svg);
    else blink(dt);
    const f = 0.9 * p;
    put(loopPath, f, f > fLap ? "pk--ink" : "", 1 - seg(p, 0.86, 1));
    move(K["c-new"], 0, 0, 1 + 0.35 * Math.sin(Math.PI * seg(f, 0, 0.06)));
    const inBuild = Math.abs(f - fBuild) < 0.05;
    move(K["hatch"], 0, inBuild ? Math.sin(t * 40) : 0);
    K["buildled"]?.classList.toggle("is-blink", inBuild && Math.sin(t * 30) > 0);
    const pp = seg(f, fLap, fLap + 0.08),
      out = seg(f, 0.94, 1);
    move(K["newpod"], 0, 0, pp > 0 ? lerp(0.4, 1, E.outBack(pp, 2.2)) : 0.4);
    fade(K["newpod"], Math.min(pp * 2.5, 1) * (1 - out));
  };
};
