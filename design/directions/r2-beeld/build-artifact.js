#!/usr/bin/env node
/*
 * r2-beeld · round 8 build.
 *   node design/directions/r2-beeld/build-artifact.js
 *
 * 1. Bakes the diagrams into the project pages (between <!-- dg:id --> markers), so they
 *    read without JS; diagrams.js animates them in the browser.
 * 2. Bakes static thumbnails for Selected work on the homepage (<!-- thumb:id --> markers): each is
 *    one diagram rendered once in its final state (via Playwright), cropped, not animated.
 * 3. Writes the publishable set to ./artifact/:
 *      index.html     the homepage, as a fragment (no doctype/html/head/body; starts with <title>)
 *      platform.html, homelab.html, mtg.html   complete documents
 *      site.css, site.js, diagrams.js          shared, referenced by relative paths
 *      assets/...                              the images
 */
"use strict";
const fs = require("fs");
const path = require("path");
const dir = __dirname;
const out = path.join(dir, "artifact");
const read = (f) => fs.readFileSync(path.join(dir, f), "utf8");
const write = (f, s) => fs.writeFileSync(path.join(dir, f), s);
const D = require(path.join(dir, "diagrams.js"));

const PAGES = ["platform.html", "homelab.html", "mtg.html"];
const BAKE = PAGES.concat(["system.html"]);
// Thumbnail crops (in the full drawing's viewBox): the most telling part of each diagram.
const THUMBS = { delivery: "10 100 360 270", push: "10 10 400 300" };

/* Screenshot slots. Each slot lists candidate files in order of preference; the build uses the
   first one that exists in assets/shots, so new screenshots drop in without editing HTML. */
