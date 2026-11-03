/**
 * Packets: small capsules that travel along routes. Linear on purpose (packets move at line
 * rate), they fade in when they appear and out at the end of their last segment.
 */
import { PACKET_PARTS } from "~/lib/art/packet";
import { fade, SVG_NS } from "./dom";
import { clamp } from "./math";

const DEG = 180 / Math.PI;

export interface Segment {
  el: SVGPathElement | SVGGeometryElement;
  /** Packet class from this segment on (e.g. "pk--ink" after a reply). */
  cls?: string;
  /** Travel this segment invisibly (inside a device). */
  hide?: boolean;
  len?: number;
}

export interface Packet {
  segs: Segment[];
  i: number;
  /** Distance along the current segment. */
  d: number;
  v: number;
  g: SVGGElement;
  cls: string;
  age: number;
  /** A random phase, so waiting packets don't jitter in sync. */
  ph: number;
  /** Seconds spent held back by `stop`. */
  wait: number;
  stop?: ((k: Packet) => number) | undefined;
  end?: ((k: Packet) => void) | undefined;
  autofade?: boolean | undefined;
}

export interface SpawnOptions {
  speed?: number;
  /** The furthest distance along the current segment the packet may go (a closed gate). */
  stop?: (k: Packet) => number;
  end?: (k: Packet) => void;
  /** Fade out over the first segment instead of at the end (for answers nobody gives). */
  autofade?: boolean;
}

function packetEl(): SVGGElement {
  const g = document.createElementNS(SVG_NS, "g");
  for (const part of PACKET_PARTS) {
    const el = document.createElementNS(SVG_NS, part.tag);
    for (const [k, v] of Object.entries(part.attrs)) el.setAttribute(k, v);
    g.appendChild(el);
  }
  return g;
}

/** Positions a packet on a path at distance d, pointing along it. */
function place(g: SVGGElement, el: SVGGeometryElement, d: number, len: number, jitter = 0): void {
  const a = el.getPointAtLength(d),
    b = el.getPointAtLength(Math.min(len, d + 1.5));
  let ang = Math.atan2(b.y - a.y, b.x - a.x) * DEG;
  if (d + 1.5 > len && d > 1.5) {
    const c = el.getPointAtLength(d - 1.5);
    ang = Math.atan2(a.y - c.y, a.x - c.x) * DEG;
  }
  const x = a.x + jitter * Math.cos(ang / DEG),
    y = a.y + jitter * Math.sin(ang / DEG);
  g.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${ang.toFixed(1)})`);
}

/** A pool of packets flowing through one layer of a drawing. */
export function packets(layer: SVGGElement) {
  const live: Packet[] = [];
  const pool: SVGGElement[] = [];

  function spawn(segs: Segment[], o: SpawnOptions = {}): Packet {
    for (const s of segs) s.len ??= s.el.getTotalLength();
    const g = pool.pop() ?? packetEl();
    const cls = segs[0]?.cls ?? "";
    g.setAttribute("class", `pk ${cls}`);
    g.style.opacity = "0";
    layer.appendChild(g);
    const k: Packet = {
      segs,
      i: 0,
      d: 0,
      v: o.speed ?? 200,
      g,
      cls,
      stop: o.stop,
      end: o.end,
      age: 0,
      ph: Math.random() * 6,
      wait: 0,
      autofade: o.autofade,
    };
    live.push(k);
    return k;
  }

  function update(dt: number, t: number): void {
    for (let j = live.length - 1; j >= 0; j--) {
      const k = live[j]!;
      let s = k.segs[k.i]!;
      k.age += dt;
      const lim = k.stop ? k.stop(k) : Infinity;
      let nd = k.d + k.v * dt;
      if (nd > lim) {
        nd = Math.max(k.d, lim);
        k.wait += dt;
      } else k.wait = 0;
      k.d = nd;
      if (k.d >= s.len!) {
        k.d -= s.len!;
        k.i++;
        if (k.i >= k.segs.length) {
          k.end?.(k);
          layer.removeChild(k.g);
          pool.push(k.g);
          live.splice(j, 1);
          continue;
        }
        s = k.segs[k.i]!;
        if (s.cls !== undefined && s.cls !== k.cls) {
          k.g.setAttribute("class", `pk ${s.cls}`);
          k.cls = s.cls;
        }
      }
      // waiting at a gate: it keeps retrying
      const jitter = k.wait > 0.25 ? Math.sin(t * 22 + k.ph) * 1.3 : 0;
      place(k.g, s.el, k.d, s.len!, jitter);
      const fadeIn = clamp(k.age / 0.18, 0, 1);
      const fadeOut = k.i === k.segs.length - 1 ? clamp((s.len! - k.d) / 14, 0, 1) : 1;
      const auto = k.autofade ? clamp(1.7 - 2.2 * (k.d / s.len!), 0, 1) : 1;
      fade(k.g, s.hide ? 0 : fadeIn * fadeOut * auto);
    }
  }

  return { spawn, update, live };
}

export type Packets = ReturnType<typeof packets>;

/** Fires at a varying interval around a mean rate (per second); never perfectly regular. */
export function emitter(): (dt: number, rate: number, fire: () => void) => void {
  let acc = 0,
    gap = 0.3;
  return (dt, rate, fire) => {
    if (rate <= 0) return;
    acc += dt;
    while (acc >= gap) {
      acc -= gap;
      fire();
      gap = (0.45 + Math.random() * 1.1) / rate;
    }
  };
}

/**
 * One packet placed by scroll progress, for scenes that follow a single change on its way.
 * Call with no element to hide it.
 */
export function courier(
  layer: SVGGElement,
): (el?: SVGGeometryElement, f?: number, cls?: string, opacity?: number) => void {
  const g = packetEl();
  g.style.opacity = "0";
  layer.appendChild(g);
  const lengths = new WeakMap<SVGGeometryElement, number>();
  let current: string | null = null;
  return (el, f = 0, cls = "", opacity = 1) => {
    if (!el) {
      fade(g, 0);
      return;
    }
    if (current !== cls) {
      g.setAttribute("class", `pk ${cls}`);
      current = cls;
    }
    let len = lengths.get(el);
    if (len === undefined) lengths.set(el, (len = el.getTotalLength()));
    const d = clamp(f, 0, 1) * len;
    const a = el.getPointAtLength(d),
      b = el.getPointAtLength(Math.min(len, d + 1.5));
    let ang = Math.atan2(b.y - a.y, b.x - a.x) * DEG;
    if (f >= 0.999) {
      const q = el.getPointAtLength(len - 1.5);
      ang = Math.atan2(a.y - q.y, a.x - q.x) * DEG;
    }
    g.setAttribute("transform", `translate(${a.x.toFixed(2)} ${a.y.toFixed(2)}) rotate(${ang.toFixed(1)})`);
    fade(g, opacity);
  };
}
