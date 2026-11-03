import { describe, expect, it } from "vitest";
import { breakpoint, cssVar, tokens, type TokenName } from "~/styles/tokens";

/** oklch(L% C H) → WCAG relative luminance, via OKLab and linear sRGB. */
function luminance(value: string): number {
  const m = /^oklch\(([\d.]+)% ([\d.]+) ([\d.]+)\)$/.exec(value);
  if (!m) throw new Error(`not an opaque oklch colour: ${value}`);
  const L = +m[1]! / 100,
    C = +m[2]!,
    h = (+m[3]! * Math.PI) / 180;
  const a = C * Math.cos(h),
    b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clip = (v: number) => Math.min(1, Math.max(0, v));
  const r = clip(4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s);
  const g = clip(-1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s);
  const bl = clip(-0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s);
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}
const contrast = (fg: TokenName, bg: TokenName): number => {
  const [a, b] = [luminance(tokens[fg].value), luminance(tokens[bg].value)].sort((x, y) => y - x);
  return (a! + 0.05) / (b! + 0.05);
};

describe("tokens", () => {
  it("resolves every reference", () => {
    for (const [name, t] of Object.entries(tokens)) expect(t.value, name).not.toMatch(/[{}]/);
  });

  it("builds every navy shade from the one hue", () => {
    for (const [name, t] of Object.entries(tokens))
      if (name.startsWith("navy-")) expect(t.value).toMatch(/ 266\)$/);
  });

  it("exposes typed helpers", () => {
    expect(cssVar("surface")).toBe("var(--surface)");
    expect(breakpoint.stage).toBe(900);
  });

  describe("contrast (WCAG 2.2 AA)", () => {
    const text: TokenName[] = ["ink", "ink-muted", "ink-subtle", "accent"];
    const surfaces: TokenName[] = ["surface", "surface-raised", "surface-sunken", "surface-card"];
    for (const fg of text) {
      for (const bg of surfaces) {
        it(`${fg} on ${bg} is at least 4.5:1`, () => expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5));
      }
    }
    it("accent-ink on accent is at least 4.5:1", () =>
      expect(contrast("accent-ink", "accent")).toBeGreaterThanOrEqual(4.5));
    it("strong lines and focus rings are at least 3:1", () => {
      expect(contrast("line-strong", "surface")).toBeGreaterThanOrEqual(3);
      expect(contrast("focus", "surface")).toBeGreaterThanOrEqual(3);
    });
  });
});
