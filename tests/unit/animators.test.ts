/**
 * Every drawing a page can render, with the animator that drives it, built and played in a
 * fake SVG DOM (fake-svg.ts). The pairs come from the same tables the pages use (the scene
 * ids, and liveArt for the cards), and the parts come from the rendered markup, so a renamed
 * part fails here instead of freezing a page (065fedf).
 */
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { card, scenes } from "~/lib/art";
import { liveArt } from "~/lib/projects";
import { loadAnimators } from "~/lib/motion/registry";
import type { SceneFactory } from "~/lib/motion/types";
import { installDocument, keysOf, parseSvg, writes, type FakeElement } from "./fake-svg";

const drawings = [
  ...Object.entries(scenes).map(([id, draw]) => ({ id, name: id, markup: draw() })),
  ...Object.values(liveArt).map((a) => ({
    id: a.motion,
    name: `${a.motion} (card "${a.card}")`,
    markup: card(a.card),
  })),
];

let animators: Record<string, SceneFactory> = {};
beforeAll(async () => {
  installDocument();
  animators = await loadAnimators(drawings.map((d) => d.id));
});

/** A small seeded generator (mulberry32), so a run's LED blinks and packet timing can be replayed. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
afterEach(() => void vi.restoreAllMocks());

const build = (id: string, svg: FakeElement) => animators[id]!(svg as unknown as SVGSVGElement);

describe.each(drawings)("$name", ({ id, markup }) => {
  it("is rendered with parts, and has an animator", () => {
    expect(keysOf(parseSvg(markup)).size).toBeGreaterThan(0);
    expect(typeof animators[id]).toBe("function");
  });

  // parts() throws on a key the drawing doesn't have, and every scene looks its parts up
  // while it's built, so building it is the check
  it("finds every part it looks up in the rendered drawing", () => {
    expect(() => build(id, parseSvg(markup))).not.toThrow();
  });

  it("plays its whole range, forwards and back, without throwing", () => {
    const run = build(id, parseSvg(markup));
    let t = 0;
    const frames = (p: number, n: number) => {
      for (let i = 0; i < n; i++) run(p, 1 / 60, (t += 1 / 60), 1, false);
    };
    for (let p = 0; p <= 1.0001; p += 0.01) frames(Math.min(1, p), 6);
    frames(1, 120);
    for (let p = 1; p >= -0.0001; p -= 0.02) frames(Math.max(0, p), 6);
  });

  // The scenes blink LEDs and time packets with Math.random; resting must not depend on it,
  // so every seed here has to settle the same way. The homelab card used to ignore `rest`
  // and keep blinking: that failed about one run in six unseeded, and fails seeds 14 and 16.
  it.each(Array.from({ length: 24 }, (_, i) => i + 1))(
    "settles when asked to rest, and then writes nothing (seed %i)",
    (seed) => {
      vi.spyOn(Math, "random").mockImplementation(seeded(seed));
      for (const p of [0.2, 0.5, 0.65, 0.8, 0.95]) {
        const run = build(id, parseSvg(markup));
        let t = 0;
        // traffic builds up first (packets on their way, LEDs blinking)
        for (let i = 0; i < 240; i++) run(p, 1 / 60, (t += 1 / 60), 1, false);
        // at rest the clock stands still (controller.ts); within a second nothing is left moving
        let frames = 0;
        while (run(p, 1 / 60, t, 1, true)) if (++frames > 60) throw new Error(`still moving at p=${p}`);
        const before = writes.n;
        run(p, 1 / 60, t, 1, true);
        // a courier scene places its one packet by progress, so its last frame may rewrite it;
        // the controller stops calling a scene as soon as it reports nothing moving
        expect(writes.n - before, `writes at rest, p=${p}`).toBeLessThanOrEqual(1);
      }
    },
  );
});

it("fails when it's built if the drawing lacks a part (the renamed route of 065fedf)", () => {
  const regions = scenes.regions().replace('data-k="route-jp"', 'data-k="rjp"');
  expect(() => build("regions", parseSvg(regions))).toThrow(/data-k="route-jp"/);
});
