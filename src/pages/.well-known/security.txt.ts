import type { APIRoute } from "astro";
import { site } from "~/lib/site";

/**
 * RFC 9116. It expires 11 months after each build: under the RFC's "less than a year", and
 * a deploy every few months keeps it valid. (The day is capped at the 28th, so adding
 * months never spills into the month after.)
 */
export const GET: APIRoute = () => {
  const now = new Date();
  const expires = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 11, Math.min(now.getUTCDate(), 28), 0, 0, 0),
  );
  const body = `Contact: mailto:${site.email}
Contact: ${site.repo}/security/advisories/new
Expires: ${expires.toISOString().replace(/\.\d{3}Z$/, "Z")}
Preferred-Languages: en, nl
Canonical: ${new URL("/.well-known/security.txt", site.url).href}
Policy: ${site.repo}/blob/main/SECURITY.md
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
