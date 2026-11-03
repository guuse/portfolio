/*
 * r2-beeld · round 16: the illustration kit and the scenes drawn with it.
 *
 * One hand for every drawing: a clean 2D technical illustration, front elevation seen from
 * slightly above. Rules:
 *   - Every solid object is a front face plus a thin lit top plane (light comes from above),
 *     outlined at 1.5 units, corner radius 2.5 on bodies and 1.5 on small parts.
 *   - Recesses (drive bays, pod slots, screens) are the darkest navy; details are 1.2-unit lines.
 *   - Objects stand on a flat contact shadow, never a blur.
 *   - Palette: navy shades + ink, one amber for the thing in motion, one cool blue for "on".
 * Colours are CSS classes (k-*), styled in site.css, so the same markup works on the site and
 * in covers.js. Everything here runs in Node at build time and returns SVG strings, drawn in
 * the scene's final state: that is the no-JS and reduced-motion frame. scenes.js animates it.
 *
 * Exports: scene(id), card(id), cover(id, shape), packetAt(d, f), sketch()
 */
"use strict";

/* ------------------------------------------------------------------ helpers */
const n = (v) => +(+v).toFixed(2);
function attrs(o) {
  let s = "";
  for (const k in o) if (o[k] !== undefined && o[k] !== null && o[k] !== false) s += " " + k + '="' + (typeof o[k] === "number" ? n(o[k]) : o[k]) + '"';
  return s;
}
const tag = (t, o, inner) => "<" + t + attrs(o || {}) + (inner === undefined ? "/>" : ">" + inner + "</" + t + ">");
const g = (o, inner) => tag("g", o, inner);
const rect = (x, y, w, h, cls, rx, extra) => tag("rect", Object.assign({ x, y, width: w, height: h, rx: rx || undefined, class: cls }, extra || {}));
const path = (d, cls, extra) => tag("path", Object.assign({ d, class: cls }, extra || {}));
const circle = (cx, cy, r, cls, extra) => tag("circle", Object.assign({ cx, cy, r, class: cls }, extra || {}));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const text = (x, y, s, cls, anchor, extra) => tag("text", Object.assign({ x, y, class: cls || "lb", "text-anchor": anchor || undefined }, extra || {}), esc(s));

