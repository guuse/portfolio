import { expect, test } from "@playwright/test";
import { PAGES } from "../pages";

for (const path of PAGES) {
  test(`${path} loads without console errors (CSP included)`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(path, { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 30));
      }
    });
    // whatever the scroll started (images, the motion runtime) has arrived and run
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => new Promise(requestAnimationFrame));
    expect(errors).toEqual([]);
  });

  test(`${path} has a title, description, canonical and social card`, async ({ page, request }) => {
    await page.goto(path);
    await expect(page).toHaveTitle(/Guus Ekkelenkamp/);
    expect(await page.locator('meta[name="description"]').getAttribute("content")).toBeTruthy();
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toBe(
      `https://ekkelenkamp.dev${path}`,
    );
    const og = await page.locator('meta[property="og:image"]').getAttribute("content");
    const card = await request.get(new URL(og!).pathname);
    expect(card.status()).toBe(200);
    // some platforms drop a social card over 300 KB
    expect((await card.body()).byteLength).toBeLessThanOrEqual(300 * 1024);
    const alt = await page.locator('meta[property="og:image:alt"]').getAttribute("content");
    expect(alt?.length).toBeGreaterThan(20);
    expect(await page.locator('meta[name="twitter:image:alt"]').getAttribute("content")).toBe(alt);
    const graph = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!) as {
      "@graph": {
        "@type": string;
        itemListElement?: { item: string }[];
        datePublished?: string;
        dateModified?: string;
      }[];
    };
    const types = graph["@graph"].map((n) => n["@type"]);
    expect(types).toEqual(expect.arrayContaining(["Person", "WebSite"]));
    if (path.startsWith("/projects/")) {
      const trail = graph["@graph"].find((n) => n["@type"] === "BreadcrumbList")!.itemListElement!;
      expect(trail.at(-1)!.item).toBe(`https://ekkelenkamp.dev${path}`);
    }
    expect(types.includes("Article")).toBe(path.startsWith("/projects/") && path !== "/projects/");
    const article = graph["@graph"].find((n) => n["@type"] === "Article");
    if (article) {
      expect(article.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(article.dateModified! >= article.datePublished!).toBe(true);
    }
    expect(await page.locator('meta[http-equiv="content-security-policy"]').count()).toBe(1);
  });

  test(`${path}: nothing before the CSP meta runs, or comes from elsewhere`, async ({ request }) => {
    const html = await (await request.get(path)).text();
    const before = html.slice(0, html.indexOf('http-equiv="content-security-policy"'));
    expect(before.length).toBeGreaterThan(0);
    // the only script ahead of the policy is JSON-LD, which is data
    for (const m of before.matchAll(/<script\b[^>]*>/g)) expect(m[0]).toContain('type="application/ld+json"');
    expect(before).not.toMatch(/\son[a-z]+=/);
    // what it loads is same-origin, which the policy allows anyway (canonical is not a load)
    for (const [tag] of before.matchAll(/<(?:link|img|source|script)\b[^>]*>/g)) {
      if (tag.includes('rel="canonical"')) continue;
      for (const [, url] of tag.matchAll(/\s(?:src|href)="([^"]+)"/g)) expect(url, tag).toMatch(/^\/(?!\/)/);
    }
  });
}

test("every internal link and asset resolves", async ({ page, request }) => {
  const seen = new Set<string>();
  const queue: string[] = ["/"];
  while (queue.length) {
    const path = queue.shift()!;
    if (seen.has(path)) continue;
    seen.add(path);
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(200);
    const refs = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLAnchorElement | HTMLLinkElement>("a[href], link[href]")].map(
        (a) => a.href,
      ),
    );
    for (const ref of refs) {
      const url = new URL(ref);
      if (url.origin !== new URL(page.url()).origin) continue;
      // in-page anchors must point at an element
      if (url.hash && url.pathname === new URL(page.url()).pathname) {
        expect(await page.locator(`[id="${decodeURIComponent(url.hash.slice(1))}"]`).count(), ref).toBe(1);
      }
      if (url.pathname.endsWith("/")) queue.push(url.pathname);
      else expect((await request.get(url.pathname)).status(), url.pathname).toBe(200);
    }
  }
  for (const p of [
    "/robots.txt",
    "/humans.txt",
    "/.well-known/security.txt",
    "/sitemap-index.xml",
    "/site.webmanifest",
  ]) {
    expect((await request.get(p)).status(), p).toBe(200);
  }
  expect(seen.size).toBeGreaterThanOrEqual(5);
});

test("the sitemap lists every page, and not the 404", async ({ request }) => {
  const xml = await (await request.get("/sitemap-0.xml")).text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname).sort();
  expect(urls).toEqual([...PAGES].sort());
});

test("security.txt expires in about 11 months: valid, and under RFC 9116's year", async ({ request }) => {
  const body = await (await request.get("/.well-known/security.txt")).text();
  const days = (new Date(/^Expires: (.+)$/m.exec(body)![1]!).getTime() - Date.now()) / 86_400_000;
  expect(days).toBeGreaterThan(300);
  expect(days).toBeLessThan(365);
});

test("the web manifest is JSON in the theme's colours", async ({ request }) => {
  const res = await request.get("/site.webmanifest");
  expect(res.headers()["content-type"]).toContain("application/manifest+json");
  const manifest = (await res.json()) as { theme_color: string; background_color: string };
  expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/);
  expect(manifest.background_color).toBe(manifest.theme_color);
});
