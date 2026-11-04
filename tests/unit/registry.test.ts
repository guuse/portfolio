import { describe, expect, it } from "vitest";
import { scenes } from "~/lib/art";
import { liveArt } from "~/lib/projects";
import { loadAnimators } from "~/lib/motion/registry";
import { animators as delivery } from "~/lib/motion/scenes/delivery";
import { animators as homelab } from "~/lib/motion/scenes/homelab";
import { animators as mtg } from "~/lib/motion/scenes/mtg";
import { animators as platform } from "~/lib/motion/scenes/platform";

describe("the animator registry", () => {
  const drawn = [...Object.keys(scenes), ...Object.values(liveArt).map((a) => a.motion), "cardscale"];

  it("has an animator for every drawing the pages can render", async () => {
    const all = await loadAnimators(drawn);
    for (const id of drawn) expect(typeof all[id], id).toBe("function");
  });

  it("files each animator under the family that exports it, and loads only what's asked", async () => {
    for (const [family, mod] of Object.entries({ platform, delivery, homelab, mtg })) {
      const ids = Object.keys(mod);
      expect(Object.keys(await loadAnimators(ids)).sort(), family).toEqual(ids.sort());
    }
    expect(await loadAnimators(["evicted", "nope"])).toEqual({});
  });
});
