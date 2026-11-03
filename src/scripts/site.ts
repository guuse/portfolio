/**
 * Behaviour shared by every page. Loaded once by the base layout as a bundled, deferred
 * module. Anything that moves is skipped when the visitor prefers reduced motion.
 */
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

const scheduler = browserScheduler();

initCopyEmail();
initSmoothAnchors();
initNav();
initPrints();
initLightbox();
initEasterEggs();

if (motionOk() && "IntersectionObserver" in window) {
  initReveal();
  initScrollEffects(scheduler);
  // The drawings' runtime is only fetched on pages that have drawings, and only once the
  // page has loaded and the main thread is idle: the stills are already on screen.
  if (document.querySelector(".scenes, [data-card]")) {
    const start = (): void =>
      void import("~/lib/motion/controller").then(({ startMotion }) => startMotion(scheduler));
    const idle = (): void =>
      void ("requestIdleCallback" in window
        ? requestIdleCallback(start, { timeout: 1500 })
        : setTimeout(start, 200));
    if (document.readyState === "complete") idle();
    else addEventListener("load", idle, { once: true });
  }
}
