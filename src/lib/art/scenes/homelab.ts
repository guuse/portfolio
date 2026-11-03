/** The homelab case study: one change from git push to a running pod. */
import {
  chip,
  commit,
  crate,
  gate,
  laptop,
  nodeBody,
  packetAt,
  pod,
  podSlot,
  shadow,
  shelf,
  slab,
} from "../kit";
import { circle, g, n, path, rect, svg, text } from "../svg";
import { H } from "./homelab.layout";

export interface LoopOptions {
  inner?: boolean;
  nolabels?: boolean;
  /** Leave out the paths-ignore gate (the cover shows the loop before the fix). */
  nogate?: boolean;
}

export function loop(o: LoopOptions = {}): string {
  let b = "";
  // routes
  b += Object.entries(H.routes)
    .map(([k, d]) => path(d, `k-route${k === "watch" ? " k-route--dash" : ""}`, { "data-k": `r-${k}` }))
    .join("");
  // the repo: a panel with a branch line and commits
  const R = H.repo;
  b += shadow(R.x + R.w / 2, R.y + R.h + 4, R.w + 16) + slab(R.x, R.y, R.w, R.h, { top: 7 });
  b +=
    rect(R.x + 10, R.y + 10, R.w - 20, R.h - 20, "k-dark", 2) +
    path(`M${R.x + 20} ${R.y + 41}H${R.x + R.w - 20}`, "k-git");
  for (const i of [0, 1, 2]) b += commit(R.x + 32 + i * 30, R.y + 41, 5, "k-commit-old");
  b += g({ "data-k": "c-push", class: "k-origin-c" }, commit(R.x + 122, R.y + 41, 7, "k-commit"));
  b += g({ "data-k": "c-tag", class: "k-origin-c" }, commit(R.x + 148, R.y + 41, 5.5, "k-commit-tag"));
  // labels carry a key so motion can nod at the machine a change arrives at
  if (!o.nolabels) b += text(R.x + R.w / 2, R.y - 18, "app repo", "lb", "middle", { "data-k": "lbl-repo" });
  // the build: a machine with a hatch
  const B = H.build;
  let vents = "";
  for (let vx = B.x + 76; vx < B.x + B.w - 30; vx += 4.5)
    vents += path(`M${vx} ${B.y + 13}V${B.y + B.h - 13}`, "k-vent");
  b += g(
    { "data-k": "build" },
    shadow(B.x + B.w / 2, B.y + B.h + 4, B.w + 16) +
      slab(B.x, B.y, B.w, B.h, { top: 7 }) +
      rect(B.x + 12, B.y + 12, 52, B.h - 24, "k-dark", 2) +
      g({ "data-k": "hatch" }, rect(B.x + 16, B.y + 16, 44, B.h - 32, "k-face", 1.5)) +
      vents +
      circle(B.x + B.w - 18, B.y + 18, 2, "k-led") +
      circle(B.x + B.w - 18, B.y + 27, 2, "k-led k-led--act", { "data-k": "buildled" }),
  );
  if (!o.nolabels)
    b += g(
      { "data-k": "lbl-build", class: "k-origin-l" },
      text(B.x + B.w + 14, B.y + 22, "GitHub", "lb lb--s") +
        text(B.x + B.w + 14, B.y + 42, "Actions", "lb lb--s"),
    );
  // the registry: a shelf of images
  const G = H.reg;
  b +=
    shelf(G.x, G.y, G.w) +
    crate(G.x + 14, G.y - 30, 40, 30) +
    crate(G.x + 62, G.y - 30, 40, 30) +
    crate(G.x + 112, G.y - 30, 40, 30, "crate");
  if (!o.nolabels) b += text(G.x + G.w / 2, G.y + 58, "GHCR", "lb", "middle", { "data-k": "lbl-reg" });
  // the laptop with k3s on it
  const L = laptop(H.lap.cx, H.lap.by, H.lap.w);
  b += L.svg;
  const T = { x: L.screen.x + 16, y: L.screen.y + L.screen.h - 60, w: L.screen.w - 32, h: 46 };
  b += g(
    {},
    nodeBody(T.x, T.y, T.w, T.h, 5) + [0, 1, 2].map((s) => pod(podSlot(T.x, T.y, T.w, T.h, 5, s))).join(""),
  );
  b +=
    pod(podSlot(T.x, T.y, T.w, T.h, 5, 3), { key: "oldpod", hidden: true }) +
    g({ "data-k": "newpod", class: "k-origin-c" }, pod(podSlot(T.x, T.y, T.w, T.h, 5, 3), { fresh: true }));
  b += path(`M420 182V${n(L.screen.y - 2)}`, "k-route k-route--dash");
  b += chip(440, 70, 116, "Argo CD", "argo") + chip(296, 152, 170, "Image Updater", "upd");
  if (!o.nolabels)
    b += text(H.lap.cx, H.lap.by + 40, "the laptop, k3s", "lb", "middle", { "data-k": "lbl-lap" });
  // the paths-ignore gate on repo → Actions
  b += g(
    { "data-k": "gate", opacity: o.nogate ? 0 : undefined },
    gate(120, H.gateY, 196, "bar") +
      (o.nolabels ? "" : text(140, 206, "paths-ignore: deploy/**", "lb-m lb-m--s")),
  );
  b += '<g class="pk-layer" data-k="pk"></g>';
  b += g(
    { class: "pk-still" },
    packetAt(H.routes.tag, 0.5, "pk--ink") +
      packetAt(H.routes.sync, 0.6, "pk--ink") +
      packetAt(H.routes.push, 0.2, "pk--ink"),
  );
  if (o.inner) return b;
  return svg(
    "loop",
    "0 0 600 440",
    "One change from git push to running: a commit in the app repo is built by GitHub Actions into an image on GHCR. Image Updater, running on the laptop, sees the image and commits the new tag back to the repo; Argo CD syncs and a new pod replaces the old one. A paths-ignore gate stops that tag commit from starting the build again.",
    b,
  );
}
