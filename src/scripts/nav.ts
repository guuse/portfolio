/**
 * The main nav's underline. It sits under the current page's entry and, on the homepage,
 * follows you: the entry for the section you're reading gets aria-current="location" and the
 * underline slides to it (transform only, so it never relays the page out).
 */
export function initNav(): void {
  const nav = document.querySelector<HTMLElement>("nav.nav");
  const mark = nav?.querySelector<HTMLElement>(".nav__mark");
  if (!nav || !mark) return;
  const links = [...nav.querySelectorAll<HTMLAnchorElement>("a")];
  const page = links.find((a) => a.getAttribute("aria-current") === "page") ?? null;
  const spied = links.flatMap((a) => {
    const el = a.dataset["spy"] ? document.getElementById(a.dataset["spy"]) : null;
    return el ? [{ a, el }] : [];
  });

  let marked: HTMLAnchorElement | null = null;
  const place = (): void => {
    if (!marked) {
      nav.classList.remove("has-mark");
      return;
    }
    // the underline sits where the text underline would: 0.4em under the baseline
    const size = parseFloat(getComputedStyle(marked).fontSize);
    const x = marked.offsetLeft,
      y = marked.offsetTop + marked.offsetHeight / 2 + size * 0.78,
      w = marked.offsetWidth;
    mark.style.transform = `translate(${x}px, ${y.toFixed(1)}px) scaleX(${(w / 100).toFixed(3)})`;
    nav.classList.add("has-mark");
  };
  const markLink = (a: HTMLAnchorElement | null): void => {
    if (a === marked) return;
    marked?.classList.remove("is-marked");
    a?.classList.add("is-marked");
    marked = a;
    place();
  };

  let active: HTMLAnchorElement | null = null;
  const spy = (): void => {
    // the last section whose top has passed 40% of the window is the one being read;
    // at the very bottom, the last one (Contact is too short to ever reach that line)
    const line = innerHeight * 0.4;
    const atEnd = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
    let now: HTMLAnchorElement | null = null;
    for (const s of spied) if (s.el.getBoundingClientRect().top <= line) now = s.a;
    if (atEnd && spied.length) now = spied[spied.length - 1]!.a;
    if (now !== active) {
      active?.removeAttribute("aria-current");
      now?.setAttribute("aria-current", "location");
      active = now;
    }
    markLink(active ?? page);
  };

  markLink(page);
  if (spied.length) {
    let queued = false;
    addEventListener(
      "scroll",
      () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          spy();
        });
      },
      { passive: true },
    );
    spy();
  }
  // re-measure when the fonts arrive or the nav wraps differently
  new ResizeObserver(place).observe(nav);
  // only animate once it's in place, so the first position doesn't slide in from the left
  requestAnimationFrame(() => requestAnimationFrame(() => nav.classList.add("is-tracking")));
}
