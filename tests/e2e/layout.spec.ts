import { expect, test } from "@playwright/test";
import { PAGES, WIDTHS } from "../pages";

for (const width of WIDTHS) {
  test.describe(`at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });
    for (const path of [...PAGES, "/404.html"]) {
      test(`${path} has no horizontal overflow`, async ({ page }) => {
        await page.goto(path);
        // walk down so reveals, the stage and lazy images settle
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 600) {
            scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 20));
          }
        });
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBe(0);
      });
    }
  });
}
