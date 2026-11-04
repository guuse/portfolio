/**
 * Getting to a place on the page, and back to it.
 *
 * Smooth scrolling, only where it helps: a click on a link to another part of the same page.
 * Loading a page with a #fragment, reloading, and going back or forward all jump straight to
 * their place, so the scroll scenes start on the step you landed on instead of playing every
 * step on the way there. That is why `scroll-behavior` isn't set in the stylesheet: it is set
 * here, through the CSSOM, for the length of one scroll.
 *
 * The homepage renders its sections only near the window (content-visibility, index.astro).
 * Until a section has rendered once it is as tall as its placeholder, which is right at one
 * width and wrong at every other, so a scroll aimed past it would land off by the difference
 * and then drift as the sections on the way render. Hence, before any jump to a place on the
 * page, everything above that place is rendered for real (`cv-on`), then the scroll is aimed,
 * and when it is over it is checked and, if it's more than a few pixels off, corrected.
 * Going back to the page does the same for the place it was left at.
 */
import { motionOk } from "./motion-ok";

/** The parts of the homepage that render only near the window (index.astro styles them). */
const LAZY = "[data-lazy]";
/** Within this many pixels of its place, a scroll has landed. */
const SLACK = 4;
const root = document.documentElement;

const lazyParts = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>(LAZY)];

/** Renders, for good, every lazy part that comes before `target` or holds it. */
function renderUpTo(target: Element): void {
  for (const el of lazyParts()) {
    if (el.classList.contains("cv-on")) continue;
    const pos = el.compareDocumentPosition(target);
    if (pos & Node.DOCUMENT_POSITION_FOLLOWING || pos & Node.DOCUMENT_POSITION_CONTAINED_BY || el === target)
      el.classList.add("cv-on");
  }
}

/** The scroll position that puts `target` where a #fragment jump puts it, within the page's range. */
const aimFor = (target: Element): number => {
  const pad = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
  const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  const y = scrollY + target.getBoundingClientRect().top - pad - margin;
  return Math.round(Math.min(Math.max(0, y), root.scrollHeight - innerHeight));
};

/** Puts `target` in its place if it isn't within a few pixels of it. */
const correct = (target: Element): void => {
  const y = aimFor(target);
  if (Math.abs(y - scrollY) > SLACK) scrollTo({ top: y, behavior: "instant" });
};

const targetOf = (hash: string): HTMLElement | null => {
  if (hash.length < 2) return null;
  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return null;
  }
};

/** Calls `fn` once the current scroll has come to rest (scrollend, or quiet where there's none). */
const whenStill = (fn: () => void): void => {
  let quiet = 0;
  const end = (): void => {
    clearTimeout(quiet);
    removeEventListener("scroll", onScroll);
    removeEventListener("scrollend", end);
    fn();
  };
  const onScroll = (): void => {
    clearTimeout(quiet);
    quiet = window.setTimeout(end, 150);
  };
  if ("onscrollend" in window) addEventListener("scrollend", end, { once: true });
  addEventListener("scroll", onScroll, { passive: true });
  // a scroll that never starts (already in place) still ends
  quiet = window.setTimeout(end, 300);
};

/** True from the moment the reader scrolls on their own: no correction overrides them. */
let readerMoved = false;
const watchReader = (): void => {
  readerMoved = false;
  const moved = (): void => {
    readerMoved = true;
  };
  for (const type of ["wheel", "touchstart", "keydown", "pointerdown"])
    addEventListener(type, moved, { passive: true, once: true, capture: true });
};

function initSmoothAnchors(): void {
  let timer = 0;
  const done = (): void => {
    clearTimeout(timer);
    root.style.removeProperty("scroll-behavior");
  };
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>("a[href*='#']") : null;
    if (!a) return;
    const url = new URL(a.href);
    if (!url.hash || url.origin !== location.origin || url.pathname !== location.pathname) return;
    const target = targetOf(url.hash);
    if (!target) return;
    // the browser does the rest (history, :target, focus) once this returns, on real boxes
    renderUpTo(target);
    // the skip link should jump: it's a shortcut, not a journey
    const smooth = !a.classList.contains("skip-link") && motionOk();
    if (smooth) {
      root.style.scrollBehavior = "smooth";
      clearTimeout(timer);
      timer = window.setTimeout(done, 1500);
    }
    // the click itself is a pointerdown: start watching for the reader after it
    setTimeout(() => {
      watchReader();
      whenStill(() => {
        done();
        if (!readerMoved) correct(target);
      });
    }, 0);
  });
}

interface Left {
  y: number;
  /**
   * which lazy parts had rendered, as indices into lazyParts() (see hasRendered). A part an
   * instant jump went past is still its placeholder, and stays one on the way back, so the
   * page above the place is as tall as it was.
   */
  on: number[];
  /** the place, relative to a lazy part at (or just below) the window's top edge: its index and offset */
  at?: [number, number];
}
const KEY = "pf-left";

