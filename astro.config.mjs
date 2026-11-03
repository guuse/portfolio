// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";

/**
 * Static site. Every page is pre-rendered; the only client code is a handful of small,
 * deferred modules (see src/scripts/). Fonts are self-hosted from Fontsource packages and
 * Astro generates metric-matched fallbacks so the swap does not shift the layout.
 */
export default defineConfig({
  site: "https://ekkelenkamp.dev",
  output: "static",
  trailingSlash: "always",
  build: { format: "directory", inlineStylesheets: "auto" },
  compressHTML: true,
  prefetch: { prefetchAll: false, defaultStrategy: "hover" },
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
