import { expect, test, type Page } from "@playwright/test";

/**
 * Waits until every running animation and transition on the page has finished. One on an
 * element the browser isn't rendering (content-visibility, off screen) doesn't advance until
 * it is again, so that one is finished on the spot.
 */
const settled = (page: Page) =>
  page.evaluate(async () => {
    // a frame first: an element that just went off screen stops rendering in the next one
    for (let i = 0; i < 100; i++) {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const running = document.getAnimations().filter((a) => a.playState === "running");
      if (!running.length) return;
      for (const a of running) {
        const el = (a.effect as KeyframeEffect | null)?.target;
        if (el && !el.checkVisibility({ contentVisibilityAuto: true })) a.finish();
      }
      await Promise.race([
        Promise.all(running.map((a) => a.finished.catch(() => undefined))),
        new Promise((r) => setTimeout(r, 250)),
      ]);
    }
  });

test.describe("reveals", () => {
  for (const path of ["/", "/projects/", "/projects/homelab/"]) {
    test(`${path}: what starts below the fold settles in, and ends visible`, async ({ page }) => {
      await page.goto(path);
      // reveal.ts tags what starts below the fold; nothing on screen at load is held back
      await page.waitForFunction(() => document.documentElement.classList.contains("js-reveal"));
      expect(
        await page.evaluate(
          () =>
            [...document.querySelectorAll(".reveal")].filter(
              (el) => el.getBoundingClientRect().top < innerHeight,
            ).length,
        ),
      ).toBe(0);
      const reveals = page.locator(".reveal");
      const count = await reveals.count();
      expect(count).toBeGreaterThan(0);
      // bring each one on screen, the way a reader would, and wait for it to come in
      for (let i = 0; i < count; i++) {
        const el = reveals.nth(i);
        await el.evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
        await expect(el).toHaveClass(/\bis-in\b/);
      }
      await settled(page);
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
  await expect(page.locator(".scenes")).toHaveClass(/is-staged/);
  await expect.poll(() => page.locator('.scene-svg [style*="transform"]').count()).toBeGreaterThan(0);
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
      // a continuing step's copy of the drawing (or its empty box) isn't printed again
      copiesPrinted: [...document.querySelectorAll(".scene-step > div.scene")].filter(
        (el) => getComputedStyle(el).display !== "none",
      ).length,
      // Chromium prints break-inside: avoid rows in a grid over what follows: no grids there
      grids: [...document.querySelectorAll(".sec, .sec__body, .hood, .lessons, .deflist")].filter(
        (el) => getComputedStyle(el).display === "grid",
      ).length,
    };
  });
  expect(report).toEqual({
    hidden: 0,
    header: "static",
    stepsWithFigure: report.steps,
    steps: report.steps,
    tallSteps: 0,
    moved: 0,
    copiesPrinted: 0,
    grids: 0,
  });
  expect((await page.pdf({ format: "A4" })).byteLength).toBeGreaterThan(10_000);
  // back on screen, the stage and the motion come back
  await page.emulateMedia({ media: "screen" });
  await expect(page.locator(".scenes")).toHaveClass(/is-staged/);
});

/*
 * WCAG 2.2.2: once the reader stops scrolling, a scroll scene settles within five seconds (no
 * packets, LEDs or wobbles), the frame loop goes to sleep, and the next scroll wakes it.
 */
for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test.describe(`scroll scenes come to rest, ${viewport.width} px`, () => {
    test.use({ viewport });

    for (const [path, at] of [
      ["/projects/hosting-platform/", 0.3],
      ["/projects/homelab/", 0.25],
      ["/projects/mtg-suite/", 0.3],
    ] as const) {
      test(`${path}: still five seconds after the last scroll, moving again on the next`, async ({
        page,
      }) => {
        await page.addInitScript(() => {
          const raf = window.requestAnimationFrame.bind(window);
          const w = window as unknown as { frames: number };
          w.frames = 0;
          window.requestAnimationFrame = (cb) => {
            w.frames++;
            return raf(cb);
          };
        });
        await page.goto(path, { waitUntil: "networkidle" });
        await page.mouse.move(200, 300);
        const end = await page.evaluate((at) => document.documentElement.scrollHeight * at, at);
        while ((await page.evaluate(() => scrollY)) < end) {
          await page.mouse.wheel(0, 120);
          await page.waitForTimeout(40);
        }
        // count what changes in the drawings from five seconds after the last scroll on
        await page.evaluate(() => {
          const w = window as unknown as { svgWrites: number };
          w.svgWrites = 0;
          new MutationObserver((list) => {
            w.svgWrites += list.filter((r) => r.target instanceof SVGElement).length;
          }).observe(document.body, { subtree: true, attributes: true, childList: true });
        });
        const moving = await page.evaluate(
          () =>
            new Promise<number>((done) =>
              setTimeout(() => done((window as unknown as { svgWrites: number }).svgWrites), 500),
            ),
        );
        expect(moving, "the scene moves while the reader scrolls").toBeGreaterThan(0);
        await page.waitForTimeout(4500);
        const still = await page.evaluate(
          () =>
            new Promise<{ writes: number; frames: number; loops: number }>((done) => {
              const w = window as unknown as { svgWrites: number; frames: number };
              w.svgWrites = 0;
              w.frames = 0;
              setTimeout(
                () =>
                  done({
                    writes: w.svgWrites,
                    frames: w.frames,
                    // an endless CSS animation in a drawing would move without any writes
                    loops: document
                      .getAnimations()
                      .filter(
                        (a) =>
                          a.playState === "running" &&
                          a.effect?.getTiming().iterations === Infinity &&
                          (a.effect as KeyframeEffect).target instanceof SVGElement,
                      ).length,
                  }),
                2000,
              );
            }),
        );
        expect(still).toEqual({ writes: 0, frames: 0, loops: 0 });
        await page.mouse.wheel(0, 60);
        await expect
          .poll(() => page.evaluate(() => (window as unknown as { svgWrites: number }).svgWrites))
          .toBeGreaterThan(0);
      });
    }
  });
}

