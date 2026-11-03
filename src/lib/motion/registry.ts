/** Which animator drives which drawing (the data-scene / data-card ids in the markup). */
import { fade, parts } from "./dom";
import { seg } from "./math";
import { cardLoop, loop } from "./scenes/homelab";
import { decks, friends, hands, itch, search, table } from "./scenes/mtg";
import { ipv6, learned, regions, scale, scaler, standard } from "./scenes/platform";
import type { SceneFactory } from "./types";

/** The platform card: the scaling scene on a slow 15-second tide instead of scroll. */
const cardScale: SceneFactory = (svg) =>
  scaler(svg, (_p, t) => 0.42 + 0.38 * Math.sin((t / 15) * Math.PI * 2 - 1.2) + 0.08 * Math.sin(t * 0.9));

/**
 * The MTG hero: the table scene dealt over and over, one game every 14 seconds. At the end of
 * a game the players get up and the hand comes back, so the next deal starts from where the
 * scene itself starts, and the loop never jumps.
 */
const cardTable: SceneFactory = (svg) => {
  const run = table(svg),
    K = parts(svg),
    seats = [0, 1, 2, 3].map((q) => K[`seat${q}`]);
  let phase = 0;
  return (_p, dt, t, speed) => {
    phase = (phase + dt / 14) % 1;
    run(Math.min(1, phase / 0.9), dt, t, speed);
    const out = seg(phase, 0.93, 0.995);
    if (out > 0) {
      for (const s of seats) fade(s, 1 - out);
      fade(K["hc2"], out);
    }
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
