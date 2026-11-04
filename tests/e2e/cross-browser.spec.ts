import { expect, test, type Page } from "@playwright/test";
import { PAGES } from "../pages";

/*
 * The part of the suite that runs in every engine (Chromium, Firefox, WebKit): each page loads
 * clean under the CSP, and the scroll scenes stage and play. The rest of the suite runs in
 * Chromium only, to keep the run short.
 */

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

for (const path of PAGES) {
  test(`${path} loads without errors, CSP and Trusted Types included`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(path, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toBeVisible();
    // nothing wider than the window
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(
      0,
    );
    expect(errors).toEqual([]);
  });
}

const CASES = ["/projects/hosting-platform/", "/projects/homelab/", "/projects/mtg-suite/"] as const;

test.describe("scroll scenes, wide", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const path of CASES) {
    test(`${path}: the figures share one stage and hand over as the steps scroll past`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.goto(path);
      const scenes = page.locator(".scenes").first();
      await expect(scenes).toHaveClass(/is-staged/);
      const steps = scenes.locator(".scene-step");
      const figures = scenes.locator(".scenes__stage > .scene");
      // the stage holds one figure per drawing, in the order the steps first show them
      const ids = await steps.evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset["scene"]!));
      const drawings = [...new Set(ids)];
      await expect(figures).toHaveCount(drawings.length);
      // the first steps of up to two drawings: each puts its drawing on the stage, which then moves
      for (const [d, id] of drawings.slice(0, 2).entries()) {
        const step = steps.nth(ids.indexOf(id));
        await step.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
        await expect(step).toHaveClass(/is-active/);
        await expect(figures.nth(d)).toHaveClass(/is-on/);
        await expect
          .poll(() => figures.nth(d).locator('[style*="transform"], [style*="opacity"]').count())
          .toBeGreaterThan(0);
      }
      await expect(scenes.locator(".scenes__stage > .scene.is-on")).toHaveCount(1);
      expect(errors).toEqual([]);
    });
  }
});

test.describe("scroll scenes, narrow", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("each figure stays with its step and plays as it scrolls through", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/projects/homelab/");
    const scenes = page.locator(".scenes").first();
    await expect(scenes).not.toHaveClass(/is-staged/);
    const figure = scenes.locator(".scene-step > .scene svg").first();
    await figure.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
    await expect
      .poll(() => figure.locator('[style*="transform"], [style*="opacity"]').count())
      .toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });
});
