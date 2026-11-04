import { expect, test } from "@playwright/test";

test.describe("copy email", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("copies the address and says so", async ({ page }) => {
    await page.goto("/");
    const button = page.locator('[data-copy-target="mail-address"]');
    await expect(button).toHaveAccessibleName("Copy address");
    const width = (await button.boundingBox())!.width;
    await button.click();
    await expect(button).toHaveAccessibleName("Copied");
    await expect(button).toHaveAttribute("data-state", "done");
    await expect(page.locator("#mail-address-status")).toHaveText("Copied to the clipboard.");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("ekkelenkampguus@gmail.com");
    // the button keeps its width whatever it says
    expect((await button.boundingBox())!.width).toBe(width);
    await expect(button).toHaveAccessibleName("Copy address", { timeout: 4000 });
  });

  test("without a clipboard it selects the address and says how to copy it", async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", { value: undefined }));
    await page.goto("/");
    const button = page.locator('[data-copy-target="mail-top"]');
    const width = (await button.boundingBox())!.width;
    await button.click();
    await expect(button).toHaveAccessibleName("Selected");
    await expect(page.locator("#mail-top-status")).toHaveText(/^Selected\. Press Ctrl\+C/);
    expect(await page.evaluate(() => getSelection()?.toString())).toBe("ekkelenkampguus@gmail.com");
    expect((await button.boundingBox())!.width).toBe(width);
  });
});

test.describe("lightbox", () => {
  test("opens on a screenshot, steps through the set, and returns focus", async ({ page }) => {
    await page.goto("/projects/mtg-suite/");
    const thumb = page.getByRole("link", {
      name: "Enlarge: Combat: four attackers, each with an arrow to its target.",
    });
    await thumb.scrollIntoViewIfNeeded();
    await thumb.click();
    const dialog = page.getByRole("dialog", { name: "Screenshot viewer" });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("button", { name: "Close viewer" })).toBeFocused();
    await expect(dialog.locator(".lightbox__count")).toHaveText("2 of 5");
    await page.keyboard.press("ArrowRight");
    await expect(dialog.locator(".lightbox__count")).toHaveText("3 of 5");
    await expect(dialog.locator(".lightbox__cap")).toHaveText("The library: every deck at a glance.");
    // focus stays inside the modal
    for (let i = 0; i < 4; i++) await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest("dialog"))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(thumb).toBeFocused();
  });

  test("closes from its button and from the backdrop", async ({ page }) => {
    await page.goto("/projects/mtg-suite/");
    const thumb = page.getByRole("link", { name: /^Enlarge: Home after signing in/ });
    await thumb.click();
    await page.getByRole("button", { name: "Close viewer" }).click();
    await expect(page.locator("dialog.lightbox")).toBeHidden();
    await thumb.click();
    await page.mouse.click(10, 10);
    await expect(page.locator("dialog.lightbox")).toBeHidden();
  });
});

test.describe("lightbox, the edges", () => {
  test("a full image that fails to load leaves the thumbnail, not a broken image", async ({ page }) => {
    await page.goto("/projects/mtg-suite/");
    const thumb = page.getByRole("link", { name: /^Enlarge: Home after signing in/ });
    const full = await thumb.getAttribute("href");
    await page.route(`**${full!}`, (route) => route.abort());
    await thumb.scrollIntoViewIfNeeded();
    await expect
      .poll(() => thumb.locator("img").evaluate((el: HTMLImageElement) => el.naturalWidth))
      .toBeGreaterThan(0);
    await thumb.click();
    const img = page.locator("dialog.lightbox .lightbox__img");
    // the failed load is handled (the spinner stops) and the thumbnail is still showing
    await expect
      .poll(() =>
        img.evaluate(
          (el: HTMLImageElement) =>
            !el.parentElement!.classList.contains("is-loading") && el.complete && el.naturalWidth > 0,
        ),
      )
      .toBe(true);
    expect(await img.getAttribute("src")).not.toContain(full!);
  });

  test("the markup has no image without a source", async ({ page }) => {
    await page.goto("/projects/mtg-suite/");
    expect(await page.locator("img:not([src]):not([srcset])").count()).toBe(0);
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("a screenshot is a link to its full image, and no copy button does nothing", async ({ page }) => {
    await page.goto("/projects/mtg-suite/");
    const thumb = page.getByRole("link", { name: /^Enlarge: Home after signing in/ });
    expect(await thumb.getAttribute("href")).toMatch(/^\/_astro\/.+\.webp$/);
    await page.goto("/");
    await expect(page.locator(".copy")).toHaveCount(2);
    for (const btn of await page.locator(".copy").all()) await expect(btn).toBeHidden();
  });
});

test.describe("keyboard", () => {
  test("the skip link is first and jumps to the content", async ({ page }) => {
    await page.goto("/projects/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
  });

  test("the main nav is reachable and marks the current page", async ({ page }) => {
    await page.goto("/projects/homelab/");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Guus Ekkelenkamp", exact: true })).toBeFocused();
    await expect(
      page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Projects" }),
    ).toHaveAttribute("aria-current", "page");
  });

  test("? opens the shortcut sheet and g p goes to projects", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("?");
    await expect(page.getByRole("dialog", { name: "Shortcuts" })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.keyboard.press("g");
    await page.keyboard.press("p");
    await expect(page).toHaveURL(/\/projects\/$/);
  });

  test("the Konami code untaps everything", async ({ page }) => {
    await page.goto("/");
    for (const key of [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
      "b",
      "a",
    ])
      await page.keyboard.press(key);
    await expect(page.getByRole("status").filter({ hasText: "Untap, upkeep, draw." })).toBeVisible();
  });
});

test.describe("motion", () => {
  test("scenes share a sticky stage on wide screens", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/projects/hosting-platform/");
    await expect(page.locator(".scenes")).toHaveClass(/is-staged/);
    await page.locator(".scene-step").nth(2).scrollIntoViewIfNeeded();
    await expect(page.locator(".scenes__stage > .scene.is-on")).toHaveCount(1);
  });

  test("on phones each figure stays with its step", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/projects/homelab/");
    await expect(page.locator(".scenes")).not.toHaveClass(/is-staged/);
    // the steps that continue the drawing get a decorative copy of it
    await expect(page.locator('.scene-step div.scene svg[aria-hidden="true"]')).toHaveCount(3);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("shows every drawing in its final frame and animates nothing", async ({ page }) => {
    await page.goto("/projects/hosting-platform/");
    const root = page.locator("html");
    await expect(root).not.toHaveClass(/js-(scenes|reveal|motion)/);
    await expect(page.locator(".scenes")).not.toHaveClass(/is-staged/);
    // the frozen packets of the still frame are still there
    await expect(page.locator(".pk-still").first()).toBeVisible();
    // no element was given an inline transform by the runtime
    expect(await page.locator('svg.scene-svg [style*="transform"]').count()).toBe(0);
    await page.goto("/");
    expect(
      await page
        .locator(".print")
        .first()
        .evaluate((el) => getComputedStyle(el).animationName),
    ).toBe("none");
  });
});
