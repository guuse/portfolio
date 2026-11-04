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
import { blockOf } from "~/lib/blocks";
import { ms } from "~/styles/tokens";

const SELECTOR = ".sec, .cover, .phase, .like, .pcard, .also__row, .reveal-set";

/**
 * Marks an element `is-done` once its entrance is over, so its component's own transitions
 * apply again (motion.css). The longest an entrance takes: five sibling steps and the fade,
 * or, in a set, the last row's step and its settle.
 */
const settle = (el: Element): void => {
  const rows = el.querySelectorAll<HTMLElement>(":scope > [data-i]");
  const last = rows.length ? Number(rows[rows.length - 1]!.dataset["i"]) || 0 : 0;
  const longest = Math.max(5 * ms.stagger + ms.reveal, last * ms.stagger + ms.reveal);
  setTimeout(() => el.classList.add("is-done"), longest + 50);
};

export function initReveal(): void {
  const all = [...document.querySelectorAll<HTMLElement>(SELECTOR)];
  // read every position first, then write. A part of the page far from the window may not be
  // rendered yet (content-visibility on the homepage): reading a box inside it would render
  // it, so each element is placed by its top-level block first, whose box is always there.
  const fold = innerHeight;
  const blocks = new Map<Element, DOMRect>();
  const blockRect = (el: Element): DOMRect | null => {
    const block = blockOf(el);
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
        settle(e.target);
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
  );
  below.forEach((el) => io.observe(el));
}
