/**
 * The icon sprite: official AWS Architecture Icons (aws-icons 3.3.0) and Simple Icons
 * (13.21.0) brand marks, inlined once per page as <symbol>s and referenced with <use>.
 * Only the icons the site uses are in src/assets/icons; their licences sit next to them.
 */
const files = import.meta.glob<string>("../../assets/icons/*/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});

export const ICONS = {
  "aws-AmazonElasticKubernetesService": "aws/AmazonElasticKubernetesService",
  "aws-ElasticLoadBalancingNetworkLoadBalancer": "aws/ElasticLoadBalancingNetworkLoadBalancer",
  "aws-AmazonAurora": "aws/AmazonAurora",
  "aws-AmazonCloudFront": "aws/AmazonCloudFront",
  "aws-AmazonSimpleStorageService": "aws/AmazonSimpleStorageService",
  "si-argo": "brand/argo",
  "si-tailscale": "brand/tailscale",
  "si-cloudflare": "brand/cloudflare",
  "si-traefikproxy": "brand/traefikproxy",
  "si-letsencrypt": "brand/letsencrypt",
} as const;

export type IconId = keyof typeof ICONS;

function symbol(id: IconId): string {
  const src = files[`../../assets/icons/${ICONS[id]}.svg`];
  if (!src) throw new Error(`icon not found: ${id}`);
  const viewBox = /viewBox="([^"]+)"/.exec(src)?.[1] ?? "0 0 24 24";
  const inner = src
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "")
    .replace(/<title>[\s\S]*?<\/title>/g, "");
  return `<symbol id="${id}" viewBox="${viewBox}">${inner}</symbol>`;
}

/** A hidden SVG holding the symbols a page needs. */
export const sprite = (ids: readonly IconId[]): string =>
  `<svg class="sprite" width="0" height="0" aria-hidden="true">${ids.map(symbol).join("")}</svg>`;
