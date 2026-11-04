/**
 * The hosting platform case study, told in five scenes. Each function returns the scene in
 * its final state: that is what visitors without JavaScript or with reduced motion see.
 * src/lib/motion/scenes/platform.ts animates them by scroll progress.
 */
import {
  addrTag,
  appliance,
  appWin,
  commit,
  database,
  gate,
  hall,
  miniLaptop,
  nodeBody,
  packetAt,
  phone,
  pod,
  podSlot,
  portal,
  rack,
  server,
  shadow,
  slab,
  tower,
  unitFace,
  type WindowKind,
} from "../kit";
import { circle, g, n, path, rect, svg, tag, text } from "../svg";
import { S1, S2, S3, S4, S5 } from "./platform.layout";

/* ------------------------------------------------------------ 1. many projects, one platform */
function oldServers(): string[] {
  const G = S1.ground;
  let ventD = "";
  for (let y = 336; y < 372; y += 5) ventD += `M72 ${y}H112`;
  const vents = path(ventD, "k-vent");
  // a tower, two mismatched 1U boxes, a small box on its side, an old 2U with a loose cable
  const a =
    shadow(92, G + 2, 74) +
    slab(62, 298, 60, 86, { top: 6 }) +
    rect(70, 308, 44, 9, "k-dark", 1) +
    rect(70, 321, 44, 6, "k-dark", 1) +
    vents +
    circle(108, 375, 1.8, "k-led") +
    rect(90, 270, 4, 22, "k-face", 1) +
    rect(80, 288, 24, 5, "k-face", 1.5);
  const b =
    shadow(222, G + 2, 116) +
    g({}, server(176, 362, 98, 22, { bays: 2 })) +
    g({ transform: "rotate(-1.5 222 350)" }, server(181, 338, 84, 22, { bays: 1 })) +
    rect(219, 306, 4, 26, "k-face", 1) +
    rect(208, 328, 26, 5, "k-face", 1.5);
  const c =
    shadow(350, G + 2, 74) +
    slab(322, 352, 56, 32, { top: 5 }) +
    circle(334, 368, 3, "k-det-ring") +
    circle(366, 368, 1.8, "k-led") +
    rect(348, 334, 4, 13, "k-face", 1) +
    rect(339, 344, 22, 4, "k-face", 1.5);
  const d =
    shadow(482, G + 2, 128) +
    server(428, 334, 108, 48, { bays: 3 }) +
    path("M536 360C556 362 560 384 540 388C520 392 470 390 452 392", "k-cable") +
    rect(479, 306, 4, 24, "k-face", 1) +
    rect(468, 325, 26, 5, "k-face", 1.5);
  return [a, b, c, d];
}

function platformSlab(): string {
  const x = 30,
    y = 318,
    w = 540,
    h = 66;
  let s = shadow(300, S1.ground + 2, w + 30) + slab(x, y, w, h, { top: 12, inset: 10 });
  const sec = w / 3;
  for (let i = 0; i < 3; i++) {
    const sx = x + i * sec;
    if (i) s += path(`M${n(sx)} ${n(y + 4)}V${n(y + h - 4)}`, "k-seam");
    s += g(
      { class: "k-unit" },
      unitFace(sx + 10, y + 9, sec - 20, 22, { bays: 3 }) +
        unitFace(sx + 10, y + 35, sec - 20, 22, { bays: 3 }),
    );
  }
  return s;
}

const dock = (cx: number): string =>
  slab(cx - 22, 309, 44, 6, { top: 3, inset: 3 }) + rect(cx - 3, 288, 6, 21, "k-face", 1.5);

export function standard(): string {
  const W = S1.win;
  let b = path(`M20 ${S1.ground + 0.5}H580`, "k-ground");
  b += g(
    { class: "s1-old" },
    oldServers()
      .map((s, i) => g({ "data-k": `old${i}`, opacity: 0 }, s))
      .join(""),
  );
  b += g(
    { "data-k": "plat" },
    platformSlab() +
      S1.docks.map((cx, i) => g({ "data-k": `dock${i}`, class: "k-origin-b" }, dock(cx))).join(""),
  );
  // windows are drawn docked; motion moves them in from where they used to live
  b += S1.kinds
    .map((k: WindowKind, i) =>
      g({ "data-k": `win${i}`, class: "k-origin-c" }, appWin(S1.docks[i]! - W.w / 2, S1.dockY, W.w, W.h, k)),
    )
    .join("");
  return svg(
    "standard",
    "0 0 600 440",
    "Before: four client apps, each on its own different server. After: the same apps, and a fifth, docked side by side on one shared platform.",
    b,
  );
}

