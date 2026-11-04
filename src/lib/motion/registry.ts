/** Which animator drives which drawing (the data-scene / data-card ids in the markup). */
import { fade, parts } from "./dom";
import { restLeds } from "./leds";
import { ease as E, seg } from "./math";
import { cardLoop, loop } from "./scenes/homelab";
import { decks, friends, hands, itch, search, table } from "./scenes/mtg";
import { ipv6, learned, regions, scale, scaler, standard } from "./scenes/platform";
import type { SceneFactory } from "./types";

/*
 * The live cards (homepage, projects page, case-study heroes) play one pass and rest; `p` is
 * that pass, 0..1 (controller.ts). Each rests on a frame that reads as finished.
 */

/** The platform card: a rush of traffic arrives and the pods scale up for it, then calm again. */
const cardScale: SceneFactory = (svg) =>
  scaler(
    svg,
    (p) => 0.3 + 0.55 * (E.inOutCubic(seg(p, 0.04, 0.3)) * (1 - E.inOutCubic(seg(p, 0.4, 0.62)))),
    true,
  );

/**
 * The MTG hero: the second half of a game, from the second spell to the stack resolving, with
 * auto-resolve on for the last round. It rests on the table with the stack cleared.
 */
const cardTable: SceneFactory = (svg) => {
  const run = table(svg),
    K = parts(svg);
  return (p, dt, t, speed) => {
    run(0.3 + 0.69 * p, dt, t, speed);
    fade(K["pk"], 1 - seg(p, 0.9, 1));
    if (p >= 1) restLeds(svg);
  };
};

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
  cardtable: cardTable,
};
