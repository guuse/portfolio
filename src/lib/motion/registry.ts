/**
 * Which animator drives which drawing (the data-scene / data-card ids in the markup), and
 * where its code is. Each family of scenes is its own chunk, so a page loads only the
 * animators for the drawings it has: a case study one family, the homepage and the projects
 * page the three cards. This file is all the eager bundle knows about them.
 *
 * The live cards (homepage, projects page, case-study heroes) play one pass and rest; `p` is
 * that pass, 0..1 (controller.ts). Each rests on a frame that reads as finished.
 */
import type { SceneFactory } from "./types";

const families = {
  platform: () => import("./scenes/platform"),
  homelab: () => import("./scenes/homelab"),
  mtg: () => import("./scenes/mtg"),
} satisfies Record<string, () => Promise<{ animators: Record<string, SceneFactory> }>>;

type Family = keyof typeof families;

const familyOf: Record<string, Family> = {
  standard: "platform",
  scale: "platform",
  regions: "platform",
  ipv6: "platform",
  learned: "platform",
  cardscale: "platform",
  loop: "homelab",
  cardloop: "homelab",
  itch: "mtg",
  table: "mtg",
  hands: "mtg",
  decks: "mtg",
  search: "mtg",
  friends: "mtg",
  cardtable: "mtg",
};

/** The drawing ids on this page. */
export const drawingIds = (root: ParentNode = document): string[] =>
  [...root.querySelectorAll<HTMLElement>("[data-scene], [data-card]")].map(
    (el) => el.dataset["scene"] ?? el.dataset["card"] ?? "",
  );

/** Loads the families these ids belong to, in parallel, and returns their animators by id. */
export async function loadAnimators(ids: readonly string[]): Promise<Record<string, SceneFactory>> {
  const wanted = new Set(ids.flatMap((id) => (familyOf[id] ? [familyOf[id]] : [])));
  const modules = await Promise.all([...wanted].map((f) => families[f]()));
  return Object.assign({}, ...modules.map((m) => m.animators)) as Record<string, SceneFactory>;
}