/* ------------------------------------------------------------------ path sampling (Node side) */
// Only M, L, H, V, C (absolute) are used in this file, so a small parser is enough.
function samplePath(d) {
  const tok = d.match(/[MLHVC]|-?\d*\.?\d+/g);
  const pts = [];
  let i = 0, cmd = "", x = 0, y = 0;
  const num = () => +tok[i++];
  while (i < tok.length) {
    if (/[MLHVC]/.test(tok[i])) cmd = tok[i++];
    if (cmd === "M") { x = num(); y = num(); pts.push([x, y]); cmd = "L"; }
    else if (cmd === "L") { x = num(); y = num(); pts.push([x, y]); }
    else if (cmd === "H") { x = num(); pts.push([x, y]); }
    else if (cmd === "V") { y = num(); pts.push([x, y]); }
    else if (cmd === "C") {
      const x1 = num(), y1 = num(), x2 = num(), y2 = num(), x3 = num(), y3 = num();
      for (let k = 1; k <= 24; k++) {
        const t = k / 24, u = 1 - t;
        pts.push([u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3, u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3]);
      }
      x = x3; y = y3;
    }
  }
  const len = [0];
  for (let k = 1; k < pts.length; k++) len.push(len[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
  return { pts, len, total: len[len.length - 1] };
}
function pointAt(d, f) {
  const s = typeof d === "string" ? samplePath(d) : d;
  const L = Math.max(0, Math.min(1, f)) * s.total;
  let k = 1;
  while (k < s.len.length - 1 && s.len[k] < L) k++;
  const a = s.pts[k - 1], b = s.pts[k], seg = s.len[k] - s.len[k - 1] || 1, t = (L - s.len[k - 1]) / seg;
  return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, a: Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI };
}

/* ------------------------------------------------------------------ the kit */
// Contact shadow: a flat capsule on the ground.
const shadow = (cx, y, w) => rect(cx - w / 2, y - 2.5, w, 5, "k-shadow", 2.5);

// A solid box: lit top plane (narrower at the back) + front face, with an inner highlight.
function slab(x, y, w, h, o) {
  o = o || {};
  const t = o.top === undefined ? 6 : o.top, ins = o.inset === undefined ? t * 0.9 : o.inset, r = o.r === undefined ? 2.5 : o.r;
  return (t ? path("M" + n(x + ins) + " " + n(y - t) + "H" + n(x + w - ins) + "L" + n(x + w) + " " + n(y) + "H" + n(x) + "Z", "k-top") : "") +
    rect(x, y, w, h, o.cls || "k-face", r) + (o.hl === false ? "" : path("M" + n(x + 3) + " " + n(y + 1.6) + "H" + n(x + w - 3), "k-hl")) +
    (h > 14 ? path("M" + n(x + 2.5) + " " + n(y + h - 1.6) + "H" + n(x + w - 2.5), "k-lo") : "");
}

// Drive bays, vents and two status LEDs on a server front.
function unitFace(x, y, w, h, o) {
  o = o || {};
  let s = "";
  const bays = o.bays === undefined ? Math.max(1, Math.floor(w * 0.36 / 15)) : o.bays;
  const bh = Math.min(h - 8, 12), by = y + (h - bh) / 2;
  for (let i = 0; i < bays; i++) {
    const bx = x + 7 + i * 15;
    s += rect(bx, by, 12, bh, "k-dark", 1.5) + path("M" + n(bx + 3) + " " + n(by + bh / 2) + "H" + n(bx + 9), "k-det");
  }
  const v0 = x + 7 + bays * 15 + 6, v1 = x + w - 26;
  for (let vx = v0; vx <= v1; vx += 4.5) s += path("M" + n(vx) + " " + n(y + 6) + "V" + n(y + h - 6), "k-vent");
  s += circle(x + w - 16, y + h / 2, 2, "k-led") + circle(x + w - 9, y + h / 2, 2, "k-led k-led--act", o.ledKey ? { "data-k": o.ledKey } : undefined);
  return s;
}

// A rack-mounted server, h units tall (22 per unit), with ears and screws.
function server(x, y, w, h, o) {
  o = o || {};
  return rect(x - 5, y + 1, 5, h - 2, "k-ear", 1) + rect(x + w, y + 1, 5, h - 2, "k-ear", 1) +
    circle(x - 2.5, y + 5, 1.1, "k-screw") + circle(x + w + 2.5, y + 5, 1.1, "k-screw") +
    rect(x, y, w, h, "k-face", 2) + path("M" + n(x + 3) + " " + n(y + 1.6) + "H" + n(x + w - 3), "k-hl") + unitFace(x, y, w, h, o);
}

// A Kubernetes worker: a 2U server whose lower half is a tray of pod slots.
// Pods are separate elements (pod()), so they can be added and drained.
function nodeBody(x, y, w, h, slots) {
  const sw = (w - 14 - (slots - 1) * 4) / slots, sy = y + 17, sh = h - 22;
  let s = rect(x - 4, y + 1, 4, h - 2, "k-ear", 1) + rect(x + w, y + 1, 4, h - 2, "k-ear", 1) +
    rect(x, y, w, h, "k-face", 2.5) + path("M" + n(x + 3) + " " + n(y + 1.6) + "H" + n(x + w - 3), "k-hl");
  // top strip: a handle, vents, LEDs
  s += rect(x + 7, y + 5, 16, 6, "k-dark", 1.5);
  for (let vx = x + 30; vx <= x + w - 26; vx += 4.5) s += path("M" + n(vx) + " " + n(y + 5) + "V" + n(y + 11), "k-vent");
  s += circle(x + w - 15, y + 8, 1.8, "k-led") + circle(x + w - 9, y + 8, 1.8, "k-led k-led--act");
  for (let i = 0; i < slots; i++) s += rect(x + 7 + i * (sw + 4), sy, sw, sh, "k-slot", 2);
  return s;
}
function podSlot(x, y, w, h, slots, i) {
  const sw = (w - 14 - (slots - 1) * 4) / slots, sh = h - 22;
  return { x: x + 7 + i * (sw + 4), y: y + 17, w: sw, h: sh };
}
// A pod: a small cartridge with a latch line, drawn in a slot.
function pod(r, o) {
  o = o || {};
  return g({ class: "k-podg k-origin-c", "data-k": o.key, opacity: o.hidden ? 0 : undefined },
    rect(r.x + 1.5, r.y + 1.5, r.w - 3, r.h - 3, "k-pod", 1.5) + path("M" + n(r.x + 4.5) + " " + n(r.y + 5) + "H" + n(r.x + r.w - 4.5), "k-pod-l") +
    (r.h > 12 ? rect(r.x + r.w / 2 - 3, r.y + r.h - 8, 6, 3.4, "k-pod-d", 1) : ""));
}

// A server rack: top cap, two rails with mounting holes, a recessed back, plinth and feet.
function rack(x, y, w, h) {
  let s = shadow(x + w / 2, y + h + 4, w + 22);
  s += rect(x + 2, y + h, 8, 4, "k-foot", 1) + rect(x + w - 10, y + h, 8, 4, "k-foot", 1);
  s += rect(x + 7, y + 10, w - 14, h - 20, "k-back", 1);
  for (const rx of [x, x + w - 7]) {
    s += rect(rx, y + 10, 7, h - 20, "k-rail", 1);
    for (let hy = y + 16; hy < y + h - 14; hy += 9) s += rect(rx + 2.5, hy, 2, 3, "k-hole", 0.6);
  }
  s += slab(x - 5, y + 5, w + 10, 8, { top: 5, r: 2 });
  s += slab(x - 5, y + h - 10, w + 10, 10, { top: 0, r: 2 });
  return s;
}

// An application window: title bar with one tab, and one of five content layouts.
function appWin(x, y, w, h, kind) {
  let s = rect(x, y, w, h, "k-win", 3) + path("M" + n(x) + " " + n(y + 13) + "H" + n(x + w), "k-edge-line") +
    path("M" + n(x + 3) + " " + n(y + 13) + "V" + n(y + 6) + "Q" + n(x + 3) + " " + n(y + 3.5) + " " + n(x + 6) + " " + n(y + 3.5) + "H" + n(x + 30) + "Q" + n(x + 33) + " " + n(y + 3.5) + " " + n(x + 34) + " " + n(y + 6) + "L" + n(x + 36) + " " + n(y + 13), "k-tab") +
    circle(x + w - 8, y + 8, 1.6, "k-det-f");
  const cx = x + 7, cy = y + 19, cw = w - 14, ch = h - 25;
  const line = (lx, ly, lw, cls) => rect(lx, ly, lw, 3, cls || "k-txt", 1.5);
  if (kind === "hero") {
    s += rect(cx, cy, cw, ch * 0.5, "k-img", 1.5) + circle(cx + cw * 0.72, cy + ch * 0.2, 3.5, "k-mark") + path("M" + n(cx + 4) + " " + n(cy + ch * 0.5 - 2) + "L" + n(cx + cw * 0.3) + " " + n(cy + ch * 0.26) + "L" + n(cx + cw * 0.5) + " " + n(cy + ch * 0.5 - 2), "k-imgline") +
      line(cx, cy + ch * 0.62, cw * 0.7, "k-txt k-txt--b") + line(cx, cy + ch * 0.78, cw * 0.9) + line(cx, cy + ch * 0.92, cw * 0.55);
  } else if (kind === "shop") {
    const q = (cw - 8) / 3;
    for (let i = 0; i < 3; i++) s += rect(cx + i * (q + 4), cy, q, ch * 0.55, "k-img", 1.5) + line(cx + i * (q + 4), cy + ch * 0.66, q * 0.8) + rect(cx + i * (q + 4), cy + ch * 0.82, q * 0.45, 4, "k-mark", 1.5);
  } else if (kind === "list") {
    for (let i = 0; i < 4; i++) s += circle(cx + 3.5, cy + 3.5 + i * (ch / 4), 3, i === 0 ? "k-mark" : "k-img") + line(cx + 11, cy + 2 + i * (ch / 4), cw * (0.75 - (i % 2) * 0.2));
  } else if (kind === "article") {
    s += line(cx, cy, cw * 0.5, "k-txt k-txt--b");
    for (let i = 0; i < 4; i++) s += line(cx, cy + 9 + i * 7, cw * (i === 3 ? 0.35 : 0.52));
    s += rect(cx + cw * 0.6, cy, cw * 0.4, ch, "k-img", 1.5) + path("M" + n(cx + cw * 0.66) + " " + n(cy + ch * 0.4) + "h" + n(cw * 0.28) + "m" + n(-cw * 0.14) + " -6v12", "k-markline");
  } else if (kind === "form") {
    s += line(cx, cy, cw * 0.4, "k-txt k-txt--b") + rect(cx, cy + 8, cw, 9, "k-field", 2) + rect(cx, cy + 21, cw, 9, "k-field", 2) + rect(cx, cy + ch - 8, cw * 0.4, 8, "k-mark", 2);
  }
  return s;
}

// A laptop, open, from slightly above: screen with a thick bezel, a keyboard deck in perspective.
function laptop(cx, by, w, o) {
  o = o || {};
  const sh = w * 0.6, sw = w, sx = cx - sw / 2, sy = by - 18 - sh;
  let s = shadow(cx, by + 8, w + 60);
  // deck: front lip, then the top surface in perspective
  s += path("M" + n(cx - w / 2 - 22) + " " + n(by) + "H" + n(cx + w / 2 + 22) + "V" + n(by + 4) + "Q" + n(cx + w / 2 + 22) + " " + n(by + 7) + " " + n(cx + w / 2 + 18) + " " + n(by + 7) + "H" + n(cx - w / 2 - 18) + "Q" + n(cx - w / 2 - 22) + " " + n(by + 7) + " " + n(cx - w / 2 - 22) + " " + n(by + 4) + "Z", "k-face");
  s += path("M" + n(cx - w / 2) + " " + n(by - 18) + "H" + n(cx + w / 2) + "L" + n(cx + w / 2 + 22) + " " + n(by) + "H" + n(cx - w / 2 - 22) + "Z", "k-top");
  // keyboard: three rows of keys, narrowing to the back
  for (let r = 0; r < 3; r++) {
    const t0 = 0.16 + r * 0.2, t1 = t0 + 0.14;
    const yA = by - 18 + 18 * t0, yB = by - 18 + 18 * t1;
    const xA = w / 2 + 22 * t0 - 10, xB = w / 2 + 22 * t1 - 10;
    s += path("M" + n(cx - xA) + " " + n(yA) + "H" + n(cx + xA) + "L" + n(cx + xB) + " " + n(yB) + "H" + n(cx - xB) + "Z", "k-keys");
  }
  s += path("M" + n(cx - w * 0.11) + " " + n(by - 2.5) + "H" + n(cx + w * 0.11) + "L" + n(cx + w * 0.1) + " " + n(by - 5.5) + "H" + n(cx - w * 0.1) + "Z", "k-dark");
  // hinge and screen
  s += rect(cx - w * 0.3, by - 21, w * 0.6, 4, "k-ear", 2);
  s += rect(sx, sy, sw, sh, "k-face", 6) + path("M" + n(sx + 5) + " " + n(sy + 1.6) + "H" + n(sx + sw - 5), "k-hl");
  s += rect(sx + 9, sy + 10, sw - 18, sh - 20, "k-screen", 2.5) +
    path("M" + n(sx + sw - 9 - (sh - 20) * 0.9) + " " + n(sy + 10) + "H" + n(sx + sw - 9 - (sh - 20) * 0.62) + "L" + n(sx + sw - 9 - (sh - 20) * 0.98) + " " + n(sy + sh - 10) + "H" + n(sx + sw - 9 - (sh - 20) * 1.26) + "Z", "k-sheen");
  s += circle(cx, sy + 5, 1.6, "k-det-f");
  if (o.sticker && false) s += rect(cx + w / 2 - 2, by - 12, 14, 8, "k-sticker", 1.5, { transform: "rotate(-8 " + n(cx + w / 2 + 5) + " " + n(by - 8) + ")" });
  return { svg: s, screen: { x: sx + 9, y: sy + 10, w: sw - 18, h: sh - 20 } };
}

// A database: a cylinder with two bands.
function database(cx, ty, w, h) {
  const rx = w / 2, ry = w * 0.15;
  let s = shadow(cx, ty + h + ry + 3, w + 18);
  s += path("M" + n(cx - rx) + " " + n(ty) + "V" + n(ty + h) + "A" + n(rx) + " " + n(ry) + " 0 0 0 " + n(cx + rx) + " " + n(ty + h) + "V" + n(ty) + "Z", "k-face");
  for (const f of [0.36, 0.68]) s += path("M" + n(cx - rx) + " " + n(ty + h * f) + "A" + n(rx) + " " + n(ry) + " 0 0 0 " + n(cx + rx) + " " + n(ty + h * f), "k-band");
  s += tag("ellipse", { cx, cy: ty, rx, ry, class: "k-top" });
  s += tag("ellipse", { cx, cy: ty, rx: rx * 0.55, ry: ry * 0.55, class: "k-det-ring" });
  return s;
}

// An older, IPv4-only machine: a tower with a 5.25" bay and a round power button.
function tower(x, y, w, h) {
  let s = shadow(x + w / 2, y + h + 3, w + 16) + slab(x, y, w, h, { top: 6, r: 2 });
  s += rect(x + 7, y + 9, w - 14, 11, "k-dark", 1) + path("M" + n(x + 12) + " " + n(y + 14.5) + "H" + n(x + w - 22), "k-det");
  s += rect(x + 7, y + 24, w - 14, 7, "k-dark", 1);
  for (let vy = y + h * 0.52; vy < y + h - 12; vy += 5) s += path("M" + n(x + 10) + " " + n(vy) + "H" + n(x + w - 10), "k-vent");
  s += circle(x + w - 13, y + h - 9, 3.2, "k-det-ring") + circle(x + 12, y + h - 9, 1.8, "k-led");
  return s;
}

// A small network appliance with two labelled ports (used for DNS64/NAT64).
function appliance(x, y, w, h, ports) {
  let s = shadow(x + w / 2, y + h + 3, w + 16) + slab(x, y, w, h, { top: 6 });
  ports.forEach((p, i) => {
    const px = x + 12 + i * (w - 24 - 18);
    s += rect(px, y + h - 19, 18, 12, "k-dark", 1.5) + rect(px + 4, y + h - 16, 10, 5, "k-port", 1);
  });
  s += circle(x + w / 2 - 4, y + 10, 1.8, "k-led") + circle(x + w / 2 + 4, y + 10, 1.8, "k-led k-led--act");
  return s;
}

// A gate across a path: a housing above, a striped bar that retracts into it (scaleY).
function gate(x, y0, y1, key) {
  const bw = 9;
  let s = slab(x - 15, y0 - 18, 30, 18, { top: 5 }) + circle(x + 8, y0 - 9, 1.8, "k-led k-led--warn", key ? { "data-k": key + "-led" } : undefined);
  let bar = rect(x - bw / 2, y0, bw, y1 - y0, "k-bar", 2);
  for (let sy = y0 + 6; sy < y1 - 4; sy += 12) bar += path("M" + n(x - bw / 2) + " " + n(sy + 6) + "L" + n(x + bw / 2) + " " + n(sy) + "V" + n(sy + 6) + "L" + n(x - bw / 2) + " " + n(sy + 12) + "Z", "k-stripe");
  s = g({ "data-k": key, class: "k-gatebar" }, bar) + s;
  s += rect(x - 15, y1 + 2, 30, 6, "k-face", 2) + shadow(x, y1 + 12, 40);
  return s;
}

// A small data hall: building with a roof plane, rack fronts behind windows and a door.
function hall(x, y, w, h) {
  let s = slab(x, y, w, h, { top: 8, r: 2 });
  const n1 = Math.floor((w - 40) / 16);
  for (let i = 0; i < n1; i++) {
    const rx = x + 10 + i * 16;
    s += rect(rx, y + 10, 12, h - 24, "k-dark", 1.5);
    for (let k = 0; k < 3; k++) s += circle(rx + 6, y + 16 + k * 7, 1.1, k === 0 ? "k-led" : "k-det-f");
  }
  s += rect(x + w - 26, y + h - 30, 16, 30, "k-dark", 1.5) + path("M" + n(x + w - 18) + " " + n(y + h - 30) + "V" + n(y + h), "k-det");
  return s;
}

// The single way in (CloudFront): an arch with an open doorway and a threshold.
function portal(cx, y, w, h) {
  const r = w / 2, ir = r - 11;
  let s = path("M" + n(cx - r) + " " + n(y + h) + "V" + n(y + r) + "A" + n(r) + " " + n(r) + " 0 0 1 " + n(cx + r) + " " + n(y + r) + "V" + n(y + h) + "H" + n(cx + ir) + "V" + n(y + r) + "A" + n(ir) + " " + n(ir) + " 0 0 0 " + n(cx - ir) + " " + n(y + r) + "V" + n(y + h) + "Z", "k-face");
  s += path("M" + n(cx - ir) + " " + n(y + h) + "V" + n(y + r) + "A" + n(ir) + " " + n(ir) + " 0 0 1 " + n(cx + ir) + " " + n(y + r) + "V" + n(y + h) + "Z", "k-doorway");
  s += path("M" + n(cx - r + 3) + " " + n(y + r) + "A" + n(r - 3) + " " + n(r - 3) + " 0 0 1 " + n(cx + r - 3) + " " + n(y + r), "k-hl");
  s += rect(cx - r - 8, y + h, w + 16, 7, "k-face", 2) + path("M" + n(cx - r - 5) + " " + n(y + h + 1.6) + "H" + n(cx + r + 5), "k-hl") + shadow(cx, y + h + 10, w + 30);
  return s;
}

// Visitors: a phone and a small laptop.
function phone(x, y) { return rect(x, y, 20, 34, "k-face", 4) + rect(x + 2.5, y + 4, 15, 24, "k-screen", 1.5) + rect(x + 7, y + 30, 6, 1.6, "k-det-f", 0.8); }
function miniLaptop(cx, by) {
  return rect(cx - 19, by - 26, 38, 24, "k-face", 3) + rect(cx - 15.5, by - 22.5, 31, 17, "k-screen", 1.5) +
    path("M" + n(cx - 24) + " " + n(by - 2) + "H" + n(cx + 24) + "L" + n(cx + 22) + " " + n(by + 2) + "H" + n(cx - 22) + "Z", "k-top");
}

// The address tag a packet carries (IPv4 / IPv6).
function addrTag(x, y, key) {
  const w = 96, h = 34;
  const body = path("M" + n(x + 12) + " " + n(y) + "H" + n(x + w - 3) + "Q" + n(x + w) + " " + n(y) + " " + n(x + w) + " " + n(y + 3) + "V" + n(y + h - 3) + "Q" + n(x + w) + " " + n(y + h) + " " + n(x + w - 3) + " " + n(y + h) + "H" + n(x + 12) + "L" + n(x) + " " + n(y + h / 2) + "Z", "k-tag") +
    circle(x + 12, y + h / 2, 3, "k-hole");
  return g({ "data-k": key, class: "k-tagg" },
    g({ "data-k": key + "-4", opacity: 0 }, body + text(x + 56, y + 23, "IPv4", "lb-tag", "middle")) +
    g({ "data-k": key + "-6", class: "is-v6" }, body.replace('class="k-tag"', 'class="k-tag k-tag--v6"') + text(x + 56, y + 23, "IPv6", "lb-tag lb-tag--v6", "middle")));
}

// A packet: a small capsule with a seam, pointing along its path.
function packet(x, y, a, cls) {
  return g({ class: "pk " + (cls || ""), transform: "translate(" + n(x) + " " + n(y) + ") rotate(" + n(a) + ")" },
    rect(-8, -4.5, 16, 9, "pk-b", 2) + rect(3, -4.5, 5, 9, "pk-h", 1.5) + path("M-4.5 -1.2H0.5M-4.5 1.4H-1", "pk-s"));
}
const packetAt = (d, f, cls) => { const p = pointAt(d, f); return packet(p.x, p.y, p.a, "pk-static " + (cls || "")); };

// git: a branch line with commits.
function commit(cx, cy, r, cls, extra) { return circle(cx, cy, r, cls || "k-commit", extra); }

/* ------------------------------------------------------------------ svg wrapper */
function svg(id, vb, label, body, o) {
  o = o || {};
  return '<svg class="scene-svg scene--' + id + (o.cls ? " " + o.cls : "") + '" viewBox="' + vb + '"' + (o.decorative ? ' aria-hidden="true" focusable="false"' : ' role="img" aria-label="' + esc(label) + '"') + ' data-art="' + id + '">' + body + "</svg>";
}

/* ================================================================== scene 1: many projects, one platform */
const S1 = {
  ground: 384,
  docks: [92, 196, 300, 404, 508],
  win: { w: 90, h: 64 },
  dockY: 222, // window top when docked
  old: [ // where each app sat before: centre x, window top, tilt
    { cx: 92, y: 196, r: -3 }, { cx: 222, y: 232, r: 2 }, { cx: 350, y: 262, r: 3.5 }, { cx: 482, y: 232, r: -2 }
  ],
  kinds: ["hero", "shop", "list", "article", "form"]
};
function oldServers() {
  const G = S1.ground;
  // a tower, two mismatched 1U boxes, a small box on its side, an old 2U with a loose cable
  const a = shadow(92, G + 2, 74) + slab(62, 298, 60, 86, { top: 6 }) + rect(70, 308, 44, 9, "k-dark", 1) + rect(70, 321, 44, 6, "k-dark", 1) +
    (() => { let v = ""; for (let y = 336; y < 372; y += 5) v += path("M72 " + y + "H112", "k-vent"); return v; })() + circle(108, 375, 1.8, "k-led") +
    rect(90, 270, 4, 22, "k-face", 1) + rect(80, 288, 24, 5, "k-face", 1.5);
  const b = shadow(222, G + 2, 116) + g({}, server(176, 362, 98, 22, { bays: 2 })) + g({ transform: "rotate(-1.5 222 350)" }, server(181, 338, 84, 22, { bays: 1 })) +
    rect(219, 306, 4, 26, "k-face", 1) + rect(208, 328, 26, 5, "k-face", 1.5);
  const c = shadow(350, G + 2, 74) + slab(322, 352, 56, 32, { top: 5 }) + circle(334, 368, 3, "k-det-ring") + circle(366, 368, 1.8, "k-led") +
    rect(348, 334, 4, 13, "k-face", 1) + rect(339, 344, 22, 4, "k-face", 1.5);
  const d = shadow(482, G + 2, 128) + server(428, 334, 108, 48, { bays: 3 }) +
    path("M536 360C556 362 560 384 540 388C520 392 470 390 452 392", "k-cable") +
    rect(479, 306, 4, 24, "k-face", 1) + rect(468, 325, 26, 5, "k-face", 1.5);
  return [a, b, c, d];
}
function platformSlab() {
  const x = 30, y = 318, w = 540, h = 66;
  let s = shadow(300, S1.ground + 2, w + 30) + slab(x, y, w, h, { top: 12, inset: 10 });
  const sec = w / 3;
  for (let i = 0; i < 3; i++) {
    const sx = x + i * sec;
    if (i) s += path("M" + n(sx) + " " + n(y + 4) + "V" + n(y + h - 4), "k-seam");
    s += g({ class: "k-unit" }, unitFace(sx + 10, y + 9, sec - 20, 22, { bays: 3 }) + unitFace(sx + 10, y + 35, sec - 20, 22, { bays: 3 }));
  }
  return s;
}
function dock(cx) { return slab(cx - 22, 309, 44, 6, { top: 3, inset: 3 }) + rect(cx - 3, 288, 6, 21, "k-face", 1.5); }
function scene1() {
  const W = S1.win;
  let b = path("M20 " + (S1.ground + 0.5) + "H580", "k-ground");
  const olds = oldServers();
  b += g({ class: "s1-old" }, olds.map((s, i) => g({ "data-k": "old" + i, opacity: 0 }, s)).join(""));
  b += g({ "data-k": "plat" }, platformSlab() + S1.docks.map((cx, i) => g({ "data-k": "dock" + i, class: "k-origin-b" }, dock(cx))).join(""));
  // windows: drawn at their docked position; scenes.js moves them from their old spots
  b += S1.kinds.map((k, i) => g({ "data-k": "win" + i, class: "k-origin-c" }, shadowless(appWin(S1.docks[i] - W.w / 2, S1.dockY, W.w, W.h, k)))).join("");
  return svg("standard", "0 0 600 440", "Before: four client apps, each on its own different server. After: the same apps, and a fifth, docked side by side on one shared platform.", b);
}
const shadowless = (s) => s;

/* ================================================================== scene 2: it scales with the load */
const S2 = {
  racks: [60, 236, 412], rw: 128, top: 172, h: 218,
  slots: 4, nw: 108, nh: 44,
  lb: { x: 210, y: 88, w: 180, h: 24 },
  baked: [[1, 1, 1, 1, 1, 1, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1, 1, 0], [1, 1, 1, 1, 1, 0, 0, 0]],
  nodesBaked: [2, 3, 2]
};
S2.slotY = (k) => S2.top + S2.h - 12 - (k + 1) * (S2.nh + 6) + 2; // k = 0 is the bottom slot
S2.inPaths = ["M226 -24C226 30 268 40 274 84", "M300 -24V84", "M374 -24C374 30 332 40 326 84"];
S2.outPaths = S2.racks.map((rx) => "M300 114C300 150 " + (rx + 64) + " 136 " + (rx + 64) + " 170");
function scene2(o) {
  o = o || {};
  let b = path("M24 " + (S2.top + S2.h + 6.5) + "H576", "k-ground");
  b += S2.inPaths.map((d, i) => path(d, "k-route", { "data-k": "in" + i })).join("") + S2.outPaths.map((d, i) => path(d, "k-route", { "data-k": "out" + i })).join("");
  b += g({ class: "k-lb" }, shadow(300, 124, 200) + server(S2.lb.x, S2.lb.y, S2.lb.w, S2.lb.h, { bays: 2, ledKey: "lbled" }));
  if (!o.nolabels) b += text(S2.lb.x + S2.lb.w + 16, S2.lb.y + 17, "load balancer", "lb lb--s");
  b += '<g class="pk-layer" data-k="pk"></g>';
  S2.racks.forEach((rx, z) => {
    b += rack(rx, S2.top, S2.rw, S2.h);
    for (let k = 0; k < S2.slots; k++) {
      const nx = rx + 10, ny = S2.slotY(k), on = k < S2.nodesBaked[z];
      let pods = "";
      for (let s = 0; s < 4; s++) pods += pod(podSlot(nx, ny, S2.nw, S2.nh, 4, s), { key: "p" + z + k + s, hidden: !(on && S2.baked[z][k * 4 + s]) });
      b += g({ "data-k": "n" + z + k, class: "k-node", opacity: on ? undefined : 0 }, nodeBody(nx, ny, S2.nw, S2.nh, 4) + pods);
    }
    if (!o.nolabels) b += text(rx + S2.rw / 2, S2.top + S2.h + 36, "Zone " + "ABC"[z], "lb", "middle");
  });
  // a pending pod over each rack, for scenes.js
  b += S2.racks.map((rx, z) => g({ "data-k": "pend" + z, opacity: 0 }, rect(rx + 52, S2.top - 30, 24, 16, "k-pend", 2))).join("");
  // frozen packets for the still frame
  b += g({ class: "pk-still" }, packetAt(S2.inPaths[1], 0.55) + packetAt(S2.inPaths[0], 0.25) + packetAt(S2.inPaths[2], 0.8) + packetAt(S2.outPaths[0], 0.5) + packetAt(S2.outPaths[1], 0.78) + packetAt(S2.outPaths[2], 0.3));
  if (o.inner) return b;
  return svg("scale", "0 0 600 440", "Requests come in through a load balancer and are spread over three zones. Each zone is a rack of nodes with pods; as the load rises, nodes are added and pods spread onto them, and as it drops they drain and are removed.", b);
}

/* ================================================================== scene 3: two regions, one entry */
// A stylised globe: a horizon arc with a real orthographic graticule. Ireland and Tokyo stand
// upright on it, west to the left and east to the right; their spacing is not to scale.
const S3 = { R: 540, cx: 300, cy: 860, lat0: 14, lon0: 66 };
function project(lat, lon) {
  const r = Math.PI / 180, p0 = S3.lat0 * r, l0 = S3.lon0 * r, p = lat * r, l = lon * r;
  const cosc = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l - l0);
  return { x: S3.cx + S3.R * Math.cos(p) * Math.sin(l - l0), y: S3.cy - S3.R * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l - l0)), vis: cosc > 0 };
}
const onArc = (x) => { const dx = x - S3.cx, y = S3.cy - Math.sqrt(S3.R * S3.R - dx * dx); return { x, y, ang: Math.asin(dx / S3.R) * 180 / Math.PI }; };
function graticule() {
  let s = "";
  const line = (pts) => {
    let d = "", on = false;
    pts.forEach((q) => { if (q.vis) { d += (on ? "L" : "M") + n(q.x) + " " + n(q.y); on = true; } else on = false; });
    return d;
  };
  for (let lat = -15; lat <= 75; lat += 15) { const pts = []; for (let lon = -180; lon <= 180; lon += 3) pts.push(project(lat, lon)); s += path(line(pts), "k-grat"); }
  for (let lon = -180; lon < 180; lon += 20) { const pts = []; for (let lat = -80; lat <= 88; lat += 3) pts.push(project(lat, lon)); s += path(line(pts), "k-grat"); }
  return s;
}
S3.ie = onArc(148);
S3.jp = onArc(452);
const roof = (pt) => { const r = pt.ang * Math.PI / 180; return { x: pt.x + 70 * Math.sin(r), y: pt.y - 70 * Math.cos(r) }; };
S3.door = { cx: 300, y: 112, w: 78, h: 80 };
S3.toIE = (() => { const r = roof(S3.ie); return "M288 200C276 236 " + n(r.x + 40) + " " + n(r.y - 70) + " " + n(r.x) + " " + n(r.y); })();
S3.toJP = (() => { const r = roof(S3.jp); return "M312 200C324 236 " + n(r.x - 40) + " " + n(r.y - 70) + " " + n(r.x) + " " + n(r.y); })();
S3.inPaths = ["M196 46C196 80 276 84 288 122", "M300 50V122", "M404 46C404 80 324 84 312 122"];
function building(pt, key, label) {
  const ang = pt.ang;
  return g({ "data-k": key, class: "k-origin-b" },
    g({ transform: "rotate(" + n(ang) + " " + n(pt.x) + " " + n(pt.y) + ")" }, shadow(pt.x, pt.y + 2, 104) + hall(pt.x - 44, pt.y - 58, 88, 58)) +
    text(pt.x - (pt.x < 300 ? 8 : -8), pt.y + 34, label, "lb", "middle"));
}
function scene3() {
  let b = "";
  b += tag("clipPath", { id: "globe-clip" }, circle(S3.cx, S3.cy, S3.R));
  b += g({ "data-k": "globe" }, circle(S3.cx, S3.cy, S3.R, "k-globe") + g({ "clip-path": "url(#globe-clip)" }, graticule()) + circle(S3.cx, S3.cy, S3.R, "k-globe-edge"));
  b += g({ "data-k": "routes" }, path(S3.toIE, "k-route", { "data-k": "rie" }) + path(S3.toJP, "k-route", { "data-k": "rjp" }) + S3.inPaths.map((d, i) => path(d, "k-route", { "data-k": "ri" + i })).join(""));
  b += g({ "data-k": "lblIE", class: "k-rlabel" }, text(146, 238, "everything else", "lb lb--s", "end"));
  b += g({ "data-k": "lblJP", class: "k-rlabel" }, text(454, 238, "/<region>/*", "lb-m", "start"));
  b += building(S3.ie, "ie", "Ireland") + building(S3.jp, "jp", "Tokyo");
  b += g({ "data-k": "door" }, portal(S3.door.cx, S3.door.y, S3.door.w, S3.door.h) + text(S3.door.cx + S3.door.w / 2 + 16, S3.door.y + 46, "CloudFront", "lb lb--s"));
  b += g({ "data-k": "users" }, phone(186, 8) + miniLaptop(300, 44) + phone(394, 8));
  b += '<g class="pk-layer" data-k="pk"></g>';
  b += g({ class: "pk-still" }, packetAt(S3.inPaths[0], 0.5) + packetAt(S3.inPaths[2], 0.75) + packetAt(S3.toIE, 0.3) + packetAt(S3.toIE, 0.72) + packetAt(S3.toJP, 0.55, "pk--cool"));
  return svg("regions", "0 0 600 440", "One entry, two regions: requests from phones and laptops go through one door, CloudFront. Region paths are sent on to Tokyo and everything else to Ireland, drawn on a globe.", b);
}

