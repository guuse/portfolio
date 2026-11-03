/** Motion for the hosting platform scenes (drawn by src/lib/art/scenes/platform.ts). */
import { S1, S2, S3, S4, S5 } from "~/lib/art/scenes/platform.layout";
import { hiddenPath, hideStill, fade, move, parts, SVG_NS } from "../dom";
import { blinker } from "../leds";
import { approach, clamp, ease as E, lerp, seg } from "../math";
import { emitter, packets, type Packet } from "../packets";
import type { SceneFactory } from "../types";

/* 1. Many projects, one platform: old servers sink away, the apps dock on one platform. */
export const standard: SceneFactory = (svg) => {
  const K = parts(svg),
    blink = blinker(svg);
  return (p, dt) => {
    blink(dt);
    S1.old.forEach((old, i) => {
      // the old servers sink away first
      const s = seg(p, 0.16 + i * 0.035, 0.28 + i * 0.035);
      move(K[`old${i}`], 0, 34 * E.inCubic(s));
      fade(K[`old${i}`], 1 - E.outQuad(s));
      // each app lifts off to one shared hover line (a small dip first), then drops into its dock
      const dx = old.cx - S1.docks[i]!,
        dy = old.y - S1.dockY,
        hover = -34;
      const lift = E.inOutBack(seg(p, 0.08 + i * 0.03, 0.26 + i * 0.03));
      const m = seg(p, 0.5 + i * 0.06, 0.68 + i * 0.06),
        mx = E.inOutCubic(m);
      const x = lerp(dx, 0, mx);
      const y =
        m > 0 ? lerp(hover, 0, E.outBack(m, 1.5)) - 10 * Math.sin(Math.PI * mx) : lerp(dy, hover, lift);
      const r =
        lerp(old.r, 0, E.inOutCubic(seg(p, 0.2 + i * 0.03, 0.4 + i * 0.03))) +
        (m > 0 && m < 1 ? Math.sin(m * Math.PI) * 3 * (dx > 0 ? -1 : 1) : 0);
      move(K[`win${i}`], x, y, null, null, r);
    });
    // the fifth app is new: it flies in from the right
    const m4 = seg(p, 0.8, 0.97);
    move(
      K["win4"],
      lerp(240, 0, E.outCubic(m4)),
      lerp(-34, 0, E.outBack(seg(m4, 0.45, 1), 1.5)) - 8 * Math.sin(Math.PI * m4),
      null,
      null,
      (1 - E.outCubic(m4)) * 5,
    );
    fade(K["win4"], seg(p, 0.79, 0.85));
    const pl = seg(p, 0.36, 0.56);
    move(K["plat"], 0, 120 * (1 - E.outBack(pl, 1.05)));
    fade(K["plat"], seg(p, 0.36, 0.41));
    for (let d = 0; d < 5; d++) {
      const ds = seg(p, 0.48 + d * 0.04, 0.58 + d * 0.04);
      move(K[`dock${d}`], 0, 0, 1, Math.max(0.001, E.outBack(ds, 2)));
      fade(K[`dock${d}`], Math.min(1, ds * 4));
    }
  };
};

/* 2. It scales with the load. */
type NodeState = "off" | "in" | "on" | "out";
interface Zone {
  nodes: { el: SVGGraphicsElement | undefined; st: NodeState; t: number; idle: number }[];
  pods: { el: SVGGraphicsElement | undefined; on: boolean; t: number; ack: number }[];
  cool: number;
  pend: SVGGraphicsElement | undefined;
  pendA: number;
  want: number;
}

/**
 * Each zone holds up to four nodes of four pods. When pods don't fit, one waits above the
 * rack (pending) until a node is added; when the load drops, pods drain from the top node and
 * the empty node is removed. Pods fill and drain one at a time. `load` maps progress and time
 * to 0..1, so the same machinery serves the scroll scene and the time-based homepage card.
 */
