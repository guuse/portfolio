/**
 * Behaviour shared by every page. Loaded once by the base layout as a bundled, deferred
 * module. Anything that moves is skipped when the visitor prefers reduced motion.
 */
import { browserScheduler } from "~/lib/motion/scheduler";
import { initCopyEmail } from "./copy-email";
import { initEasterEggs } from "./eggs";
import { initLightbox } from "./lightbox";
import { motionOk } from "./motion-ok";
import { initPrints } from "./prints";
import { initReveal } from "./reveal";
import { initScrollEffects } from "./scroll-effects";

const scheduler = browserScheduler();

initCopyEmail();
initPrints();
initLightbox();
initEasterEggs();

if (motionOk() && "IntersectionObserver" in window) {
  initReveal();
  initScrollEffects(scheduler);
  // the drawings' runtime is only fetched on pages that have drawings
  if (document.querySelector(".scenes, [data-card]")) {
    void import("~/lib/motion/controller").then(({ startMotion }) => startMotion(scheduler));
  }
}
