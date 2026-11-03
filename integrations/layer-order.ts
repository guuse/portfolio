import type { Plugin } from "vite";

/**
 * The site's cascade layers, lowest first. Browsers take layer order from the first place
 * each layer name appears, and Vite splits CSS into per-component chunks in whatever order
 * the import graph gives; so every emitted stylesheet starts with this statement and the
 * order holds no matter which chunk a page loads first.
 */
export const LAYERS = "@layer reset, tokens, base, layout, components, utilities;";

export function layerOrder(): Plugin {
  return {
    name: "layer-order",
    enforce: "post",
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type === "asset" && file.fileName.endsWith(".css")) {
          const source =
            typeof file.source === "string" ? file.source : new TextDecoder().decode(file.source);
          if (!source.startsWith(LAYERS)) file.source = `${LAYERS}\n${source}`;
        }
      }
    },
  };
}
