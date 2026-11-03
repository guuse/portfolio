import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { PAGES } from "../pages";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

for (const width of [390, 1440]) {
  test.describe(`at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });
    for (const path of [...PAGES, "/404.html"]) {
      test(`${path} has no axe violations`, async ({ page }) => {
        await page.goto(path);
        // reveal everything first, so axe sees the page as a reader does
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 400) {
            scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 30));
          }
          scrollTo(0, 0);
        });
        await page.waitForTimeout(900);
        const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        expect(
          results.violations.map((v) => `${v.id}: ${v.nodes.length} × ${v.nodes[0]?.target.join(" ")}`),
        ).toEqual([]);
      });
    }
  });
}

test("the lightbox is accessible when open", async ({ page }) => {
  await page.goto("/projects/mtg-suite/");
  await page.getByRole("button", { name: /^Enlarge: Home after signing in/ }).click();
  const results = await new AxeBuilder({ page }).include("dialog.lightbox").withTags(TAGS).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});
