/**
 * Sections, cards and list items settle in once as they enter the viewport, a few at a time
 * (each waits a little longer than its previous sibling). Sets marked `.reveal-set` animate
 * their children instead; their stagger index comes from `data-i` (the CSP allows no style
 * attributes, so it's set here through the CSSOM).
 */
const SELECTOR = ".sec, .cover, .phase, .like, .pcard, .also__row, .reveal-set";

export function initReveal(): void {
  const els = [...document.querySelectorAll<HTMLElement>(SELECTOR)];
  for (const el of els) {
    el.classList.add("reveal");
    const i = el.parentElement ? [...el.parentElement.children].indexOf(el) : 0;
    el.style.setProperty("--rd", `${Math.min(i, 5) * 70}ms`);
  }
  for (const el of document.querySelectorAll<SVGElement>(".reveal-set [data-i]"))
    el.style.setProperty("--i", el.dataset["i"] ?? "0");
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
  els.forEach((el) => io.observe(el));
}
