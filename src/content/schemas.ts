/**
 * Schemas for the content in src/content. Plain zod, so the unit tests can validate the
 * YAML without booting Astro; content.config.ts wires them to collections.
 */
import { z } from "astro/zod";

const text = z.string().trim().min(1);
/** Position in the list. Collections come back sorted by id, so order is explicit. */
const order = z.number().int().positive();
/** A sentence that may hold inline HTML (a link). It must not hold block markup. */
/** A calendar date, YYYY-MM-DD, that exists. */
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((s) => new Date(`${s}T00:00:00Z`).toISOString().startsWith(s), "not a real date");
const inline = text.refine((s) => !/<(p|div|ul|ol|li|h\d)\b/i.test(s), "inline HTML only");

export const experience = z.object({
  id: text,
  order,
  title: text,
  years: z.string().regex(/^\d{4}–(\d{4}|now)$/),
  intro: text,
  bullets: z.array(inline).min(1),
  learned: text.startsWith("What I learned: "),
});

export const interest = z.object({
  id: text,
  order,
  name: text,
  line: text,
  lift: z.enum(["bouldering", "travel", "me"]),
});

export const principle = z.object({ id: text, order, title: text, text });

export const skill = z.object({ id: text, order, label: text, value: text });

export const project = z.object({
  id: z.enum(["hosting-platform", "homelab", "mtg-suite"]),
  order,
  title: text,
  meta: text,
  card: text,
  line: text,
  why: text,
  facts: z.array(text).length(4),
  stack: text,
  /** The case study's dates for its Article JSON-LD (YYYY-MM-DD): content, so a build without .git has them. */
  published: isoDate,
  updated: isoDate,
});

export const also = z.object({
  id: text,
  order,
  title: text,
  lang: z.string().optional(),
  line: text,
  href: z.url().optional(),
});
