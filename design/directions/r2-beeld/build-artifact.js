#!/usr/bin/env node
/*
 * r2-beeld · round 8 build.
 *   node design/directions/r2-beeld/build-artifact.js
 *
 * 1. Bakes the diagrams into the project pages (between <!-- dg:id --> markers), so they
 *    read without JS; diagrams.js animates them in the browser.
 * 2. Bakes static thumbnails for Selected work on the CV (<!-- thumb:id --> markers): each is
 *    one diagram rendered once in its final state (via Playwright), cropped, not animated.
 * 3. Writes the publishable set to ./artifact/:
 *      index.html     the CV, as a fragment (no doctype/html/head/body; starts with <title>)
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
const THUMBS = { delivery: "10 92 740 290", push: "10 10 740 360" };

(async () => {
  // 1. diagrams into the project pages
  for (const f of BAKE) {
    let s = read(f);
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
  write("index.html", cv);

  // 3. the publishable set
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(path.join(out, "assets"), { recursive: true });
  fs.cpSync(path.join(dir, "assets"), path.join(out, "assets"), { recursive: true });
  for (const f of ["site.css", "site.js", "diagrams.js"]) fs.copyFileSync(path.join(dir, f), path.join(out, f));
  for (const f of PAGES) fs.copyFileSync(path.join(dir, f), path.join(out, f));

  // The CV as a fragment: the publisher wraps it in a document.
  const head = cv.slice(cv.indexOf("<title>"), cv.indexOf("</head>")).replace(/<meta name="viewport"[^>]*>\n?/, "");
  const body = cv.slice(cv.indexOf("<!-- page:start -->") + "<!-- page:start -->".length, cv.indexOf("<!-- page:end -->"));
  const fragment = head.replace(/^(<title>[^<]*<\/title>)/, '$1\n<meta name="claude:viewport-fit-sides" content="cover">').trim() +
    "\n" + body.trim() + '\n<script src="site.js"></script>\n';
  fs.writeFileSync(path.join(out, "index.html"), fragment);

  const size = (f) => (fs.statSync(path.join(out, f)).size / 1024).toFixed(1) + " KB";
  console.log("artifact/", ["index.html", ...PAGES, "site.css", "site.js", "diagrams.js"].map((f) => f + " " + size(f)).join(", "));
})().catch((e) => { console.error(e); process.exit(1); });
