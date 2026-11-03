/**
 * The illustration kit: one hand for every drawing on the site. A clean 2D technical
 * illustration, front elevation seen from slightly above.
 *
 *   - Every solid object is a front face plus a thin lit top plane (light comes from above),
 *     outlined at 1.5 units, corner radius 2.5 on bodies and 1.5 on small parts.
 *   - Recesses (drive bays, pod slots, screens) are the darkest navy; details are 1.2-unit lines.
 *   - Objects stand on a flat contact shadow, never a blur.
 *   - Palette: navy shades and ink, one amber for the thing in motion, one cool blue for "on".
 *
 * Colours are CSS classes (k-*, styled in src/styles/art.css from the art.* tokens), so the
 * same markup restyles with the theme. Elements that motion moves carry `data-k` keys.
 */
import { pointAt } from "./geometry";
import { PACKET_INNER } from "./packet";
import { circle, g, n, path, rect, tag, text, type Attrs } from "./svg";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Contact shadow: a flat capsule on the ground. */
export const shadow = (cx: number, y: number, w: number): string =>
  rect(cx - w / 2, y - 2.5, w, 5, "k-shadow", 2.5);

export interface SlabOptions {
  /** Depth of the lit top plane (0 for none). */
  top?: number;
  /** How much narrower the back edge of the top plane is. */
  inset?: number;
  r?: number;
  cls?: string;
  hl?: boolean;
}

/** A solid box: lit top plane (narrower at the back) and a front face with an inner highlight. */
export function slab(x: number, y: number, w: number, h: number, o: SlabOptions = {}): string {
  const t = o.top ?? 6,
    ins = o.inset ?? t * 0.9,
    r = o.r ?? 2.5;
  return (
    (t ? path(`M${n(x + ins)} ${n(y - t)}H${n(x + w - ins)}L${n(x + w)} ${n(y)}H${n(x)}Z`, "k-top") : "") +
    rect(x, y, w, h, o.cls ?? "k-face", r) +
    (o.hl === false ? "" : path(`M${n(x + 3)} ${n(y + 1.6)}H${n(x + w - 3)}`, "k-hl")) +
    (h > 14 ? path(`M${n(x + 2.5)} ${n(y + h - 1.6)}H${n(x + w - 2.5)}`, "k-lo") : "")
  );
}

export interface UnitOptions {
  bays?: number;
  /** A data-k key on the activity LED, so a scene can drive it. */
  ledKey?: string;
}

/** Drive bays, vents and two status LEDs on a server front. */
export function unitFace(x: number, y: number, w: number, h: number, o: UnitOptions = {}): string {
  let s = "";
  const bays = o.bays ?? Math.max(1, Math.floor((w * 0.36) / 15));
  const bh = Math.min(h - 8, 12),
    by = y + (h - bh) / 2;
  for (let i = 0; i < bays; i++) {
    const bx = x + 7 + i * 15;
    s += rect(bx, by, 12, bh, "k-dark", 1.5) + path(`M${n(bx + 3)} ${n(by + bh / 2)}H${n(bx + 9)}`, "k-det");
  }
  const v0 = x + 7 + bays * 15 + 6,
    v1 = x + w - 26;
  for (let vx = v0; vx <= v1; vx += 4.5) s += path(`M${n(vx)} ${n(y + 6)}V${n(y + h - 6)}`, "k-vent");
  s +=
    circle(x + w - 16, y + h / 2, 2, "k-led") +
    circle(x + w - 9, y + h / 2, 2, "k-led k-led--act", o.ledKey ? { "data-k": o.ledKey } : {});
  return s;
}

