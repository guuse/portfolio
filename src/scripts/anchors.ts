/**
 * Smooth scrolling, only where it helps: a click on a link to another part of the same page.
 * Loading a page with a #fragment, reloading, and going back or forward all jump straight to
 * their place, so the scroll scenes start on the step you landed on instead of playing every
 * step on the way there. That is why `scroll-behavior` isn't set in the stylesheet: it is set
 * here, through the CSSOM, for the length of one scroll.
 */
import { motionOk } from "./motion-ok";

export function initSmoothAnchors(): void {
  const root = document.documentElement;
  let timer = 0;
  const done = (): void => {
    clearTimeout(timer);
    root.style.removeProperty("scroll-behavior");
  };
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>("a[href*='#']") : null;
    // the skip link should jump: it's a shortcut, not a journey
    if (!a || a.classList.contains("skip-link") || !motionOk()) return;
    const url = new URL(a.href);
    if (!url.hash || url.origin !== location.origin || url.pathname !== location.pathname) return;
    // the browser does the rest (history, :target, focus); this only makes that one scroll smooth
    root.style.scrollBehavior = "smooth";
    addEventListener("scrollend", done, { once: true });
    clearTimeout(timer);
    timer = window.setTimeout(done, 1500);
  });
}
