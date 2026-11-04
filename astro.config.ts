import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { fontsourcePackages } from "./integrations/local-fonts";
import { customMedia } from "./integrations/custom-media";
import { layerOrder } from "./integrations/layer-order";

const selfHosted = fontsourcePackages();

/**
 * Static site. Every page is pre-rendered; the only client code is a handful of small,
 * deferred modules (see src/scripts/). Fonts come from the Fontsource packages, read from
 * node_modules at build time (never a CDN, see integrations/local-fonts.ts), and Astro
 * generates metric-matched fallbacks so the swap does not shift the layout.
 */
export default defineConfig({
  site: "https://ekkelenkamp.dev",
  output: "static",
  trailingSlash: "always",
  // Stylesheets are inlined, each with its hash in the CSP (ADR 0006); integrations/layer-order
  // keeps the cascade layer order whichever stylesheet comes first.
  build: { format: "directory", inlineStylesheets: "always" },
  vite: { plugins: [layerOrder()], css: { postcss: { plugins: [customMedia()] } } },
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
        // no upgrade-insecure-requests: nginx sends it (and HSTS) in production, and in the
        // meta it would turn every request on a plain-http preview into https (Safari).
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
      provider: selfHosted,
      name: "Instrument Serif",
      cssVariable: "--font-serif",
      weights: [400],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["Georgia", "serif"],
      options: { package: "@fontsource/instrument-serif" },
    },
    {
      provider: selfHosted,
      name: "Schibsted Grotesk Variable",
      cssVariable: "--font-sans",
      weights: ["400 900"],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["Arial", "sans-serif"],
      options: { package: "@fontsource-variable/schibsted-grotesk" },
    },
    {
      provider: selfHosted,
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
