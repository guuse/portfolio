/**
 * The infrastructure delivery case study, in three scenes. Each function returns the scene in
 * its final state: that is what visitors without JavaScript or with reduced motion see.
 * src/lib/motion/scenes/delivery.ts animates them by scroll progress.
 */
import {
  appliance,
  chip,
  crate,
  database,
  gate,
  laptop,
  packetAt,
  shadow,
  shelf,
  slab,
  unitFace,
} from "../kit";
import { circle, g, n, path, rect, svg, tag, text } from "../svg";
import { D1, D2, D3 } from "./delivery.layout";

/** A diff panel: a slab with a dark recess and a few rows, each a marker and a line. */
function diffPanel(
  x: number,
  y: number,
  w: number,
  h: number,
  rows: readonly { y: number; w: number }[],
): string {
  let s = shadow(x + w / 2, y + h + 4, w + 16) + slab(x, y, w, h, { top: 7 });
  s += rect(x + 10, y + 10, w - 20, h - 20, "k-dark", 2);
  rows.forEach(
    (r, i) =>
      (s += g(
        { "data-k": `row${i}` },
        rect(x + 22, r.y - 3, 6, 6, "k-mark", 1.5) + rect(x + 36, r.y - 1.5, r.w, 3, "k-txt", 1.5),
      )),
  );
  return s;
}

/** A small round badge with a tick in it. */
const tick = (cx: number, cy: number, key: string): string =>
  g(
    { "data-k": key, class: "k-origin-c" },
    circle(cx, cy, 12, "k-face") + path(`M${n(cx - 5)} ${n(cy)}l3.6 3.8l6.4 -7.4`, "k-markline"),
  );

/* ------------------------------------------------------------ 1. approved should mean applied */
export interface PlanOptions {
  /** Return the inner markup only (for the card). */
  inner?: boolean;
  nolabels?: boolean;
}

export function plan(o: PlanOptions = {}): string {
  const R = D1.routes;
  let b = Object.entries(R)
    .map(([k, d]) => path(d, "k-route", { "data-k": `route-${k}` }))
    .join("");
  b += g({ "data-k": "pr" }, diffPanel(D1.pr.x, D1.pr.y, D1.pr.w, D1.pr.h, D1.rows));
  b += chip(D1.review.x, D1.review.y, D1.review.w, "reviewer", "review") + tick(D1.ok.cx, D1.ok.cy, "ok");
  // the plan store: older plans on the shelf, and the slot this pull request's plan lands in
  const S = D1.store;
  b +=
    shelf(S.x, S.y, S.w) +
    crate(S.x + 58, S.y - 30, 40, 30) +
    crate(S.x + 106, S.y - 30, 40, 30) +
    crate(D1.crateX, S.y - 30, 40, 30, "plancrate");
  // the deploy's drift check, and production
  const C = D1.check;
  b += g({ "data-k": "check", class: "k-origin-b" }, appliance(C.x, C.y, C.w, C.h, []));
  const P = D1.prod;
  b += g(
    { "data-k": "prod", class: "k-origin-b" },
    shadow(P.x + P.w / 2, P.y + P.h + 4, P.w + 16) +
      slab(P.x, P.y, P.w, P.h, { top: 7 }) +
      unitFace(P.x + 6, P.y + 6, P.w - 12, 17, { bays: 2 }) +
      unitFace(P.x + 6, P.y + 27, P.w - 12, 17, { bays: 2 }) +
      g(
        { "data-k": "prod-old", opacity: 0 },
        rect(P.x + P.w - 34, P.y - 17, 20, 10, "k-flag k-flag--old", 1.5),
      ) +
      g({ "data-k": "prod-new", class: "k-origin-b" }, rect(P.x + P.w - 34, P.y - 17, 20, 10, "k-flag", 1.5)),
  );
  if (!o.nolabels)
    b +=
      text(D1.pr.x + D1.pr.w / 2, D1.pr.y - 18, "pull request", "lb", "middle") +
      text(S.x + S.w / 2, S.y - 52, "saved plan", "lb", "middle") +
      text(C.x - 8, C.y + 52, "drift check", "lb lb--s", "end") +
      text(P.x + P.w / 2, P.y + P.h + 28, "production", "lb", "middle");
  b += '<g class="pk-layer" data-k="pk"></g>';
  b += g({ class: "pk-still" }, packetAt(R.fetch, 0.45) + packetAt(R.merge, 0.6, "pk--ink"));
  if (o.inner) return b;
  return svg(
    "plan",
    "0 0 600 440",
    "A pull request saves its plan to a store, and a reviewer other than the author approves it. On merge the deploy fetches that saved plan, checks production for drift, and applies exactly that plan to production.",
    b,
  );
}

/* ------------------------------------------------------------ 2. make the wrong change impossible */
/** An object-storage bucket: a tapered tub with a lit rim and one band. */
function bucket(cx: number, top: number, w: number, h: number): string {
  const rx = w / 2,
    ry = w * 0.14,
    bx = rx * 0.8;
  let s = shadow(cx, top + h + ry * 0.8 + 3, w + 10);
  s += path(
    `M${n(cx - rx)} ${n(top)}L${n(cx - bx)} ${n(top + h)}A${n(bx)} ${n(ry * 0.8)} 0 0 0 ${n(cx + bx)} ${n(top + h)}L${n(cx + rx)} ${n(top)}Z`,
    "k-face",
  );
  s += path(
    `M${n(cx - rx * 0.92)} ${n(top + h * 0.35)}A${n(rx * 0.92)} ${n(ry * 0.92)} 0 0 0 ${n(cx + rx * 0.92)} ${n(top + h * 0.35)}`,
    "k-band",
  );
  s += tag("ellipse", { cx, cy: top, rx, ry, class: "k-top" });
  s += tag("ellipse", { cx, cy: top, rx: rx * 0.8, ry: ry * 0.7, class: "k-dark" });
  return s;
}

