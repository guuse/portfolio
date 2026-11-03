/**
 * Two scroll-linked touches, on the page's shared scheduler: the MTG cover drifts a little
 * inside its card (parallax), and the Experience timeline draws its line as you read. The
 * line's tip follows the scroll with a little smoothing, so a mouse wheel reads as one motion
 * rather than steps, and each phase's dot fills with the accent as the line reaches it.
 */
import { approach } from "~/lib/motion/math";
import type { Scheduler } from "~/lib/motion/scheduler";

export function initScrollEffects(scheduler: Scheduler): void {
  const covers = [...document.querySelectorAll<HTMLElement>(".cover__img")];
  const phases = document.querySelector<HTMLElement>(".phases");
  if (!covers.length && !phases) return;

  // where the line runs and where each dot sits, relative to the list (measured on resize)
  const items = phases ? [...phases.querySelectorAll<HTMLElement>(":scope > .phase")] : [];
  let lineTop = 0,
    lineLen = 1;
  let dots: number[] = [];
  const measure = (): void => {
    if (!phases) return;
    const cs = getComputedStyle(phases, "::after");
    lineTop = parseFloat(cs.top) || 0;
    lineLen = Math.max(1, phases.clientHeight - lineTop - (parseFloat(cs.bottom) || 0));
    dots = items.map((el) => {
      const d = getComputedStyle(el, "::before");
      return el.offsetTop + (parseFloat(d.top) || 0) + (parseFloat(d.height) || 0) / 2;
    });
  };
  if (phases) {
    measure();
    new ResizeObserver(measure).observe(phases);
  }

  let shown = -1;
  const reached = items.map(() => false);
  const update = (dt: number): boolean => {
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
    if (!phases || !box) return false;
    const target = Math.max(0, Math.min(1, (vh * 0.7 - box.top) / box.height));
    // jump on the first frame (a reload mid-page), ease after that
    shown = shown < 0 ? target : shown + (target - shown) * approach(dt, 9);
    if (Math.abs(target - shown) < 0.0005) shown = target;
    phases.style.setProperty("--p", shown.toFixed(4));
    const tip = lineTop + shown * lineLen;
    dots.forEach((y, i) => {
      const on = tip >= y - 1;
      if (on !== reached[i]) {
        reached[i] = on;
        items[i]!.classList.toggle("is-reached", on);
      }
    });
    // keep the loop awake while the tip is still catching up
    return shown !== target;
  };
  scheduler.add(update);
  addEventListener("scroll", () => scheduler.wake(), { passive: true });
  document.documentElement.classList.add("js-motion");
}
