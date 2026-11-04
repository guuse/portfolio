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
  },
  {
    id: "design-system",
    kicker: "ekkelenkamp.dev",
    title: "Design system",
    line: "Tokens, type, components, the illustration kit and its motion.",
    art: "covers/platform-wide.webp",
  },
];

const card = (c) => `<!doctype html><meta charset="utf-8"><style>
@font-face { font-family: "OG Serif"; src: url(${font("@fontsource/instrument-serif", "instrument-serif-latin-400-normal.woff2")}); }
@font-face { font-family: "OG Sans"; src: url(${font("@fontsource-variable/schibsted-grotesk", "schibsted-grotesk-latin-wght-normal.woff2")}); font-weight: 400 900; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; overflow: hidden; background: ${NAVY}; color: ${INK}; font-family: "OG Sans"; position: relative; }
.art { position: absolute; inset: 0 0 0 auto; width: 760px; background: url(${asset(c.art)}) 70% 50% / cover; }
.art::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, ${NAVY} 0%, transparent 55%); }
.print { position: absolute; right: 120px; top: 120px; width: 330px; height: 330px; padding: 10px; background: #f8f6f1; transform: rotate(2deg); box-shadow: 0 14px 40px #0008; }
.print img { width: 100%; height: 100%; object-fit: cover; display: block; }
.text { position: absolute; left: 72px; top: 0; bottom: 0; width: 640px; display: flex; flex-direction: column; justify-content: center; gap: 22px; }
.kicker { color: ${SUBTLE}; font-size: 26px; }
h1 { font-family: "OG Serif"; font-weight: 400; font-size: ${c.title.length > 20 ? 78 : 104}px; line-height: 0.98; letter-spacing: -0.02em; }
p { color: ${MUTED}; font-size: 28px; line-height: 1.35; max-width: 560px; }
.url { position: absolute; left: 72px; bottom: 48px; font-size: 22px; color: ${SUBTLE}; }
.url b { color: ${AMBER}; font-weight: 500; }
</style>
${c.print ? `<div class="print"><img src="${asset(c.art)}"></div>` : `<div class="art"></div>`}
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