/* ------------------------------------------------------------ 2. it scales with the load */
export interface ScaleOptions {
  /** Return the inner markup only (for cards and covers). */
  inner?: boolean;
  nolabels?: boolean;
}

export function scale(o: ScaleOptions = {}): string {
  let b = path(`M24 ${S2.top + S2.h + 6.5}H576`, "k-ground");
  b +=
    S2.inPaths.map((d, i) => path(d, "k-route", { "data-k": `in${i}` })).join("") +
    S2.outPaths.map((d, i) => path(d, "k-route", { "data-k": `out${i}` })).join("");
  b += g(
    { class: "k-lb" },
    shadow(300, 124, 200) + server(S2.lb.x, S2.lb.y, S2.lb.w, S2.lb.h, { bays: 2, ledKey: "lbled" }),
  );
  if (!o.nolabels) b += text(S2.lb.x + S2.lb.w + 16, S2.lb.y + 17, "load balancer", "lb lb--s");
  b += '<g class="pk-layer" data-k="pk"></g>';
  S2.racks.forEach((rx, z) => {
    b += rack(rx, S2.top, S2.rw, S2.h);
    for (let k = 0; k < S2.slots; k++) {
      const nx = rx + 10,
        ny = S2.slotY(k),
        on = k < S2.nodesBaked[z]!;
      let pods = "";
      for (let s = 0; s < 4; s++)
        pods += pod(podSlot(nx, ny, S2.nw, S2.nh, 4, s), {
          key: `pod${z}${k}${s}`,
          hidden: !(on && S2.baked[z]![k * 4 + s]),
        });
      b += g(
        { "data-k": `node${z}${k}`, class: "k-node", opacity: on ? undefined : 0 },
        nodeBody(nx, ny, S2.nw, S2.nh, 4) + pods,
      );
    }
    if (!o.nolabels) b += text(rx + S2.rw / 2, S2.top + S2.h + 36, `Zone ${"ABC"[z]}`, "lb", "middle");
  });
  // a pending pod over each rack, shown while a zone waits for a new node
  b += S2.racks
    .map((rx, z) => g({ "data-k": `pend${z}`, opacity: 0 }, rect(rx + 52, S2.top - 30, 24, 16, "k-pend", 2)))
    .join("");
  // frozen packets for the still frame
  b += g(
    { class: "pk-still" },
    packetAt(S2.inPaths[1]!, 0.55) +
      packetAt(S2.inPaths[0]!, 0.25) +
      packetAt(S2.inPaths[2]!, 0.8) +
      packetAt(S2.outPaths[0]!, 0.5) +
      packetAt(S2.outPaths[1]!, 0.78) +
      packetAt(S2.outPaths[2]!, 0.3),
  );
  if (o.inner) return b;
  return svg(
    "scale",
    "0 0 600 440",
    "Requests come in through a load balancer and are spread over three zones. Each zone is a rack of nodes with pods; as the load rises, nodes are added and pods spread onto them, and as it drops they drain and are removed.",
    b,
  );
}

/* ------------------------------------------------------------ 3. two regions, one entry */
// A stylised globe: a horizon arc with a real orthographic graticule. Ireland and Tokyo stand
// upright on it, west to the left and east to the right; their spacing is not to scale.
function project(lat: number, lon: number): { x: number; y: number; vis: boolean } {
  const r = Math.PI / 180,
    p0 = S3.lat0 * r,
    l0 = S3.lon0 * r,
    p = lat * r,
    l = lon * r;
  const cosc = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l - l0);
  return {
    x: S3.cx + S3.R * Math.cos(p) * Math.sin(l - l0),
    y: S3.cy - S3.R * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l - l0)),
    vis: cosc > 0,
  };
}

