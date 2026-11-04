/**
 * The two small diagrams on the homelab page: the app-of-apps tree and the three ways in.
 * They use brand marks from the icon sprite (see icons.ts) and animate with CSS only.
 */
import { esc } from "./svg";
import type { IconId } from "./icons";

const use = (id: IconId, x: number, y: number, s: number): string =>
  `<use href="#${id}" x="${x}" y="${y}" width="${s}" height="${s}" class="mono"/>`;
/** A text in a diagram: a label, a smaller note under it, or a strong figure (art.css). */
const label = (
  x: number,
  y: number,
  s: string,
  kind: "label" | "note" | "strong",
  anchor?: "middle",
): string =>
  `<text x="${x}" y="${y}" class="story__${kind}"${anchor ? ` text-anchor="${anchor}"` : ""}>${esc(s)}</text>`;
const wrap = (cls: string, viewBox: string, aria: string, body: string): string =>
  `<svg class="story ${cls}" viewBox="${viewBox}" role="img" aria-label="${esc(aria)}">${body}</svg>`;

/** One root Argo CD application with fifteen children, one of them Argo CD itself. */
export function apps(): string {
  let b = `<rect class="hn-r" x="300" y="10" width="200" height="56" rx="4"/>${use("si-argo", 316, 22, 32)}${label(358, 44, "root application", "label")}`;
  for (let i = 0; i < 15; i++) {
    const c = i % 5,
      r = Math.floor(i / 5),
      x = 40 + c * 148,
      y = 110 + r * 64;
    const wire = r === 0 ? `M400 66 V88 H${x + 60} V${y}` : `M${x + 60} ${y - 20} V${y}`;
    const inner =
      i === 0
        ? use("si-argo", x + 10, y + 10, 24) + label(x + 42, y + 28, "Argo CD", "note")
        : `<rect class="tile__bar" x="${x + 14}" y="${y + 18}" width="${50 + ((i * 23) % 40)}" height="8" rx="2"/>`;
    b += `<g class="tile" data-i="${i}"><path class="ln" d="${wire}"/><rect class="hn-r" x="${x}" y="${y}" width="120" height="44" rx="4"/>${inner}</g>`;
  }
  return wrap(
    "story--apps",
    "0 0 800 300",
    "One root Argo CD application with fifteen child applications beneath it, one of them Argo CD itself.",
    b,
  );
}

/** Three ways in, all ending at Traefik with one wildcard certificate. */
export function ways(): string {
  const row = (y: number, icon: IconId, who: string, via: string, note: string, cls: string): string =>
    `<g class="way ${cls}">${label(16, y + 24, who, "label")}<path class="ln" d="M150 ${y + 18} H290 M520 ${y + 18} H560"/>${use(icon, 300, y, 36)}${label(346, y + 16, via, "label")}${label(346, y + 36, note, "note")}</g>`;
  let b = "";
  b += row(20, "si-tailscale", "My devices", "Tailscale", "the default", "w1");
  b += row(110, "si-cloudflare", "A visitor", "Cloudflare Tunnel", "+ Access, opt-in", "w2");
  b += row(200, "si-tailscale", "A party guest", "Tailscale Funnel", "opt-in, for one evening", "w3");
  b +=
    `<rect class="hn-r" x="560" y="16" width="200" height="226" rx="4"/>${use("si-traefikproxy", 580, 36, 36)}${label(626, 52, "Traefik", "label")}${label(626, 72, "one wildcard cert", "note")}` +
    `${use("si-letsencrypt", 580, 106, 30)}${label(620, 126, "Let’s Encrypt", "note")}${label(580, 190, "0 open ports", "strong")}`;
  return wrap(
    "story--ways",
    "0 0 780 260",
    "Three ways in: my devices over Tailscale by default; a visitor through a Cloudflare Tunnel with Access, opt-in (this site is the exception, with no Access); a party guest through Tailscale Funnel, opt-in. All end at Traefik with one wildcard Let’s Encrypt certificate. No open ports.",
    b,
  );
}
