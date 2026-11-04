/**
 * Sections, cards and list items settle in once as they enter the viewport, a few at a time
 * (each waits a little longer than its previous sibling). Sets marked `.reveal-set` animate
 * their children instead, staggered by their `data-i`. The rules, delays included, are in
 * src/styles/motion.css: this only tags elements and never writes a style, since a custom
 * property written on a section restyles everything inside it.
 *
 * Only what starts below the fold is tagged: whatever is on screen when the page opens is
 * already painted, and fading it out and back in would be a flash, not an entrance.
 */
const SELECTOR = ".sec, .cover, .phase, .like, .pcard, .also__row, .reveal-set";

export function initReveal(): void {
  const all = [...document.querySelectorAll<HTMLElement>(SELECTOR)];
  // read every position first, then write. A part of the page far from the window may not be
  // rendered yet (content-visibility on the homepage): reading a box inside it would render
  // it, so each element is placed by its top-level block first, whose box is always there.
  const fold = innerHeight;
  const blocks = new Map<Element, DOMRect>();
  const blockRect = (el: Element): DOMRect | null => {
    // (the hero and About share a wrapper, .hero: About counts as a block of its own)
    const block = el.closest(
      "main > :not(div.wrap, .hero), main > div.wrap > *, .hero > *, .hero > div.wrap > *",
    );
    if (!block || block === el) return null;
    let r = blocks.get(block);
    if (!r) blocks.set(block, (r = block.getBoundingClientRect()));
    return r;
  };
  const below = all.filter((el) => {
    const b = blockRect(el);
    if (b && b.top > fold) return true; // the whole block starts below the fold
    if (b && b.bottom < 0) return false; // it's all above the window
    return el.getBoundingClientRect().top > fold;
  });
  // each one's delay comes from its place among its siblings (motion.css)
  for (const el of below) el.classList.add("reveal");
  // motion.css turns data-i 0 to 15 into --i from the start; only a longer set needs this
  for (const el of document.querySelectorAll<HTMLElement | SVGElement>(".reveal-set [data-i]")) {
    const i = Number(el.dataset["i"]);
    if (i > 15) el.style.setProperty("--i", String(i));
  }
  document.documentElement.classList.add("js-reveal");
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
  );
  below.forEach((el) => io.observe(el));
}
