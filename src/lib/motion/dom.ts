/**
 * DOM helpers for the scenes. Only transform and opacity ever change, and each element
 * remembers what it was last given so unchanged frames cost no style writes.
 */
const SVG_NS = "http://www.w3.org/2000/svg";

export type Parts = Record<string, SVGGraphicsElement | undefined>;

interface Memo {
  /** The last transform, as the rounded numbers it was built from (so equal frames build no string). */
  x?: number;
  y?: number;
  sx?: number;
  sy?: number;
  r?: number;
  /** The last opacity, in thousandths. */
  o?: number;
  /** Smoothed opacity (fadeTowards). */
  v?: number;
  /** Attributes set through attr(). */
  a?: Record<string, number>;
}
const memo = new WeakMap<Element, Memo>();
const memoOf = (el: Element): Memo => {
  let m = memo.get(el);
  if (!m) memo.set(el, (m = {}));
  return m;
};
/** "No scale" in the memo, distinct from every real (rounded) scale. */
const NONE = -1e9;

/**
 * Every element with a data-k key in a drawing, by key. Asking for a key the drawing doesn't
 * have throws, so a renamed part breaks the animator when it is built (every scene looks its
 * parts up then), not silently in some later frame.
 */
export function parts(root: Element): Parts {
  const found: Parts = {};
  for (const el of root.querySelectorAll<SVGGraphicsElement>("[data-k]"))
    found[el.getAttribute("data-k")!] = el;
  return new Proxy(found, {
    get(target, key) {
      if (typeof key !== "string" || key in target) return Reflect.get(target, key) as unknown;
      throw new Error(
        `motion: the drawing "${root.getAttribute("class") ?? ""}" has no part data-k="${key}"`,
      );
    },
  });
}

/** A runtime-made element (a packet, a lit route), marked so toStill() can take it away again. */
export function made<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  el.setAttribute("data-rt", "");
  return el;
}

/** Puts a drawing back to its build-time still: what an animator leaves behind when it fails. */
export function toStill(svg: SVGSVGElement): void {
  for (const el of svg.querySelectorAll("[data-rt]")) el.remove();
  for (const el of svg.querySelectorAll("[style]")) el.removeAttribute("style");
}

/**
 * translate, then rotate, then scale (x and y separately; sy defaults to sx). The inputs are
 * compared, rounded to what the string would show, before any string is built: most parts sit
 * still most frames, and those frames cost nothing.
 */
export function move(
  el: Element | undefined,
  x = 0,
  y = 0,
  sx?: number | null,
  sy?: number | null,
  r?: number,
): void {
  if (!el) return;
  const qx = Math.round(x * 100),
    qy = Math.round(y * 100),
    scaled = sx !== undefined && sx !== null,
    qsx = scaled ? Math.round(sx * 1000) : NONE,
    qsy = scaled ? Math.round((sy ?? sx) * 1000) : NONE,
    qr = r ? Math.round(r * 100) : 0;
  const m = memoOf(el);
  if (m.x === qx && m.y === qy && m.sx === qsx && m.sy === qsy && m.r === qr) return;
  m.x = qx;
  m.y = qy;
  m.sx = qsx;
  m.sy = qsy;
  m.r = qr;
  // At rest (no offset, turn or scale), no transform at all: an element with one, even an
  // identity one, is a paint chunk of its own, and every chunk costs each frame the page paints.
  if (!qx && !qy && !qr && (!scaled || (qsx === 1000 && qsy === 1000))) {
    (el as SVGElement).style.transform = "";
    return;
  }
  let s = `translate(${qx / 100}px,${qy / 100}px)`;
  if (qr) s += ` rotate(${qr / 100}deg)`;
  if (scaled) s += ` scale(${qsx / 1000},${qsy / 1000})`;
  (el as SVGElement).style.transform = s;
}

export function fade(el: Element | undefined, o: number): void {
  if (!el) return;
  const q = Math.round(o * 1000);
  const m = memoOf(el);
  if (m.o === q) return;
  m.o = q;
  (el as SVGElement).style.opacity = String(q / 1000);
}

/** Sets a numeric attribute (a circle's cx, say), skipping the write when it hasn't changed. */
export function attr(el: Element | undefined, name: string, v: number): void {
  if (!el) return;
  const q = Math.round(v * 100) / 100;
  const m = memoOf(el);
  const a = (m.a ??= {});
  if (a[name] === q) return;
  a[name] = q;
  el.setAttribute(name, String(q));
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
  const p = made("path");
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
