import type { APIRoute } from "astro";
import { site } from "~/lib/site";

const body = `# Hello, robot. Everything here is public; please read it all.
# (Humans: the credits are at /humans.txt, the source at ${site.repo}.)
User-agent: *
Allow: /

Sitemap: ${new URL("/sitemap-index.xml", site.url).href}
`;

export const GET: APIRoute = () =>
  new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
