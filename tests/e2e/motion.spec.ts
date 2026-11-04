import { expect, test, type Page } from "@playwright/test";

/** Scrolls the page from top to bottom in steps, the way a reader would. */
async function readThrough(page: Page): Promise<void> {
  await page.evaluate(async () => {
    for (let y = 0; y <= document.documentElement.scrollHeight; y += 300) {
      scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 40));
    }
  });
}

test.describe("reveals", () => {
  for (const path of ["/", "/projects/", "/projects/homelab/"]) {
    test(`${path}: what starts below the fold settles in, and ends visible`, async ({ page }) => {
      await page.goto(path);
      // nothing on screen at load is held back
      expect(
        await page.evaluate(
          () =>
            [...document.querySelectorAll(".reveal")].filter(
              (el) => el.getBoundingClientRect().top < innerHeight,
            ).length,
        ),
      ).toBe(0);
      const below = await page.locator(".reveal").count();
      expect(below).toBeGreaterThan(0);
      await readThrough(page);
      await expect(page.locator(".reveal:not(.is-in)")).toHaveCount(0);
      // and everything that moved in has finished at full opacity, untransformed
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              [...document.querySelectorAll(".reveal, .rows > [data-i]")].filter((el) => {
                const cs = getComputedStyle(el);
                return cs.opacity !== "1" || cs.transform !== "none";
              }).length,
          ),
        )
        .toBe(0);
    });
  }
});

test("print shows every part of the page, each figure with its step", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/projects/homelab/");
  // put the scene mid-way, so the runtime has moved things
  await page.locator(".scene-step").nth(1).scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(600);
  await expect(page.locator(".scenes")).toHaveClass(/is-staged/);
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".scenes")).not.toHaveClass(/is-staged/);
  const report = await page.evaluate(() => {
    const visible = (el: Element): number => {
      let o = 1;
      for (let e: Element | null = el; e; e = e.parentElement) {
        const cs = getComputedStyle(e);
        if (cs.display === "none" || cs.visibility === "hidden") return 0;
        o *= Number(cs.opacity);
      }
      return o;
    };
    const content = [...document.querySelectorAll("main :is(h1, h2, h3, p, li, dt, dd, figure)")].filter(
      (el) => !el.closest("dialog, .visually-hidden"),
    );
    const steps = [...document.querySelectorAll(".scene-step")];
    return {
      hidden: content.filter((el) => visible(el) < 1).length,
      header: getComputedStyle(document.querySelector(".site-header")!).position,
      stepsWithFigure: steps.filter((s) => s.querySelector(":scope > .scene svg")).length,
      steps: steps.length,
      tallSteps: steps.filter((s) => parseFloat(getComputedStyle(s).minHeight) > 0).length,
      moved: document.querySelectorAll('.scene-svg [style*="transform"]').length,
    };
  });
  expect(report).toEqual({
    hidden: 0,
    header: "static",
    stepsWithFigure: report.steps,
    steps: report.steps,
    tallSteps: 0,
    moved: 0,
  });
  expect((await page.pdf({ format: "A4" })).byteLength).toBeGreaterThan(10_000);
  // back on screen, the stage and the motion come back
  await page.emulateMedia({ media: "screen" });
  await expect(page.locator(".scenes")).toHaveClass(/is-staged/);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the Konami toast still shows", async ({ page }) => {
    await page.goto("/");
    for (const key of ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight"])
      await page.keyboard.press(key);
    for (const key of ["ArrowLeft", "ArrowRight", "b", "a"]) await page.keyboard.press(key);
    const toast = page.locator(".toast");
    await page.waitForTimeout(400);
    await expect(toast).toBeVisible();
    expect(await toast.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
  });

  test("there is no view transition", async ({ page }) => {
    await page.goto("/");
    expect(
      await page
        .locator(".cover__art")
        .first()
        .evaluate((el) => getComputedStyle(el).viewTransitionName),
    ).toBe("none");
  });
});

