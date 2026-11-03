/**
 * Screenshot viewer: a native modal <dialog>, so focus is trapped, the page behind is inert
 * and Esc closes it for free. Any `button[data-lb]` opens it on its image; the buttons in the
 * same `[data-lb-group]` become the set to step through (arrow keys, buttons or a swipe).
 * Focus returns to the button that opened it.
 */
interface Shot {
  src: string;
  width: string;
  height: string;
  alt: string;
  caption: string;
}

function shotOf(btn: HTMLButtonElement): Shot {
  const img = btn.querySelector("img")!;
  const caption = btn.closest("figure")?.querySelector("figcaption")?.textContent ?? img.alt;
  // the largest candidate: the viewer shows the screenshot as big as it fits
  return {
    src: btn.dataset["full"] ?? (img.currentSrc || img.src),
    width: btn.dataset["fullWidth"] ?? img.getAttribute("width") ?? "",
    height: btn.dataset["fullHeight"] ?? img.getAttribute("height") ?? "",
    alt: img.alt,
    caption,
  };
}

export function initLightbox(): void {
  const dialog = document.querySelector<HTMLDialogElement>("dialog.lightbox");
  if (!dialog) return;
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
    img.src = s.src;
    img.width = Number(s.width);
    img.height = Number(s.height);
    img.alt = s.alt;
    cap.textContent = s.caption;
    count.textContent = `${index + 1} of ${shots.length}`;
    prev.hidden = next.hidden = shots.length < 2;
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
    if (e.target === dialog || (e.target as Element).classList.contains("lightbox__stage")) dialog.close();
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
  let sx: number | null = null;
  dialog.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") sx = e.clientX;
  });
  dialog.addEventListener("pointerup", (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx;
    sx = null;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  });
}