/** A rack-mounted server, h units tall (22 per unit), with ears and screws. */
export function server(x: number, y: number, w: number, h: number, o: UnitOptions = {}): string {
  return (
    rect(x - 5, y + 1, 5, h - 2, "k-ear", 1) +
    rect(x + w, y + 1, 5, h - 2, "k-ear", 1) +
    circle(x - 2.5, y + 5, 1.1, "k-screw") +
    circle(x + w + 2.5, y + 5, 1.1, "k-screw") +
    rect(x, y, w, h, "k-face", 2) +
    path(`M${n(x + 3)} ${n(y + 1.6)}H${n(x + w - 3)}`, "k-hl") +
    unitFace(x, y, w, h, o)
  );
}

/**
 * A Kubernetes worker: a 2U server whose lower half is a tray of pod slots. Pods are separate
 * elements (pod()), so they can be added and drained.
 */
export function nodeBody(x: number, y: number, w: number, h: number, slots: number): string {
  const sw = (w - 14 - (slots - 1) * 4) / slots,
    sy = y + 17,
    sh = h - 22;
  let s =
    rect(x - 4, y + 1, 4, h - 2, "k-ear", 1) +
    rect(x + w, y + 1, 4, h - 2, "k-ear", 1) +
    rect(x, y, w, h, "k-face", 2.5) +
    path(`M${n(x + 3)} ${n(y + 1.6)}H${n(x + w - 3)}`, "k-hl");
  // top strip: a handle, vents, LEDs
  s += rect(x + 7, y + 5, 16, 6, "k-dark", 1.5);
  for (let vx = x + 30; vx <= x + w - 26; vx += 4.5)
    s += path(`M${n(vx)} ${n(y + 5)}V${n(y + 11)}`, "k-vent");
  s += circle(x + w - 15, y + 8, 1.8, "k-led") + circle(x + w - 9, y + 8, 1.8, "k-led k-led--act");
  for (let i = 0; i < slots; i++) s += rect(x + 7 + i * (sw + 4), sy, sw, sh, "k-slot", 2);
  return s;
}

/** The rectangle of pod slot `i` in a node drawn by nodeBody(). */
export function podSlot(x: number, y: number, w: number, h: number, slots: number, i: number): Rect {
  const sw = (w - 14 - (slots - 1) * 4) / slots,
    sh = h - 22;
  return { x: x + 7 + i * (sw + 4), y: y + 17, w: sw, h: sh };
}

/** A pod: a small cartridge with a latch line, drawn in a slot. */
export function pod(r: Rect, o: { key?: string; hidden?: boolean; fresh?: boolean } = {}): string {
  return g(
    { class: "k-podg k-origin-c", "data-k": o.key, opacity: o.hidden ? 0 : undefined },
    rect(r.x + 1.5, r.y + 1.5, r.w - 3, r.h - 3, o.fresh ? "k-pod k-pod--new" : "k-pod", 1.5) +
      path(`M${n(r.x + 4.5)} ${n(r.y + 5)}H${n(r.x + r.w - 4.5)}`, "k-pod-l") +
      (r.h > 12 ? rect(r.x + r.w / 2 - 3, r.y + r.h - 8, 6, 3.4, "k-pod-d", 1) : ""),
  );
}

