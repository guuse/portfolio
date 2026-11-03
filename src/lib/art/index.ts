/** Every drawing a page can ask for, by id. */
import * as homelab from "./scenes/homelab";
import * as mtg from "./scenes/mtg";
import * as platform from "./scenes/platform";

export const scenes = {
  standard: platform.standard,
  scale: () => platform.scale(),
  regions: platform.regions,
  ipv6: platform.ipv6,
  learned: platform.learned,
  loop: () => homelab.loop(),
  itch: mtg.itch,
  table: mtg.table,
  hands: mtg.hands,
  decks: mtg.decks,
  search: mtg.search,
  friends: mtg.friends,
} satisfies Record<string, () => string>;

export type SceneId = keyof typeof scenes;

export { card, type CardId } from "./cards";
export { apps, ways } from "./diagrams";
export { sprite, type IconId } from "./icons";
