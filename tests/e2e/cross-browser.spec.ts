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
    // the scheduler and the controller report a failed animator as an error; catch a
    // softer report of one too
    if (m.type() === "error" || /threw/i.test(m.text())) errors.push(m.text());
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

const CASES = [
  "/projects/hosting-platform/",
  "/projects/infrastructure-delivery/",
  "/projects/homelab/",
  "/projects/mtg-suite/",
] as const;

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

/**
 * A reader's way down a case study: in small wheel steps, stopping on every step for a moment
 * so each scene plays through its whole range, then on to the bottom.
 */
async function readDown(page: Page): Promise<void> {
  await page.mouse.move(400, 300);
  const steps = await page.locator(".scene-step").count();
  for (let i = 0; i < steps; i++) {
    const step = page.locator(".scene-step").nth(i);
    // wheel until the step's middle has passed the middle of the window
    for (let n = 0; n < 60; n++) {
      const box = await step.boundingBox();
      const vh = page.viewportSize()!.height;
      if (!box || box.y + box.height * 0.75 < vh * 0.5) break;
      await page.mouse.wheel(0, 140);
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(500);
  }
  for (let n = 0; n < 200; n++) {
    const left = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight - scrollY);
    if (left < 2) break;
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(50);
  }
  await page.waitForTimeout(500);
}

test.describe("reading a case study through", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.describe.configure({ timeout: 90_000 });

  for (const path of CASES) {
    test(`${path}: every scene plays as it's scrolled past, and nothing throws`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.goto(path, { waitUntil: "networkidle" });
      await expect(page.locator(".scenes").first()).toHaveClass(/is-staged/);
      await readDown(page);
      // every drawing on a stage has been moved by its animator (a failed one is put back
      // to its still, without inline styles)
      const unmoved = await page.evaluate(() =>
        [...document.querySelectorAll(".scenes__stage > .scene")]
          .filter((f) => !f.querySelector('.scene-svg [style*="transform"], .scene-svg [style*="opacity"]'))
          .map((f) => f.querySelector("svg")?.getAttribute("class")),
      );
      expect(unmoved).toEqual([]);
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