const SHOT = {
  "r99-game": ["Rules of 99: a four-player Commander table in the main phase, every board on screen", "A four-player game, with every board on screen."],
  "r99-game-combat": ["Rules of 99 during combat: four attackers, with arrows to the player they attack", "Combat: four attackers, each with an arrow to its target."],
  "r99-game-stack": ["Rules of 99 with Chaos Warp on the stack and an arrow to its target", "Chaos Warp on the stack, waiting for responses."],
  "r99-game-mobile": ["Rules of 99 game on a phone", "On a phone, one board at a time.", true],
  "r99-lobby": ["Rules of 99 home screen after signing in", "Home after signing in: your decks and open tables."],
  "r99-workbench-new": ["Rules of 99 deck workbench", "The workbench for building and tuning a deck."],
  "r99-home": ["Rules of 99 home screen with the last deck played and a Play button", "Home: continue with the last deck, or open a table."],
  "r99-table-setup": ["Rules of 99 table setup with four seats, each with a commander", "Table setup: two to four seats, each with its commander."],
  "r99-workbench": ["Rules of 99 deck workbench with the card list, a mana curve and search", "The workbench for building and tuning a deck."],
  "r99-replay": ["Rules of 99 replay of a finished four-player game", "Replays of finished games."],
  "r99-home-mobile": ["Rules of 99 home screen on a phone", "On a phone.", true],
  "tutor-library": ["Tutor deck library with commander art for each deck", "The library: every deck at a glance."],
  "tutor-builder": ["Tutor deck builder listing a deck's cards by category", "The builder, with legality and colour identity checked."],
  "tutor-analysis": ["Tutor deck insights comparing the deck's shape with 97 real decks, with a 50 euro upgrade suggestion", "Insights: how the deck compares with 97 real decks, and what a €50 upgrade would add."],
  "tutor-insights": ["Tutor listing staple cards the deck is missing", "Staples the deck is missing."],
  "tutor-mobile": ["Tutor on a phone", "On a phone.", true],
  "tutor-mobile-deck": ["A Tutor deck on a phone", "A deck on a phone.", true],
  "scryfall-result": ["Scryfall in plain words: a request turned into a query, with a breakdown of each part", "A request in plain words, the query it became, and what each part means."],
  "scryfall-mobile": ["Scryfall in plain words on a phone", "On a phone.", true],
  "mtg-skills-banner": ["MTG Skills for Claude Code banner", "The plugin marketplace."]
};
const SLOTS = {
  hero: [["r99-game-combat", "r99-game", "r99-home"]],
  thumb: [["r99-game-combat", "r99-game", "r99-home"]],
  r99: [["r99-game"], ["r99-game-stack"], ["r99-game-combat"], ["r99-game-mobile"], ["r99-lobby"], ["r99-workbench-new"]],
  tutor: [["tutor-library"], ["tutor-builder"], ["tutor-analysis"], ["tutor-insights"], ["tutor-mobile"], ["tutor-mobile-deck"]],
  scryfall: [["scryfall-result"], ["scryfall-mobile"]],
  skills: [["mtg-skills-banner"]]
};
function webpSize(file) {
  const b = fs.readFileSync(file);
  const t = b.toString("ascii", 12, 16);
  if (t === "VP8X") return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (t === "VP8 ") return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  if (t === "VP8L") { const v = b.readUInt32LE(21); return [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1]; }
  throw new Error("unknown webp " + file);
}
const missing = [];
function pick(slot) {
  return SLOTS[slot].map((cands) => {
    const id = cands.find((c) => fs.existsSync(path.join(dir, "assets/shots", c + ".webp")));
    if (!id) missing.push(slot + ": " + cands.join(" | "));
    return id;
  }).filter(Boolean);
}
function esc(s) { return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
function img(id, lazy) {
  const [w, h] = webpSize(path.join(dir, "assets/shots", id + ".webp"));
  const x2 = fs.existsSync(path.join(dir, "assets/shots", id + "@2x.webp")) ? ' srcset="assets/shots/' + id + '.webp 1x, assets/shots/' + id + '@2x.webp 2x"' : "";
  return '<img src="assets/shots/' + id + '.webp"' + x2 + ' width="' + w + '" height="' + h + '" alt="' + esc(SHOT[id][0]) + '"' + (lazy ? ' loading="lazy"' : "") + ' decoding="async">';
}
function grid(slot) {
  const ids = pick(slot);
  if (!ids.length) return "";
  return '<ul class="shotgrid" data-lb-group>' + ids.map((id) =>
    '<li' + (SHOT[id][2] ? ' class="is-phone"' : "") + (ids.length === 1 ? ' style="grid-column: 1 / -1"' : "") + '><figure><button type="button" data-lb aria-label="Enlarge: ' + esc(SHOT[id][1]) + '">' + img(id, true) + "</button><figcaption>" + SHOT[id][1] + "</figcaption></figure></li>").join("") + "</ul>";
}

(async () => {
  // 1. diagrams and screenshot slots into the project pages
  for (const f of BAKE) {
    let s = read(f);
    s = s.replace(/<!-- shots:([a-z0-9]+) -->[\s\S]*?<!-- \/shots -->/g, (m, slot) => "<!-- shots:" + slot + " -->" + grid(slot) + "<!-- /shots -->");
    s = s.replace(/<!-- shot:hero -->[\s\S]*?<!-- \/shot -->/g, () => { const id = pick("hero")[0]; return "<!-- shot:hero -->" + (id ? '<figure class="hero-shot">' + img(id, false) + "</figure>" : "") + "<!-- /shot -->"; });
    s = s.replace(/<!-- dg:([a-z]+) -->[\s\S]*?<!-- \/dg -->/g, (m, id) => "<!-- dg:" + id + " -->" + D.html(id) + "<!-- /dg -->");
    write(f, s);
  }

  // 2. static thumbnails, rendered once in their final state
  const { chromium } = require("playwright");
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1200, height: 800 } });
  const page = await ctx.newPage();
  await page.setContent("<!doctype html><body>" + Object.keys(THUMBS).map((id) => D.html(id, { caption: false })).join("") + "</body>");
  await page.addScriptTag({ content: read("diagrams.js") });
  const thumbs = await page.evaluate((crops) => {
    BeeldDiagrams.mount(document);
    const res = {};
    document.querySelectorAll(".dg").forEach((f) => {
      f.__player.play(true);
      const svg = f.querySelector(".dg__svg--full").cloneNode(true);
      svg.setAttribute("viewBox", crops[f.dataset.dg]);
      svg.setAttribute("preserveAspectRatio", "xMinYMin slice");
      svg.querySelectorAll(".dg-pk").forEach((n) => n.remove());
      svg.classList.add("dg-still");
      res[f.dataset.dg] = '<div class="dg dg--static" aria-hidden="true">' + svg.outerHTML + "</div>";
    });
    return res;
  }, THUMBS);
  await browser.close();
  let cv = read("index.html");
  cv = cv.replace(/<!-- thumb:([a-z]+) -->[\s\S]*?<!-- \/thumb -->/g, (m, id) => "<!-- thumb:" + id + " -->" + thumbs[id] + "<!-- /thumb -->");
  cv = cv.replace(/<!-- shot:thumb -->[\s\S]*?<!-- \/shot -->/g, () => { const id = pick("thumb")[0]; return "<!-- shot:thumb -->" + (id ? img(id, true).replace(/alt="[^"]*"/, 'alt=""') : "") + "<!-- /shot -->"; });
  write("index.html", cv);

  // 3. the publishable set
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(path.join(out, "assets"), { recursive: true });
  fs.cpSync(path.join(dir, "assets"), path.join(out, "assets"), { recursive: true, filter: (src) => !/grimoire-|r99-(home|table-setup|replay|card|workbench)\.webp|r99-home-mobile/.test(src) });
  for (const f of ["site.css", "site.js", "diagrams.js"]) fs.copyFileSync(path.join(dir, f), path.join(out, f));
  for (const f of PAGES) fs.copyFileSync(path.join(dir, f), path.join(out, f));

  // The homepage as a fragment: the publisher wraps it in a document.
  const head = cv.slice(cv.indexOf("<title>"), cv.indexOf("</head>")).replace(/<meta name="viewport"[^>]*>\n?/, "");
  const body = cv.slice(cv.indexOf("<!-- page:start -->") + "<!-- page:start -->".length, cv.indexOf("<!-- page:end -->"));
  const fragment = head.replace(/^(<title>[^<]*<\/title>)/, '$1\n<meta name="claude:viewport-fit-sides" content="cover">').trim() +
    "\n" + body.trim() + '\n<script src="site.js"></script>\n';
  fs.writeFileSync(path.join(out, "index.html"), fragment);

  const size = (f) => (fs.statSync(path.join(out, f)).size / 1024).toFixed(1) + " KB";
  if (missing.length) console.log("screenshot slots with no file yet:\n  " + missing.join("\n  "));
  console.log("artifact/", ["index.html", ...PAGES, "site.css", "site.js", "diagrams.js"].map((f) => f + " " + size(f)).join(", "));
})().catch((e) => { console.error(e); process.exit(1); });
