/**
 * The two live miniatures on the homepage project cards (the MTG card is a photo collage).
 * Both are decorative: the card's text says what the project is.
 */
import { commit, laptop, nodeBody, packetAt, pod, podSlot, shadow, slab } from "./kit";
import { scale } from "./scenes/platform";
import { CL } from "./scenes/homelab.layout";
import { circle, g, path, rect, svg } from "./svg";

export type CardId = "platform" | "homelab";

const frame = (id: string, inner: string): string =>
  svg(id, "0 0 400 500", "", `<rect class="k-cardbg" width="400" height="500"/>${inner}`, {
    decorative: true,
    cls: "scene-svg--card",
  });

/** Homelab card: the repo, the build and the laptop, with one packet going round the loop. */
function cardLoop(): string {
  let b = path(CL.loop, "k-route", { "data-k": "loop" });
  // repo, top left
  b +=
    shadow(110, 108, 108) +
    slab(58, 52, 104, 52, { top: 6 }) +
    rect(66, 60, 88, 36, "k-dark", 2) +
    path("M74 78H146", "k-git") +
    commit(86, 78, 4.5, "k-commit-old") +
    commit(106, 78, 4.5, "k-commit-old") +
    g({ "data-k": "c-new", class: "k-origin-c" }, commit(128, 78, 6, "k-commit"));
  // build, bottom left
  let vents = "";
  for (let vx = 108; vx < 146; vx += 4.5) vents += path(`M${vx} 234V252`, "k-vent");
  b += g(
    { "data-k": "build" },
    shadow(112, 262, 112) +
      slab(58, 226, 108, 34, { top: 6 }) +
      rect(66, 233, 34, 20, "k-dark", 2) +
      g({ "data-k": "hatch" }, rect(69, 236, 28, 14, "k-face", 1.5)) +
      vents +
      circle(154, 240, 2, "k-led") +
      circle(154, 248, 2, "k-led k-led--act", { "data-k": "buildled" }),
  );
  // laptop, right
  const L = laptop(292, 230, 150);
  b += L.svg;
  const T = { x: L.screen.x + 10, y: L.screen.y + L.screen.h - 40, w: L.screen.w - 20, h: 32 };
  b +=
    nodeBody(T.x, T.y, T.w, T.h, 4) +
    [0, 1, 2].map((s) => pod(podSlot(T.x, T.y, T.w, T.h, 4, s))).join("") +
    g({ "data-k": "newpod", class: "k-origin-c" }, pod(podSlot(T.x, T.y, T.w, T.h, 4, 3), { fresh: true }));
  b += '<g class="pk-layer" data-k="pk"></g>';
  b += g({ class: "pk-still" }, packetAt(CL.loop, 0.42));
  return b;
}

export function card(id: CardId): string {
  if (id === "platform") {
    // the scaling scene, smaller, without labels
    return frame(
      "scale",
      g({ transform: "translate(11 34) scale(0.63)" }, scale({ inner: true, nolabels: true })),
    );
  }
  return frame("cardloop", g({ transform: "translate(0 26)" }, cardLoop()));
}