function graticule(): string {
  const line = (pts: { x: number; y: number; vis: boolean }[]): string => {
    let d = "",
      on = false;
    for (const q of pts) {
      if (q.vis) {
        d += `${on ? "L" : "M"}${n(q.x)} ${n(q.y)}`;
        on = true;
      } else on = false;
    }
    return d;
  };
  let s = "";
  for (let lat = -15; lat <= 75; lat += 15) {
    const pts = [];
    for (let lon = -180; lon <= 180; lon += 3) pts.push(project(lat, lon));
    s += path(line(pts), "k-grat");
  }
  for (let lon = -180; lon < 180; lon += 20) {
    const pts = [];
    for (let lat = -80; lat <= 88; lat += 3) pts.push(project(lat, lon));
    s += path(line(pts), "k-grat");
  }
  return s;
}

function building(pt: { x: number; y: number; ang: number }, key: string, label: string): string {
  return g(
    { "data-k": key, class: "k-origin-b" },
    g(
      { transform: `rotate(${n(pt.ang)} ${n(pt.x)} ${n(pt.y)})` },
      shadow(pt.x, pt.y + 2, 104) + hall(pt.x - 44, pt.y - 58, 88, 58),
    ) + text(pt.x - (pt.x < 300 ? 8 : -8), pt.y + 34, label, "lb", "middle"),
  );
}

export function regions(): string {
  let b = tag("clipPath", { id: "globe-clip" }, circle(S3.cx, S3.cy, S3.R));
  b += g(
    { "data-k": "globe" },
    circle(S3.cx, S3.cy, S3.R, "k-globe") +
      g({ "clip-path": "url(#globe-clip)" }, graticule()) +
      circle(S3.cx, S3.cy, S3.R, "k-globe-edge"),
  );
  b += g(
    { "data-k": "routes" },
    path(S3.toIE, "k-route", { "data-k": "route-ie" }) +
      path(S3.toJP, "k-route", { "data-k": "route-jp" }) +
      S3.inPaths.map((d, i) => path(d, "k-route", { "data-k": `route-in${i}` })).join(""),
  );
  b += g({ "data-k": "lblIE", class: "k-rlabel" }, text(146, 238, "everything else", "lb lb--s", "end"));
  b += g({ "data-k": "lblJP", class: "k-rlabel" }, text(454, 238, "/<region>/*", "lb-m", "start"));
  b += building(S3.ie, "ie", "Ireland") + building(S3.jp, "jp", "Tokyo");
  b += g(
    { "data-k": "door" },
    portal(S3.door.cx, S3.door.y, S3.door.w, S3.door.h) +
      text(S3.door.cx + S3.door.w / 2 + 16, S3.door.y + 46, "CloudFront", "lb lb--s"),
  );
  b += g({ "data-k": "users" }, phone(186, 8) + miniLaptop(300, 44) + phone(394, 8));
  b += '<g class="pk-layer" data-k="pk"></g>';
  b += g(
    { class: "pk-still" },
    packetAt(S3.inPaths[0]!, 0.5) +
      packetAt(S3.inPaths[2]!, 0.75) +
      packetAt(S3.toIE, 0.3) +
      packetAt(S3.toIE, 0.72) +
      packetAt(S3.toJP, 0.55, "pk--cool"),
  );
  return svg(
    "regions",
    "0 0 600 440",
    "One entry, two regions: requests from phones and laptops all go to CloudFront. Region paths are sent on to Tokyo and everything else to Ireland, drawn on a globe.",
    b,
  );
}