export function scaler(svg: SVGSVGElement, load: (p: number, t: number) => number) {
  const K = parts(svg),
    blink = blinker(svg);
  hideStill(svg);
  const P = packets(K["pk"] as SVGGElement),
    emit = emitter();
  const ins = [0, 1, 2].map((i) => K[`in${i}`] as SVGPathElement);
  const outs = [0, 1, 2].map((i) => K[`out${i}`] as SVGPathElement);
  const bias = [1.1, 1.3, 0.85];
  const Z: Zone[] = S2.racks.map((_, z) => {
    const zone: Zone = { nodes: [], pods: [], cool: 0, pend: K[`pend${z}`], pendA: 0, want: 1 };
    for (let k = 0; k < 4; k++) {
      zone.nodes.push({ el: K[`n${z}${k}`], st: "off", t: 9, idle: 0 });
      for (let s = 0; s < 4; s++) zone.pods.push({ el: K[`p${z}${k}${s}`], on: false, t: 9, ack: 9 });
    }
    return zone;
  });
  let first = true;
  const target = (z: number, L: number): number => clamp(Math.round(1 + L * 11.5 * bias[z]!), 1, 16);
  const ready = (z: Zone): number => z.nodes.filter((x) => x.st === "on").length;
  const placed = (z: Zone): number => z.pods.filter((x) => x.on).length;

  function stepZone(z: Zone, dt: number): void {
    z.cool -= dt;
    const P0 = placed(z),
      R = ready(z),
      want = z.want;
    if (z.cool <= 0) {
      if (P0 < want) {
        if (P0 < R * 4) {
          const pd = z.pods.find((x, i) => !x.on && z.nodes[i >> 2]!.st === "on");
          if (pd) {
            pd.on = true;
            pd.t = 0;
          }
          z.cool = 0.07 + Math.random() * 0.08;
        } else {
          if (!z.nodes.some((x) => x.st === "in")) {
            const off = z.nodes.find((x) => x.st === "off");
            if (off) {
              off.st = "in";
              off.t = 0;
            }
          }
          z.cool = 0.1;
        }
      } else if (P0 > want) {
        const last = [...z.pods].reverse().find((x) => x.on);
        if (last) {
          last.on = false;
          last.t = 0;
        }
        z.cool = 0.1 + Math.random() * 0.1;
      }
    }
    // remove the top node once it has been empty for a moment
    for (let q = 3; q >= 1; q--) {
      const nd = z.nodes[q]!;
      if (nd.st !== "on") continue;
      const empty = [0, 1, 2, 3].every((s) => !z.pods[q * 4 + s]!.on);
      const above = q < 3 && z.nodes[q + 1]!.st !== "off";
      nd.idle = empty && !above && want <= q * 4 ? nd.idle + dt : 0;
      if (nd.idle > 0.6) {
        nd.st = "out";
        nd.t = 0;
      }
      break;
    }
    const pendOn = P0 < want && P0 >= R * 4 ? 1 : 0;
    z.pendA += (pendOn - z.pendA) * approach(dt, 10);
  }

  function draw(z: Zone, t: number): void {
    for (const nd of z.nodes) {
      if (nd.st === "in") {
        const a = clamp(nd.t / 0.6, 0, 1);
        move(nd.el, 0, -30 * (1 - E.outBack(a, 1.6)));
        fade(nd.el, clamp(a * 3, 0, 1));
        if (a >= 1) nd.st = "on";
      } else if (nd.st === "out") {
        const b = clamp(nd.t / 0.45, 0, 1);
        move(nd.el, 0, -22 * E.inCubic(b));
        fade(nd.el, 1 - E.outQuad(b));
        if (b >= 1) nd.st = "off";
      } else {
        move(nd.el, 0, 0);
        fade(nd.el, nd.st === "on" ? 1 : 0);
      }
    }
    for (const pd of z.pods) {
      // a pod dims for a moment when a request lands on it
      const ack = 1 - 0.35 * Math.max(0, 1 - pd.ack / 0.3);
      if (pd.on) {
        const a = clamp(pd.t / 0.3, 0, 1);
        move(pd.el, 0, 0, lerp(0.4, 1, E.outBack(a, 2.2)));
        fade(pd.el, clamp(a * 2.5, 0, 1) * ack);
      } else {
        const b = clamp(pd.t / 0.22, 0, 1);
        move(pd.el, 0, 0, lerp(1, 0.55, b));
        fade(pd.el, 1 - b);
      }
    }
    move(z.pend, 0, Math.sin(t * 4) * 2.5);
    fade(z.pend, z.pendA);
  }

  // jump straight to the state for the current load, so the first frame isn't a rush of pods
  function settle(L: number): void {
    Z.forEach((z, zi) => {
      const w = target(zi, L),
        nn = Math.max(1, Math.ceil(w / 4));
      z.want = w;
      z.nodes.forEach((nd, k) => {
        nd.st = k < nn ? "on" : "off";
        nd.t = 9;
      });
      z.pods.forEach((pd, i) => {
        pd.on = i < w;
        pd.t = 9;
      });
    });
  }

  return (p: number, dt: number, t: number): void => {
    const L = load(p, t);
    if (first) {
      settle(L);
      first = false;
    }
    blink(dt);
    Z.forEach((z, zi) => {
      z.want = target(zi, L);
      for (const nd of z.nodes) nd.t += dt;
      for (const pd of z.pods) {
        pd.t += dt;
        pd.ack += dt;
      }
      stepZone(z, dt);
      draw(z, t);
    });
    emit(dt, 1 + 9 * L, () => {
      // requests go to a zone in proportion to its share of the load
      const w = Z.map((z) => z.want),
        sum = w[0]! + w[1]! + w[2]!,
        r = Math.random() * sum;
      const zi = r < w[0]! ? 0 : r < w[0]! + w[1]! ? 1 : 2;
      P.spawn([{ el: ins[(Math.random() * 3) | 0]!, cls: "" }, { el: outs[zi]! }], {
        speed: 190 + Math.random() * 70,
        end: () => {
          const on = Z[zi]!.pods.filter((x) => x.on);
          if (on.length) on[(Math.random() * on.length) | 0]!.ack = 0;
        },
      });
    });
    P.update(dt, t);
  };
}

