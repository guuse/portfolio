/**
 * Behaviour shared by every page. Loaded once by the base layout as a bundled, deferred
 * module. Anything that moves is skipped when the visitor prefers reduced motion.
 */
import { initPageTransitions } from "./page-transitions";
import { drawingIds, loadAnimators } from "~/lib/motion/registry";
import { browserScheduler } from "~/lib/motion/scheduler";
import { initSmoothAnchors } from "./anchors";
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

// first: the new page's view transition is set up before its first frame
safely("page transitions", initPageTransitions);
const scheduler = browserScheduler();

safely("copy email", initCopyEmail);
safely("smooth anchors", initSmoothAnchors);
safely("nav", initNav);
safely("prints", initPrints);
safely("lightbox", initLightbox);
safely("easter eggs", initEasterEggs);

if (motionOk() && "IntersectionObserver" in window) {
  safely("reveal", initReveal);
  safely("scroll effects", () => initScrollEffects(scheduler));
  // The drawings' runtime is only fetched on pages that have drawings, and only once the
  // page has loaded and the main thread is idle: the stills are already on screen. The
  // controller and the animators for this page's drawings load in parallel.
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
    if (document.readyState === "complete") idle();
    else addEventListener("load", idle, { once: true });
  }
}
