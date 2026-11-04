import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { readCustomMedia, substituteCustomMedia } from "../../integrations/custom-media";
import { media } from "~/styles/tokens";

describe("custom media", () => {
  it("reads every generated definition, the same queries tokens.ts exports", async () => {
    const defs = readCustomMedia(await readFile("src/styles/media.css", "utf8"));
    expect(Object.fromEntries([...defs].map(([k, v]) => [k.slice(2), v]))).toEqual(media);
  });

  it("substitutes names in a prelude and leaves everything else alone", () => {
    const defs = new Map([
      ["--sm", "(width >= 600px)"],
      ["--landscape-short", "(orientation: landscape) and (height <= 500px)"],
    ]);
    expect(substituteCustomMedia(" (--sm) and (hover: hover) ", defs)).toBe(
      " (width >= 600px) and (hover: hover) ",
    );
    expect(substituteCustomMedia("(--sm), (--landscape-short)", defs)).toBe(
      "(width >= 600px), (orientation: landscape) and (height <= 500px)",
    );
    expect(substituteCustomMedia("print", defs)).toBe("print");
  });

  it("fails on a name that isn't a token", () => {
    expect(() => substituteCustomMedia("(--huge)", new Map(), "x.css")).toThrow(/unknown --huge in x.css/);
  });
});
