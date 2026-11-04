import { describe, expect, it } from "vitest";
import { firstAlong, flatten, pointAt, sample, samplePath, TRACK_SEGMENTS } from "~/lib/art/geometry";
import { scenes } from "~/lib/art";
import { card, type CardId } from "~/lib/art/cards";

/** Length of a cubic, by brute force: the reference the flattened one is held to. */
function cubicLength(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
) {
  let len = 0,
    px = x0,
    py = y0;
  for (let k = 1; k <= 100_000; k++) {
    const u = k / 100_000,
      v = 1 - u;
    const x = v * v * v * x0 + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * x3,
      y = v * v * v * y0 + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * y3;
    len += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return len;
}

describe("flatten", () => {
  it("reads straight commands, absolute and relative", () => {
    expect(flatten("M10 20L30 20H50V60")).toEqual({ xs: [10, 30, 50, 50], ys: [20, 20, 20, 60] });
    expect(flatten("m10 20l20 0h20v40")).toEqual({ xs: [10, 30, 50, 50], ys: [20, 20, 20, 60] });
  });

  it("treats extra pairs after a move as line-tos, and closes back to the start", () => {
    expect(flatten("M0 0 10 0 10 10Z")).toEqual({ xs: [0, 10, 10, 0], ys: [0, 0, 10, 0] });
    expect(flatten("m5 5 10 0z")).toEqual({ xs: [5, 15, 5], ys: [5, 5, 5] });
  });

  it("reads compact numbers: signs, leading dots and exponents as separators", () => {
    expect(flatten("M-1.5-2.5L.5.5 1e1-1E0")).toEqual({ xs: [-1.5, 0.5, 10], ys: [-2.5, 0.5, -1] });
  });

  it("flattens a cubic into equal steps of its parameter, ending exactly on its end point", () => {
    const abs = flatten("M0 0C0 100 100 100 100 0");
    expect(abs.xs).toHaveLength(1 + TRACK_SEGMENTS);
    expect([abs.xs.at(-1), abs.ys.at(-1)]).toEqual([100, 0]);
    // relative control points are relative to the cubic's start, not to each other
    const rel = flatten("M10 10c0 100 100 100 100 0");
    expect(rel.xs.map((x) => x - 10)).toEqual(abs.xs.map((x) => x));
    expect(rel.ys.map((y) => y - 10)).toEqual(abs.ys.map((y) => y));
  });

  it("throws on what it can't sample, naming the problem", () => {
    expect(() => flatten("M0 0A10 10 0 0 1 20 0")).toThrow(/unsupported command "A"/);
    expect(() => flatten("M0 0Q5 5 10 0")).toThrow(/unsupported command "Q"/);
    expect(() => flatten("M0 0s1 1 2 2")).toThrow(/unsupported command "s"/);
    expect(() => flatten("M0 0L5")).toThrow(/missing a number/);
    expect(() => flatten("10 10")).toThrow(/doesn't start with a command/);
    expect(() => flatten("M0 0Z 5 5")).toThrow(/doesn't start with a command/);
    expect(() => flatten("")).toThrow(/draws nothing/);
  });
});

describe("sample", () => {
  it("measures straight paths exactly and samples them evenly", () => {
    const t = sample("M0 0H100V50", 2);
    expect(t.len).toBe(150);
    expect(t.xs).toHaveLength(76);
    expect(t.step).toBe(2);
    expect([t.xs[25], t.ys[25]]).toEqual([50, 0]);
    expect([t.xs[60], t.ys[60]]).toEqual([100, 20]);
    expect([t.xs.at(-1), t.ys.at(-1)]).toEqual([100, 50]);
  });

  it("measures a cubic to within a tenth of a percent", () => {
    const t = sample("M0 0C0 100 100 100 100 0", 2);
    expect(Math.abs(t.len / cubicLength(0, 0, 0, 100, 100, 100, 100, 0) - 1)).toBeLessThan(0.001);
  });

  it("spaces samples evenly by distance along a curve, not by its parameter", () => {
    // a strongly uneven cubic: its parameter crawls near the ends
    const t = sample("M0 0C0 0 0 0 100 100", 2);
    for (let q = 1; q < t.xs.length; q++) {
      const gap = Math.hypot(t.xs[q]! - t.xs[q - 1]!, t.ys[q]! - t.ys[q - 1]!);
      expect(gap).toBeGreaterThan(t.step * 0.98);
      expect(gap).toBeLessThanOrEqual(t.step * 1.0001);
    }
  });

  it("keeps a path with no length usable", () => {
    const t = sample("M5 5", 2);
    expect(t.len).toBe(0);
    expect([...t.xs, ...t.ys]).toEqual([5, 5, 5, 5]);
  });

  it("finds where a route first crosses a line", () => {
    const t = sample("M120 136V206", 2);
    expect(firstAlong(t, (_, y) => y >= 148)).toBe(12);
    expect(firstAlong(t, () => false)).toBe(t.len);
  });
});

describe("the drawings' routes", () => {
  const markup = [
    ...Object.values(scenes).map((draw) => draw()),
    ...(["platform", "homelab", "mtg"] as CardId[]).map((id) => card(id)),
  ].join("");
  const routes = [...markup.matchAll(/<path d="([^"]+)"[^>]*data-k="[^"]+"/g)].map((m) => m[1]!);

  it("are all paths the runtime can sample, as long as a fine reference says", () => {
    expect(routes.length).toBeGreaterThan(20);
    for (const d of routes) {
      const fine = samplePath(d).total;
      expect(Math.abs(sample(d, 2).len - fine), d).toBeLessThan(Math.max(0.05, fine * 0.001));
    }
  });
});

describe("pointAt (still frames)", () => {
  it("samples straight lines exactly", () => {
    expect(samplePath("M0 0H100V50").total).toBe(150);
    expect(pointAt("M0 0H100", 0.25)).toEqual({ x: 25, y: 0, a: 0 });
  });

  it("follows curves and clamps the fraction", () => {
    const d = "M0 0C0 100 100 100 100 0";
    expect(pointAt(d, 1).x).toBeCloseTo(100);
    expect(pointAt(d, 2)).toEqual(pointAt(d, 1));
    expect(pointAt(d, 0.5).y).toBeCloseTo(75, 0);
  });
});