export function policy(): string {
  const R = D2.routes;
  let b = path(R.change, "k-route", { "data-k": "route-change" });
  b += path(R.link, "k-route k-route--dash", { "data-k": "route-link" });
  b += g(
    { "data-k": "pr" },
    diffPanel(D2.pr.x, D2.pr.y, D2.pr.w, D2.pr.h, [
      { y: 196, w: 84 },
      { y: 216, w: 60 },
      { y: 236, w: 92 },
    ]),
  );
  b += text(D2.pr.x + D2.pr.w / 2, D2.pr.y - 18, "pull request", "lb", "middle");
  b += chip(D2.pack.x, D2.pack.y, D2.pack.w, "CrossGuard", "pack");
  b += g(
    { "data-k": "gate" },
    gate(D2.gate.x, D2.gate.y0, D2.gate.y1, "bar") +
      text(D2.gate.x, D2.gate.y1 + 40, "mandatory policy", "lb lb--s", "middle"),
  );
  b += g(
    { "data-k": "bucket", class: "k-origin-b" },
    bucket(D2.bucket.cx, D2.bucket.top, D2.bucket.w, D2.bucket.h) +
      text(D2.bucket.cx, D2.bucket.top + D2.bucket.h + 46, "log bucket", "lb", "middle"),
  );
  b += g({ "data-k": "lbl-rule" }, text(224, 204, "expiry rule", "lb-m lb-m--s", "middle"));
  b += '<g class="pk-layer" data-k="pk"></g>';
  b += g({ class: "pk-still" }, packetAt(R.change, D2.stopAt));
  return svg(
    "policy",
    "0 0 600 440",
    "A pull request adds an S3 expiry rule to the log bucket. A mandatory CrossGuard policy sits on the way as a closed gate, and the change stops there, before it can reach the bucket.",
    b,
  );
}

/* ------------------------------------------------------------ 3. separate foundations, one writer */
/** A key: a ring and a bit. */
const key = (x: number, y: number): string =>
  circle(x + 6, y, 5.5, "k-det-ring") +
  path(`M${n(x + 11.5)} ${n(y)}H${n(x + 26)}M${n(x + 22)} ${n(y)}V${n(y + 5)}`, "k-det");

function foundation(i: number): string {
  const E = D3.envs[i]!,
    { w, h } = D3.env;
  let s = shadow(E.x + w / 2, E.y + h + 4, w + 16) + slab(E.x, E.y, w, h, { top: 8 });
  s += rect(E.x + 10, E.y + 10, w - 20, h - 20, "k-dark", 2);
  // what each environment has of its own: its state, its key and its deploy role
  const cx = [E.x + 46, E.x + 115, E.x + 184];
  s += database(cx[0]!, E.y + 24, 26, 14);
  s += key(cx[1]! - 13, E.y + 32);
  s += rect(cx[2]! - 10, E.y + 21, 20, 22, "k-face", 3) + circle(cx[2]!, E.y + 29, 3.2, "k-det-f");
  s += ["state", "key", "role"].map((l, k) => text(cx[k]!, E.y + 64, l, "lb-m lb-m--s", "middle")).join("");
  return g(
    { "data-k": `env${i}`, class: "k-origin-b" },
    s + text(E.x + w / 2, E.y - 18, E.label, "lb", "middle"),
  );
}

export function writer(): string {
  const R = D3.routes;
  let b =
    path(R.acc, "k-route", { "data-k": "route-acc" }) +
    path(R.prod, "k-route", { "data-k": "route-prod" }) +
    path(R.read, "k-route k-route--dash", { "data-k": "route-read" });
  b += chip(D3.ci.x, D3.ci.y, D3.ci.w, "GitHub Actions", "ci");
  b += foundation(0) + foundation(1);
  const L = laptop(D3.lap.cx, D3.lap.by, D3.lap.w);
  const T = L.screen;
  b += g(
    { "data-k": "lap", class: "k-origin-b" },
    L.svg +
      g(
        { "data-k": "term" },
        text(T.x + 12, T.y + 30, "haven preview", "lb-m lb-m--s") +
          text(T.x + 12, T.y + 54, "haven test", "lb-m lb-m--s"),
      ) +
      text(D3.lap.cx, D3.lap.by + 34, "haven CLI", "lb", "middle"),
  );
  b += '<g class="pk-layer" data-k="pk"></g>';
  b += g({ class: "pk-still" }, packetAt(R.prod, 0.7) + packetAt(R.read, 0.5, "pk--cool"));
  return svg(
    "writer",
    "0 0 600 440",
    "Acceptance and production each have their own state, key and deploy role. GitHub Actions deploys to both; the haven CLI on a laptop only reads production, with a dashed line for preview and test.",
    b,
  );
}