// calm, a rush that peaks past the middle, then calm again
export const scale: SceneFactory = (svg) =>
  scaler(
    svg,
    (p) => 0.08 + 0.92 * (E.inOutCubic(seg(p, 0.08, 0.55)) * (1 - 0.72 * E.inOutCubic(seg(p, 0.68, 1)))),
  );

/* 3. Two regions, one entry. */
export const regions: SceneFactory = (svg) => {
  const K = parts(svg);
  hideStill(svg);
  const layer = K["pk"] as SVGGElement;
  const P = packets(layer),
    emit = emitter(),
    blink = blinker(svg);
  // the three lanes through the door fan out towards one of the two regions
  const through = {
    ie: S3.lanes.map((x) => hiddenPath(layer.parentNode as Element, `M${x} 122C${x} 160 288 162 288 200`)),
    jp: S3.lanes.map((x) => hiddenPath(layer.parentNode as Element, `M${x} 122C${x} 160 312 162 312 200`)),
  };
  return (p, dt, t) => {
    blink(dt);
    const gs = seg(p, 0, 0.3);
    move(K["globe"], 0, 60 * (1 - E.outCubic(gs)));
    fade(K["globe"], gs);
    const a = seg(p, 0.14, 0.34),
      b = seg(p, 0.26, 0.46);
    move(K["ie"], 0, 0, lerp(0.5, 1, E.outBack(a, 2)));
    fade(K["ie"], Math.min(1, a * 3));
    move(K["jp"], 0, 0, lerp(0.5, 1, E.outBack(b, 2)));
    fade(K["jp"], Math.min(1, b * 3));
    const d = seg(p, 0.4, 0.58);
    move(K["door"], 0, -34 * (1 - E.outBack(d, 1.6)));
    fade(K["door"], Math.min(1, d * 2.5));
    fade(K["users"], seg(p, 0.5, 0.62));
    fade(K["routes"], seg(p, 0.46, 0.6));
    fade(K["lblIE"], seg(p, 0.64, 0.76));
    fade(K["lblJP"], seg(p, 0.7, 0.82));
    move(K["lblIE"], 6 * (1 - E.outCubic(seg(p, 0.64, 0.76))), 0);
    move(K["lblJP"], -6 * (1 - E.outCubic(seg(p, 0.7, 0.82))), 0);
    emit(dt, p > 0.56 ? 4.2 * seg(p, 0.56, 0.7) : 0, () => {
      const i = (Math.random() * 3) | 0,
        jp = Math.random() < 0.3;
      P.spawn(
        [
          { el: K[`ri${i}`] as SVGPathElement, cls: jp ? "pk--cool" : "" },
          { el: (jp ? through.jp : through.ie)[i]! },
          { el: K[jp ? "rjp" : "rie"] as SVGPathElement },
        ],
        {
          speed: 170 + Math.random() * 60,
        },
      );
    });
    P.update(dt, t);
  };
};

