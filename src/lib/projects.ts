/** Case-study routes, by project id (the ids in src/content/projects.yaml). */
export type ProjectId = "hosting-platform" | "homelab" | "mtg-suite";

export const caseStudyHref = (id: ProjectId): string => `/projects/${id}/`;
