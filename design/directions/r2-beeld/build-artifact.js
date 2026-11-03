#!/usr/bin/env node
/*
 * Builds artifact.html: one self-contained file (nacht + nuchter, no review bar) from
 * index.html, ../../system/base.css, beeld.css, projects.js and site.js.
 * The publisher wraps it in a document, so there is no doctype/html/head/body here.
 *   node design/directions/r2-beeld/build-artifact.js
 */
"use strict";
const fs = require("fs");
const path = require("path");
const dir = __dirname;
const read = (f) => fs.readFileSync(path.join(dir, f), "utf8");

// 1. Server-render the default featured state (Homelab) into index.html, same as the repo bake.
const P = require(path.join(dir, "projects.js"));
let html = read("index.html");
const out = P.render("homelab");
for (const k of ["featured", "grid", "index"]) {
  html = html.replace(new RegExp("<!-- " + k + ":start -->[\\s\\S]*?<!-- " + k + ":end -->"), "<!-- " + k + ":start -->" + out[k] + "<!-- " + k + ":end -->");
}
fs.writeFileSync(path.join(dir, "index.html"), html);
// ...and the Homelab case study into project.html (the page template).
let proj = read("project.html");
proj = proj.replace(/<!-- case:start -->[\s\S]*?<!-- case:end -->/, "<!-- case:start -->" + P.caseHTML(P.byId("homelab")) + "<!-- case:end -->");
fs.writeFileSync(path.join(dir, "project.html"), proj);

// 2. Take the page markup (skip link → detail shell), drop repo-only bits and comments.
const start = html.indexOf('<a class="skip-link"');
const end = html.indexOf("<script", start);
let markup = html.slice(start, end)
  .replace(/<!--(?!\s*\[CONFIRM)[\s\S]*?-->/g, "")
  .replace(/\n{3,}/g, "\n\n")
  .replace('class="site-header__name" href="index.html"', 'class="site-header__name" href="#main"')
  .trim();

// 3. CSS: base + direction, plus artifact-only rules.
const css = [
  read("../../system/base.css"),
  read("beeld.css"),
  `/* artifact: dark by design, nothing repo-only */
:root { color-scheme: dark; }
html, body { background: var(--surface); }
[data-repo-only] { display: none !important; }
.review-bar { display: none !important; }`
].join("\n").replace(/\/\*[\s\S]*?\*\//g, (m) => (m.length > 400 ? "" : m)).replace(/\n{2,}/g, "\n");

// 4. JS: project data + rotation + detail views, page enhancements.
const js = read("projects.js") + "\n" + read("site.js");

const artifact = `<title>Guus Ekkelenkamp</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="Tech lead of the infra team at Harborn in Rotterdam. Security, cloud and architecture, plus a few side projects.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Schibsted+Grotesk:ital,wght@0,400..700;1,400..700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
${css}
</style>
${markup}
<script>
${js}
</script>
`;
fs.writeFileSync(path.join(dir, "artifact.html"), artifact);
console.log("artifact.html", (Buffer.byteLength(artifact) / 1024).toFixed(1) + " KB");
