#!/usr/bin/env node
/**
 * Renders the raster brand assets into public/ with Playwright: the favicon PNGs and .ico
 * from public/favicon.svg, and a 1200×630 social card per page. The output is committed,
 * so the site build never needs a browser. Run it after changing a title or a cover:
 *
 *   node scripts/brand-assets.mjs
 */
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import sharp from "sharp";
// the generated token map (npm run tokens); Node runs the TypeScript as it is
import { tokens } from "../src/styles/tokens.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const pub = (p) => `${root}public/${p}`;
const require = createRequire(import.meta.url);
const font = (pkg, file) => pathToFileURL(require.resolve(`${pkg}/files/${file}`)).href;
const asset = (p) => pathToFileURL(`${root}src/assets/${p}`).href;

const NAVY = "#0a1328",
  INK = "#eef1f8",
  MUTED = "#b7c0d4",
  SUBTLE = "#8d98b0",
  AMBER = "#fbc044";

/**
 * A social card as a palette PNG (libimagequant at full quality): indistinguishable from the
 * screenshot, and a third of its size, so every card stays under the 300 KB that some
 * platforms cap og:image at.
 */
const ogPng = (png) =>
  sharp(png).png({ palette: true, quality: 100, effort: 10, compressionLevel: 9 }).toBuffer();

/** The cards: a kicker, a title, a line, and the art that fills the right-hand side. */
const CARDS = [
  {
    id: "home",
    kicker: "Guus Ekkelenkamp · Rotterdam",
    title: "I like building things that keep running.",
    line: "Tech lead infrastructure & platform engineering at Harborn",
    art: "photos/portrait.webp",
    print: true,
  },
  {
    id: "projects",
    kicker: "Projects",
    title: "A platform at work, two things at home.",
    line: "Why I made each one, how it works and what broke along the way.",
    art: "covers/mtg-wide.webp",
    // the cover's caption sits at its right edge, so anchor the crop there
    pos: "100% 50%",
    // the screenshots are full of text: none of it under the headline
    fade: `${NAVY} 0%, ${NAVY} 31%, transparent 58%`,
  },
  {
    id: "hosting-platform",
    kicker: "Case study · Work at Harborn",
    title: "Hosting platform",
    line: "The platform our client projects run on: AWS first, and the same setup on Azure for clients who are there.",
    art: "covers/platform-wide.webp",
  },
  {
    id: "homelab",
    kicker: "Case study · Personal",
    title: "Homelab",
    line: "The patterns I use at work, on one old laptop under the TV.",
    art: "covers/homelab-wide.webp",
  },
  {
    id: "mtg-suite",
    kicker: "Case study · Personal",
    title: "MTG suite",
    line: "The Magic tools I build for my friends.",
    art: "covers/mtg-hero-wide.webp",
    // the engine and its label sit at the cover's right edge: anchor the crop there, or the
    // label is cut off ("the engi")
    pos: "100% 50%",
  },
  {
    id: "design-system",
    kicker: "Behind this site",
    title: "Design system",
    line: "Tokens, type, components, the illustration kit and its motion.",
    // its own drawing: the palette, the three typefaces and a few parts of the kit
    html: () => designSystemArt(),
  },
];

const hex = (name) => {
  const t = tokens[name];
  if (!t?.hex) throw new Error(`brand-assets: no hex for token ${name}`);
  return t.hex;
};

/** The design system's card art: swatch ramps from the tokens, a type specimen, kit parts. */
function designSystemArt() {
  const ramps = [
    ["navy-210", "navy-280", "navy-360", "navy-430", "navy-480"],
    ["cloud-680", "cloud-760", "cloud-800", "cloud-960"],
    ["amber-500", "amber-660", "amber-840"],
    ["sky-480", "sky-640", "sky-800"],
  ];
  const sw = ramps
    .map(
      (ramp, r) =>
        `<g transform="translate(0 ${r * 84})">` +
        ramp
          .map(
            (n, i) =>
              `<rect x="${i * 70}" width="54" height="54" rx="8" fill="${hex(n)}" stroke="${hex("navy-360")}"/>` +
              `<text x="${i * 70 + 27}" y="71" text-anchor="middle" class="lbl">${n.split("-")[1]}</text>`,
          )
          .join("") +
        `<text x="${ramp.length * 70 + 4}" y="33" class="lbl lbl--name">${ramp[0].split("-")[0]}</text></g>`,
    )
    .join("");
  // a packet (the kit's capsule) and a pod, drawn as the kit draws them
  const packet = (x, y, r) =>
    `<g transform="translate(${x} ${y}) rotate(${r}) scale(2.2)"><rect x="-8" y="-4.5" width="16" height="9" rx="2" fill="${hex("amber-840")}"/><rect x="3" y="-4.5" width="5" height="9" rx="1.5" fill="${hex("amber-660")}"/><path d="M-4.5 -1.2H0.5M-4.5 1.4H-1" stroke="${hex("navy-280")}" stroke-width="1" stroke-linecap="round"/></g>`;
  const pod = (x, y, on) =>
    `<rect x="${x}" y="${y}" width="34" height="34" rx="6" fill="${on ? hex("cloud-760") : hex("navy-280")}" stroke="${hex("navy-480")}"/>` +
    (on ? `<rect x="${x + 9}" y="${y + 23}" width="16" height="4" rx="2" fill="${hex("navy-360")}"/>` : "");
  return `<svg class="ds-art" viewBox="0 0 520 560" width="520" height="560">
<style>.lbl{font:400 13px "OG Mono";fill:${hex("cloud-680")}}.lbl--name{font-size:15px;fill:${hex("cloud-800")}}</style>
<g transform="translate(10 34)">${sw}</g>
<g transform="translate(10 378)">
<text x="0" y="86" style="font:400 112px 'OG Serif';fill:${hex("cloud-960")}">Aa</text>
<text x="146" y="86" style="font:600 80px 'OG Sans';fill:${hex("cloud-800")}">Aa</text>
<text x="300" y="84" style="font:400 62px 'OG Mono';fill:${hex("cloud-680")}">{}</text>
<rect x="0" y="112" width="500" height="1" fill="${hex("navy-360")}"/>
<g transform="translate(0 132)">${pod(0, 0, true)}${pod(42, 0, true)}${pod(84, 0, true)}${pod(126, 0, false)}</g>
${packet(250, 149, 0)}${packet(330, 142, -14)}
<path d="M200 149H232M276 149H306" stroke="${hex("navy-480")}" stroke-width="2" stroke-dasharray="5 7" stroke-linecap="round"/>
</g></svg>`;
}

