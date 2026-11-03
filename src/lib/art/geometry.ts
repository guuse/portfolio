/**
 * Path sampling for build time: where a packet sits a fraction of the way along a route,
 * so the still frame can show traffic frozen mid-flight. The browser uses the native
 * SVGPathElement API instead (see src/lib/motion/packets.ts).
 */

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

/** Samples an absolute path that only uses M, L, H, V and C (all the kit draws). */
export function samplePath(d: string): PathSample {
  const tok = d.match(/[MLHVC]|-?\d*\.?\d+/g) ?? [];
  const pts: [number, number][] = [];
  let i = 0;
  let cmd = "";
  let x = 0;
  let y = 0;
  const num = (): number => +(tok[i++] ?? 0);
  while (i < tok.length) {
    const t = tok[i] ?? "";
    if (/[MLHVC]/.test(t)) {
      cmd = t;
      i++;
    }
    if (cmd === "M") {
      x = num();
      y = num();
      pts.push([x, y]);
      cmd = "L";
    } else if (cmd === "L") {
      x = num();
      y = num();
      pts.push([x, y]);
    } else if (cmd === "H") {
      x = num();
      pts.push([x, y]);
    } else if (cmd === "V") {
      y = num();
      pts.push([x, y]);
    } else if (cmd === "C") {
      const x1 = num(),
        y1 = num(),
        x2 = num(),
        y2 = num(),
        x3 = num(),
        y3 = num();
      for (let k = 1; k <= 24; k++) {
        const t = k / 24,
          u = 1 - t;
        pts.push([
          u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
          u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
        ]);
      }
      x = x3;
      y = y3;
    } else {
      throw new Error(`samplePath: unsupported command in "${d}"`);
    }
  }
  const len = [0];
  for (let k = 1; k < pts.length; k++) {
    const [ax, ay] = pts[k - 1]!;
    const [bx, by] = pts[k]!;
    len.push(len[k - 1]! + Math.hypot(bx - ax, by - ay));
  }
  return { pts, len, total: len[len.length - 1]! };
}

/** The point a fraction `f` (0..1) of the way along a path, and the heading there. */
export function pointAt(d: string | PathSample, f: number): PathPoint {
  const s = typeof d === "string" ? samplePath(d) : d;
  const L = Math.max(0, Math.min(1, f)) * s.total;
  let k = 1;
  while (k < s.len.length - 1 && s.len[k]! < L) k++;
  const [ax, ay] = s.pts[k - 1]!;
  const [bx, by] = s.pts[k]!;
  const seg = s.len[k]! - s.len[k - 1]! || 1;
  const t = (L - s.len[k - 1]!) / seg;
  return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t, a: (Math.atan2(by - ay, bx - ax) * 180) / Math.PI };
}