/* ================================================================== scene 4: the IPv6 move */
const S4 = {
  toX: "M152 196C204 196 206 112 254 112",
  fromX: "M346 112C392 112 404 118 452 118",
  toDB: "M152 262C228 262 248 344 312 344H446",
  gateX: 382
};
function scene4() {
  let b = "";
  b += path(S4.toX, "k-route", { "data-k": "rx" }) + path(S4.fromX, "k-route", { "data-k": "rf" }) + path(S4.toDB, "k-route", { "data-k": "rdb" }) + path("M446 314H458", "k-route k-route--idle", { "data-k": "ridle" });
  // the cluster: two nodes on a plinth
  b += shadow(96, 300, 132) + slab(34, 286, 124, 12, { top: 0 }) + g({}, nodeBody(42, 232, 108, 44, 4) + [0, 1, 2].map((s) => pod(podSlot(42, 232, 108, 44, 4, s))).join("")) +
    g({}, nodeBody(42, 178, 108, 44, 4) + [0, 1, 2, 3].map((s) => pod(podSlot(42, 178, 108, 44, 4, s))).join(""));
  b += text(96, 330, "cluster", "lb", "middle");
  b += addrTag(48, 124, "tag");
  // translator and the old service
  b += g({ "data-k": "xlat" }, appliance(254, 88, 92, 46, ["6", "4"]) + text(300, 166, "DNS64 / NAT64", "lb lb--s", "middle"));
  b += g({ "data-k": "legacy" }, tower(452, 64, 72, 96) + text(488, 190, "IPv4-only", "lb lb--s", "middle"));
  // the database with two addresses, and the gate in front of the IPv6 one
  b += g({ "data-k": "db" }, database(500, 288, 92, 84) +
    rect(446, 306, 26, 16, "k-plate", 2) + text(459, 318, "4", "lb-port", "middle") +
    rect(446, 336, 26, 16, "k-plate k-plate--v6", 2) + text(459, 348, "6", "lb-port lb-port--v6", "middle") +
    text(500, 412, "database", "lb lb--s", "middle"));
  b += g({ "data-k": "gate" }, gate(S4.gateX, 322, 368, "bar") + text(S4.gateX, 292, "security group", "lb lb--s", "middle"));
  b += '<g class="pk-layer" data-k="pk"></g>';
  b += g({ class: "pk-still" }, packetAt(S4.toX, 0.45) + packetAt(S4.fromX, 0.55, "pk--ink") + packetAt(S4.toDB, 0.3) + packetAt(S4.toDB, 0.88));
  return svg("ipv6", "0 0 600 440", "The IPv6 move: a cluster's address tag flips from IPv4 to IPv6. Traffic to an IPv4-only service goes through a DNS64/NAT64 translator. Traffic to a database that answers on both an IPv4 and an IPv6 address is held at a security-group gate until the gate is opened for IPv6.", b);
}

