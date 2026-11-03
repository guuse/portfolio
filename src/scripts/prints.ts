/**
 * The hero photos are loose prints. With a mouse or pen they can be nudged (up to 60px) and
 * spring back on release; touch keeps scrolling. Hovering an interest in About lifts the
 * matching print (decorative only, so the interests are not tab stops).
 */
const LIMIT = 60;

export function initPrints(): void {
  for (const el of document.querySelectorAll<HTMLElement>(".print")) {
    let id: number | null = null,
      sx = 0,
      sy = 0;
    el.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || e.pointerType === "touch") return;
      id = e.pointerId;
      sx = e.clientX;
      sy = e.clientY;
      el.setPointerCapture(id);
      el.classList.add("is-dragging");
      e.preventDefault();
    });
    el.addEventListener("pointermove", (e) => {
      if (e.pointerId !== id) return;
      el.style.setProperty("--dx", `${Math.max(-LIMIT, Math.min(LIMIT, e.clientX - sx))}px`);
      el.style.setProperty("--dy", `${Math.max(-LIMIT, Math.min(LIMIT, e.clientY - sy))}px`);
    });
    const end = (e: PointerEvent): void => {
      if (e.pointerId !== id) return;
      id = null;
      el.classList.remove("is-dragging");
      el.style.removeProperty("--dx");
      el.style.removeProperty("--dy");
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  }

  for (const item of document.querySelectorAll<HTMLElement>("[data-lift]")) {
    const print = document.querySelector(`[data-print="${item.dataset["lift"]}"]`);
    if (!print) continue;
    const on = (): void => void print.classList.add("is-lifted");
    const off = (): void => void print.classList.remove("is-lifted");
    item.addEventListener("pointerenter", on);
    item.addEventListener("pointerleave", off);
  }
}
