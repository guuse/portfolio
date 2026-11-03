import { expect, test } from "@playwright/test";

test.describe("copy email", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("copies the address and says so", async ({ page }) => {
    await page.goto("/");
    const button = page.locator('[data-copy-target="mail-address"]');
    await expect(button).toHaveAccessibleName("Copy address");
    await button.click();
    await expect(button).toContainText("Copied");
    await expect(page.locator("#mail-address-status")).toHaveText("Copied");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("ekkelenkampguus@gmail.com");
    await expect(button).toContainText("Copy address", { timeout: 4000 });
  });
});

test.describe("lightbox", () => {
  test("opens on a screenshot, steps through the set, and returns focus", async ({ page }) => {
    await page.goto("/projects/mtg-suite/");
    const thumb = page.getByRole("button", {
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
    const thumb = page.getByRole("button", { name: /^Enlarge: Home after signing in/ });
    await thumb.click();
    await page.getByRole("button", { name: "Close viewer" }).click();
    await expect(page.locator("dialog.lightbox")).toBeHidden();
    await thumb.click();
    await page.mouse.click(10, 10);
    await expect(page.locator("dialog.lightbox")).toBeHidden();
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
