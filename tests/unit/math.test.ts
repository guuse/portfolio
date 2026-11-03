import { describe, expect, it } from "vitest";
import { approach, clamp, ease, lerp, seg } from "~/lib/motion/math";

describe("math", () => {
  it("clamps, lerps and segments", () => {
    expect(clamp(-1, 0, 1)).toBe(0);
    expect(clamp(2, 0, 1)).toBe(1);
    expect(lerp(10, 20, 0.25)).toBe(12.5);
    expect(seg(0.5, 0.25, 0.75)).toBe(0.5);
    expect(seg(0.1, 0.25, 0.75)).toBe(0);
    expect(seg(0.9, 0.25, 0.75)).toBe(1);
  });

  it("smooths independently of frame rate", () => {
    // two 8ms steps cover the same ground as one 16ms step
    const one = approach(0.016, 7);
    const two = 1 - (1 - approach(0.008, 7)) ** 2;
    expect(two).toBeCloseTo(one, 10);
  });

  describe.each(Object.entries(ease))("ease.%s", (_name, f) => {
    it("starts at 0 and ends at 1", () => {
      expect(f(0)).toBeCloseTo(0, 10);
      expect(f(1)).toBeCloseTo(1, 10);
    });
  });

  it("overshoots with outBack, and more with a larger s", () => {
    const peak = (s: number) => Math.max(...Array.from({ length: 101 }, (_, i) => ease.outBack(i / 100, s)));
    expect(peak(1.70158)).toBeGreaterThan(1.09);
    expect(peak(2.4)).toBeGreaterThan(peak(1.70158));
  });
});
