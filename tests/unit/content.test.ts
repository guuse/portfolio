import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import * as schema from "~/content/schemas";

const load = (name: string): unknown[] =>
  parse(readFileSync(new URL(`../../src/content/${name}.yaml`, import.meta.url), "utf8")) as unknown[];
const cases = [
  ["experience", schema.experience],
  ["interests", schema.interest],
  ["principles", schema.principle],
  ["skills", schema.skill],
  ["projects", schema.project],
  ["also", schema.also],
] as const;

describe.each(cases)("content: %s", (name, s) => {
  const items = load(name);

  it("matches its schema", () => {
    for (const item of items) expect(() => s.parse(item)).not.toThrow();
  });

  it("has unique ids and a continuous order", () => {
    const parsed = items.map((i) => s.parse(i) as { id: string; order: number });
    expect(new Set(parsed.map((p) => p.id)).size).toBe(parsed.length);
    expect(parsed.map((p) => p.order).sort((a, b) => a - b)).toEqual(parsed.map((_, i) => i + 1));
  });

  it("uses typographic apostrophes", () => {
    expect(JSON.stringify(items)).not.toMatch(/\w'\w/);
  });
});

it("rejects block markup in inline copy", () => {
  const phase = load("experience")[0] as Record<string, unknown>;
  expect(() => schema.experience.parse({ ...phase, bullets: ["<p>no</p>"] })).toThrow();
});

it("dates a case study as updated on or after it was published", () => {
  for (const p of load("projects").map((i) => schema.project.parse(i)))
    expect(p.updated >= p.published).toBe(true);
  const first = load("projects")[0] as Record<string, unknown>;
  expect(() => schema.project.parse({ ...first, published: "2026-02-30" })).toThrow();
});
