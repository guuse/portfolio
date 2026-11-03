/**
 * DOM helpers for the scenes. Only transform and opacity ever change, and each element
 * remembers what it was last given so unchanged frames cost no style writes.
 */
export const SVG_NS = "http://www.w3.org/2000/svg";

export type Parts = Record<string, SVGGraphicsElement | undefined>;

interface Memo {
  t?: string;
  o?: string;
  /** Smoothed opacity (smoothOpacity). */
  v?: number;
}
const memo = new WeakMap<Element, Memo>();
const memoOf = (el: Element): Memo => {
  let m = memo.get(el);
  if (!m) memo.set(el, (m = {}));
  return m;
};

/** Every element with a data-k key in a drawing, by key. */
export function parts(root: Element): Parts {
  const out: Parts = {};
  for (const el of root.querySelectorAll<SVGGraphicsElement>("[data-k]"))
    out[el.getAttribute("data-k")!] = el;
  return out;
}

/** translate, then rotate, then scale (x and y separately; sy defaults to sx). */
export function move(
  el: Element | undefined,
  x = 0,
  y = 0,
  sx?: number | null,
  sy?: number | null,
  r?: number,
): void {
  if (!el) return;
  let s = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px)`;
  if (r) s += ` rotate(${r.toFixed(2)}deg)`;
  if (sx !== undefined && sx !== null) s += ` scale(${sx.toFixed(3)},${(sy ?? sx).toFixed(3)})`;
  const m = memoOf(el);
  if (m.t !== s) {
    (el as SVGElement).style.transform = s;
    m.t = s;
  }
}

export function fade(el: Element | undefined, o: number): void {
  if (!el) return;
  const v = o.toFixed(3);
  const m = memoOf(el);
  if (m.o !== v) {
    (el as SVGElement).style.opacity = v;
    m.o = v;
  }
}

/** Eases an element's opacity towards a target instead of jumping. */
export function fadeTowards(el: Element | undefined, target: number, dt: number, rate = 10): void {
  if (!el) return;
  const m = memoOf(el);
  m.v = m.v === undefined ? target : m.v + (target - m.v) * (1 - Math.exp(-dt * rate));
  fade(el, m.v);
}

/** The still frame's frozen packets go away once real ones move. */
export function hideStill(svg: SVGSVGElement): void {
  for (const el of svg.querySelectorAll<SVGElement>(".pk-still")) el.style.display = "none";
}

/** An invisible path for packets to travel along (e.g. through a device). */
export function hiddenPath(parent: Element, d: string): SVGPathElement {
  const p = document.createElementNS(SVG_NS, "path");
  p.setAttribute("d", d);
  p.setAttribute("fill", "none");
  p.setAttribute("stroke", "none");
  parent.appendChild(p);
  return p;
}

/** The centre of an element's box, in its own user space. */
export function centre(el: SVGGraphicsElement): { x: number; y: number } {
  const b = el.getBBox();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}