/* ------------------------------------------------------------ 4. the IPv6 move */
export function ipv6(): string {
  let b = "";
  b +=
    path(S4.toX, "k-route", { "data-k": "route-to-xlat" }) +
    path(S4.fromX, "k-route", { "data-k": "route-from-xlat" }) +
    path(S4.toDB, "k-route", { "data-k": "route-db" }) +
    path("M446 314H458", "k-route k-route--idle", { "data-k": "route-idle" });
  // the cluster: two nodes on a plinth
  b +=
    shadow(96, 300, 132) +
    slab(34, 286, 124, 12, { top: 0 }) +
    g(
      {},
      nodeBody(42, 232, 108, 44, 4) + [0, 1, 2].map((s) => pod(podSlot(42, 232, 108, 44, 4, s))).join(""),
    ) +
    g(
      {},
      nodeBody(42, 178, 108, 44, 4) + [0, 1, 2, 3].map((s) => pod(podSlot(42, 178, 108, 44, 4, s))).join(""),
    );
  b += text(96, 330, "cluster", "lb", "middle");
  b += addrTag(48, 124, "tag");
  // the translator and the old service
  b += g(
    { "data-k": "xlat" },
    appliance(254, 88, 92, 46, ["6", "4"]) + text(300, 166, "DNS64 / NAT64", "lb lb--s", "middle"),
  );
  b += g({ "data-k": "legacy" }, tower(452, 64, 72, 96) + text(488, 190, "IPv4-only", "lb lb--s", "middle"));
  // a private database with two addresses, and the gate in front of the IPv6 one: closed until hypercare fixed it
  b += g(
    { "data-k": "db" },
    database(500, 288, 92, 84) +
      rect(446, 306, 26, 16, "k-plate", 2) +
      text(459, 318, "4", "lb-port", "middle") +
      rect(446, 336, 26, 16, "k-plate k-plate--v6", 2) +
      text(459, 348, "6", "lb-port lb-port--v6", "middle") +
      text(500, 412, "database", "lb lb--s", "middle"),
  );
  b += g(
    { "data-k": "gate" },
    gate(S4.gateX, 322, 368, "bar") + text(S4.gateX, 292, "hypercare", "lb lb--s", "middle"),
  );
  b += '<g class="pk-layer" data-k="pk"></g>';
  b += g(
    { class: "pk-still" },
    packetAt(S4.toX, 0.45) +
      packetAt(S4.fromX, 0.55, "pk--ink") +
      packetAt(S4.toDB, 0.3) +
      packetAt(S4.toDB, 0.88),
  );
  return svg(
    "ipv6",
    "0 0 600 440",
    "The IPv6 move: a cluster’s address tag flips from IPv4 to IPv6. Traffic to an IPv4-only service goes through a DNS64/NAT64 translator. Traffic to a private database that answers on both an IPv4 and an IPv6 address waits at a closed gate until hypercare opens it for IPv6.",
    b,
  );
}

/* ------------------------------------------------------------ 5. one change, every cluster */
function miniCluster(x: number, y: number, key: string): string {
  const w = S5.cw;
  return g(
    { "data-k": key, class: "k-origin-b" },
    shadow(x + w / 2, y + 66, w + 12) +
      slab(x, y + 8, w, 58, { top: 7 }) +
      unitFace(x + 6, y + 15, w - 12, 18, { bays: 1 }) +
      unitFace(x + 6, y + 38, w - 12, 18, { bays: 1 }) +
      g({ "data-k": `${key}-old` }, rect(x + w / 2 - 9, y - 6, 18, 9, "k-flag k-flag--old", 1.5)) +
      g({ "data-k": `${key}-new`, class: "k-origin-b" }, rect(x + w / 2 - 9, y - 6, 18, 9, "k-flag", 1.5)),
  );
}

export function learned(): string {
  let b = "";
  // history on the left, the new commit at the end of it
  b += path(`M24 ${S5.y}H${S5.x0}`, "k-git");
  for (const x of [44, 84, 124]) b += commit(x, S5.y, 6, "k-commit-old");
  b += g(
    { "data-k": "commit", class: "k-origin-c" },
    commit(166, S5.y, 9, "k-commit") + circle(166, S5.y, 3.2, "k-commit-core"),
  );
  b += text(166, S5.y + 36, "one change", "lb lb--s", "middle");
  // the spine and the ribs
  b += path(`M${S5.x0} ${S5.y}H${S5.x1}`, "k-wire");
  b += g(
    { "data-k": "lit-spine", class: "k-origin-l" },
    path(`M${S5.x0} ${S5.y}H${S5.x1}`, "k-wire k-wire--lit"),
  );
  const top = S5.y - 128,
    bot = S5.y + 40;
  for (const s of S5.stubs) {
    const d = s.up ? `M${s.x} ${S5.y}V${top + 74}` : `M${s.x} ${S5.y}V${bot}`;
    b +=
      path(d, "k-wire") +
      g({ "data-k": `lit${s.i}`, class: s.up ? "k-origin-b" : "k-origin-t" }, path(d, "k-wire k-wire--lit"));
  }
  S5.cols.forEach((x, i) => {
    b += miniCluster(x, top, `cluster${i * 2}`) + miniCluster(x, bot + 6, `cluster${i * 2 + 1}`);
  });
  b += '<g class="pk-layer" data-k="pk"></g>';
  return svg(
    "learned",
    "0 0 600 440",
    "A single commit goes out to all eight clusters, and they update one after another.",
    b,
  );
}
