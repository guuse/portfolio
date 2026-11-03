import { defineConfig, devices } from "@playwright/test";

/**
 * e2e and a11y run against `astro preview`, which serves the built site with the same
 * meta CSP as production. Build first (`npm run build`). CHROMIUM_PATH can point at a
 * locally installed Chromium; CI uses Playwright's own.
 */
const PORT = 4321;
const chromium = process.env["CHROMIUM_PATH"];
const launchOptions = chromium ? { executablePath: chromium } : {};

export default defineConfig({
  outputDir: "test-results",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  reporter: process.env["CI"] ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    launchOptions,
  },
  webServer: {
    command: `npm run preview -- --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env["CI"],
  },
  projects: [
    {
      name: "e2e",
      testDir: "tests/e2e",
      use: { ...devices["Desktop Chrome"], launchOptions },
    },
    {
      name: "a11y",
      testDir: "tests/a11y",
      use: { ...devices["Desktop Chrome"], launchOptions },
    },
  ],
});