/* ================================================================== scene 5: one change, every cluster */
const S5 = {
  y: 236, x0: 196, x1: 572,
  cols: [236, 320, 404, 488], cw: 64
};
S5.stubs = [];
S5.cols.forEach((x, i) => { S5.stubs.push({ x: x + S5.cw / 2, up: true, i: i * 2 }); S5.stubs.push({ x: x + S5.cw / 2, up: false, i: i * 2 + 1 }); });
function miniCluster(x, y, key) {
  const w = S5.cw;
  return g({ "data-k": key, class: "k-origin-b" },
    shadow(x + w / 2, y + 66, w + 12) + slab(x, y + 8, w, 58, { top: 7 }) +
    unitFace(x + 6, y + 15, w - 12, 18, { bays: 1 }) + unitFace(x + 6, y + 38, w - 12, 18, { bays: 1 }) +
    g({ "data-k": key + "-old" }, rect(x + w / 2 - 9, y - 6, 18, 9, "k-flag k-flag--old", 1.5)) +
    g({ "data-k": key + "-new", class: "k-origin-b" }, rect(x + w / 2 - 9, y - 6, 18, 9, "k-flag", 1.5)));
}
function scene5() {
  let b = "";
  // history on the left, the new commit at the end of it
  b += path("M24 " + S5.y + "H" + S5.x0, "k-git");
  [44, 84, 124].forEach((x) => { b += commit(x, S5.y, 6, "k-commit-old"); });
  b += g({ "data-k": "commit", class: "k-origin-c" }, commit(166, S5.y, 9, "k-commit") + circle(166, S5.y, 3.2, "k-commit-core"));
  b += text(166, S5.y + 36, "one change", "lb lb--s", "middle");
  // the spine and the ribs
  b += path("M" + S5.x0 + " " + S5.y + "H" + S5.x1, "k-wire");
  b += g({ "data-k": "lit-spine", class: "k-origin-l" }, path("M" + S5.x0 + " " + S5.y + "H" + S5.x1, "k-wire k-wire--lit"));
  const top = S5.y - 128, bot = S5.y + 40;
  S5.stubs.forEach((s) => {
    const d = s.up ? "M" + s.x + " " + S5.y + "V" + (top + 74) : "M" + s.x + " " + S5.y + "V" + (bot);
    b += path(d, "k-wire") + g({ "data-k": "lit" + s.i, class: s.up ? "k-origin-b" : "k-origin-t" }, path(d, "k-wire k-wire--lit"));
  });
  S5.cols.forEach((x, i) => { b += miniCluster(x, top, "c" + i * 2) + miniCluster(x, bot + 6, "c" + (i * 2 + 1)); });
  b += '<g class="pk-layer" data-k="pk"></g>';
  return svg("learned", "0 0 600 440", "One change, committed once, travels along one line to eight identical clusters, and each one updates in turn.", b);
}

