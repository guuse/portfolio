import { devices, expect, test, type Page } from "@playwright/test";

/** Waits until every running animation and transition on the page has finished. */
const settled = (page: Page) =>
  page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))));

/* Phone and tablet profiles, minus the browser they'd pick: the suite runs in Chromium. */
const device = (name: string) =>
  Object.fromEntries(Object.entries(devices[name]!).filter(([key]) => key !== "defaultBrowserType")) as Omit<
    (typeof devices)[string],
    "defaultBrowserType"
  >;

/** Every CSS rule on the page, with the conditions (media queries) it sits in. */
async function rules(page: Page): Promise<{ selector: string; media: string[] }[]> {
  return page.evaluate(() => {
    const out: { selector: string; media: string[] }[] = [];
    const walk = (list: CSSRuleList, media: string[]): void => {
      for (const r of list) {
        if (r instanceof CSSStyleRule) out.push({ selector: r.selectorText, media });
        if (r instanceof CSSMediaRule) walk(r.cssRules, [...media, r.conditionText]);
        else if ("cssRules" in r) walk((r as CSSGroupingRule).cssRules, media);
      }
    };
    for (const s of document.styleSheets) {
      try {
        walk(s.cssRules, []);
      } catch {
        /* cross-origin: none on this site */
      }
    }
    return out;
  });
}

test.describe("hover", () => {
  for (const path of ["/", "/projects/", "/projects/mtg-suite/", "/design-system/"]) {
    test(`${path}: every hover effect is for devices that can hover`, async ({ page }) => {
      await page.goto(path);
      const loose = (await rules(page)).filter(
        ({ selector, media }) =>
          // :hover inside :not(...) only excludes; the reduced-motion rules only switch motion off
          selector.replace(/:not\([^)]*\)/g, "").includes(":hover") &&
          !media.some((m) => /hover:\s*hover/.test(m) || m.includes("prefers-reduced-motion")),
      );
      expect(loose.map((r) => r.selector)).toEqual([]);
    });
  }

  test.describe("on a touch screen", () => {
    test.use(device("Pixel 7"));

    test("a tapped print doesn't stay lifted", async ({ page }) => {
      await page.goto("/");
      const print = page.locator(".print--portrait");
      await expect(print).toHaveClass(/is-settled/, { timeout: 4000 });
      const before = await print.evaluate((el) => getComputedStyle(el).transform);
      await print.tap();
      await settled(page);
      expect(await print.evaluate((el) => getComputedStyle(el).transform)).toBe(before);
    });
  });
});

test.describe("lightbox on a phone", () => {
  test.describe("upright", () => {
    test.use(device("iPhone 13"));

    test("the screenshot uses the full width, larger than its thumbnail", async ({ page }) => {
      await page.goto("/projects/mtg-suite/");
      const thumb = page.getByRole("link", { name: /^Enlarge: Home after signing in/ });
      await thumb.scrollIntoViewIfNeeded();
      const small = (await thumb.boundingBox())!;
      await thumb.tap();
      const img = page.locator(".lightbox__img");
      // the full image replaces the thumbnail once it has decoded
      await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(2000);
      await settled(page);
      const big = (await img.boundingBox())!;
      const vw = page.viewportSize()!.width;
      expect(big.width).toBeGreaterThan(small.width);
      expect(big.width).toBeGreaterThanOrEqual(vw - 1);
      // pinch-zoom is the browser's own
      expect(await page.locator(".lightbox__stage").evaluate((el) => getComputedStyle(el).touchAction)).toBe(
        "pan-y pinch-zoom",
      );
    });
  });

  test.describe("sideways", () => {
    test.use(device("iPhone 13 landscape"));

    test("the screenshot gets nearly all the height, with the bar over it", async ({ page }) => {
      await page.goto("/projects/mtg-suite/");
      const thumb = page.getByRole("link", { name: /^Enlarge: Home after signing in/ });
      await thumb.scrollIntoViewIfNeeded();
      await thumb.tap();
      await expect(page.locator("dialog.lightbox")).toBeVisible();
      await settled(page);
      const img = (await page.locator(".lightbox__img").boundingBox())!;
      const bar = (await page.locator(".lightbox__bar").boundingBox())!;
      const vh = page.viewportSize()!.height;
      expect(img.height).toBeGreaterThanOrEqual(vh - 25);
      expect(bar.y).toBeLessThan(img.y + img.height);
    });
  });
});

test.describe("at 320px", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test("the email address never breaks inside a word", async ({ page }) => {
    await page.goto("/");
    for (const id of ["mail-address", "mail-top"]) {
      const lines = await page.locator(`#${id}`).evaluate((el) => {
        // one rect per line box of its text
        const range = document.createRange();
        range.selectNodeContents(el);
        const tops = new Set([...range.getClientRects()].map((r) => Math.round(r.top)));
        return tops.size;
      });
      expect(lines, id).toBe(1);
    }
  });
});

test("the shortcut sheet opens in the middle of the window", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.keyboard.press("?");
  const box = (await page.getByRole("dialog", { name: "Shortcuts" }).boundingBox())!;
  expect(Math.abs(box.x + box.width / 2 - 640)).toBeLessThan(2);
  expect(Math.abs(box.y + box.height / 2 - 400)).toBeLessThan(2);
});

