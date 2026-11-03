/*
 * r2-beeld · designed project covers (round 11).
 * Renders three posters (platform, homelab, MTG) in two shapes, wide 16:10 and card 4:5,
 * at 2x with Playwright, and writes assets/covers/<id>-<shape>.webp plus @2x.
 * Called from build-artifact.js. Static art: no animation, few big elements, sharp text.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const FONTS = '<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Schibsted+Grotesk:wght@400;500;600&display=swap" rel="stylesheet">';
const BASE = `
*{box-sizing:border-box;margin:0}
html,body{width:100%;height:100%}
body{font-family:"Schibsted Grotesk",system-ui,sans-serif;color:#f0f3fa;overflow:hidden;
  background:radial-gradient(70% 60% at 70% 15%, rgba(60,90,170,.22), transparent 70%), linear-gradient(170deg,#0f1b36 0%,#0a1328 60%,#081022 100%)}
.serif{font-family:"Instrument Serif",Georgia,serif;font-weight:400}
.node{border:1.5px solid rgba(240,243,250,.22);background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.02));border-radius:10px;padding:22px 30px;background:#121f3d}
.node b{display:block;font-family:"Instrument Serif",Georgia,serif;font-weight:400;font-size:54px;line-height:1}
.node span{display:block;margin-top:8px;font-size:22px;color:rgba(240,243,250,.62)}
.gold{border-color:#fbc044;background:linear-gradient(180deg,rgba(251,192,68,.14),rgba(251,192,68,.04))}
.gold b{color:#fbc044}
.foot{position:absolute;left:64px;bottom:52px;font-size:24px;letter-spacing:.06em;text-transform:uppercase;color:rgba(240,243,250,.55)}
svg.lines{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
svg.lines path{fill:none;stroke:#fbc044;stroke-width:3;stroke-linecap:round;opacity:.85}
svg.lines path.dim{stroke:rgba(240,243,250,.35);stroke-dasharray:4 10}
`;

function doc(body, css) {
  return "<!doctype html><html><head><meta charset=utf-8>" + FONTS + "<style>" + BASE + css + "</style></head><body>" + body + "</body></html>";
}
const abs = (x, y, w) => `position:absolute;left:${x}px;top:${y}px;${w ? "width:" + w + "px;" : ""}`;

/* --- platform: commit → CI → registry → Argo CD → acceptance / production */
const FLOW = `.wrap{position:absolute;inset:64px 64px 64px;display:flex;flex-direction:column;justify-content:center;gap:70px}
.title{font-size:104px;line-height:.95}
.row{display:flex;align-items:center}
.col{display:flex;flex-direction:column;align-items:stretch}
.c-h{flex:1;height:3px;min-width:40px;background:#fbc044;opacity:.85}
.c-v{width:3px;height:36px;background:#fbc044;opacity:.85;align-self:center}
.node b{font-size:64px}
.node span{font-size:24px}`;
function platform(shape) {
  if (shape === "wide") {
    return doc(`<div class="wrap">
<div>
<div class="row"><div class="node"><b>Commit</b><span>to the app repo</span></div><i class="c-h"></i><div class="node"><b>CI</b><span>build and test</span></div><i class="c-h"></i><div class="node"><b>Registry</b><span>immutable image</span></div><i class="c-h"></i><div class="node gold"><b>Argo CD</b><span>syncs from git</span></div></div>
<div class="row" style="justify-content:flex-end;gap:40px;margin-top:56px"><div class="node"><b>Acceptance</b><span>release candidates</span></div><div class="node gold"><b>Production</b><span>stable releases</span></div></div>
</div>
<p style="font-size:26px;letter-spacing:.08em;text-transform:uppercase;color:rgba(240,243,250,.55)">8 clusters · AWS and Azure · GitOps</p>
</div>`, FLOW + ".foot{display:none}");
  }
  return doc(`<div class="wrap">
<div class="col" style="padding-inline:90px">
<div class="node"><b>Commit</b></div><i class="c-v"></i><div class="node"><b>CI</b></div><i class="c-v"></i><div class="node"><b>Registry</b></div><i class="c-v"></i><div class="node gold"><b>Argo CD</b></div>
</div>
<div class="row" style="gap:24px"><div class="node" style="flex:1"><b style="font-size:46px">Acceptance</b></div><div class="node gold" style="flex:1"><b style="font-size:46px">Production</b></div></div>
</div>`, FLOW + ".foot{display:none}" + ".wrap{bottom:330px;top:48px;justify-content:space-between}.node{padding:16px 24px}.node b{font-size:52px}.c-v{height:22px}");
}