/* ================================================================== homelab: from git push to running */
const H = {
  repo: { x: 34, y: 54, w: 172, h: 82 },
  build: { x: 44, y: 212, w: 152, h: 52 },
  reg: { x: 34, y: 352, w: 172 },
  lap: { cx: 432, by: 368, w: 232 }
};
H.p = {
  push: "M120 136V206",                              // repo → Actions
  ship: "M120 266V318",                              // Actions → GHCR
  watch: "M206 340C296 340 340 260 340 182",         // Image Updater watches GHCR
  tag: "M296 160C250 160 246 118 206 118",           // Image Updater commits the tag back to the repo
  sync: "M206 76C300 76 376 84 440 84",              // Argo CD syncs from the repo
  roll: "M494 100V246"                               // Argo CD rolls the app on the laptop
};
function shelf(x, y, w) {
  return shadow(x + w / 2, y + 30, w + 16) + rect(x + 6, y + 4, 4, 24, "k-rail", 1) + rect(x + w - 10, y + 4, 4, 24, "k-rail", 1) + slab(x, y, w, 7, { top: 4 });
}
function crate(x, y, w, h, key, hidden) {
  return g({ "data-k": key, class: "k-origin-b", opacity: hidden ? 0 : undefined },
    slab(x, y, w, h, { top: 5, inset: 4 }) + path("M" + n(x + 5) + " " + n(y + h / 2) + "H" + n(x + w - 5), "k-det") + rect(x + w / 2 - 5, y + 5, 10, 6, "k-dark", 1));
}
function chip(x, y, w, label, key) {
  return g({ "data-k": key }, rect(x, y, w, 30, "k-chip", 15) + circle(x + 15, y + 15, 4, "k-led") + text(x + 27, y + 20, label, "lb-chip"));
}
function homelabScene(o) {
  o = o || {};
  let b = "";
  // routes
  b += Object.keys(H.p).map((k) => path(H.p[k], "k-route" + (k === "watch" ? " k-route--dash" : ""), { "data-k": "r-" + k })).join("");
  // the repo: a panel with a branch line and commits
  const R = H.repo;
  b += shadow(R.x + R.w / 2, R.y + R.h + 4, R.w + 16) + slab(R.x, R.y, R.w, R.h, { top: 7 });
  b += rect(R.x + 10, R.y + 10, R.w - 20, R.h - 20, "k-dark", 2) + path("M" + (R.x + 20) + " " + (R.y + 41) + "H" + (R.x + R.w - 20), "k-git");
  [0, 1, 2].forEach((i) => { b += commit(R.x + 32 + i * 30, R.y + 41, 5, "k-commit-old"); });
  b += g({ "data-k": "c-push", class: "k-origin-c" }, commit(R.x + 122, R.y + 41, 7, "k-commit"));
  b += g({ "data-k": "c-tag", class: "k-origin-c" }, commit(R.x + 148, R.y + 41, 5.5, "k-commit-tag"));
  if (!o.nolabels) b += text(R.x + R.w / 2, R.y - 18, "app repo", "lb", "middle");
  // the build: a machine with a hatch
  const B = H.build;
  b += g({ "data-k": "build" }, shadow(B.x + B.w / 2, B.y + B.h + 4, B.w + 16) + slab(B.x, B.y, B.w, B.h, { top: 7 }) +
    rect(B.x + 12, B.y + 12, 52, B.h - 24, "k-dark", 2) + g({ "data-k": "hatch" }, rect(B.x + 16, B.y + 16, 44, B.h - 32, "k-face", 1.5)) +
    (() => { let v = ""; for (let vx = B.x + 76; vx < B.x + B.w - 30; vx += 4.5) v += path("M" + vx + " " + (B.y + 13) + "V" + (B.y + B.h - 13), "k-vent"); return v; })() +
    circle(B.x + B.w - 18, B.y + 18, 2, "k-led") + circle(B.x + B.w - 18, B.y + 27, 2, "k-led k-led--act", { "data-k": "buildled" }));
  if (!o.nolabels) b += text(B.x + B.w + 14, B.y + 22, "GitHub", "lb lb--s") + text(B.x + B.w + 14, B.y + 42, "Actions", "lb lb--s");
  // the registry: a shelf of images
  const G = H.reg;
  b += shelf(G.x, G.y, G.w) + crate(G.x + 14, G.y - 30, 40, 30) + crate(G.x + 62, G.y - 30, 40, 30) + crate(G.x + 112, G.y - 30, 40, 30, "crate", false);
  if (!o.nolabels) b += text(G.x + G.w / 2, G.y + 58, "GHCR", "lb", "middle");
  // the laptop with k3s on it
  const L = laptop(H.lap.cx, H.lap.by, H.lap.w, { sticker: true });
  b += L.svg;
  const T = { x: L.screen.x + 16, y: L.screen.y + L.screen.h - 60, w: L.screen.w - 32, h: 46 };
  b += g({}, nodeBody(T.x, T.y, T.w, T.h, 5) + [0, 1, 2].map((s) => pod(podSlot(T.x, T.y, T.w, T.h, 5, s))).join(""));
  b += pod(podSlot(T.x, T.y, T.w, T.h, 5, 3), { key: "oldpod", hidden: true }) + g({ "data-k": "newpod", class: "k-origin-c" }, pod(podSlot(T.x, T.y, T.w, T.h, 5, 3)).replace("k-pod\"", "k-pod k-pod--new\""));
  b += path("M420 182V" + n(L.screen.y - 2), "k-route k-route--dash");
  b += chip(440, 70, 116, "Argo CD", "argo") + chip(296, 152, 170, "Image Updater", "upd");
  if (!o.nolabels) b += text(H.lap.cx, H.lap.by + 40, "the laptop, k3s", "lb", "middle");
  // the paths-ignore gate on repo → Actions
  b += g({ "data-k": "gate", opacity: o.nogate ? 0 : undefined }, gate(120, 160, 196, "bar") + (o.nolabels ? "" : text(140, 206, "paths-ignore: deploy/**", "lb-m lb-m--s")));
  b += '<g class="pk-layer" data-k="pk"></g>';
  b += g({ class: "pk-still" }, packetAt(H.p.tag, 0.5, "pk--ink") + packetAt(H.p.sync, 0.6, "pk--ink") + packetAt(H.p.push, 0.2, "pk--ink"));
  if (o.inner) return b;
  return svg("loop", "0 0 600 440", "One change from git push to running: a commit in the app repo is built by GitHub Actions into an image on GHCR. Image Updater, running on the laptop, sees the image and commits the new tag back to the repo; Argo CD syncs and a new pod replaces the old one. A paths-ignore gate stops that tag commit from starting the build again.", b);
}

