import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { breakpoint, cssVar, media, ms, px, themes, tokens, type TokenName } from "~/styles/tokens";
import { buildTokens } from "../../scripts/build-tokens.mjs";
import { luminance, oklchToHex } from "../../scripts/oklch.mjs";

const contrast = (fg: TokenName, bg: TokenName): number => {
  const [a, b] = [luminance(tokens[fg].value), luminance(tokens[bg].value)].sort((x, y) => y - x);
  return (a! + 0.05) / (b! + 0.05);
};

describe("tokens", () => {
  it("resolves every reference", () => {
    for (const [name, t] of Object.entries(tokens)) expect(t.value, name).not.toMatch(/[{}]/);
  });

  it("builds every navy and cloud shade from the one hue", () => {
    const hue = Number(tokens["hue-navy"].value);
    for (const [name, t] of Object.entries(tokens)) {
      if (name.startsWith("navy-")) expect(t.value).toMatch(new RegExp(` ${hue}\\)$`));
      // the cloud ramp sits a few degrees off it
      if (name.startsWith("cloud-")) {
        const h = Number(/ ([\d.]+)\)$/.exec(t.value)![1]);
        expect(Math.abs(h - hue), name).toBeLessThanOrEqual(12);
      }
    }
  });

  it("exposes typed helpers, numbers and queries", () => {
    expect(cssVar("surface")).toBe("var(--surface)");
    expect(breakpoint.stage).toBe(900);
    expect(media.stage).toBe("(width >= 900px)");
    expect(px["space-header"]).toBe(64);
    expect(ms.toast).toBe(3200);
    expect(themes[0]).toBe("nacht");
  });

  it("gives opaque colours a hex value, for theme-color and the manifest", () => {
    expect(tokens.surface.hex).toBe("#0a1328");
    expect(oklchToHex("oklch(84% 0.15 82)")).toBe("#fbc044");
    expect(oklchToHex("oklch(7% 0.03 266 / 0.97)")).toBeNull();
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

  describe("the drawings and components follow the hue", () => {
    it("have no colour with a hue of its own (every oklch() hue is an offset of --hue-navy)", async () => {
      const files = ["src/styles/art.css"];
      for (const dir of ["src/components", "src/pages", "src/layouts"])
        for (const f of await readdir(dir, { recursive: true }))
          if (/\.(astro|css)$/.test(f)) files.push(join(dir, f));
      for (const file of files) {
        const css = await readFile(file, "utf8");
        for (const m of css.matchAll(/oklch\(([^()]|\([^()]*\))*\)/g)) {
          const colour = m[0];
          // achromatic (chroma 0) needs no hue
          if (/^oklch\(\S+ 0 /.test(colour) || colour.startsWith("oklch(from ")) continue;
          expect(colour, `${file}: ${colour}`).toContain("var(--hue-navy)");
        }
      }
    });

    it("draw the packets from the accent", () => {
      expect(tokens["art-packet-band"].value).toContain(tokens.accent.value);
      expect(tokens["art-packet-seam"].value).toContain(tokens.accent.value);
    });
  });

  describe("themes", () => {
    let dir = "";
    beforeAll(async () => (dir = await mkdtemp(join(tmpdir(), "tokens-"))));
    afterAll(() => rm(dir, { recursive: true, force: true }));

    /** A second theme: nacht with a light surface and another accent. */
    async function dusk(edit: (theme: Record<string, Record<string, unknown>>) => void = () => undefined) {
      const theme = JSON.parse(await readFile("tokens/theme/nacht.json", "utf8")) as Record<
        string,
        Record<string, unknown>
      >;
      theme["surface"]!["base"] = { $value: "{bone.970}" };
      theme["accent"]!["base"] = { $value: "{sky.480}" };
      edit(theme);
      const file = join(dir, "dusk.json");
      await writeFile(file, JSON.stringify(theme));
      return file;
    }

    it("scope each theme to its own selector, after the default, with no collisions", async () => {
      const out = join(dir, "out");
      const files = await buildTokens({
        outDir: out,
        themeFiles: ["tokens/theme/nacht.json", await dusk()],
      });
      const css = files["tokens.css"]!;
      const block = (selector: string) => {
        const at = css.indexOf(`${selector} {`);
        expect(at, selector).toBeGreaterThan(-1);
        return css.slice(at, css.indexOf("\n  }\n", at));
      };
      const nacht = block(`:root,\n  [data-theme="nacht"]`),
        dark = block(`[data-theme="dusk"]`);
      expect(css.indexOf(dark)).toBeGreaterThan(css.indexOf(nacht));
      const names = (b: string) => [...b.matchAll(/^\s+(--[\w-]+):/gm)].map((m) => m[1]).sort();
      expect(names(dark)).toEqual(names(nacht));
      expect(new Set(names(nacht)).size).toBe(names(nacht).length);
      expect(dark).toContain("--surface: var(--bone-970);");
      expect(dark).toContain("--accent: var(--sky-480);");
      // tokens built on the accent follow it in the other theme too
      expect(dark).toContain("--art-amber: var(--accent);");
      // primitives are shared, once, on :root
      expect(css.match(/--navy-190:/g)).toHaveLength(1);
      expect(files["tokens.ts"]).toContain('export const themes = ["nacht","dusk"]');
    });

    it("refuse a theme that doesn't define the same names", async () => {
      const file = await dusk((t) => delete t["focus"]);
      await expect(
        buildTokens({ outDir: join(dir, "bad"), themeFiles: ["tokens/theme/nacht.json", file] }),
      ).rejects.toThrow(/theme "dusk" must define exactly the nacht names; missing focus/);
    });
  });
});