test("the shortcuts can be turned off, and it sticks", async ({ page }) => {
  await page.goto("/");
  const sheet = page.getByRole("dialog", { name: "Shortcuts" });
  await page.keyboard.press("?");
  await sheet.getByRole("button", { name: "Turn shortcuts off" }).click();
  await expect(sheet.getByRole("button", { name: "Turn shortcuts on" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.reload();
  // a single character key does nothing now
  await page.keyboard.press("?");
  await expect(sheet).toBeHidden();
  await page.keyboard.press("g");
  await page.keyboard.press("p");
  // a negative check: give a navigation the time it would take to start, then look
  await page.waitForTimeout(300);
  await expect(page).toHaveURL(/\/$/);
  // Alt + ? still opens the sheet, to turn them back on
  await page.keyboard.press("Alt+Shift+Slash");
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("button", { name: "Turn shortcuts on" })).toBeVisible();
  await sheet.getByRole("button", { name: "Turn shortcuts on" }).click();
  await page.keyboard.press("Escape");
  await page.reload();
  await page.keyboard.press("?");
  await expect(sheet).toBeVisible();
});

test.describe("live drawings", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  /** Changes made to the drawings in the next `ms` milliseconds. */
  const changes = (page: Page, ms: number) =>
    page.evaluate(
      (ms) =>
        new Promise<number>((done) => {
          let n = 0;
          const mo = new MutationObserver((r) => (n += r.length));
          for (const el of document.querySelectorAll("[data-card]"))
            mo.observe(el, { subtree: true, attributes: true, childList: true });
          setTimeout(() => {
            mo.disconnect();
            done(n);
          }, ms);
        }),
      ms,
    );

  test("play one pass and come to rest within about five seconds; hover replays them", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => document.getElementById("projects")!.scrollIntoView({ behavior: "instant" }));
    expect(await changes(page, 1500)).toBeGreaterThan(0);
    // the runtime starts once the page is idle, then plays about five seconds and rests
    const start = Date.now();
    await expect.poll(() => changes(page, 1000), { timeout: 10_000, intervals: [0] }).toBe(0);
    expect(Date.now() - start).toBeLessThan(8000);
    await page.locator(".cover__link").first().hover();
    expect(await changes(page, 800)).toBeGreaterThan(0);
  });

  test("the case-study hero rests too", async ({ page }) => {
    await page.goto("/projects/mtg-suite/");
    const start = Date.now();
    // it moves first (the runtime starts once the page is idle), then rests
    await expect.poll(() => changes(page, 500), { timeout: 6000, intervals: [0] }).toBeGreaterThan(0);
    await expect.poll(() => changes(page, 1000), { timeout: 10_000, intervals: [0] }).toBe(0);
    expect(Date.now() - start).toBeLessThan(9000);
  });

  test("the 404 pod gives up after two tries", async ({ page }) => {
    await page.goto("/404.html");
    const anim = await page
      .locator(".evicted")
      .first()
      .evaluate((el) => getComputedStyle(el).animationIterationCount);
    expect(anim).toBe("2");
  });
});

test("email addresses are mailto: links", async ({ page }) => {
  await page.goto("/");
  for (const where of ["#mail-top", "#mail-address", ".site-footer a[href^='mailto:']"]) {
    await expect(page.locator(where)).toHaveAttribute("href", "mailto:ekkelenkampguus@gmail.com");
  }
});

test("external links say they open a new tab", async ({ page }) => {
  for (const path of ["/", "/projects/", "/projects/mtg-suite/"]) {
    await page.goto(path);
    const links = page.locator('a[target="_blank"]');
    expect(await links.count()).toBeGreaterThan(0);
    for (const a of await links.all()) {
      await expect(a).toHaveAccessibleName(/\(opens in a new tab\)$/);
      await expect(a.locator("svg.ext")).toHaveCount(1);
    }
  }
});

test("the MTG page links its one public repository", async ({ page }) => {
  await page.goto("/projects/mtg-suite/");
  await expect(page.locator("main")).not.toContainText("two of the tools");
  expect(await page.locator('main a[href="https://github.com/guuse/claude-mtg-skills"]').count()).toBe(2);
});

test("the footer has the design system, the source and the address", async ({ page }) => {
  await page.goto("/projects/");
  const footer = page.locator(".site-footer");
  await expect(footer.getByRole("link", { name: "Design system" })).toHaveAttribute(
    "href",
    "/design-system/",
  );
  await expect(footer.getByRole("link", { name: /^Source/ })).toHaveAttribute(
    "href",
    "https://github.com/guuse/portfolio",
  );
});

test("the 404 has no canonical URL; case studies are articles", async ({ page }) => {
  await page.goto("/404.html");
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
  await page.goto("/projects/homelab/");
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
  await page.goto("/projects/");
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "website");
});

test("the homepage covers are named by their title first", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".cover__link").first()).toHaveAccessibleName(
    /^Hosting platform Work · 2022 to now/,
  );
});

test("there are no developer comments in the HTML, only the one for view-source readers", async ({
  request,
}) => {
  for (const path of ["/", "/projects/", "/projects/homelab/", "/design-system/"]) {
    const html = await (await request.get(path)).text();
    const comments = html.match(/<!--[\s\S]*?-->/g) ?? [];
    expect(comments.length, path).toBe(1);
    expect(comments[0]).toContain("View-source is a fine way to read a website");
  }
});

test.describe("forced colours", () => {
  test.use({ colorScheme: "dark" });

  test("drawings keep their own colours; the current nav entry is underlined", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/projects/homelab/");
    expect(
      await page
        .locator("svg.scene-svg")
        .first()
        .evaluate((el) => getComputedStyle(el).forcedColorAdjust),
    ).toBe("none");
    const current = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Projects" });
    expect(await current.evaluate((el) => getComputedStyle(el).textDecorationLine)).toBe("underline");
  });
});

test("focus is never hidden under the sticky header", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/projects/homelab/");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollPaddingTop)).toBe("80px");
});
