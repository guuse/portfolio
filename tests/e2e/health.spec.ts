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
    await page.waitForTimeout(300);
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
    expect((await request.get(new URL(og!).pathname)).status()).toBe(200);
    expect(await page.locator('meta[http-equiv="content-security-policy"]').count()).toBe(1);
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

test("security.txt has not expired", async ({ request }) => {
  const body = await (await request.get("/.well-known/security.txt")).text();
  const expires = new Date(/^Expires: (.+)$/m.exec(body)![1]!);
  expect(expires.getTime()).toBeGreaterThan(Date.now());
});