/* 4. The IPv6 move: the tag flips, IPv4-only traffic is translated, the database waits at a gate. */
export const ipv6: SceneFactory = (svg) => {
  const K = parts(svg);
  hideStill(svg);
  const layer = K["pk"] as SVGGElement;
  const P = packets(layer),
    eA = emitter(),
    eB = emitter(),
    blink = blinker(svg);
  const thruX = hiddenPath(layer.parentNode as Element, S4.thruX);
  const rdb = K["rdb"] as SVGPathElement;
  // where the IPv6 path meets the gate
  const dbL = rdb.getTotalLength();
  let gateD = dbL;
  for (let d = 0; d < dbL; d += 1) {
    if (rdb.getPointAtLength(d).x >= S4.gateX - 13) {
      gateD = d;
      break;
    }
  }
  let open = 0;
  let queue: Packet[] = [];
  const gateLed = K["bar-led"];
  return (p, dt, t) => {
    blink(dt);
    // the address tag flips over
    const f = seg(p, 0.06, 0.24);
    move(
      K["tag"],
      0,
      0,
      1,
      f < 0.5 ? Math.max(0.001, 1 - E.inCubic(f * 2)) : Math.max(0.001, E.outBack((f - 0.5) * 2, 2.2)),
    );
    fade(K["tag-4"], f < 0.5 ? 1 : 0);
    fade(K["tag-6"], f < 0.5 ? 0 : 1);
    const x1 = seg(p, 0.22, 0.34),
      x2 = seg(p, 0.28, 0.4);
    move(K["xlat"], 0, 16 * (1 - E.outBack(x1, 1.6)));
    fade(K["xlat"], x1);
    move(K["legacy"], 0, 16 * (1 - E.outBack(x2, 1.6)));
    fade(K["legacy"], x2);
    fade(K["rx"], seg(p, 0.24, 0.34));
    fade(K["rf"], seg(p, 0.3, 0.4));
    const y1 = seg(p, 0.42, 0.54),
      y2 = seg(p, 0.48, 0.58);
    move(K["db"], 0, 16 * (1 - E.outBack(y1, 1.6)));
    fade(K["db"], y1);
    move(K["gate"], 0, -12 * (1 - E.outBack(y2, 1.6)));
    fade(K["gate"], y2);
    fade(rdb, seg(p, 0.44, 0.54));
    fade(K["ridle"], seg(p, 0.48, 0.58));
    // the gate opens late in the step: a small dip first, then up with a settle
    const g = seg(p, 0.78, 0.92);
    open = g;
    const sy =
      g < 0.18 ? 1 + 0.07 * Math.sin((g / 0.18) * Math.PI) : 1 - 0.9 * E.outBack((g - 0.18) / 0.82, 1.4);
    move(K["bar"], 0, 0, 1, clamp(sy, 0.04, 1.1));
    gateLed?.classList.toggle("is-open", g > 0.6);
    eA(dt, p > 0.36 ? 1.5 : 0, () => {
      P.spawn(
        [
          { el: K["rx"] as SVGPathElement, cls: "" },
          { el: thruX, hide: true },
          { el: K["rf"] as SVGPathElement, cls: "pk--ink" },
        ],
        { speed: 150 + Math.random() * 40 },
      );
    });
    // packets to the database queue up at the closed gate, one behind the other
    queue = queue.filter((k) => P.live.includes(k));
    const queued = queue.filter((k) => k.d < gateD + 1).length;
    eB(dt, p > 0.56 && (open > 0.5 || queued < 4) ? 1.3 : 0, () => {
      const k = P.spawn([{ el: rdb, cls: "" }], {
        speed: 140 + Math.random() * 40,
        stop: (me) => {
          if (open > 0.55 || me.d > gateD + 0.5) return Infinity;
          let ahead = 0;
          for (const other of queue) {
            if (other === me) break;
            if (other.d <= gateD + 0.5) ahead++;
          }
          return gateD - ahead * 19;
        },
      });
      queue.push(k);
    });
    P.update(dt, t);
  };
};

