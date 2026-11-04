/**
 * Screenshot viewer: a native modal <dialog>, so focus is trapped, the page behind is inert
 * and Esc closes it for free. Any `button[data-lb]` opens it on its image; the buttons in the
 * same `[data-lb-group]` become the set to step through (arrow keys, buttons or a swipe).
 * Focus returns to the button that opened it.
 *
 * It shows the thumbnail the page already has at once (it's cached), at the full image's
 * size, and swaps in the full image as soon as it has decoded; if that takes a moment, a
 * faint spinner appears (CSS, after 300 ms). Pinch-zoom is the browser's own, so a swipe only
 * steps when it's one finger on an unzoomed page.
 */
interface Shot {
  thumb: string;
  src: string;
  width: string;
  height: string;
  alt: string;
  caption: string;
}

function shotOf(btn: HTMLButtonElement): Shot {
  const img = btn.querySelector("img")!;
  const caption = btn.closest("figure")?.querySelector("figcaption")?.textContent ?? img.alt;
  const thumb = img.currentSrc || img.src;
  // the largest candidate: the viewer shows the screenshot as big as it fits
  return {
    thumb,
    src: btn.dataset["full"] ?? thumb,
    width: btn.dataset["fullWidth"] ?? img.getAttribute("width") ?? "",
    height: btn.dataset["fullHeight"] ?? img.getAttribute("height") ?? "",
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
  const img = dialog.querySelector<HTMLImageElement>(".lightbox__img")!;
  const cap = dialog.querySelector(".lightbox__cap")!;
  const count = dialog.querySelector(".lightbox__count")!;
  const prev = dialog.querySelector<HTMLButtonElement>("[data-lb-prev]")!;
  const next = dialog.querySelector<HTMLButtonElement>("[data-lb-next]")!;
  const close = dialog.querySelector<HTMLButtonElement>("[data-lb-close]")!;
  let shots: Shot[] = [],
    index = 0,
    opener: HTMLButtonElement | null = null;

  const render = (): void => {
    const s = shots[index]!;
    img.width = Number(s.width);
    img.height = Number(s.height);
    img.alt = s.alt;
    cap.textContent = s.caption;
    count.textContent = `${index + 1} of ${shots.length}`;
    prev.hidden = next.hidden = shots.length < 2;
    if (decoded.has(s.src) || s.src === s.thumb) {
      stage.classList.remove("is-loading");
      img.src = s.src;
      return;
    }
    // the thumbnail first, stretched to the full image's box, then the real thing
    img.src = s.thumb;
    stage.classList.add("is-loading");
    const full = new Image();
    full.src = s.src;
    full
      .decode()
      .catch(() => undefined)
      .then(() => {
        decoded.add(s.src);
        if (shots[index] !== s) return;
        img.src = s.src;
        stage.classList.remove("is-loading");
      });
  };
  const step = (d: number): void => {
    if (shots.length < 2) return;
    index = (index + d + shots.length) % shots.length;
    render();
  };

  document.addEventListener("click", (e) => {
    const btn = (e.target as Element).closest?.<HTMLButtonElement>("button[data-lb]");
    if (!btn) return;
    e.preventDefault();
    const group = btn.closest("[data-lb-group]") ?? btn.parentElement!;
    const buttons = [...group.querySelectorAll<HTMLButtonElement>("button[data-lb]")];
    shots = buttons.map(shotOf);
    index = buttons.indexOf(btn);
    opener = btn;
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
