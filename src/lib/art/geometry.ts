/**
 * Path geometry, one parser for both sides of the drawings:
 *   - at build time, where a packet sits a fraction of the way along a route, so the still
 *     frame can show traffic frozen mid-flight (pointAt, used by the kit);
 *   - in the browser, each route sampled at even distances into a lookup table that the
 *     packets are placed from (sample, used by src/lib/motion/packets.ts).
 *
 * The browser never asks the DOM where a path goes: `getPointAtLength()` forces style and
 * layout and walks the path from its start on every call, which cost long tasks on a phone.
 *
 * Supported: M, L, H, V, C and Z, absolute and relative, with implicit repeats (extra pairs
 * after M are line-tos). Anything else (S, Q, T, A) throws, so a new kind of route fails
 * loudly instead of sending packets the wrong way.
 */

/** A polyline: the path's corners, with each cubic flattened into straight pieces. */
export interface Polyline {
  xs: number[];
  ys: number[];
}

/** A path sampled at even distances along it: points, the distance between them, the length. */
export interface Track {
  xs: Float32Array;
  ys: Float32Array;
  step: number;
  len: number;
}

export interface PathSample {
  pts: [number, number][];
  len: number[];
  total: number;
}

export interface PathPoint {
  x: number;
  y: number;
  /** Direction of travel in degrees. */
  a: number;
}

/**
 * Pieces per cubic. The still frames are laid out with 24, the count their parts were placed
 * with; the runtime uses 32, finer than a pixel at any size the drawings are shown.
 */
const STILL_SEGMENTS = 24;
export const TRACK_SEGMENTS = 32;

const TOKEN = /[a-zA-Z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;
const COMMANDS = new Set(["M", "L", "H", "V", "C", "Z"]);

/** The path as a polyline, each cubic in `segments` pieces. */
export function flatten(d: string, segments = TRACK_SEGMENTS): Polyline {
  const tokens = d.match(TOKEN) ?? [];
  const xs: number[] = [],
    ys: number[] = [];
  let i = 0,
    x = 0,
    y = 0,
    startX = 0,
    startY = 0,
    cmd = "";
  const num = (): number => {
    const v = Number(tokens[i++]);
    if (Number.isNaN(v)) throw new Error(`path: "${cmd}" is missing a number in "${d}"`);
    return v;
  };
  const to = (nx: number, ny: number): void => {
    x = nx;
    y = ny;
    xs.push(x);
    ys.push(y);
  };
  while (i < tokens.length) {
    const t = tokens[i]!;
    if (/^[a-zA-Z]$/.test(t)) {
      cmd = t;
      i++;
      if (!COMMANDS.has(cmd.toUpperCase())) throw new Error(`path: unsupported command "${cmd}" in "${d}"`);
    } else if (!cmd) throw new Error(`path: "${d}" doesn't start with a command`);
    const rel = cmd === cmd.toLowerCase(),
      ox = rel ? x : 0,
      oy = rel ? y : 0;
    switch (cmd.toUpperCase()) {
      case "M":
        to(ox + num(), oy + num());
        startX = x;
        startY = y;
        // further pairs after a move are line-tos
        cmd = rel ? "l" : "L";
        break;
      case "L":
        to(ox + num(), oy + num());
        break;
      case "H":
        to(ox + num(), y);
        break;
      case "V":
        to(x, oy + num());
        break;
      case "C": {
        const x0 = x,
          y0 = y,
          x1 = ox + num(),
          y1 = oy + num(),
          x2 = ox + num(),
          y2 = oy + num(),
          x3 = ox + num(),
          y3 = oy + num();
        for (let k = 1; k <= segments; k++) {
          const u = k / segments,
            v = 1 - u;
          to(
            v * v * v * x0 + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * x3,
            v * v * v * y0 + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * y3,
          );
        }
        break;
      }
      default: // Z: back to the start of the subpath; a number after it is an error
        to(startX, startY);
        cmd = "";
    }
  }
  if (!xs.length) throw new Error(`path: "${d}" draws nothing`);
  return { xs, ys };
}

/** Distance along a polyline at each of its points. */
function lengths({ xs, ys }: Polyline): number[] {
  const at = [0];
  for (let k = 1; k < xs.length; k++)
    at.push(at[k - 1]! + Math.hypot(xs[k]! - xs[k - 1]!, ys[k]! - ys[k - 1]!));
  return at;
}

/** Samples a path every `spacing` units of its length; the last sample is its end. */
export function sample(d: string, spacing: number): Track {
  const line = flatten(d),
    { xs: px, ys: py } = line,
    at = lengths(line),
    last = px.length - 1;
  const len = at[last]!,
    n = Math.max(2, Math.ceil(len / spacing) + 1),
    step = len / (n - 1),
    xs = new Float32Array(n),
    ys = new Float32Array(n);
  let k = 0;
  for (let q = 0; q < n; q++) {
    const dist = q * step;
    while (k < last - 1 && at[k + 1]! < dist) k++;
    const b = Math.min(k + 1, last),
      span = at[b]! - at[k]!,
      f = span > 0 ? Math.min(1, (dist - at[k]!) / span) : 0;
    xs[q] = px[k]! + (px[b]! - px[k]!) * f;
    ys[q] = py[k]! + (py[b]! - py[k]!) * f;
  }
  return { xs, ys, step, len };
}

/** The first distance along a track where `test(x, y)` holds (to its sample spacing), or its length. */
export function firstAlong(t: Track, test: (x: number, y: number) => boolean): number {
  for (let q = 0; q < t.xs.length; q++) if (test(t.xs[q]!, t.ys[q]!)) return q * t.step;
  return t.len;
}

/** The polyline of a path with its running length, for pointAt (build time). */
export function samplePath(d: string): PathSample {
  const line = flatten(d, STILL_SEGMENTS),
    len = lengths(line);
  return {
    pts: line.xs.map((x, k): [number, number] => [x, line.ys[k]!]),
    len,
    total: len[len.length - 1]!,
  };
}

/** The point a fraction `f` (0..1) of the way along a path, and the heading there. */
export function pointAt(d: string | PathSample, f: number): PathPoint {
  const s = typeof d === "string" ? samplePath(d) : d;
  if (s.pts.length === 1) return { x: s.pts[0]![0], y: s.pts[0]![1], a: 0 };
  const L = Math.max(0, Math.min(1, f)) * s.total;
  let k = 1;
  while (k < s.len.length - 1 && s.len[k]! < L) k++;
  const [ax, ay] = s.pts[k - 1]!;
  const [bx, by] = s.pts[k]!;
  const seg = s.len[k]! - s.len[k - 1]! || 1;
  const t = (L - s.len[k - 1]!) / seg;
  return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t, a: (Math.atan2(by - ay, bx - ax) * 180) / Math.PI };
}
