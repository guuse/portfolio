/**
 * Tiny SVG string builders. Everything in src/lib/art runs at build time (in Astro
 * frontmatter) and returns markup, so pages show the drawings without JavaScript.
 * Numbers are rounded to two decimals to keep the markup small and stable.
 */

export type AttrValue = string | number | false | null | undefined;
export type Attrs = Record<string, AttrValue>;

/** Round to two decimals. */
export const n = (v: number): number => +v.toFixed(2);

function attrs(o: Attrs): string {
  let s = "";
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined || v === null || v === false) continue;
    s += ` ${k}="${typeof v === "number" ? n(v) : v}"`;
  }
  return s;
}

export const esc = (s: string | number): string =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** An element. Without `inner` it self-closes. */
export const tag = (t: string, o: Attrs = {}, inner?: string): string =>
  `<${t}${attrs(o)}${inner === undefined ? "/>" : `>${inner}</${t}>`}`;

export const g = (o: Attrs, inner: string): string => tag("g", o, inner);

export const rect = (
  x: number,
  y: number,
  w: number,
  h: number,
  cls: string,
  rx?: number,
  extra: Attrs = {},
): string => tag("rect", { x, y, width: w, height: h, rx: rx || undefined, class: cls, ...extra });

export const path = (d: string, cls: string, extra: Attrs = {}): string =>
  tag("path", { d, class: cls, ...extra });

export const circle = (cx: number, cy: number, r: number, cls?: string, extra: Attrs = {}): string =>
  tag("circle", { cx, cy, r, class: cls, ...extra });

export const text = (
  x: number,
  y: number,
  s: string,
  cls = "lb",
  anchor?: "start" | "middle" | "end",
  extra: Attrs = {},
): string => tag("text", { x, y, class: cls, "text-anchor": anchor, ...extra }, esc(s));

export interface SvgOptions {
  /** Extra classes on the root. */
  cls?: string;
  /** Decorative drawings are hidden from assistive tech; others are `role="img"` with a label. */
  decorative?: boolean;
}

/** The root element every scene, card and cover is wrapped in. */
export function svg(id: string, viewBox: string, label: string, body: string, o: SvgOptions = {}): string {
  const a11y = o.decorative
    ? ' aria-hidden="true" focusable="false"'
    : ` role="img" aria-label="${esc(label)}"`;
  return `<svg class="scene-svg scene--${id}${o.cls ? ` ${o.cls}` : ""}" viewBox="${viewBox}"${a11y} data-art="${id}">${body}</svg>`;
}
