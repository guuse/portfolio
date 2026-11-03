/**
 * The 404 drawing: a node with one empty slot, and the pod that used to live there
 * drifting off. CSS animates it (src/pages/404.astro); this is its still frame.
 */
import { nodeBody, pod, podSlot, shadow, slab } from "../kit";
import { g, path, rect, svg, text } from "../svg";

export function evicted(): string {
  const x = 150,
    y = 150,
    w = 300,
    h = 74,
    slots = 4;
  let b = path("M60 268.5H540", "k-ground");
  b += shadow(300, 262, w + 40) + slab(x - 10, y + h + 8, w + 20, 14, { top: 0 });
  b += nodeBody(x, y, w, h, slots) + [0, 1, 2].map((i) => pod(podSlot(x, y, w, h, slots, i))).join("");
  const gap = podSlot(x, y, w, h, slots, 3);
  b += rect(gap.x + 1.5, gap.y + 1.5, gap.w - 3, gap.h - 3, "k-pend", 1.5);
  b += g({ class: "evicted" }, pod({ ...gap, y: gap.y - 92 }, { fresh: true }));
  b += text(gap.x + gap.w / 2, gap.y - 112, "Evicted", "lb-m", "middle");
  return svg(
    "evicted",
    "0 0 600 300",
    "A Kubernetes node with three pods and one empty slot; the fourth pod floats away above it.",
    b,
  );
}
