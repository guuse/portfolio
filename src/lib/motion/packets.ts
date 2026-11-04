/**
 * Packets: small capsules that travel along routes. Linear on purpose (packets move at line
 * rate), they fade in when they appear and out at the end of their last segment.
 *
 * Nothing ever asks the DOM where a path goes: each route's `d` is sampled once into a lookup
 * table (track(); the sampler is in ~/lib/art/geometry) when an animator is built or a packet
 * first uses it, and packets are placed by interpolating that table.
 */
import { PACKET_PARTS } from "~/lib/art/packet";
import { fade, SVG_NS } from "./dom";
import { clamp } from "./math";
import { sample, type Track } from "~/lib/art/geometry";

const DEG = 180 / Math.PI;

/** Sample spacing, in drawing units. Packets are 16 long, so 2 is finer than the eye can tell. */
const STEP = 2;
const tracks = new WeakMap<Element, Track>();

/** The lookup table for a path, sampled from its `d` on first use. */
export function track(el: Element): Track {
  let t = tracks.get(el);
  if (t) return t;
  const d = el.getAttribute("d");
  if (el.localName !== "path" || !d)
    throw new Error(`packets: a route must be a <path> with a d, not <${el.localName}>`);
  tracks.set(el, (t = sample(d, STEP)));
  return t;
}

/** Samples the given paths now (an animator calls this while it's built, off the frame loop). */
export function prime(...els: (Element | undefined)[]): void {
  for (const el of els) if (el) track(el);
}

export interface Segment {
  el: SVGPathElement;
  /** Packet class from this segment on (e.g. "pk--ink" after a reply). */
  cls?: string;
  /** Travel this segment invisibly (inside a device). */
  hide?: boolean;
  /** The path's lookup table, filled in on first use. */
  track?: Track;
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

/** Writes a packet's transform: at distance d along a track, pointing along it, nudged by jitter. */
function place(g: SVGGElement, t: Track, d: number, jitter = 0): void {
  const last = t.xs.length - 1,
    f = clamp(d / t.step, 0, last),
    i = Math.min(last - 1, Math.floor(f)),
    u = f - i;
  const ax = t.xs[i]!,
    ay = t.ys[i]!,
    bx = t.xs[i + 1]!,
    by = t.ys[i + 1]!;
  const ang = Math.atan2(by - ay, bx - ax);
  const x = ax + (bx - ax) * u + jitter * Math.cos(ang),
    y = ay + (by - ay) * u + jitter * Math.sin(ang);
  g.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(ang * DEG).toFixed(1)})`);
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

/** A pool of packets flowing through one layer of a drawing. */
export function packets(layer: SVGGElement) {
  const live: Packet[] = [];
  const pool: SVGGElement[] = [];

  function spawn(segs: Segment[], o: SpawnOptions = {}): Packet {
    for (const s of segs) s.track ??= track(s.el);
    const g = pool.pop() ?? packetEl();
    const cls = segs[0]?.cls ?? "";
    g.setAttribute("class", `pk ${cls}`);
    // through fade(), so a recycled packet's memo can't skip its first real opacity
    fade(g, 0);
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
      if (k.d >= s.track!.len) {
        k.d -= s.track!.len;
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
      const len = s.track!.len;
      place(k.g, s.track!, k.d, jitter);
      const fadeIn = clamp(k.age / 0.18, 0, 1);
      const fadeOut = k.i === k.segs.length - 1 ? clamp((len - k.d) / 14, 0, 1) : 1;
      const auto = k.autofade ? clamp(1.7 - 2.2 * (k.d / len), 0, 1) : 1;
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
): (el?: SVGPathElement, f?: number, cls?: string, opacity?: number) => void {
  const g = packetEl();
  fade(g, 0);
  layer.appendChild(g);
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
    const t = track(el);
    place(g, t, clamp(f, 0, 1) * t.len);
    fade(g, opacity);
  };
}
