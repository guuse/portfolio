import type { APIRoute } from "astro";
import { site } from "~/lib/site";

/** RFC 9116. Expires a year after each build, so a fresh deploy keeps it valid. */
export const GET: APIRoute = () => {
  const expires = new Date();
  expires.setUTCFullYear(expires.getUTCFullYear() + 1);
  const body = `Contact: mailto:${site.email}
Contact: ${site.repo}/security/advisories/new
Expires: ${expires.toISOString().replace(/\.\d{3}Z$/, "Z")}
Preferred-Languages: en, nl
Canonical: ${new URL("/.well-known/security.txt", site.url).href}
Policy: ${site.repo}/blob/main/SECURITY.md
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