test("resizing across the stage breakpoint keeps the reader on their step", async ({ page }) => {
  const where = () =>
    page.evaluate(() => {
      const line = innerHeight * 0.4;
      const steps = [...document.querySelectorAll(".scene-step")];
      const i = steps.findIndex((s) => {
        const r = s.getBoundingClientRect();
        return r.top <= line && r.bottom > line;
      });
      const r = steps[i]!.getBoundingClientRect();
      return { i, f: Math.round(((line - r.top) / r.height) * 20) / 20 };
    });
  for (const [from, to] of [
    [1200, 800],
    [800, 1200],
  ] as const) {
    await page.setViewportSize({ width: from, height: 900 });
    await page.goto("/projects/homelab/", { waitUntil: "networkidle" });
    // the runtime (loaded when the page is idle) has laid the scenes out, the fonts are in
    await expect(page.locator("html")).toHaveClass(/js-scenes/);
    await page.evaluate(() => document.fonts.ready);
    // 30% into the third step (again, if something above it still moved)
    await expect
      .poll(async () => {
        await page
          .locator(".scene-step")
          .nth(2)
          .evaluate((el) => {
            const r = el.getBoundingClientRect();
            scrollTo({ top: scrollY + r.top - innerHeight * 0.4 + r.height * 0.3, behavior: "instant" });
          });
        await page.waitForTimeout(100);
        return where();
      })
      .toEqual({ i: 2, f: 0.3 });
    await page.setViewportSize({ width: to, height: 900 });
    await expect.poll(where).toEqual({ i: 2, f: 0.3 });
  }
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the Konami toast still shows", async ({ page }) => {
    await page.goto("/");
    for (const key of ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight"])
      await page.keyboard.press(key);
    for (const key of ["ArrowLeft", "ArrowRight", "b", "a"]) await page.keyboard.press(key);
    const toast = page.locator(".toast");
    await expect(toast).toBeVisible();
    await expect.poll(() => toast.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
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
    // the first frames of the scroll: on its way, nowhere near the end yet
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
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
    // the sections after Experience without an entry of their own still belong to it
    for (const id of ["learned", "skills"]) {
      await to(id);
      await expect(link("Experience")).toHaveAttribute("aria-current", "location");
      await expect(link("Experience")).toHaveClass(/is-marked/);
    }
    // and above the first tracked section it's the page's own entry
    await to("about");
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
  expect(await during("homelab")).toEqual(["art-homelab"]);
  // the MTG card is a photo, not the hero's drawing: nothing to morph, it fades with the page
  expect(await during("mtg-suite")).toEqual([]);
  // titles never carry a name: they crossfade with the page
  expect((await names()).every((n) => n.startsWith("art-"))).toBe(true);
  // a case study names its drawing's own <svg> (the morph keeps the drawing's shape) and its
  // copy, which arrives above the drawing; on the page being left (vt-out) the copy goes
  await page.goto("/projects/homelab/");
  expect(await names()).toEqual(["art-homelab", "case-copy"]);
  expect(
    await page.locator(".ph-hero__art svg").evaluate((el) => getComputedStyle(el).viewTransitionName),
  ).toBe("art-homelab");
  await page.evaluate(() => document.documentElement.classList.add("vt-out"));
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
  await settled(page);
  await page.mouse.move(5, 5);
  // the lowest opacity it shows over the next twenty frames
  const lowest = await print.evaluate(
    (el) =>
      new Promise<number>((done) => {
        let min = 1,
          frames = 0;
        const look = (): void => {
          min = Math.min(min, Number(getComputedStyle(el).opacity));
          if (++frames < 20) requestAnimationFrame(look);
          else done(min);
        };
        requestAnimationFrame(look);
      }),
  );
  expect(lowest).toBe(1);
});
