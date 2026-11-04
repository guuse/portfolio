import { fileURLToPath } from "node:url";
import { fontProviders } from "astro/config";
import type { FontProvider } from "astro";

/**
 * Fonts from the Fontsource packages in node_modules, and nowhere else.
 *
 * Astro's npm provider reads a package's CSS locally but, by default, points every font file
 * at jsDelivr and downloads it from there during the build. `remote: false` keeps it local:
 * unifont then returns `file://` URLs. Astro 7.4's font fetcher reads a font from disk only
 * when it gets a plain absolute path, so this turns those URLs into paths. A font that isn't
 * installed is a build error, the build works with the network off, and every font the site
 * serves is a same-origin /_astro/fonts/ file.
 */
export function fontsourcePackages(): FontProvider<{ package: string } | undefined> {
  const npm = fontProviders.npm({ remote: false });
  return {
    ...npm,
    name: "fontsource-packages",
    async resolveFont(options) {
      const result = await npm.resolveFont(options);
      if (!result) return result;
      for (const face of result.fonts)
        for (const src of face.src)
          if ("url" in src) {
            if (!src.url.startsWith("file:"))
              throw new Error(`fonts: ${options.familyName} resolved to ${src.url}, not a local file`);
            src.url = fileURLToPath(src.url);
          }
      return result;
    },
  };
}