/* 5. One change, every cluster: a commit travels the spine and each cluster flips its flag. */
export const learned: SceneFactory = (svg) => {
  const K = parts(svg),
    blink = blinker(svg);
  const { x0, y, cols, cw, stubUp, stubDown } = S5;
  const spine = cols[3]! + cw / 2 - x0,
    total = spine + stubUp;
  const dots: SVGCircleElement[] = [];
  for (let i = 0; i < 9; i++) {
    const c = document.createElementNS(SVG_NS, "circle");
    c.setAttribute("r", "4.5");
    c.setAttribute("class", "k-pulse");
    c.style.opacity = "0";
    K["pk"]!.appendChild(c);
    dots.push(c);
  }
  return (p, dt) => {
    blink(dt);
    const cs = seg(p, 0.04, 0.2);
    move(K["commit"], 0, -44 * (1 - E.outBack(cs, 1.8)), lerp(0.4, 1, E.outBack(cs, 1.8)));
    fade(K["commit"], Math.min(1, cs * 3));
    const D = seg(p, 0.22, 0.8) * total;
    move(K["lit-spine"], 0, 0, Math.max(0.001, clamp(D / (spine + 52), 0, 1)), 1);
    const front = x0 + D,
      head = dots[8]!;
    head.setAttribute("cx", String(Math.min(front, cols[3]! + cw / 2)));
    head.setAttribute("cy", String(y));
    fade(head, D > 0 && D < spine ? 1 : 0);
    for (let s = 0; s < 8; s++) {
      const up = s % 2 === 0,
        len = up ? stubUp : stubDown,
        sx = cols[s >> 1]! + cw / 2;
      const q = clamp((D - (sx - x0)) / len, 0, 1);
      move(K[`lit${s}`], 0, 0, 1, Math.max(0.001, q));
      dots[s]!.setAttribute("cx", String(sx));
      dots[s]!.setAttribute("cy", String(y + (up ? -1 : 1) * q * len));
      fade(dots[s], q > 0 && q < 1 ? 1 : 0);
      // a cluster updates once the pulse reaches it: a small hop and a new flag
      const arrive = 0.22 + ((sx - x0 + len) / total) * 0.58;
      const u = seg(p, arrive, arrive + 0.08);
      move(K[`c${s}`], 0, -7 * Math.sin(Math.PI * u));
      fade(K[`c${s}-old`], 1 - u);
      move(K[`c${s}-new`], 0, 0, 1, Math.max(0.001, E.outBack(u, 2.4)));
      fade(K[`c${s}-new`], Math.min(1, u * 3));
    }
  };
};
