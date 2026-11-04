import type { Plugin } from "vite";

/**
 * The site's cascade layers, lowest first. Browsers take layer order from the first place
 * each layer name appears, and Vite bundles component styles in whatever order the import
 * graph gives. So every stylesheet module (plain .css and Astro <style> blocks) starts with
 * this statement, and the order holds whichever module ends up first on a page.
 */
const LAYERS = "@layer reset, tokens, base, layout, components, utilities;";

const isStyle = (id: string): boolean => /\.css($|\?)/.test(id) || /[?&]lang\.css$/.test(id);

export function layerOrder(): Plugin {
  return {
    name: "layer-order",
    enforce: "pre",
    transform(code, id) {
      if (!isStyle(id) || code.startsWith(LAYERS)) return null;
      return { code: `${LAYERS}\n${code}`, map: null };
    },
  };
}