/** The lazy part the window's top edge is in (the innermost), else the first one below it. */
const anchorOf = (parts: HTMLElement[]): number => {
  let at = -1;
  for (const [i, el] of parts.entries()) {
    const r = el.getBoundingClientRect();
    if (r.bottom <= 0) continue;
    if (r.top <= 0) at = i;
    else return at < 0 ? i : at;
  }
  return at;
};

/**
 * Whether a part has rendered at some point: it is in the window, or its height is no longer
 * its placeholder's (`auto` keeps the size it last rendered at). Reading a part's own box
 * doesn't render it.
 */
const hasRendered = (el: HTMLElement): boolean => {
  const r = el.getBoundingClientRect();
  if (r.top < innerHeight && r.bottom > 0) return true;
  const cs = getComputedStyle(el);
  const placeholder = parseFloat(cs.containIntrinsicBlockSize.split(" ").pop() ?? "");
  if (!placeholder) return false;
  const content = r.height - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0);
  const borders = (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
  return Math.abs(content - borders - placeholder) > 1;
};

/** Notes where the page was left, in its history entry, so coming back can rebuild it. */
const remember = (): void => {
  const parts = lazyParts();
  const on = parts.flatMap((el, i) => (el.classList.contains("cv-on") || hasRendered(el) ? [i] : []));
  const i = anchorOf(parts);
  const left: Left = { y: scrollY, on };
  if (i >= 0) left.at = [i, -Math.round(parts[i]!.getBoundingClientRect().top)];
  try {
    history.replaceState({ ...(history.state as object | null), [KEY]: left }, "");
  } catch {
    // a browser that limits replaceState: coming back lands where the browser puts it
  }
};

/** Coming back (or reloading): the parts that were rendered are rendered again, then the place. */
function restore(): void {
  const left = (history.state as Record<string, Left> | null)?.[KEY];
  if (!left) return;
  const parts = lazyParts();
  for (const i of left.on) parts[i]?.classList.add("cv-on");
  watchReader();
  const [i, dy] = left.at ?? [-1, 0];
  const anchor = parts[i];
  const put = (): void => {
    if (readerMoved) return;
    // relative to the anchor part: a part above it that renders late moves it, and the place with it
    const want = anchor ? scrollY + anchor.getBoundingClientRect().top + dy : left.y;
    const y = Math.round(Math.min(Math.max(0, want), root.scrollHeight - innerHeight));
    if (Math.abs(scrollY - y) > SLACK) scrollTo({ top: y, behavior: "instant" });
  };
  put();
  requestAnimationFrame(put);
  if (document.readyState === "complete") setTimeout(put, 0);
  else addEventListener("load", () => setTimeout(put, 0), { once: true });
  void document.fonts.ready.then(put);
}

/** A page opened at a #fragment: render what's above it, jump there, and keep it there. */
function arrive(): void {
  const target = targetOf(location.hash);
  if (!target) return;
  renderUpTo(target);
  watchReader();
  const put = (): void => {
    if (!readerMoved) correct(target);
  };
  put();
  requestAnimationFrame(put);
  // the browser's own fragment scroll can come later still, while the page loads
  if (document.readyState === "complete") setTimeout(put, 0);
  else addEventListener("load", () => setTimeout(put, 0), { once: true });
  void document.fonts.ready.then(put);
}

/**
 * Rendering ahead: a part of the page that would render the moment it comes near the window
 * (mid-scroll, in the frame that has to show it) is rendered about a screen earlier instead,
 * in an idle moment, and its style and layout done there and then. Only once the reader
 * scrolls: the page load itself renders the first screen and nothing more.
 */
function initRenderAhead(): void {
  const idle = (fn: () => void): void => {
    if ("requestIdleCallback" in window) requestIdleCallback(fn, { timeout: 400 });
    else setTimeout(fn, 50);
  };
  const start = (): void => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.unobserve(e.target);
          const el = e.target as HTMLElement;
          if (el.classList.contains("cv-on")) continue;
          idle(() => {
            el.classList.add("cv-on");
            // style and layout now, in this idle task, not in the next frame
            el.getBoundingClientRect();
          });
        }
      },
      { rootMargin: "100% 0px" },
    );
    for (const el of lazyParts()) if (!el.classList.contains("cv-on")) io.observe(el);
  };
  addEventListener("scroll", start, { once: true, passive: true });
}

export function initAnchors(): void {
  initSmoothAnchors();
  // only pages with lazy parts need their place kept by hand
  if (!document.querySelector(LAZY)) return;
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  const returning = nav?.type === "back_forward" || nav?.type === "reload";
  if (returning && (history.state as Record<string, unknown> | null)?.[KEY]) restore();
  else arrive();
  initRenderAhead();
  // leaving: a link (before the navigation starts), or the page going away by any other means
  document.addEventListener(
    "click",
    (e) => {
      const a = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (a && new URL(a.href).pathname !== location.pathname) remember();
    },
    { capture: true },
  );
  // (where there is one, at pageswap: by pagehide the view transition's classes have been
  // put on, and the page may have shifted under them)
  addEventListener("onpageswap" in window ? "pageswap" : "pagehide", remember);
  // a page restored from the back/forward cache is exactly as it was left
}
