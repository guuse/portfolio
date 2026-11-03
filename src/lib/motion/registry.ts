/** Which animator drives which drawing (the data-scene / data-card ids in the markup). */
import { cardLoop, loop } from "./scenes/homelab";
import { decks, friends, hands, itch, search, table } from "./scenes/mtg";
import { ipv6, learned, regions, scale, scaler, standard } from "./scenes/platform";
import type { SceneFactory } from "./types";

/** The platform card: the scaling scene on a slow 15-second tide instead of scroll. */
const cardScale: SceneFactory = (svg) =>
  scaler(svg, (_p, t) => 0.42 + 0.38 * Math.sin((t / 15) * Math.PI * 2 - 1.2) + 0.08 * Math.sin(t * 0.9));

export const animators: Record<string, SceneFactory> = {
  standard,
  scale,
  regions,
  ipv6,
  learned,
  loop,
  itch,
  table,
  hands,
  decks,
  search,
  friends,
  cardscale: cardScale,
  cardloop: cardLoop,
};
