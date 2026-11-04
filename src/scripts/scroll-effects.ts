/**
 * Two scroll-linked touches, on the page's shared scheduler: the MTG cover drifts a little
 * inside its card (parallax), and the Experience timeline draws its line as you read. The
 * line's tip follows the scroll with a little smoothing, so a mouse wheel reads as one motion
 * rather than steps, and each phase's dot fills with the accent as the line reaches it.
 *
 * Per frame it reads in the scheduler's read phase and writes in the task, and it writes only
 * transforms, straight onto the elements that move (a custom property on the list would
 * restyle every element in it each frame), and only when a value changed.
 */
import { approach } from "~/lib/motion/math";
import type { Scheduler } from "~/lib/motion/scheduler";

export function initScrollEffects(scheduler: Scheduler): void {
  const covers = [...document.querySelectorAll<HTMLElement>(".cover__img")];
  const phases = document.querySelector<HTMLElement>(".phases");
  const line = document.querySelector<HTMLElement>(".timeline__line");
  if (!covers.length && !(phases && line)) return;

  // Only what is near the window is measured or moved. Far from it, a part of the page may
  // not be rendered yet (content-visibility on the homepage), and reading a box in there
  // would render it on the spot.
  const near = new Set<Element>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) near.add(e.target);
        else near.delete(e.target);
      }
      scheduler.wake();
    },
    { rootMargin: "25% 0px" },
  );
  const frames = covers.map((img) => img.parentElement!);
  frames.forEach((f) => io.observe(f));

  // Where things are on the page, kept from one layout to the next: a frame then needs only
  // scrollY, not a box (reading one in a frame can force a style pass). Anything that changes
  // the page's layout resizes <main> or the list, which marks it all for measuring again.
  const items = phases ? [...phases.querySelectorAll<HTMLElement>(":scope > .phase")] : [];
  let version = 0;
  const spots = new Map<Element, { v: number; top: number; height: number }>();
  const spot = (el: Element): { top: number; height: number } => {
    let s = spots.get(el);
    if (s?.v !== version) {
      const r = el.getBoundingClientRect();
      s = { v: version, top: r.top + scrollY, height: r.height };
      spots.set(el, s);
      if (el === phases) measureLine();
    }
    return s;
  };
  const relaid = new ResizeObserver(() => {
    version++;
  });
  relaid.observe(document.querySelector("main") ?? document.body);

  // where the line runs and where each dot sits, relative to the line's top
  let lineLen = 1;
  let dots: number[] = [];
  const measureLine = (): void => {
    if (!phases || !line) return;
    lineLen = Math.max(1, line.offsetHeight);
    dots = items.map((el) => {
      const d = getComputedStyle(el, "::before");
      return (
        phases.offsetTop +
        el.offsetTop +
        (parseFloat(d.top) || 0) +
        (parseFloat(d.height) || 0) / 2 -
        line.offsetTop
      );
    });
  };
  if (phases && line) {
    io.observe(phases);
    relaid.observe(phases);
  }

  // The window: its height on resize and the scroll position on scroll, taken in those
  // events, before the frame's animations have touched the style. Read in the frame instead,
  // either one makes the browser bring the style up to date first, every frame.
  let vh = innerHeight,
    sy = scrollY;
  addEventListener(
    "resize",
    () => {
      vh = innerHeight;
    },
    { passive: true },
  );

  // the read phase's results: boxes relative to the window
  const rects: ({ top: number; height: number; bottom: number } | null)[] = covers.map(() => null);
  let box: { top: number; height: number } | null = null;
  const at = (el: Element): { top: number; height: number; bottom: number } => {
    const s = spot(el),
      top = s.top - sy;
    return { top, height: s.height, bottom: top + s.height };
  };
  const read = (): void => {
    frames.forEach((f, i) => (rects[i] = near.has(f) ? at(f) : null));
    box = phases && line && near.has(phases) ? at(phases) : null;
  };

  const drift = covers.map(() => "");
  let shown = -1;
  let drawn = "";
  const reached = items.map(() => false);
  const update = (dt: number): boolean => {
    covers.forEach((img, i) => {
      const r = rects[i];
      if (!r || r.bottom < 0 || r.top > vh) return;
      const p = (r.top + r.height / 2) / vh - 0.5;
      const t = `translate3d(0,${(p * -22).toFixed(1)}px,0) scale(1.06)`;
      if (t !== drift[i]) img.style.transform = drift[i] = t;
    });
    if (!line || !box) return false;
    const target = Math.max(0, Math.min(1, (vh * 0.7 - box.top) / box.height));
    // jump on the first frame (a reload mid-page), ease after that
    shown = shown < 0 ? target : shown + (target - shown) * approach(dt, 9);
    if (Math.abs(target - shown) < 0.0005) shown = target;
    const t = `scaleY(${shown.toFixed(4)})`;
    if (t !== drawn) line.style.transform = drawn = t;
    const tip = shown * lineLen;
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
  scheduler.add(update, read);
  addEventListener(
    "scroll",
    () => {
      sy = scrollY;
      scheduler.wake();
    },
    { passive: true },
  );
  document.documentElement.classList.add("js-motion");
}