/* ================================================================== homepage cards and covers */
function card(id) {
  if (id === "platform") {
    // the scaling scene, smaller, without labels
    const inner = scene2({ inner: true, nolabels: true });
    return svg("scale", "0 0 400 500", "", '<rect class="k-cardbg" width="400" height="500"/>' + g({ transform: "translate(11 34) scale(0.63)" }, inner), { decorative: true, cls: "scene-svg--card" });
  }
  if (id === "homelab") {
    return svg("cardloop", "0 0 400 500", "", '<rect class="k-cardbg" width="400" height="500"/>' + g({ transform: "translate(0 26)" }, cardLoop()), { decorative: true, cls: "scene-svg--card" });
  }
}
// Homelab card: the repo, the build and the laptop, with one packet going round the loop.
const CL = {
  loop: "M86 120C86 170 86 196 96 214C112 244 160 250 214 250C262 250 280 206 296 172C312 138 300 92 262 78C220 62 132 58 104 70C92 76 86 92 86 120"
};
function cardLoop() {
  let b = path(CL.loop, "k-route", { "data-k": "loop" });
  // repo, top-left
  b += shadow(110, 108, 108) + slab(58, 52, 104, 52, { top: 6 }) + rect(66, 60, 88, 36, "k-dark", 2) + path("M74 78H146", "k-git") +
    commit(86, 78, 4.5, "k-commit-old") + commit(106, 78, 4.5, "k-commit-old") + g({ "data-k": "c-new", class: "k-origin-c" }, commit(128, 78, 6, "k-commit"));
  // build, bottom-left
  b += g({ "data-k": "build" }, shadow(112, 262, 112) + slab(58, 226, 108, 34, { top: 6 }) + rect(66, 233, 34, 20, "k-dark", 2) + g({ "data-k": "hatch" }, rect(69, 236, 28, 14, "k-face", 1.5)) +
    (() => { let v = ""; for (let vx = 108; vx < 146; vx += 4.5) v += path("M" + vx + " 234V252", "k-vent"); return v; })() + circle(154, 240, 2, "k-led") + circle(154, 248, 2, "k-led k-led--act", { "data-k": "buildled" }));
  // laptop, right
  const L = laptop(292, 230, 150, { sticker: true });
  b += L.svg;
  const T = { x: L.screen.x + 10, y: L.screen.y + L.screen.h - 40, w: L.screen.w - 20, h: 32 };
  b += nodeBody(T.x, T.y, T.w, T.h, 4) + [0, 1, 2].map((s) => pod(podSlot(T.x, T.y, T.w, T.h, 4, s))).join("") +
    g({ "data-k": "newpod", class: "k-origin-c" }, pod(podSlot(T.x, T.y, T.w, T.h, 4, 3)).replace("k-pod\"", "k-pod k-pod--new\""));
  b += '<g class="pk-layer" data-k="pk"></g>';
  b += g({ class: "pk-still" }, packetAt(CL.loop, 0.42));
  return b;
}
function cover(id, shape) {
  // Static stills for the projects page and the case-study heroes (rendered by covers.js).
  if (id === "mtg-hero") {
    const inner = require("./art-mtg.js").scenes.table().replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "").replace(/<g class="pk-still">/, '<g class="pk-still" style="display:none">');
    return svg(id, "0 0 1600 1000", "", '<rect class="k-cardbg" width="1600" height="1000"/>' + g({ transform: "translate(690 70) scale(1.42)" }, inner), { decorative: true, cls: "scene-svg--cover" });
  }
  if (shape === "wide") {
    const art = id === "platform" ? g({ transform: "translate(730 30) scale(1.42)" }, scene2({ inner: true, nolabels: true })) :
      g({ transform: "translate(720 120) scale(1.45)" }, homelabScene({ inner: true, nolabels: true, nogate: true }));
    return svg(id, "0 0 1600 1000", "", '<rect class="k-cardbg" width="1600" height="1000"/>' + art, { decorative: true, cls: "scene-svg--cover" });
  }
  return card(id);
}

