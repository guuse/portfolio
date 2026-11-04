/**
 * Lighthouse CI: every page (the same list as tests/pages.ts), mobile (the default emulation), against `astro preview`.
 * The budget is the one in the plan: 95+ in every category, LCP under 2 s, CLS under
 * 0.05, TBT under 100 ms, and no more than 40 KB of script per page.
 */
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
  ci: {
    collect: {
      startServerCommand: "npm run preview -- --port 4322 --ignore-lock",
      startServerReadyPattern: "localhost:4322",
      url: pages.map((p) => `http://localhost:4322${p}`),
      numberOfRuns: 1,
      settings: { chromeFlags: "--no-sandbox --headless=new" },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.95 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:seo": ["error", { minScore: 0.95 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2000 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.05 }],
        "total-blocking-time": ["error", { maxNumericValue: 100 }],
        "resource-summary:script:size": ["error", { maxNumericValue: 40960 }],
      },
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci" },
  },
};