/* --- homelab: three ways in → the laptop (k3s + Home Assistant), no open ports */
const LAB = FLOW + `.laptop{border:3px solid rgba(240,243,250,.3);border-radius:12px;padding:36px;background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.01));box-shadow:0 30px 80px rgba(0,0,0,.5);position:relative}
.laptop::after{content:"";position:absolute;left:-5%;right:-5%;bottom:-24px;height:14px;border-radius:0 0 18px 18px;background:rgba(240,243,250,.22)}
.lab{font-size:24px;color:rgba(240,243,250,.6);margin-bottom:22px}
.laptop .node+.node{margin-top:20px}
.way{font-family:"Instrument Serif",Georgia,serif;font-size:56px;line-height:1}
.way small{display:block;font-family:"Schibsted Grotesk",sans-serif;font-size:24px;color:rgba(240,243,250,.58);margin-top:8px}
.ways{display:flex;flex-direction:column;gap:46px}
.shield{display:flex;align-items:center;gap:16px;font-size:30px}
.shield i{width:46px;height:52px;display:block;background:#fbc044;clip-path:path("M23 0 46 9v17c0 14-10 22-23 26C10 48 0 40 0 26V9z")}`;
function homelab(shape) {
  const box = `<div class="laptop"><p class="lab">One old laptop · Proxmox</p><div class="node gold"><b>k3s</b><span>15 apps, deployed by Argo CD</span></div><div class="node"><b>Home Assistant</b><span>Zigbee stick passed through</span></div></div>`;
  if (shape === "wide") {
    return doc(`<div class="wrap">
<div class="row" style="gap:60px;align-items:center">
<div class="ways" style="width:470px"><p class="way">Tailnet<small>the default</small></p><p class="way">Cloudflare Tunnel<small>opt-in, behind a login</small></p><p class="way">Tailscale Funnel<small>opt-in, for one evening</small></p></div>
<i class="c-h" style="max-width:80px"></i>
<div style="flex:1">${box}</div>
</div>
<div class="shield" style="align-self:flex-end"><i></i>0 open ports</div>
</div>`, LAB + ".foot{display:none}");
  }
  return doc(`<div class="wrap">
${box}
<div><p class="way" style="font-size:46px">Tailnet by default<small>two more ways in, both opt-in</small></p><div class="shield" style="margin-top:28px"><i></i>0 open ports</div></div>
</div>`, LAB + ".wrap{bottom:330px;top:48px;justify-content:space-between}.node{padding:16px 24px}.node b{font-size:52px}.c-v{height:22px}");
}

/* --- MTG: Tutor library behind, Rules of 99 home in front, Scryfall on a phone */
function mtg(shape, shots) {
  const s = (f) => "file://" + path.join(shots, f);
  const css = `.shot{position:absolute;border-radius:6px;overflow:hidden;box-shadow:0 40px 90px rgba(0,0,0,.65),0 0 0 2px rgba(255,255,255,.08)}
.shot img{display:block;width:100%;height:100%;object-fit:cover;object-position:top left}
.phone{position:absolute;border-radius:44px;padding:12px;background:#111;box-shadow:0 40px 90px rgba(0,0,0,.7),0 0 0 2px rgba(255,255,255,.12)}
.phone img{display:block;width:100%;height:100%;object-fit:cover;object-position:top;border-radius:34px}`;
  if (shape === "wide") {
    return doc(`
<div class="shot" style="${abs(70, 80, 900)}height:560px;transform:rotate(-4deg);opacity:.9"><img src="${s("tutor-library@2x.webp")}"></div>
<div class="shot" style="${abs(380, 300, 1000)}height:625px;transform:rotate(1.5deg)"><img src="${s("r99-lobby@2x.webp")}"></div>
<div class="phone" style="${abs(1250, 140, 300)}height:640px;transform:rotate(5deg)"><img src="${s("scryfall-home-mobile.webp")}"></div>
<p class="foot" style="left:auto;right:64px;bottom:44px">Rules of 99 · Tutor · Scryfall, in plain words</p>`, css);
  }
  return doc(`
<div class="shot" style="${abs(20, 30, 720)}height:500px;transform:rotate(-5deg);opacity:.85"><img src="${s("tutor-library@2x.webp")}"></div>
<div class="shot" style="${abs(40, 220, 820)}height:512px;transform:rotate(2deg)"><img src="${s("r99-lobby@2x.webp")}"></div>
<div class="phone" style="${abs(520, 330, 230)}height:490px;transform:rotate(6deg)"><img src="${s("scryfall-home-mobile.webp")}"></div>`, css);
}

async function render(dir) {
  const { chromium } = require("playwright");
  const outDir = path.join(dir, "assets/covers");
  fs.mkdirSync(outDir, { recursive: true });
  const shots = path.join(dir, "assets/shots");
  const browser = await chromium.launch();
  const jobs = [];
  for (const shape of ["wide", "card"]) {
    const [w, h] = shape === "wide" ? [1600, 1000] : [800, 1000];
    for (const [id, fn] of [["platform", platform], ["homelab", homelab], ["mtg", mtg]]) jobs.push({ id, shape, w, h, html: fn(shape, shots) });
  }
  const ctx = await browser.newContext({ deviceScaleFactor: 2 });
  for (const j of jobs) {
    const p = await ctx.newPage();
    await p.setViewportSize({ width: j.w, height: j.h });
    const tmp = path.join(outDir, "_" + j.id + ".html");
    fs.writeFileSync(tmp, j.html);
    await p.goto("file://" + tmp, { waitUntil: "networkidle" });
    await p.evaluate(() => document.fonts.ready);
    const png = path.join(outDir, "_" + j.id + "-" + j.shape + ".png");
    await p.screenshot({ path: png });
    fs.unlinkSync(tmp);
    await p.close();
    // 2x and 1x webp from the 2x PNG
    execFileSync("python3", ["-c",
      "import sys;from PIL import Image;im=Image.open(sys.argv[1]).convert('RGB');im.save(sys.argv[2],'WEBP',quality=86,method=6);" +
      "im.resize((im.width//2,im.height//2),Image.LANCZOS).save(sys.argv[3],'WEBP',quality=88,method=6)",
      png, path.join(outDir, j.id + "-" + j.shape + "@2x.webp"), path.join(outDir, j.id + "-" + j.shape + ".webp")]);
    fs.unlinkSync(png);
  }
  await browser.close();
}
module.exports = { render };
if (require.main === module) render(__dirname).then(() => console.log("covers done"));