/** A server rack: top cap, two rails with mounting holes, a recessed back, plinth and feet. */
export function rack(x: number, y: number, w: number, h: number): string {
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

export type WindowKind = "hero" | "shop" | "list" | "article" | "form";

/** An application window: a title bar with one tab, and one of five content layouts. */
export function appWin(x: number, y: number, w: number, h: number, kind: WindowKind): string {
  let s =
    rect(x, y, w, h, "k-win", 3) +
    path(`M${n(x)} ${n(y + 13)}H${n(x + w)}`, "k-edge-line") +
    path(
      `M${n(x + 3)} ${n(y + 13)}V${n(y + 6)}Q${n(x + 3)} ${n(y + 3.5)} ${n(x + 6)} ${n(y + 3.5)}H${n(x + 30)}Q${n(x + 33)} ${n(y + 3.5)} ${n(x + 34)} ${n(y + 6)}L${n(x + 36)} ${n(y + 13)}`,
      "k-tab",
    ) +
    circle(x + w - 8, y + 8, 1.6, "k-det-f");
  const cx = x + 7,
    cy = y + 19,
    cw = w - 14,
    ch = h - 25;
  const line = (lx: number, ly: number, lw: number, cls = "k-txt"): string => rect(lx, ly, lw, 3, cls, 1.5);
  if (kind === "hero") {
    s +=
      rect(cx, cy, cw, ch * 0.5, "k-img", 1.5) +
      circle(cx + cw * 0.72, cy + ch * 0.2, 3.5, "k-mark") +
      path(
        `M${n(cx + 4)} ${n(cy + ch * 0.5 - 2)}L${n(cx + cw * 0.3)} ${n(cy + ch * 0.26)}L${n(cx + cw * 0.5)} ${n(cy + ch * 0.5 - 2)}`,
        "k-imgline",
      ) +
      line(cx, cy + ch * 0.62, cw * 0.7, "k-txt k-txt--b") +
      line(cx, cy + ch * 0.78, cw * 0.9) +
      line(cx, cy + ch * 0.92, cw * 0.55);
  } else if (kind === "shop") {
    const q = (cw - 8) / 3;
    for (let i = 0; i < 3; i++) {
      s +=
        rect(cx + i * (q + 4), cy, q, ch * 0.55, "k-img", 1.5) +
        line(cx + i * (q + 4), cy + ch * 0.66, q * 0.8) +
        rect(cx + i * (q + 4), cy + ch * 0.82, q * 0.45, 4, "k-mark", 1.5);
    }
  } else if (kind === "list") {
    for (let i = 0; i < 4; i++)
      s +=
        circle(cx + 3.5, cy + 3.5 + i * (ch / 4), 3, i === 0 ? "k-mark" : "k-img") +
        line(cx + 11, cy + 2 + i * (ch / 4), cw * (0.75 - (i % 2) * 0.2));
  } else if (kind === "article") {
    s += line(cx, cy, cw * 0.5, "k-txt k-txt--b");
    for (let i = 0; i < 4; i++) s += line(cx, cy + 9 + i * 7, cw * (i === 3 ? 0.35 : 0.52));
    s +=
      rect(cx + cw * 0.6, cy, cw * 0.4, ch, "k-img", 1.5) +
      path(`M${n(cx + cw * 0.66)} ${n(cy + ch * 0.4)}h${n(cw * 0.28)}m${n(-cw * 0.14)} -6v12`, "k-markline");
  } else {
    s +=
      line(cx, cy, cw * 0.4, "k-txt k-txt--b") +
      rect(cx, cy + 8, cw, 9, "k-field", 2) +
      rect(cx, cy + 21, cw, 9, "k-field", 2) +
      rect(cx, cy + ch - 8, cw * 0.4, 8, "k-mark", 2);
  }
  return s;
}

/** A laptop, open, from slightly above: a screen with a thick bezel and a keyboard deck in perspective. */
export function laptop(cx: number, by: number, w: number): { svg: string; screen: Rect } {
  const sh = w * 0.6,
    sw = w,
    sx = cx - sw / 2,
    sy = by - 18 - sh;
  let s = shadow(cx, by + 8, w + 60);
  // deck: front lip, then the top surface in perspective
  s += path(
    `M${n(cx - w / 2 - 22)} ${n(by)}H${n(cx + w / 2 + 22)}V${n(by + 4)}Q${n(cx + w / 2 + 22)} ${n(by + 7)} ${n(cx + w / 2 + 18)} ${n(by + 7)}H${n(cx - w / 2 - 18)}Q${n(cx - w / 2 - 22)} ${n(by + 7)} ${n(cx - w / 2 - 22)} ${n(by + 4)}Z`,
    "k-face",
  );
  s += path(
    `M${n(cx - w / 2)} ${n(by - 18)}H${n(cx + w / 2)}L${n(cx + w / 2 + 22)} ${n(by)}H${n(cx - w / 2 - 22)}Z`,
    "k-top",
  );
  // keyboard: three rows of keys, narrowing to the back
  for (let r = 0; r < 3; r++) {
    const t0 = 0.16 + r * 0.2,
      t1 = t0 + 0.14;
    const yA = by - 18 + 18 * t0,
      yB = by - 18 + 18 * t1;
    const xA = w / 2 + 22 * t0 - 10,
      xB = w / 2 + 22 * t1 - 10;
    s += path(`M${n(cx - xA)} ${n(yA)}H${n(cx + xA)}L${n(cx + xB)} ${n(yB)}H${n(cx - xB)}Z`, "k-keys");
  }
  s += path(
    `M${n(cx - w * 0.11)} ${n(by - 2.5)}H${n(cx + w * 0.11)}L${n(cx + w * 0.1)} ${n(by - 5.5)}H${n(cx - w * 0.1)}Z`,
    "k-dark",
  );
  // hinge and screen
  s += rect(cx - w * 0.3, by - 21, w * 0.6, 4, "k-ear", 2);
  s += rect(sx, sy, sw, sh, "k-face", 6) + path(`M${n(sx + 5)} ${n(sy + 1.6)}H${n(sx + sw - 5)}`, "k-hl");
  const ih = sh - 20;
  s +=
    rect(sx + 9, sy + 10, sw - 18, ih, "k-screen", 2.5) +
    path(
      `M${n(sx + sw - 9 - ih * 0.9)} ${n(sy + 10)}H${n(sx + sw - 9 - ih * 0.62)}L${n(sx + sw - 9 - ih * 0.98)} ${n(sy + sh - 10)}H${n(sx + sw - 9 - ih * 1.26)}Z`,
      "k-sheen",
    );
  s += circle(cx, sy + 5, 1.6, "k-det-f");
  return { svg: s, screen: { x: sx + 9, y: sy + 10, w: sw - 18, h: ih } };
}

/** A database: a cylinder with two bands. */
export function database(cx: number, ty: number, w: number, h: number): string {
  const rx = w / 2,
    ry = w * 0.15;
  let s = shadow(cx, ty + h + ry + 3, w + 18);
  s += path(
    `M${n(cx - rx)} ${n(ty)}V${n(ty + h)}A${n(rx)} ${n(ry)} 0 0 0 ${n(cx + rx)} ${n(ty + h)}V${n(ty)}Z`,
    "k-face",
  );
  for (const f of [0.36, 0.68])
    s += path(
      `M${n(cx - rx)} ${n(ty + h * f)}A${n(rx)} ${n(ry)} 0 0 0 ${n(cx + rx)} ${n(ty + h * f)}`,
      "k-band",
    );
  s += tag("ellipse", { cx, cy: ty, rx, ry, class: "k-top" });
  s += tag("ellipse", { cx, cy: ty, rx: rx * 0.55, ry: ry * 0.55, class: "k-det-ring" });
  return s;
}

/** An older, IPv4-only machine: a tower with a 5.25" bay and a round power button. */
export function tower(x: number, y: number, w: number, h: number): string {
  let s = shadow(x + w / 2, y + h + 3, w + 16) + slab(x, y, w, h, { top: 6, r: 2 });
  s +=
    rect(x + 7, y + 9, w - 14, 11, "k-dark", 1) +
    path(`M${n(x + 12)} ${n(y + 14.5)}H${n(x + w - 22)}`, "k-det");
  s += rect(x + 7, y + 24, w - 14, 7, "k-dark", 1);
  for (let vy = y + h * 0.52; vy < y + h - 12; vy += 5)
    s += path(`M${n(x + 10)} ${n(vy)}H${n(x + w - 10)}`, "k-vent");
  s += circle(x + w - 13, y + h - 9, 3.2, "k-det-ring") + circle(x + 12, y + h - 9, 1.8, "k-led");
  return s;
}

/** A small network appliance with labelled ports (used for DNS64/NAT64). */
export function appliance(x: number, y: number, w: number, h: number, ports: string[]): string {
  let s = shadow(x + w / 2, y + h + 3, w + 16) + slab(x, y, w, h, { top: 6 });
  ports.forEach((_, i) => {
    const px = x + 12 + i * (w - 24 - 18);
    s += rect(px, y + h - 19, 18, 12, "k-dark", 1.5) + rect(px + 4, y + h - 16, 10, 5, "k-port", 1);
  });
  s += circle(x + w / 2 - 4, y + 10, 1.8, "k-led") + circle(x + w / 2 + 4, y + 10, 1.8, "k-led k-led--act");
  return s;
}

/** A gate across a path: a housing above and a striped bar that retracts into it (scaleY). */
export function gate(x: number, y0: number, y1: number, key: string): string {
  const bw = 9;
  let s =
    slab(x - 15, y0 - 18, 30, 18, { top: 5 }) +
    circle(x + 8, y0 - 9, 1.8, "k-led k-led--warn", { "data-k": `${key}-led` });
  let bar = rect(x - bw / 2, y0, bw, y1 - y0, "k-bar", 2);
  for (let sy = y0 + 6; sy < y1 - 4; sy += 12) {
    bar += path(
      `M${n(x - bw / 2)} ${n(sy + 6)}L${n(x + bw / 2)} ${n(sy)}V${n(sy + 6)}L${n(x - bw / 2)} ${n(sy + 12)}Z`,
      "k-stripe",
    );
  }
  s = g({ "data-k": key, class: "k-gatebar" }, bar) + s;
  s += rect(x - 15, y1 + 2, 30, 6, "k-face", 2) + shadow(x, y1 + 12, 40);
  return s;
}

/** A small data hall: a building with a roof plane, rack fronts behind windows and a door. */
export function hall(x: number, y: number, w: number, h: number): string {
  let s = slab(x, y, w, h, { top: 8, r: 2 });
  const racks = Math.floor((w - 40) / 16);
  for (let i = 0; i < racks; i++) {
    const rx = x + 10 + i * 16;
    s += rect(rx, y + 10, 12, h - 24, "k-dark", 1.5);
    for (let k = 0; k < 3; k++) s += circle(rx + 6, y + 16 + k * 7, 1.1, k === 0 ? "k-led" : "k-det-f");
  }
  s +=
    rect(x + w - 26, y + h - 30, 16, 30, "k-dark", 1.5) +
    path(`M${n(x + w - 18)} ${n(y + h - 30)}V${n(y + h)}`, "k-det");
  return s;
}

/** The single way in (CloudFront): an arch with an open doorway and a threshold. */
export function portal(cx: number, y: number, w: number, h: number): string {
  const r = w / 2,
    ir = r - 11;
  let s = path(
    `M${n(cx - r)} ${n(y + h)}V${n(y + r)}A${n(r)} ${n(r)} 0 0 1 ${n(cx + r)} ${n(y + r)}V${n(y + h)}H${n(cx + ir)}V${n(y + r)}A${n(ir)} ${n(ir)} 0 0 0 ${n(cx - ir)} ${n(y + r)}V${n(y + h)}Z`,
    "k-face",
  );
  s += path(
    `M${n(cx - ir)} ${n(y + h)}V${n(y + r)}A${n(ir)} ${n(ir)} 0 0 1 ${n(cx + ir)} ${n(y + r)}V${n(y + h)}Z`,
    "k-doorway",
  );
  s += path(
    `M${n(cx - r + 3)} ${n(y + r)}A${n(r - 3)} ${n(r - 3)} 0 0 1 ${n(cx + r - 3)} ${n(y + r)}`,
    "k-hl",
  );
  s +=
    rect(cx - r - 8, y + h, w + 16, 7, "k-face", 2) +
    path(`M${n(cx - r - 5)} ${n(y + h + 1.6)}H${n(cx + r + 5)}`, "k-hl") +
    shadow(cx, y + h + 10, w + 30);
  return s;
}

/** Visitors: a phone. */
export const phone = (x: number, y: number): string =>
  rect(x, y, 20, 34, "k-face", 4) +
  rect(x + 2.5, y + 4, 15, 24, "k-screen", 1.5) +
  rect(x + 7, y + 30, 6, 1.6, "k-det-f", 0.8);

/** Visitors: a small laptop. */
export const miniLaptop = (cx: number, by: number): string =>
  rect(cx - 19, by - 26, 38, 24, "k-face", 3) +
  rect(cx - 15.5, by - 22.5, 31, 17, "k-screen", 1.5) +
  path(`M${n(cx - 24)} ${n(by - 2)}H${n(cx + 24)}L${n(cx + 22)} ${n(by + 2)}H${n(cx - 22)}Z`, "k-top");

/** The address tag a packet carries: an IPv4 face and an IPv6 face, for a flip. */
export function addrTag(x: number, y: number, key: string): string {
  const w = 96,
    h = 34;
  const body =
    path(
      `M${n(x + 12)} ${n(y)}H${n(x + w - 3)}Q${n(x + w)} ${n(y)} ${n(x + w)} ${n(y + 3)}V${n(y + h - 3)}Q${n(x + w)} ${n(y + h)} ${n(x + w - 3)} ${n(y + h)}H${n(x + 12)}L${n(x)} ${n(y + h / 2)}Z`,
      "k-tag",
    ) + circle(x + 12, y + h / 2, 3, "k-hole");
  return g(
    { "data-k": key, class: "k-tagg" },
    g({ "data-k": `${key}-4`, opacity: 0 }, body + text(x + 56, y + 23, "IPv4", "lb-tag", "middle")) +
      g(
        { "data-k": `${key}-6`, class: "is-v6" },
        body.replace('class="k-tag"', 'class="k-tag k-tag--v6"') +
          text(x + 56, y + 23, "IPv6", "lb-tag lb-tag--v6", "middle"),
      ),
  );
}

/** A packet: a small capsule with a seam, pointing along its path. */
export const packet = (x: number, y: number, a: number, cls = ""): string =>
  g({ class: `pk ${cls}`, transform: `translate(${n(x)} ${n(y)}) rotate(${n(a)})` }, PACKET_INNER);

/** A packet frozen a fraction `f` of the way along route `d`, for the still frame. */
export const packetAt = (d: string, f: number, cls = ""): string => {
  const p = pointAt(d, f);
  return packet(p.x, p.y, p.a, `pk-static ${cls}`);
};

/** A git commit dot. */
export const commit = (cx: number, cy: number, r: number, cls = "k-commit", extra: Attrs = {}): string =>
  circle(cx, cy, r, cls, extra);

/** A shelf on two rails (the registry). */
export const shelf = (x: number, y: number, w: number): string =>
  shadow(x + w / 2, y + 30, w + 16) +
  rect(x + 6, y + 4, 4, 24, "k-rail", 1) +
  rect(x + w - 10, y + 4, 4, 24, "k-rail", 1) +
  slab(x, y, w, 7, { top: 4 });

/** A container image as a crate. */
export const crate = (x: number, y: number, w: number, h: number, key?: string): string =>
  g(
    { "data-k": key, class: "k-origin-b" },
    slab(x, y, w, h, { top: 5, inset: 4 }) +
      path(`M${n(x + 5)} ${n(y + h / 2)}H${n(x + w - 5)}`, "k-det") +
      rect(x + w / 2 - 5, y + 5, 10, 6, "k-dark", 1),
  );

/** A labelled pill with a status LED (Argo CD, Image Updater). */
export const chip = (x: number, y: number, w: number, label: string, key: string): string =>
  g(
    { "data-k": key },
    rect(x, y, w, 30, "k-chip", 15) +
      circle(x + 15, y + 15, 4, "k-led") +
      text(x + 27, y + 20, label, "lb-chip"),
  );