const card = (c) => `<!doctype html><meta charset="utf-8"><style>
@font-face { font-family: "OG Serif"; src: url(${font("@fontsource/instrument-serif", "instrument-serif-latin-400-normal.woff2")}); }
@font-face { font-family: "OG Sans"; src: url(${font("@fontsource-variable/schibsted-grotesk", "schibsted-grotesk-latin-wght-normal.woff2")}); font-weight: 400 900; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; overflow: hidden; background: ${NAVY}; color: ${INK}; font-family: "OG Sans"; position: relative; }
.art { position: absolute; inset: 0 0 0 auto; width: 760px; background: url(${asset(c.art)}) ${c.pos ?? "70% 50%"} / cover; }
.art::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, ${c.fade ?? `${NAVY} 0%, transparent 55%`}); }
@font-face { font-family: "OG Mono"; src: url(${font("@fontsource/geist-mono", "geist-mono-latin-400-normal.woff2")}); }
.ds-art { position: absolute; right: 56px; top: 36px; }
.print { position: absolute; right: 120px; top: 120px; width: 330px; height: 330px; padding: 10px; background: #f8f6f1; transform: rotate(2deg); box-shadow: 0 14px 40px #0008; }
.print img { width: 100%; height: 100%; object-fit: cover; display: block; }
.text { position: absolute; left: 72px; top: 0; bottom: 0; width: 640px; display: flex; flex-direction: column; justify-content: center; gap: 22px; }
.kicker { color: ${SUBTLE}; font-size: 26px; }
h1 { font-family: "OG Serif"; font-weight: 400; font-size: ${c.title.length > 20 ? 78 : 104}px; line-height: 0.98; letter-spacing: -0.02em; }
p { color: ${MUTED}; font-size: 28px; line-height: 1.35; max-width: 560px; }
.url { position: absolute; left: 72px; bottom: 48px; font-size: 22px; color: ${SUBTLE}; }
.url b { color: ${AMBER}; font-weight: 500; }
</style>
${c.html ? c.html() : c.print ? `<div class="print"><img src="${asset(c.art)}"></div>` : `<div class="art"></div>`}
<div class="text"><div class="kicker">${c.kicker}</div><h1>${c.title}</h1><p>${c.line.replace("&", "&amp;")}</p></div>
<div class="url"><b>●</b> ekkelenkamp.dev</div>`;

/** A .ico that wraps one PNG (supported by every browser that asks for /favicon.ico). */
function ico(png, size) {
  const head = Buffer.alloc(22);
  head.writeUInt16LE(0, 0);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(1, 4);
  head.writeUInt8(size, 6);
  head.writeUInt8(size, 7);
  head.writeUInt16LE(1, 10);
  head.writeUInt16LE(32, 12);
  head.writeUInt32LE(png.length, 14);
  head.writeUInt32LE(22, 18);
  return Buffer.concat([head, png]);
}

// CI installs Playwright's own Chromium; elsewhere CHROMIUM_PATH can point at a local one.
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
try {
  const svg = await readFile(pub("favicon.svg"), "utf8");
  const icons = {
    "favicon-32.png": 32,
    "apple-touch-icon.png": 180,
    "icon-192.png": 192,
    "icon-512.png": 512,
  };
  for (const [name, size] of Object.entries(icons)) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    // the apple icon gets no transparent corners: iOS rounds it itself
    const markup = name.startsWith("apple") ? svg.replace('rx="7"', 'rx="0"') : svg;
    await page.setContent(
      `<style>*{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${markup}`,
    );
    const png = await page.screenshot({ omitBackground: true });
    if (name === "favicon-32.png") await writeFile(pub("favicon.ico"), ico(png, 32));
    else await writeFile(pub(name), png);
    await page.close();
  }
  await mkdir(pub("og"), { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  // a file page, so it may load the fonts and covers from disk
  const tmp = await mkdtemp(join(tmpdir(), "og-"));
  for (const c of CARDS) {
    await writeFile(join(tmp, "card.html"), card(c));
    await page.goto(pathToFileURL(join(tmp, "card.html")).href, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await writeFile(pub(`og/${c.id}.png`), await ogPng(await page.screenshot()));
  }
  await rm(tmp, { recursive: true });
  console.info(`wrote ${Object.keys(icons).length} icons and ${CARDS.length} social cards`);
} finally {
  await browser.close();
}
