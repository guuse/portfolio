/**
 * The main nav's underline. It sits under the current page's entry and, on the homepage,
 * follows you: while you read a section that has an entry, the underline slides to it
 * (transform only, so it never relays the page out), and it stays there through the sections
 * that follow without an entry of their own (Learned and Skills belong to Experience) until
 * the next one with an entry starts. Above the first one it's the page's own entry. An entry that links to a section of this page (Experience, Contact)
 * also gets aria-current="location"; one that links to another page (Projects) only moves
 * the underline.
 *
 * It never measures the page while scrolling: the links' places are taken when the nav is
 * laid out (a ResizeObserver, which runs after layout), and which sections have passed the
 * reading line comes from an IntersectionObserver, which the browser works out off the
 * script's back. So the spy costs nothing per frame, and nothing at all while the page is
 * hidden.
 */

export function initNav(): void {
  const nav = document.querySelector<HTMLElement>("nav.nav");
  const mark = nav?.querySelector<HTMLElement>(".nav__mark");
  if (!nav || !mark) return;
  const links = [...nav.querySelectorAll<HTMLAnchorElement>("a")];
  const page = links.find((a) => a.getAttribute("aria-current") === "page") ?? null;
  const spied = links.flatMap((a) => {
    const el = a.dataset["spy"] ? document.getElementById(a.dataset["spy"]) : null;
    const url = new URL(a.href);
    const inPage = !!url.hash && url.pathname === location.pathname;
    return el ? [{ a, el, inPage }] : [];
  });

  // where each link's underline goes, measured whenever the nav is laid out anew
  const spots = new Map<HTMLAnchorElement, string>();
  let marked: HTMLAnchorElement | null = null;
  let placed = "";
  const place = (): void => {
    const spot = marked ? spots.get(marked) : undefined;
    if (!marked || !spot) {
      if (!marked) nav.classList.remove("has-mark");
      return;
    }
    if (spot !== placed) mark.style.transform = placed = spot;
    nav.classList.add("has-mark");
  };
  const measure = (): void => {
    for (const a of links) {
      // the underline sits where the text underline would: 0.4em under the baseline
      const size = parseFloat(getComputedStyle(a).fontSize);
      const x = a.offsetLeft,
        y = a.offsetTop + a.offsetHeight / 2 + size * 0.78,
        w = a.offsetWidth;
      spots.set(a, `translate(${x}px, ${y.toFixed(1)}px) scaleX(${(w / 100).toFixed(3)})`);
    }
    place();
  };
  const markLink = (a: HTMLAnchorElement | null): void => {
    if (a === marked) return;
    marked?.classList.remove("is-marked");
    a?.classList.add("is-marked");
    marked = a;
    place();
  };

  type Spied = (typeof spied)[number];
  let active: Spied | null = null;
  // the last section with an entry whose top has passed 40% of the window is the one being
  // read: it holds through the sections after it that have none. At the very bottom it's the
  // last one (Contact is too short to ever reach that line).
  const passed = new Set<Element>();
  let atEnd = false;
  const spy = (): void => {
    let now: Spied | null = null;
    for (const s of spied) if (passed.has(s.el)) now = s;
    if (atEnd) now = spied[spied.length - 1]!;
    if (now !== active) {
      if (active?.inPage) active.a.removeAttribute("aria-current");
      if (now?.inPage) now.a.setAttribute("aria-current", "location");
      active = now;
    }
    markLink(active?.a ?? page);
  };

  markLink(page);
  if (spied.length) {
    // the root runs from far above the page down to the reading line: a section is in it
    // exactly when its top has passed the line, so every change is an entry, even a jump
    const line = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) passed.add(e.target);
          else passed.delete(e.target);
        }
        spy();
      },
      { rootMargin: "100000px 0px -60% 0px" },
    );
    for (const s of spied) line.observe(s.el);
    // the very end of the page: the footer all in view
    const footer = document.querySelector(".site-footer");
    if (footer)
      new IntersectionObserver(
        (entries) => {
          atEnd = entries.at(-1)!.intersectionRatio >= 0.99;
          spy();
        },
        { threshold: [0, 0.99] },
      ).observe(footer);
  }
  // measured when the nav is first laid out, and again when the fonts arrive or it wraps
  new ResizeObserver(measure).observe(nav);
  // only animate once it's in place, so the first position doesn't slide in from the left
  requestAnimationFrame(() => requestAnimationFrame(() => nav.classList.add("is-tracking")));
}
