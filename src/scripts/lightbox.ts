/**
 * Screenshot viewer: a native modal <dialog>, so focus is trapped, the page behind is inert
 * and Esc closes it for free. Each screenshot is an `a[data-lb]` linking to its full-size
 * image (what a click does without JavaScript, or with a modifier key); this takes the plain
 * click over and opens the viewer on it. The links in the same `[data-lb-group]` become the
 * set to step through (arrow keys, buttons or a swipe). Focus returns to the link that opened it.
 *
 * It shows the thumbnail the page already has at once (it's cached), stretched to the full
 * image's box (its aspect ratio and size are known up front, so nothing moves), and swaps in
 * the full image as soon as it has decoded; if that takes a moment, a
 * faint spinner appears (CSS, after 300 ms). If the full image fails to load, the thumbnail
 * stays. Pinch-zoom is the browser's own, so a swipe only steps when it's one finger on an
 * unzoomed page.
 */
interface Shot {
  thumb: string;
  src: string;
  width: string;
  height: string;
  alt: string;
  caption: string;
}

function shotOf(link: HTMLAnchorElement): Shot {
  const img = link.querySelector("img")!;
  const caption = link.closest("figure")?.querySelector("figcaption")?.textContent ?? img.alt;
  // the thumbnail as the page has it, if it has loaded (a lazy one may not have yet)
  const thumb = img.complete && img.naturalWidth > 0 ? img.currentSrc : "";
  // the full image the link points at: the viewer shows the screenshot as big as it fits
  return {
    thumb,
    src: link.href,
    width: link.dataset["fullWidth"] ?? img.getAttribute("width") ?? "",
    height: link.dataset["fullHeight"] ?? img.getAttribute("height") ?? "",
    alt: img.alt,
    caption,
  };
}

/** Full images already decoded, so stepping back to one never shows the thumbnail again. */
const decoded = new Set<string>();

export function initLightbox(): void {
  const dialog = document.querySelector<HTMLDialogElement>("dialog.lightbox");
  if (!dialog) return;
  const stage = dialog.querySelector<HTMLElement>(".lightbox__stage")!;
  // made here rather than in the markup, where it would be an <img> without a source
  const img = document.createElement("img");
  img.className = "lightbox__img";
  img.alt = "";
  img.decoding = "async";
  const cap = dialog.querySelector(".lightbox__cap")!;
  const count = dialog.querySelector(".lightbox__count")!;
  const prev = dialog.querySelector<HTMLButtonElement>("[data-lb-prev]")!;
  const next = dialog.querySelector<HTMLButtonElement>("[data-lb-next]")!;
  const close = dialog.querySelector<HTMLButtonElement>("[data-lb-close]")!;
  let shots: Shot[] = [],
    index = 0,
    opener: HTMLAnchorElement | null = null;

  const render = (): void => {
    const s = shots[index]!;
    const w = Number(s.width),
      h = Number(s.height);
    img.width = w;
    img.height = h;
    // the box is the full image's, from the start (Lightbox.astro): the thumbnail fills it
    // stretched, and the full image lands in exactly the same place
    if (w > 0 && h > 0) {
      img.style.setProperty("--lb-ratio", String(w / h));
      img.style.setProperty("--lb-w", `${w}px`);
    }
    img.alt = s.alt;
    cap.textContent = s.caption;
    count.textContent = `${index + 1} of ${shots.length}`;
    prev.hidden = next.hidden = shots.length < 2;
    if (decoded.has(s.src)) {
      stage.classList.remove("is-loading");
      img.src = s.src;
      return;
    }
    // the thumbnail first, stretched to the full image's box, then the real thing
    if (s.thumb) img.src = s.thumb;
    else img.removeAttribute("src");
    stage.classList.add("is-loading");
    const full = new Image();
    full.src = s.src;
    full.decode().then(
      () => {
        decoded.add(s.src);
        if (shots[index] !== s) return;
        img.src = s.src;
        stage.classList.remove("is-loading");
      },
      // it didn't load: keep the thumbnail (or nothing) rather than swap in a broken image
      () => {
        if (shots[index] === s) stage.classList.remove("is-loading");
      },
    );
  };
  const step = (d: number): void => {
    if (shots.length < 2) return;
    index = (index + d + shots.length) % shots.length;
    render();
  };

  for (const link of document.querySelectorAll("a[data-lb]")) link.setAttribute("aria-haspopup", "dialog");
  document.addEventListener("click", (e) => {
    const link = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>("a[data-lb]") : null;
    // a new tab, a download, a middle click: the link does what links do
    if (!link || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const group = link.closest("[data-lb-group]") ?? link.parentElement!;
    const links = [...group.querySelectorAll<HTMLAnchorElement>("a[data-lb]")];
    shots = links.map(shotOf);
    index = links.indexOf(link);
    opener = link;
    if (!img.isConnected) stage.append(img);
    render();
    dialog.showModal();
    close.focus();
  });
  prev.addEventListener("click", () => step(-1));
  next.addEventListener("click", () => step(1));
  close.addEventListener("click", () => dialog.close());
  // a click on the backdrop (the dialog itself or the empty stage) closes it
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog || e.target === stage) dialog.close();
  });
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
    else return;
    e.preventDefault();
  });
  dialog.addEventListener("close", () => {
    document.documentElement.classList.remove("has-modal");
    opener?.focus();
  });
  dialog.addEventListener("toggle", () =>
    document.documentElement.classList.toggle("has-modal", dialog.open),
  );

  // a swipe: one finger, page not zoomed in, mostly sideways
  const down = new Set<number>();
  let sx: number | null = null,
    sy = 0;
  const zoomed = (): boolean => (window.visualViewport?.scale ?? 1) > 1.01;
  dialog.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return;
    down.add(e.pointerId);
    if (down.size === 1 && !zoomed()) {
      sx = e.clientX;
      sy = e.clientY;
    } else sx = null; // a second finger: that's a pinch, not a swipe
  });
  const lift = (e: PointerEvent): void => {
    if (!down.delete(e.pointerId)) return;
    if (sx === null || e.type === "pointercancel") {
      sx = null;
      return;
    }
    const dx = e.clientX - sx,
      dy = e.clientY - sy;
    sx = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && !zoomed()) step(dx < 0 ? 1 : -1);
  };
  dialog.addEventListener("pointerup", lift);
  dialog.addEventListener("pointercancel", lift);
}
