import type { APIRoute } from "astro";
import { site } from "~/lib/site";

/** humanstxt.org: who made the site and with what. */
const body = `/* TEAM */
  Design, code, words, photos: ${site.name}
  Site: ${site.url}
  GitHub: ${site.github}
  From: ${site.city}, the Netherlands

/* THANKS */
  The friends who test the MTG tools and file the bug reports.

/* SITE */
  Last update: ${new Date().toISOString().slice(0, 10)}
  Language: English
  Standards: HTML, CSS, SVG
  Components: Astro, Style Dictionary, Fontsource
  Fonts: Instrument Serif, Schibsted Grotesk, Geist Mono
  Icons: AWS Architecture Icons, Simple Icons
  Hosting: nginx on k3s, deployed by Argo CD, behind a Cloudflare Tunnel
  Analytics: none
`;

export const GET: APIRoute = () =>
  new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
