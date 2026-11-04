/** Motion for the hosting platform scenes (drawn by src/lib/art/scenes/platform.ts). */
import { S1, S2, S3, S4, S5 } from "~/lib/art/scenes/platform.layout";
import { attr, hiddenPath, hideStill, fade, made, move, parts } from "../dom";
import { blinker, restLeds } from "../leds";
import { approach, clamp, ease as E, lerp, seg } from "../math";
import { emitter, packets, prime, track, type Packet, type Segment } from "../packets";
import { firstAlong } from "~/lib/art/geometry";
import type { SceneFactory } from "../types";

/* 1. Many projects, one platform: old servers sink away, the apps dock on one platform. */
const standard: SceneFactory = (svg) => {
  const K = parts(svg),
    blink = blinker(svg);
  const olds = S1.old.map((_, i) => K[`old${i}`]),
    wins = S1.old.map((_, i) => K[`win${i}`]),
    docks = [0, 1, 2, 3, 4].map((d) => K[`dock${d}`]),
    { win4, plat } = K;
  return (p, dt, _t, _s, rest) => {
    blink(dt, rest);
    S1.old.forEach((old, i) => {
      // the old servers sink away first
      const s = seg(p, 0.16 + i * 0.035, 0.28 + i * 0.035);
      move(olds[i], 0, 34 * E.inCubic(s));
      fade(olds[i], 1 - E.outQuad(s));
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
      move(wins[i], x, y, null, null, r);
    });
    // the fifth app is new: it flies in from the right
    const m4 = seg(p, 0.8, 0.97);
    move(
      win4,
      lerp(240, 0, E.outCubic(m4)),
      lerp(-34, 0, E.outBack(seg(m4, 0.45, 1), 1.5)) - 8 * Math.sin(Math.PI * m4),
      null,
      null,
      (1 - E.outCubic(m4)) * 5,
    );
    fade(win4, seg(p, 0.79, 0.85));
    const pl = seg(p, 0.36, 0.56);
    move(plat, 0, 120 * (1 - E.outBack(pl, 1.05)));
    fade(plat, seg(p, 0.36, 0.41));
    for (let d = 0; d < 5; d++) {
      const ds = seg(p, 0.48 + d * 0.04, 0.58 + d * 0.04);
      move(docks[d], 0, 0, 1, Math.max(0.001, E.outBack(ds, 2)));
      fade(docks[d], Math.min(1, ds * 4));
    }
    return false;
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
 *
 * Capacity follows the load a beat late, about the time a request takes to cross the drawing,
 * so you see the traffic arrive first and the pods answer it.
 *
 * Nothing in the frame loop allocates: zone counts are plain loops and the routes a request
 * can take are built once.
 */
function scaler(svg: SVGSVGElement, load: (p: number, t: number) => number, card = false) {
  const K = parts(svg),
    blink = blinker(svg);
  hideStill(svg);
  const pk = K["pk"] as SVGGElement,
    P = packets(pk),
    emit = emitter();
  const ins = [0, 1, 2].map((i) => K[`in${i}`] as SVGPathElement);
  const outs = [0, 1, 2].map((i) => K[`out${i}`] as SVGPathElement);
  prime(...ins, ...outs);
  // every way in, to every zone: [entry][zone]
  const routes: Segment[][][] = ins.map((el) => outs.map((out) => [{ el, cls: "" }, { el: out }]));
  const bias = [1.1, 1.3, 0.85];
  const Z: Zone[] = S2.racks.map((_, z) => {
    const zone: Zone = { nodes: [], pods: [], cool: 0, pend: K[`pend${z}`], pendA: 0, want: 1 };
    for (let k = 0; k < 4; k++) {
      zone.nodes.push({ el: K[`node${z}${k}`], st: "off", t: 9, idle: 0 });
      for (let s = 0; s < 4; s++) zone.pods.push({ el: K[`pod${z}${k}${s}`], on: false, t: 9, ack: 9 });
    }
    return zone;
  });
  let first = true;
  /** The load capacity has caught up with (it lags the real load, see above). */
  let capacity = 0;
  const target = (z: number, L: number): number => clamp(Math.round(1 + L * 11.5 * bias[z]!), 1, 16);
  const ready = (z: Zone): number => {
    let n = 0;
    for (const x of z.nodes) if (x.st === "on") n++;
    return n;
  };
  const placed = (z: Zone): number => {
    let n = 0;
    for (const x of z.pods) if (x.on) n++;
    return n;
  };

  function stepZone(z: Zone, dt: number): void {
    z.cool -= dt;
    const P0 = placed(z),
      R = ready(z),
      want = z.want;
    if (z.cool <= 0) {
      if (P0 < want) {
        if (P0 < R * 4) {
          for (let i = 0; i < z.pods.length; i++) {
            const pd = z.pods[i]!;
            if (pd.on || z.nodes[i >> 2]!.st !== "on") continue;
            pd.on = true;
            pd.t = 0;
            break;
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
        for (let i = z.pods.length - 1; i >= 0; i--) {
          const last = z.pods[i]!;
          if (!last.on) continue;
          last.on = false;
          last.t = 0;
          break;
        }
        z.cool = 0.1 + Math.random() * 0.1;
      }
    }
    // remove the top node once it has been empty for a moment
    for (let q = 3; q >= 1; q--) {
      const nd = z.nodes[q]!;
      if (nd.st !== "on") continue;
      let empty = true;
      for (let s = 0; s < 4; s++) if (z.pods[q * 4 + s]!.on) empty = false;
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

  /** Is any zone still changing (a node or pod on its way in or out, a request landing)? */
  function changing(): boolean {
    for (const z of Z) {
      if (placed(z) !== z.want || Math.abs(z.pendA - Math.round(z.pendA)) > 0.002) return true;
      for (const nd of z.nodes) if (nd.st === "in" || nd.st === "out") return true;
      for (const pd of z.pods) if (pd.t < 0.3 || pd.ack < 0.3) return true;
    }
    return false;
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

  // a request lands on one of its zone's running pods, which dims for a moment
  const landed = Z.map((zone) => () => {
    let on = 0;
    for (const x of zone.pods) if (x.on) on++;
    if (!on) return;
    let pick = (Math.random() * on) | 0;
    for (const x of zone.pods)
      if (x.on && pick-- === 0) {
        x.ack = 0;
        break;
      }
  });
  // requests go to a zone in proportion to its share of the load
  const fire = (): void => {
    const w0 = Z[0]!.want,
      w1 = Z[1]!.want,
      r = Math.random() * (w0 + w1 + Z[2]!.want);
    const zi = r < w0 ? 0 : r < w0 + w1 ? 1 : 2;
    P.spawn(routes[(Math.random() * 3) | 0]![zi]!, { speed: 190 + Math.random() * 70, end: landed[zi]! });
  };

  return (p: number, dt: number, t: number, rest: boolean): boolean => {
    const L = load(p, t);
    if (first) {
      settle(L);
      capacity = L;
      first = false;
    }
    capacity += (L - capacity) * approach(dt, 1.5);
    if (card && p >= 1) restLeds(svg);
    else blink(dt, rest);
    Z.forEach((z, zi) => {
      z.want = target(zi, capacity);
      for (const nd of z.nodes) nd.t += dt;
      for (const pd of z.pods) {
        pd.t += dt;
        pd.ack += dt;
      }
      stepZone(z, dt);
      draw(z, t);
    });
    // a card's pass winds down: no new requests near the end, and the last ones fade away
    emit(dt, rest || (card && p > 0.78) ? 0 : 1 + 9 * L, fire);
    const moving = P.update(dt, t, rest);
    if (card) fade(pk, 1 - seg(p, 0.86, 1));
    return moving || changing();
  };
}

// calm, a rush that peaks past the middle, then calm again
const scale: SceneFactory = (svg) => {
  const run = scaler(
    svg,
    (p) => 0.08 + 0.92 * (E.inOutCubic(seg(p, 0.08, 0.55)) * (1 - 0.72 * E.inOutCubic(seg(p, 0.68, 1)))),
  );
  return (p, dt, t, _s, rest) => run(p, dt, t, rest);
};

/* 3. Two regions, one entry. */
const regions: SceneFactory = (svg) => {
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
  // each lane, to each region (users in Japan go to Tokyo), built once
  const route = (i: number, jp: boolean): Segment[] => [
    { el: K[`route-in${i}`] as SVGPathElement, cls: jp ? "pk--cool" : "" },
    { el: (jp ? through.jp : through.ie)[i]! },
    { el: K[jp ? "route-jp" : "route-ie"] as SVGPathElement },
  ];
  const toIE = [0, 1, 2].map((i) => route(i, false)),
    toJP = [0, 1, 2].map((i) => route(i, true));
  for (const r of [...toIE, ...toJP]) prime(...r.map((x) => x.el));
  const fire = (): void => {
    const i = (Math.random() * 3) | 0;
    P.spawn((Math.random() < 0.3 ? toJP : toIE)[i]!, { speed: 170 + Math.random() * 60 });
  };
  const { globe, ie, jp, door, users, routes, lblIE, lblJP } = K;
  return (p, dt, t, _s, rest) => {
    blink(dt, rest);
    const gs = seg(p, 0, 0.3);
    move(globe, 0, 60 * (1 - E.outCubic(gs)));
    fade(globe, gs);
    const a = seg(p, 0.14, 0.34),
      b = seg(p, 0.26, 0.46);
    move(ie, 0, 0, lerp(0.5, 1, E.outBack(a, 2)));
    fade(ie, Math.min(1, a * 3));
    move(jp, 0, 0, lerp(0.5, 1, E.outBack(b, 2)));
    fade(jp, Math.min(1, b * 3));
    const d = seg(p, 0.4, 0.58);
    move(door, 0, -34 * (1 - E.outBack(d, 1.6)));
    fade(door, Math.min(1, d * 2.5));
    fade(users, seg(p, 0.5, 0.62));
    fade(routes, seg(p, 0.46, 0.6));
    fade(lblIE, seg(p, 0.64, 0.76));
    fade(lblJP, seg(p, 0.7, 0.82));
    move(lblIE, 6 * (1 - E.outCubic(seg(p, 0.64, 0.76))), 0);
    move(lblJP, -6 * (1 - E.outCubic(seg(p, 0.7, 0.82))), 0);
    emit(dt, !rest && p > 0.56 ? 4.2 * seg(p, 0.56, 0.7) : 0, fire);
    return P.update(dt, t, rest);
  };
};

/* 4. The IPv6 move: the tag flips, IPv4-only traffic is translated, the database waits at a gate. */
const ipv6: SceneFactory = (svg) => {
  const K = parts(svg);
  hideStill(svg);
  const layer = K["pk"] as SVGGElement;
  const P = packets(layer),
    eA = emitter(),
    eB = emitter(),
    blink = blinker(svg);
  const thruX = hiddenPath(layer.parentNode as Element, S4.thruX);
  const rdb = K["route-db"] as SVGPathElement;
  prime(K["route-to-xlat"], thruX, K["route-from-xlat"], rdb);
  // where the IPv6 path meets the gate
  const gateD = firstAlong(track(rdb), (x) => x >= S4.gateX - 13);
  let open = 0;
  /** Packets on their way to the database, oldest first. */
  const queue: Packet[] = [];
  const gateLed = K["bar-led"];
  const translated: Segment[] = [
    { el: K["route-to-xlat"] as SVGPathElement, cls: "" },
    { el: thruX, hide: true },
    { el: K["route-from-xlat"] as SVGPathElement, cls: "pk--ink" },
  ];
  const toDb: Segment[] = [{ el: rdb, cls: "" }];
  const fireA = (): void => void P.spawn(translated, { speed: 150 + Math.random() * 40 });
  // packets to the database queue up at the closed gate, one behind the other
  const stop = (me: Packet): number => {
    if (open > 0.55 || me.d > gateD + 0.5) return Infinity;
    let ahead = 0;
    for (const other of queue) {
      if (other === me) break;
      if (other.d <= gateD + 0.5) ahead++;
    }
    return gateD - ahead * 19;
  };
  const fireB = (): void => void queue.push(P.spawn(toDb, { speed: 140 + Math.random() * 40, stop }));
  const {
    tag,
    "tag-4": tag4,
    "tag-6": tag6,
    xlat,
    legacy,
    db,
    gate,
    bar,
    "route-to-xlat": toXlat,
    "route-from-xlat": fromXlat,
    "route-idle": idleRoute,
  } = K;
  return (p, dt, t, _s, rest) => {
    blink(dt, rest);
    // the address tag flips over
    const f = seg(p, 0.06, 0.24);
    move(
      tag,
      0,
      0,
      1,
      f < 0.5 ? Math.max(0.001, 1 - E.inCubic(f * 2)) : Math.max(0.001, E.outBack((f - 0.5) * 2, 2.2)),
    );
    fade(tag4, f < 0.5 ? 1 : 0);
    fade(tag6, f < 0.5 ? 0 : 1);
    const x1 = seg(p, 0.22, 0.34),
      x2 = seg(p, 0.28, 0.4);
    move(xlat, 0, 16 * (1 - E.outBack(x1, 1.6)));
    fade(xlat, x1);
    move(legacy, 0, 16 * (1 - E.outBack(x2, 1.6)));
    fade(legacy, x2);
    fade(toXlat, seg(p, 0.24, 0.34));
    fade(fromXlat, seg(p, 0.3, 0.4));
    const y1 = seg(p, 0.42, 0.54),
      y2 = seg(p, 0.48, 0.58);
    move(db, 0, 16 * (1 - E.outBack(y1, 1.6)));
    fade(db, y1);
    move(gate, 0, -12 * (1 - E.outBack(y2, 1.6)));
    fade(gate, y2);
    fade(rdb, seg(p, 0.44, 0.54));
    fade(idleRoute, seg(p, 0.48, 0.58));
    // the gate opens late in the step: a small dip first, then up with a settle
    const g = seg(p, 0.78, 0.92);
    open = g;
    const sy =
      g < 0.18 ? 1 + 0.07 * Math.sin((g / 0.18) * Math.PI) : 1 - 0.9 * E.outBack((g - 0.18) / 0.82, 1.4);
    move(bar, 0, 0, 1, clamp(sy, 0.04, 1.1));
    gateLed?.classList.toggle("is-open", g > 0.6);
    eA(dt, !rest && p > 0.36 ? 1.5 : 0, fireA);
    // drop the ones that arrived (in place, oldest first), and count who's still waiting
    let queued = 0;
    for (let j = queue.length - 1; j >= 0; j--) {
      const k = queue[j]!;
      if (!P.live.includes(k)) queue.splice(j, 1);
      else if (k.d < gateD + 1) queued++;
    }
    eB(dt, !rest && p > 0.56 && (open > 0.5 || queued < 4) ? 1.3 : 0, fireB);
    return P.update(dt, t, rest);
  };
};

/* 5. One change, every cluster: a commit travels the spine and each cluster flips its flag. */
const learned: SceneFactory = (svg) => {
  const K = parts(svg),
    blink = blinker(svg);
  const { x0, y, cols, cw, stubUp, stubDown } = S5;
  const spine = cols[3]! + cw / 2 - x0,
    total = spine + stubUp;
  const dots: SVGCircleElement[] = [];
  for (let i = 0; i < 9; i++) {
    const c = made("circle");
    c.setAttribute("r", "4.5");
    c.setAttribute("class", "k-pulse");
    c.style.opacity = "0";
    K["pk"]!.appendChild(c);
    dots.push(c);
  }
  const lit = [0, 1, 2, 3, 4, 5, 6, 7].map((s) => K[`lit${s}`]),
    cl = lit.map((_, s) => [K[`cluster${s}`], K[`cluster${s}-old`], K[`cluster${s}-new`]] as const),
    { commit, "lit-spine": litSpine } = K;
  return (p, dt, _t, _s, rest) => {
    blink(dt, rest);
    const cs = seg(p, 0.04, 0.2);
    move(commit, 0, -44 * (1 - E.outBack(cs, 1.8)), lerp(0.4, 1, E.outBack(cs, 1.8)));
    fade(commit, Math.min(1, cs * 3));
    const D = seg(p, 0.22, 0.8) * total;
    move(litSpine, 0, 0, Math.max(0.001, clamp(D / (spine + 52), 0, 1)), 1);
    const front = x0 + D,
      head = dots[8]!;
    attr(head, "cx", Math.min(front, cols[3]! + cw / 2));
    attr(head, "cy", y);
    fade(head, D > 0 && D < spine ? 1 : 0);
    for (let s = 0; s < 8; s++) {
      const up = s % 2 === 0,
        len = up ? stubUp : stubDown,
        sx = cols[s >> 1]! + cw / 2;
      const q = clamp((D - (sx - x0)) / len, 0, 1);
      move(lit[s], 0, 0, 1, Math.max(0.001, q));
      attr(dots[s], "cx", sx);
      attr(dots[s], "cy", y + (up ? -1 : 1) * q * len);
      fade(dots[s], q > 0 && q < 1 ? 1 : 0);
      // a cluster updates once the pulse reaches it: a small hop and a new flag
      const arrive = 0.22 + ((sx - x0 + len) / total) * 0.58;
      const u = seg(p, arrive, arrive + 0.08);
      const c = cl[s]!;
      move(c[0], 0, -7 * Math.sin(Math.PI * u));
      fade(c[1], 1 - u);
      move(c[2], 0, 0, 1, Math.max(0.001, E.outBack(u, 2.4)));
      fade(c[2], Math.min(1, u * 3));
    }
    return false;
  };
};

/** The platform card: a rush of traffic arrives and the pods scale up for it, then calm again. */
const cardScale: SceneFactory = (svg) => {
  const run = scaler(
    svg,
    (p) => 0.3 + 0.55 * (E.inOutCubic(seg(p, 0.04, 0.3)) * (1 - E.inOutCubic(seg(p, 0.4, 0.62)))),
    true,
  );
  return (p, dt, t, _s, rest) => run(p, dt, t, rest);
};

/** The platform family's animators, by drawing id (data-scene / data-card). */
export const animators = { standard, scale, regions, ipv6, learned, cardscale: cardScale };
