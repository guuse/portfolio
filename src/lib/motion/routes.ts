/**
 * The lit routes of the scenes that follow one packet (delivery, homelab): an amber copy laid
 * over each route of the journey, shown while the packet is on it, with a dash flowing its way.
 */
import { attr, fadeTowards } from "./dom";

type Path = SVGPathElement;

/** The lit route's dash pattern (art.css: 5 on, 7 off), and how fast it flows, per second. */
const DASH = 12,
  DASH_SPEED = DASH / 0.7;

/** Lays an amber copy over each route, hidden until `lightRoute` shows it. */
export function hotRoutes(routes: readonly Path[]): Path[] {
  return routes.map((route) => {
    const h = route.cloneNode() as Path;
    h.removeAttribute("data-k");
    h.setAttribute("data-rt", "");
    h.setAttribute("class", "k-route-hot");
    h.style.opacity = "0";
    route.after(h);
    return h;
  });
}

/**
 * Fades a lit route in (`on`) or out. The dash flows on the scene's clock `t`, so it stands
 * still whenever the scene does.
 */
export function lightRoute(hot: Path | undefined, on: boolean, dt: number, t: number): void {
  fadeTowards(hot, on ? 0.95 : 0, dt, 9);
  if (on) attr(hot, "stroke-dashoffset", -((t * DASH_SPEED) % DASH));
}
