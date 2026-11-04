import { devices, expect, test, type Page } from "@playwright/test";

/**
 * The homepage hero and About: the action row, the interests, and the prints, which with a
 * mouse on a wide screen stay in view through About (a sticky stage in Hero.astro).
 */

/** Waits until every running animation and transition on the page has finished. */
const settled = (page: Page) =>
  page.evaluate(async () => {
    for (let i = 0; i < 100; i++) {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const running = document.getAnimations().filter((a) => a.playState === "running");
      if (!running.length) return;
      await Promise.race([
        Promise.all(running.map((a) => a.finished.catch(() => undefined))),
        new Promise((r) => setTimeout(r, 250)),
      ]);
    }
  });

const box = async (page: Page, selector: string) => (await page.locator(selector).boundingBox())!;

/* Phone profiles, minus the browser they'd pick: the suite runs in Chromium. */
const device = (name: string) =>
  Object.fromEntries(Object.entries(devices[name]!).filter(([key]) => key !== "defaultBrowserType")) as Omit<
    (typeof devices)[string],
    "defaultBrowserType"
  >;

test.describe("the hero's actions", () => {
  for (const width of [1024, 1100, 1280, 1440, 1920, 390, 320]) {
    test(`at ${width}px: one height, one centre line per row, and groups that wrap whole`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const groups = await page
        .locator(".actions > *")
        .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON() as DOMRect));
      expect(groups).toHaveLength(3);
      for (const g of groups) {
        expect(g.height).toBe(44);
        expect(g.right).toBeLessThanOrEqual(width);
      }
      // the two profiles are one group: never one of them alone on a line
      const [linkedin, github] = await page
        .locator(".actions__more a")
        .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top));
      expect(linkedin).toBe(github);
      // from 1100px it's all one line
      if (width >= 1100) expect(new Set(groups.map((g) => g.top + g.height / 2)).size).toBe(1);
    });
  }

  test("the copy button keeps its square and says it copied in a tag above it", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const button = page.locator('[data-copy-target="mail-top"]');
    await expect(button).toHaveAccessibleName("Copy email");
    const before = (await button.boundingBox())!;
    expect(before.width).toBe(44);
    await button.click();
    await expect(button).toHaveAccessibleName("Copied");
    await expect(button.locator(".copy__labels")).toHaveCSS("opacity", "1");
    expect((await button.boundingBox())!.width).toBe(before.width);
  });
});

test.describe("with a mouse on a wide screen", () => {
  for (const [width, height] of [
    [1100, 760],
    [1280, 800],
    [1440, 900],
    [1920, 1080],
  ] as const) {
    test(`at ${width}×${height}: the prints stay in view through About and leave with it`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/");
      await expect(page.locator(".print--portrait")).toHaveClass(/is-settled/, { timeout: 4000 });
      const start = await box(page, ".stage__prints");
      // on the first screen they're in the hero's right column, centred on the hero
      const stage = await box(page, ".stage");
      expect(Math.abs(start.y + start.height / 2 - (64 + (stage.height - 64) / 2))).toBeLessThan(1.5);

      // About at the top of the window: the prints are still all there
      await page
        .locator("#about")
        .evaluate((el) => scrollTo(0, el.getBoundingClientRect().top + scrollY - 64));
      await settled(page);
      const during = await box(page, ".stage__prints");
      expect(during.y).toBeGreaterThanOrEqual(64);
      expect(during.y + during.height).toBeLessThanOrEqual(height);
      expect(Math.abs(during.x - start.x)).toBeLessThan(1);

      // Projects under the header: they've gone, with About's end (to the subpixel)
      await page
        .locator("#projects")
        .evaluate((el) => scrollTo(0, el.getBoundingClientRect().top + scrollY - 64));
      await settled(page);
      const after = await box(page, ".stage__prints");
      expect(after.y + after.height).toBeLessThanOrEqual(65);
    });
  }

  test("each interest brings its print forward, and Bouldering brings in the bouldering print", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.locator(".print--portrait")).toHaveClass(/is-settled/, { timeout: 4000 });
    await page.locator("#about").evaluate((el) => scrollTo(0, el.getBoundingClientRect().top + scrollY - 64));
    await settled(page);
    const boulder = page.locator(".print--b");
    await expect(boulder).toHaveCSS("opacity", "0");
    for (const [name, print] of [
      ["Bouldering", ".print--b"],
      ["Travelling", ".print--a"],
      ["Card and board games", ".print--portrait"],
      ["Tinkering", ".print--portrait"],
    ] as const) {
      await page.locator(".like", { hasText: name }).hover();
      await expect(page.locator(print)).toHaveClass(/is-lifted/);
      await expect(page.locator(".print.is-lifted")).toHaveCount(1);
      await settled(page);
      if (print === ".print--b") {
        await expect(boulder).toHaveCSS("opacity", "1");
        await expect(boulder).toHaveCSS("z-index", "5");
        // the lazy image has loaded, now that the stage shows it
        expect(
          await boulder
            .locator("img")
            .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
        ).toBe(true);
      }
    }
    await page.mouse.move(5, 5);
    await expect(page.locator(".print.is-lifted")).toHaveCount(0);
    await settled(page);
    await expect(boulder).toHaveCSS("opacity", "0");
  });

  test("the interests line up: names on one line, descriptions starting together", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await page.locator("#about").evaluate((el) => scrollTo(0, el.getBoundingClientRect().top + scrollY - 64));
    await settled(page);
    // layout positions (offsetTop), so the interests' staggered reveal doesn't count
    const tops = (sel: string) =>
      page.locator(sel).evaluateAll((els) =>
        els.map((el) => {
          let y = 0;
          for (let e: HTMLElement | null = el as HTMLElement; e; e = e.offsetParent as HTMLElement | null)
            y += e.offsetTop;
          return y;
        }),
      );
    const names = await tops(".like__name");
    const lines = await tops(".like__line");
    expect(names[0]).toBe(names[1]);
    expect(names[2]).toBe(names[3]);
    expect(lines[0]).toBe(lines[1]);
    expect(lines[2]).toBe(lines[3]);
    // the list shares the paragraphs' left edge
    const prose = await box(page, ".about__prose");
    const list = await box(page, ".likes");
    expect(list.x).toBe(prose.x);
  });
});

test.describe("on a touch screen", () => {
  test.use(device("Pixel 7"));

  test("no sticky stage: the prints sit in the hero and the interests are plain text", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".stage__rail")).toHaveCSS("display", "contents");
    await expect(page.locator(".stage__prints")).toHaveCSS("position", "relative");
    await expect(page.locator(".print--b")).toBeHidden();
    const prints = await box(page, ".stage__prints");
    const title = await box(page, ".stage__title");
    expect(prints.y + prints.height).toBeLessThan(title.y);
    for (const like of await page.locator(".like").all()) await expect(like).toBeVisible();
  });
});
