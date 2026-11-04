import { describe, expect, it } from "vitest";
import { scenes as drawings } from "~/lib/art";
import { card } from "~/lib/art/cards";
import { apps, ways } from "~/lib/art/diagrams";
import { pointAt, samplePath } from "~/lib/art/geometry";
import { CL } from "~/lib/art/scenes/homelab.layout";
import { PACKET_INNER, PACKET_PARTS } from "~/lib/art/packet";
import * as platform from "~/lib/art/scenes/platform";
import { sketch } from "~/lib/art/sketch";

/** Every drawing a page can ask for, by id (the same table the pages use). */
const scenes: Record<string, () => string> = drawings;

describe("illustration kit", () => {
  // that each has every part its animator looks up is animators.test.ts
  it.each(Object.keys(scenes))("%s is a labelled image", (id) => {
    expect(scenes[id]!()).toMatch(
      /^<svg class="scene-svg [^"]*" viewBox="0 0 600 440" role="img" aria-label="[^"]{40,}"/,
    );
  });

  it("never writes style attributes (the CSP forbids them)", () => {
    const all = [
      ...Object.values(scenes).map((draw) => draw()),
      card("platform"),
      card("homelab"),
      card("mtg"),
      apps(),
      ways(),
      sketch(),
    ];
    for (const svg of all) expect(svg).not.toMatch(/\sstyle=/);
  });

  it("hides the live project drawings from assistive tech", () => {
    for (const id of ["platform", "homelab", "mtg"] as const) {
      expect(card(id)).toContain('aria-hidden="true"');
      expect(card(id)).not.toContain("role=");
    }
  });

  it("is deterministic", () => {
    expect(platform.regions()).toBe(platform.regions());
  });
});

it("describes a packet once for both renderers", () => {
  expect(PACKET_PARTS).toHaveLength(3);
  expect(PACKET_INNER).toBe(
    '<rect x="-8" y="-4.5" width="16" height="9" rx="2" class="pk-b"/><rect x="3" y="-4.5" width="5" height="9" rx="1.5" class="pk-h"/><path d="M-4.5 -1.2H0.5M-4.5 1.4H-1" class="pk-s"/>',
  );
});

it("knows where the homelab card's loop passes the build and the laptop", () => {
  const s = samplePath(CL.loop);
  const nearest = (x: number, y: number) => {
    let best = 0,
      bd = Infinity;
    for (let i = 0; i <= 2000; i++) {
      const p = pointAt(s, i / 2000),
        d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < bd) [bd, best] = [d, i / 2000];
    }
    return best;
  };
  expect(nearest(112, 243)).toBeCloseTo(CL.buildAt, 2);
  expect(nearest(250, 180)).toBeCloseTo(CL.laptopAt, 2);
});

it("escapes text and attribute values, quotes included", async () => {
  const { esc, tag } = await import("~/lib/art/svg");
  expect(esc(`a < b & "c" 'd' >`)).toBe("a &lt; b &amp; &quot;c&quot; &#39;d&#39; &gt;");
  expect(tag("text", { "aria-label": 'say "hi"' }, esc("Let's"))).toBe(
    '<text aria-label="say &quot;hi&quot;">Let&#39;s</text>',
  );
});
