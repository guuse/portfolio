import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { layerOrder } from "./integrations/layer-order";

/**
 * Static site. Every page is pre-rendered; the only client code is a handful of small,
 * deferred modules (see src/scripts/). Fonts are self-hosted from Fontsource packages and
 * Astro generates metric-matched fallbacks so the swap does not shift the layout.
 */
export default defineConfig({
  site: "https://ekkelenkamp.dev",
  output: "static",
  trailingSlash: "always",
  // Stylesheets stay files (cached, and no inline style hashes in the CSP); see layer-order.
  build: { format: "directory", inlineStylesheets: "never" },
  vite: { plugins: [layerOrder()] },
  compressHTML: true,
  // Shiki writes inline styles, which the CSP would block; the site has no highlighted code.
  markdown: { syntaxHighlight: false },
  /*
   * Astro writes this policy into every page as a <meta>, with a SHA-256 hash for each inline
   * script and style it emits. nginx adds what a meta can't (frame-ancestors) as a header.
   * Hence: no style="" attributes, no innerHTML (Trusted Types), scripts only through Astro.
   * The contract is in infrastructure/README.md ("CSP").
   */
  security: {
    csp: {
      algorithm: "SHA-256",
      directives: [
        "default-src 'none'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "manifest-src 'self'",
        "base-uri 'none'",
        "form-action 'none'",
        "object-src 'none'",
        "require-trusted-types-for 'script'",
        "trusted-types 'none'",
        "upgrade-insecure-requests",
      ],
    },
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/404"),
    }),
  ],
  fonts: [
    {
      provider: fontProviders.npm(),
      name: "Instrument Serif",
      cssVariable: "--font-serif",
      weights: [400],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["Georgia", "serif"],
      options: { package: "@fontsource/instrument-serif" },
    },
    {
      provider: fontProviders.npm(),
      name: "Schibsted Grotesk Variable",
      cssVariable: "--font-sans",
      weights: ["400 900"],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["Arial", "sans-serif"],
      options: { package: "@fontsource-variable/schibsted-grotesk" },
    },
    {
      // The italic ships as a separate stylesheet in the variable package. Same family name,
      // so `font-style: italic` on --font-sans picks it up; never preloaded (rarely used).
      provider: fontProviders.npm(),
      name: "Schibsted Grotesk Variable",
      cssVariable: "--font-sans-italic",
      weights: ["400 900"],
      styles: ["italic"],
      subsets: ["latin"],
      fallbacks: ["Arial", "sans-serif"],
      options: { package: "@fontsource-variable/schibsted-grotesk", file: "wght-italic.css" },
    },
    {
      provider: fontProviders.npm(),
      name: "Geist Mono",
      cssVariable: "--font-mono",
      weights: [400],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["ui-monospace", "monospace"],
      options: { package: "@fontsource/geist-mono" },
    },
  ],
});
