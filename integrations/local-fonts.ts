import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { fontProviders } from "astro/config";
import type { FontProvider } from "astro";

/**
 * Fonts from the Fontsource packages in node_modules, and nowhere else.
 *
 * Astro's npm provider reads a package's CSS locally but, by default, points every font file
 * at jsDelivr and downloads it from there during the build. `remote: false` keeps it local:
 * unifont then returns `file://` URLs. Astro 7.4's font fetcher reads a font from disk only
 * when it gets a plain absolute path, so this turns those URLs into paths. A font that isn't
 * installed is a build error, the build works with the network off, and every font the site
 * serves is a same-origin /_astro/fonts/ file.
 */
export function fontsourcePackages(): FontProvider<{ package: string } | undefined> {
  const npm = fontProviders.npm({ remote: false });
  return {
    ...npm,
    name: "fontsource-packages",
    async resolveFont(options) {
      const result = await npm.resolveFont(options);
      if (!result) return result;
      for (const face of result.fonts)
        for (const src of face.src)
          if ("url" in src) {
            if (!src.url.startsWith("file:"))
              throw new Error(`fonts: ${options.familyName} resolved to ${src.url}, not a local file`);
            src.url = fileURLToPath(src.url);
          }
      const split = SPLIT[options.familyName];
      if (split) result.fonts = result.fonts.flatMap((face) => splitFace(face, split));
      return result;
    },
  };
}

/**
 * The characters the site's text uses (keep in step with CORE in scripts/subset-fonts.py).
 * The faces the first screen needs come as a small file with only these, and a second one
 * with the rest of the latin subset that a page downloads only if it uses one of them: the
 * whole latin file was the biggest download in the homepage's critical path (and its LCP).
 */
const CORE: [number, number][] = [
  [0x20, 0x7e],
  [0xa0, 0xa0],
  [0xa9, 0xa9],
  [0xb7, 0xb7],
  [0x2013, 0x2014],
  [0x2018, 0x2019],
  [0x201c, 0x201d],
  [0x2026, 0x2026],
  [0x20ac, 0x20ac],
];

/** Families split this way, and their two files (made by scripts/subset-fonts.py). */
const SPLIT: Record<string, string> = {
  "Schibsted Grotesk Variable": "schibsted-grotesk",
  "Instrument Serif": "instrument-serif",
};

type Face =
  Awaited<ReturnType<FontProvider["resolveFont"]>> extends infer R
    ? R extends { fonts: (infer F)[] }
      ? F
      : never
    : never;

const hex = (n: number): string => n.toString(16).toUpperCase().padStart(4, "0");
const range = ([a, b]: [number, number]): string => (a === b ? `U+${hex(a)}` : `U+${hex(a)}-${hex(b)}`);

function parseRange(r: string): [number, number] {
  const [a = "", b = a] = r.replace(/^U\+/i, "").split("-");
  return [parseInt(a, 16), parseInt(b, 16)];
}

/**
 * `ranges` without the CORE code points, and without the control characters: they have no
 * glyphs, and a newline in the markup would otherwise make every page fetch the rest file.
 */
function withoutCore(ranges: [number, number][]): [number, number][] {
  let out = ranges;
  for (const [c0, c1] of [...CORE, [0x00, 0x1f], [0x7f, 0x9f]] as [number, number][])
    out = out.flatMap(([a, b]): [number, number][] => {
      if (c1 < a || c0 > b) return [[a, b]];
      const parts: [number, number][] = [];
      if (a < c0) parts.push([a, c0 - 1]);
      if (b > c1) parts.push([c1 + 1, b]);
      return parts;
    });
  return out;
}

/** The upright latin face becomes a core face and a rest face; every other face stays. */
function splitFace(face: Face, name: string): Face[] {
  const latin = face.unicodeRange?.[0]?.toUpperCase().startsWith("U+0000-00FF");
  if (!latin || (face.style ?? "normal") !== "normal") return [face];
  const file = (part: string): string => {
    const path = fileURLToPath(new URL(`../src/assets/fonts/${name}-${part}.woff2`, import.meta.url));
    if (!existsSync(path)) throw new Error(`fonts: ${path} is missing (run scripts/subset-fonts.py)`);
    return path;
  };
  const rest = withoutCore(face.unicodeRange!.map(parseRange));
  return [
    { ...face, src: [{ url: file("core"), format: "woff2" }], unicodeRange: CORE.map(range) },
    { ...face, src: [{ url: file("rest"), format: "woff2" }], unicodeRange: rest.map(range) },
  ];
}