/* ================================================================== the style sheet (sketch) */
function sketch() {
  let b = path("M20 300.5H1180", "k-ground");
  b += rack(40, 80, 128, 218);
  [0, 1].forEach((k) => {
    const nx = 50, ny = S2.slotY.call(null, k) - S2.top + 80;
    b += nodeBody(nx, ny, 108, 44, 4) + [0, 1, 2, 3].slice(0, k ? 2 : 4).map((s) => pod(podSlot(nx, ny, 108, 44, 4, s))).join("");
  });
  b += shadow(290, 302, 130) + server(230, 254, 120, 22) + server(230, 278, 120, 22, { bays: 2 });
  b += laptop(500, 290, 200, { sticker: true }).svg;
  b += database(700, 210, 92, 80);
  b += tower(780, 200, 70, 96);
  b += gate(900, 230, 278, "bar");
  b += portal(1000, 200, 78, 80);
  b += appWin(1080, 120, 90, 64, "hero") + appWin(1080, 200, 90, 64, "shop");
  b += packet(260, 120, 0) + packet(300, 130, 20, "pk--cool") + packet(340, 140, 40, "pk--ink");
  b += addrTag(380, 100);
  b += phone(260, 40) + miniLaptop(330, 74);
  b += hall(700, 60, 88, 58);
  b += appliance(860, 80, 92, 46, ["6", "4"]);
  return svg("sketch", "0 0 1200 330", "sketch", b);
}

const kit = { n, tag, g, rect, path, circle, text, esc, shadow, slab, unitFace, server, nodeBody, podSlot, pod, rack, appWin, laptop, database, tower, appliance, gate, phone, miniLaptop, packet, packetAt, pointAt, commit, svg, shelf, crate, chip };
module.exports = { kit, scene: (id) => (({ standard: scene1, scale: scene2, regions: scene3, ipv6: scene4, learned: scene5, loop: homelabScene })[id] || require("./art-mtg.js").scenes[id])(), card, cover, sketch, packetAt, pointAt, S1, S2, S3, S4, S5, H, CL };
