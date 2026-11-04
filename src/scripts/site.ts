/**
 * Behaviour shared by every page. Loaded once by the base layout as a bundled, deferred
 * module. Anything that moves is skipped when the visitor prefers reduced motion.
 */
import { initPageTransitions } from "./page-transitions";
import { blockOf } from "~/lib/blocks";
import { drawingIds, loadAnimators } from "~/lib/motion/registry";
import { browserScheduler } from "~/lib/motion/scheduler";
import { initAnchors } from "./anchors";
import { initCopyEmail } from "./copy-email";
import { initEasterEggs } from "./eggs";
import { initLightbox } from "./lightbox";
import { initNav } from "./nav";
import { motionOk } from "./motion-ok";
import { initPrints } from "./prints";
import { initReveal } from "./reveal";
import { initScrollEffects } from "./scroll-effects";

/** Runs one part of the page's behaviour; if it throws, it says so and the rest still run. */
function safely(name: string, init: () => void): void {
  try {
    init();
  } catch (error) {
    console.error(`site: ${name} failed; the rest of the page still works`, error);
  }
}

/** Gives the main thread back between two steps: scheduler.yield where there is one. */
const yieldNow = (): Promise<void> => {
  const s = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  return s?.yield ? s.yield() : new Promise((resolve) => setTimeout(resolve, 0));
};

/**
 * Runs the steps in order once the page has painted (a frame, then a task after it), each in
 * a task of its own, the main thread given back between them: what measures the page (the
 * nav's underline, which sections start below the fold, the timeline) waits for this, so the
 * module itself never forces a style or layout pass and no step adds to another's long task.
 */
type Step = [name: string, init: () => void];
const afterPaint = (steps: Step[]): void => {
  const run = async (): Promise<void> => {
    for (const [name, init] of steps) {
      safely(name, init);
      await yieldNow();
    }
  };
  requestAnimationFrame(() => setTimeout(() => void run(), 0));
};

/** Runs `init` when the main thread is idle: for what nobody needs in the first seconds. */
const whenIdle = (name: string, init: () => void): void => {
  if ("requestIdleCallback" in window) requestIdleCallback(() => safely(name, init), { timeout: 2000 });
  else setTimeout(() => safely(name, init), 300);
};

// first: the new page's view transition is set up before its first frame
safely("page transitions", initPageTransitions);
const scheduler = browserScheduler();

// now: the copy buttons are shown, and a click on an in-page link is smooth from the start
safely("copy email", initCopyEmail);
safely("anchors", initAnchors);

const motion = motionOk() && "IntersectionObserver" in window;
// a frame later, one step at a time: the keyboard shortcuts (a reader may press one the
// moment the page shows; they only add listeners), the reveal (it reads every position
// before anything else has written), the nav, then what moves with the scroll
const reveal: Step[] = motion ? [["reveal", initReveal]] : [];
const effects: Step[] = motion ? [["scroll effects", () => initScrollEffects(scheduler)]] : [];
afterPaint([["easter eggs", initEasterEggs], ...reveal, ["nav", initNav], ...effects]);
// listeners for things a reader does later, each in an idle moment of its own
whenIdle("prints", initPrints);
whenIdle("lightbox", initLightbox);

if (motion) {
  // The drawings' runtime is only fetched on pages that have drawings, and only once the
  // page has loaded, a drawing is near and the main thread is idle: the stills are already
  // on screen. The controller and the animators for this page's drawings load in parallel.
  const ids = drawingIds();
  if (ids.length) {
    // a chunk that fails to load (a deploy mid-visit, a flaky network) leaves the stills
    const start = (): void =>
      void Promise.all([import("~/lib/motion/controller"), loadAnimators(ids)])
        .then(([{ startMotion }, animators]) => startMotion(scheduler, animators))
        .catch((error: unknown) =>
          console.error("site: the drawings' runtime didn't load; they stay still", error),
        );
    const idle = (): void => {
      if ("requestIdleCallback" in window) requestIdleCallback(start, { timeout: 1500 });
      else setTimeout(start, 200);
    };
    // "Near" is within a screen of the window: on a phone the homepage's
    // drawings are three screens down, and loading their runtime during the page load would
    // only compete with it. Each drawing is watched by its top-level block, which has a box
    // even where the page isn't rendered yet (content-visibility).
    const near = (): void => {
      const io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          io.disconnect();
          idle();
        },
        { rootMargin: "100% 0px" },
      );
      for (const el of document.querySelectorAll("[data-scene], [data-card]")) io.observe(blockOf(el) ?? el);
    };
    if (document.readyState === "complete") near();
    else addEventListener("load", near, { once: true });
  }
}
