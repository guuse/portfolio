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
        // reveal.ts tags what starts below the fold once the page has painted
        await page.waitForFunction(() => document.documentElement.classList.contains("js-reveal"));
        // reveal everything first, so axe sees the page as a reader does
        for (const el of await page.locator(".reveal").all()) {
          await el.evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
          await expect(el).toHaveClass(/\bis-in\b/);
        }
        await page.evaluate(() => scrollTo(0, 0));
        // what isn't rendered (content-visibility, off screen) doesn't animate: finish it
        await page.evaluate(() =>
          Promise.all(
            document.getAnimations().map((a) => {
              const el = (a.effect as KeyframeEffect | null)?.target;
              if (el && !el.checkVisibility({ contentVisibilityAuto: true })) a.finish();
              return a.finished.catch(() => undefined);
            }),
          ),
        );
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
  await page.getByRole("link", { name: /^Enlarge: Home after signing in/ }).click();
  const results = await new AxeBuilder({ page }).include("dialog.lightbox").withTags(TAGS).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});
