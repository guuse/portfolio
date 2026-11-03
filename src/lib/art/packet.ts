/**
 * The inside of a packet: a capsule body, a header band and a seam. One description, two
 * renderers: markup for the build-time still frames, and DOM nodes for the browser runtime
 * (Trusted Types forbid building it from a string there).
 */
export const PACKET_PARTS = [
  { tag: "rect", attrs: { x: "-8", y: "-4.5", width: "16", height: "9", rx: "2", class: "pk-b" } },
  { tag: "rect", attrs: { x: "3", y: "-4.5", width: "5", height: "9", rx: "1.5", class: "pk-h" } },
  { tag: "path", attrs: { d: "M-4.5 -1.2H0.5M-4.5 1.4H-1", class: "pk-s" } },
] as const;

/** The same parts as markup. */
export const PACKET_INNER = PACKET_PARTS.map(
  (p) =>
    `<${p.tag}${Object.entries(p.attrs)
      .map(([k, v]) => ` ${k}="${v}"`)
      .join("")}/>`,
).join("");