test.describe("scrolling", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("a #fragment load jumps, it doesn't scroll there smoothly", async ({ page }) => {
    await page.goto("/projects/");
    await page.goto("/#experience", { waitUntil: "commit" });
    await page.waitForLoadState("domcontentloaded");
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
    const target = await page.evaluate(
      () => document.getElementById("experience")!.getBoundingClientRect().top + scrollY - 88,
    );
    // one frame later it is already there: no animation in between
    await page.evaluate(() => new Promise(requestAnimationFrame));
    expect(Math.abs((await page.evaluate(() => scrollY)) - target)).toBeLessThan(4);
  });

  test("an in-page link click scrolls smoothly", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Contact" }).click();
    await page.waitForTimeout(120);
    const mid = await page.evaluate(() => scrollY);
    const end = await page.evaluate(
      () => document.getElementById("contact")!.getBoundingClientRect().top + scrollY,
    );
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(end - 200);
    await expect(page).toHaveURL(/#contact$/);
  });

  test("the nav follows the homepage sections", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    const link = (name: string) => nav.getByRole("link", { name, exact: true });
    await expect(link("Home")).toHaveAttribute("aria-current", "page");
    await expect(nav.locator('[aria-current="location"]')).toHaveCount(0);
    const to = (id: string) =>
      page.evaluate((id) => document.getElementById(id)!.scrollIntoView({ behavior: "instant" }), id);
    // Projects links to another page: the underline follows, aria-current doesn't
    await to("projects");
    await expect(link("Projects")).toHaveClass(/is-marked/);
    await expect(link("Projects")).not.toHaveAttribute("aria-current", "location");
    await expect(nav.locator('[aria-current="location"]')).toHaveCount(0);
    for (const [id, name] of [
      ["experience", "Experience"],
      ["contact", "Contact"],
    ] as const) {
      await to(id);
      await expect(link(name)).toHaveAttribute("aria-current", "location");
      await expect(nav.locator('[aria-current="location"]')).toHaveCount(1);
      await expect(link(name)).toHaveClass(/is-marked/);
    }
    // past Experience, in a section with no entry of its own, nothing is marked but the page
    await to("skills");
    await expect(nav.locator('[aria-current="location"]')).toHaveCount(0);
    await expect(link("Home")).toHaveClass(/is-marked/);
    // the underline is one element that moved by transform
    expect(await nav.locator(".nav__mark").evaluate((el) => el.style.transform)).toMatch(/^translate\(/);
  });
});

test("view transitions are declared, and only the project a navigation is about is named", async ({
  page,
}) => {
  await page.goto("/");
  const css = await page.evaluate(() =>
    [...document.styleSheets]
      .flatMap((s) => {
        try {
          return [...s.cssRules].map((r) => r.cssText);
        } catch {
          return [];
        }
      })
      .join("\n"),
  );
  expect(css).toMatch(/@view-transition\s*\{\s*navigation:\s*auto/);
  const names = async () =>
    page.evaluate(() =>
      [...document.querySelectorAll("main *")]
        .map((el) => getComputedStyle(el).viewTransitionName)
        .filter((n) => n !== "none")
        .sort(),
    );
  // during a navigation (page-transitions.ts sets the classes), only that project's drawing
  const during = async (slug: string | null) => {
    await page.evaluate((slug) => {
      document.documentElement.classList.add("vt-only");
      if (slug) document.documentElement.classList.add(`vt-${slug}`);
    }, slug);
    const n = await names();
    await page.evaluate(() =>
      document.documentElement.classList.remove(
        ...[...document.documentElement.classList].filter((c) => c.startsWith("vt-")),
      ),
    );
    return n;
  };
  expect(await during("homelab")).toEqual(["art-homelab"]);
  expect(await during(null)).toEqual([]);
  await page.goto("/projects/");
  expect(await during("mtg-suite")).toEqual(["art-mtg-suite"]);
  // titles never carry a name: they crossfade with the page
  expect((await names()).every((n) => n.startsWith("art-"))).toBe(true);
  await page.goto("/projects/homelab/");
  expect(await names()).toEqual(["art-homelab"]);
});

test("a click on a project card carries only its drawing into the case study", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    addEventListener("pagereveal", (e) => {
      if (!(e as Event & { viewTransition: unknown }).viewTransition) return;
      requestAnimationFrame(() => {
        const groups = document
          .getAnimations()
          .map((a) => (a.effect as KeyframeEffect | null)?.pseudoElement ?? "")
          .filter((p) => p.startsWith("::view-transition-group(art-"));
        sessionStorage.setItem("vt-groups", JSON.stringify([...new Set(groups)]));
      });
    });
  });
  await page.goto("/projects/");
  await page.waitForLoadState("load");
  await page.getByRole("link", { name: "Homelab", exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/homelab\/$/);
  await expect
    .poll(() => page.evaluate(() => sessionStorage.getItem("vt-groups")))
    .toBe(JSON.stringify(["::view-transition-group(art-homelab)"]));
});

test("the hero prints never drop in again after they've settled", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const print = page.locator(".print--portrait");
  await expect(print).toHaveClass(/is-settled/, { timeout: 4000 });
  await print.hover();
  await page.waitForTimeout(300);
  await page.mouse.move(5, 5);
  for (let i = 0; i < 5; i++) {
    expect(await print.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
    await page.waitForTimeout(40);
  }
});
