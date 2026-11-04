/**
 * The hero photos are loose prints. With a mouse or pen they can be nudged (up to 60px) and
 * spring back on release; touch keeps scrolling. Hovering an interest in About lifts the
 * matching print (decorative only, so the interests are not tab stops). None of this touches
 * the prints' `animation` (see .is-settled in Hero.astro).
 */
const LIMIT = 60;

export function initPrints(): void {
  for (const el of document.querySelectorAll<HTMLElement>(".print")) {
    // once the drop-in (or an untap that interrupted it) is over, retire the animation for
    // good, so hovering, lifting or dragging can never start it again
    el.addEventListener("animationend", () => el.classList.add("is-settled"), { once: true });
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
    // a mouse or pen only: a tap on an interest shouldn't leave its print hanging in the air
    const on = (e: PointerEvent): void => {
      if (e.pointerType !== "touch") print.classList.add("is-lifted");
    };
    const off = (): void => print.classList.remove("is-lifted");
    item.addEventListener("pointerenter", on);
    item.addEventListener("pointerleave", off);
  }
}
