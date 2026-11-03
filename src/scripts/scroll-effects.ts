/**
 * Two scroll-linked touches, on the page's shared scheduler: the MTG cover drifts a little
 * inside its card (parallax), and the Experience timeline draws its line as you read.
 */
import type { Scheduler } from "~/lib/motion/scheduler";

export function initScrollEffects(scheduler: Scheduler): void {
  const covers = [...document.querySelectorAll<HTMLElement>(".cover__img")];
  const phases = document.querySelector<HTMLElement>(".phases");
  if (!covers.length && !phases) return;
  const update = (): boolean => {
    const vh = innerHeight;
    // read everything, then write
    const rects = covers.map((img) => img.parentElement!.getBoundingClientRect());
    const box = phases?.getBoundingClientRect();
    covers.forEach((img, i) => {
      const r = rects[i]!;
      if (r.bottom < 0 || r.top > vh) return;
      const p = (r.top + r.height / 2) / vh - 0.5;
      img.style.transform = `translate3d(0,${(p * -22).toFixed(1)}px,0) scale(1.06)`;
    });
    if (phases && box)
      phases.style.setProperty("--p", Math.max(0, Math.min(1, (vh * 0.7 - box.top) / box.height)).toFixed(3));
    return false; // runs whenever the loop is awake; a scroll wakes it for one frame
  };
  scheduler.add(update);
  addEventListener("scroll", () => scheduler.wake(), { passive: true });
  document.documentElement.classList.add("js-motion");
}
