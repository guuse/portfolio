/**
 * Lighthouse CI: every page in tests/pages.ts, with mobile emulation (the default), against
 * `astro preview`. The budget: 95+ in every category, LCP under 2 s, CLS under 0.05, TBT
 * under 100 ms, and no more than 40 KB of script per page.
 */
// A copy of PAGES in tests/pages.ts: a .cjs config can't import the .ts. The unit test
// tests/unit/lighthouse-pages.test.ts keeps the two lists equal.
const pages = [
  "/",
  "/projects/",
  "/projects/hosting-platform/",
  "/projects/homelab/",
  "/projects/mtg-suite/",
  "/design-system/",
  "/privacy/",
];

module.exports = {
  pages,
  ci: {
    collect: {
      startServerCommand: "npm run preview -- --port 4322 --ignore-lock",
      startServerReadyPattern: "localhost:4322",
      url: pages.map((p) => `http://localhost:4322${p}`),
      // three runs per page, and every assertion is on their median (not lhci's default, the best run)
      numberOfRuns: 3,
      settings: { chromeFlags: "--no-sandbox --headless=new" },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.95, aggregationMethod: "median" }],
        "categories:accessibility": ["error", { minScore: 0.95, aggregationMethod: "median" }],
        "categories:best-practices": ["error", { minScore: 0.95, aggregationMethod: "median" }],
        "categories:seo": ["error", { minScore: 0.95, aggregationMethod: "median" }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2000, aggregationMethod: "median" }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.05, aggregationMethod: "median" }],
        "total-blocking-time": ["error", { maxNumericValue: 100, aggregationMethod: "median" }],
        "resource-summary:script:size": ["error", { maxNumericValue: 40960, aggregationMethod: "median" }],
      },
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci" },
  },
};
