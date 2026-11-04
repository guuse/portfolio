import { describe, expect, it } from "vitest";
import { card } from "~/lib/art/cards";
import { apps, ways } from "~/lib/art/diagrams";
import { pointAt, samplePath } from "~/lib/art/geometry";
import { CL } from "~/lib/art/scenes/homelab.layout";
import { PACKET_INNER, PACKET_PARTS } from "~/lib/art/packet";
import * as homelab from "~/lib/art/scenes/homelab";
import * as mtg from "~/lib/art/scenes/mtg";
import * as platform from "~/lib/art/scenes/platform";
import { sketch } from "~/lib/art/sketch";

const scenes = { ...platform, ...homelab, ...mtg } as Record<string, () => string>;

/** The data-k keys each animator reaches for (src/lib/motion/scenes). */
const KEYS: Record<string, string[]> = {
  standard: ["plat", "old0", "win4", "dock4"],
  scale: ["pk", "in0", "out2", "n00", "p223", "pend1"],
  regions: ["globe", "ie", "jp", "door", "users", "routes", "lblIE", "lblJP", "rie", "rjp", "ri2"],
  ipv6: [
    "tag",
    "tag-4",
    "tag-6",
    "xlat",
    "legacy",
    "db",
    "gate",
    "bar",
    "bar-led",
    "rx",
    "rf",
    "rdb",
    "ridle",
  ],
  learned: ["commit", "lit-spine", "lit7", "c7", "c7-old", "c7-new", "pk"],
  loop: [
    "c-push",
    "c-tag",
    "hatch",
    "buildled",
    "crate",
    "oldpod",
    "newpod",
    "gate",
    "bar",
    "r-push",
    "r-roll",
    "lbl-repo",
    "lbl-build",
    "lbl-reg",
    "lbl-lap",
    "argo",
    "upd",
  ],
  itch: ["f0", "f3", "t6", "bk7", "sh2", "q0", "q1"],
  table: ["seat3", "seat3-ring", "st2", "hc2", "stacklbl", "auto", "lane3", "back3"],
  hands: ["scr3", "scr3-c", "scr3-re", "scr0-bf4", "bar", "mark", "lane3"],
  decks: ["bx0", "bx13", "bd3", "s0", "s0-ring", "deck", "route", "gap"],
  search: ["bub", "words", "tk2", "tl2", "rq", "rb", "tick", "fan0", "fc1-5"],
  friends: ["moon", "flag", "issue", "fix", "img", "parcel", "r3", "p0", "p0-ring"],
};

describe("illustration kit", () => {
  it.each(Object.keys(KEYS))("%s is a labelled image with every part motion needs", (id) => {
    const svg = scenes[id]!();
    expect(svg).toMatch(
      /^<svg class="scene-svg [^"]*" viewBox="0 0 600 440" role="img" aria-label="[^"]{40,}"/,
    );
    for (const key of KEYS[id]!) expect(svg, key).toContain(`data-k="${key}"`);
  });

  it("never writes style attributes (the CSP forbids them)", () => {
    const all = [
      ...Object.keys(KEYS).map((id) => scenes[id]!()),
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
    // the MTG hero is the table scene, whole, with what its animator reaches for
    for (const key of KEYS["table"]!) expect(card("mtg"), key).toContain(`data-k="${key}"`);
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
