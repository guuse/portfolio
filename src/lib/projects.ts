/** Case-study routes, by project id (the ids in src/content/projects.yaml). */
export type ProjectId = "hosting-platform" | "homelab" | "mtg-suite";

export const caseStudyHref = (id: ProjectId): string => `/projects/${id}/`;

/**
 * Each project's live drawing: which card from the kit (src/lib/art/cards.ts) and which
 * animator plays it (src/lib/motion/registry.ts). The homepage, the projects page and the
 * case-study hero show the same one, so a view transition can carry it from page to page.
 */
export const liveArt = {
  "hosting-platform": { card: "platform", motion: "cardscale" },
  homelab: { card: "homelab", motion: "cardloop" },
  "mtg-suite": { card: "mtg", motion: "cardtable" },
} as const satisfies Record<ProjectId, { card: string; motion: string }>;
