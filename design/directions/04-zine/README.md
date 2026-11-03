# 04 · Zine

**Concept.** The site is laid out as a two-ink risograph zine about building things at home.
It has a cover with an "inside this issue" contents list, numbered pages with running folios
(`§ Cover story · Parts list … p. 06`), off-white paper with a grain layer, and display type
printed in drum 1 with a screened, misregistered second drum on top. Tape, halftone photo
boxes, stickers and handwritten margin notes give it the hand-made feel. Underneath sits a
strict 12-column grid, the 4px spacing scale and one fluid type scale, so the page reads like
an indie print studio made it, not a scrapbook app. The homelab is the cover story. The day job
is a full-coverage spread printed flat and quiet, so it carries the same weight as the
homelab without having to compete with its jokes.

## Why it fits Guus

The homelab content is DIY by nature: an old laptop behind the TV, a battery as a UPS, a bot
hunting one pair of clogs. A zine is the format people already use for "here's how I built
this, here's what bit me". Its conventions (contents page, page numbers, margin notes, a
"things that bit me" page) let the specifics carry the personality. The design never has to
claim any. The day job runs against that on purpose: in a zine the full-coverage page is the
serious one, so the job (tech lead of the infra team) gets flat ink, one small-caps title and
plain sentences about the three areas it covers: security, cloud & platform, architecture.

## Options (tokens only, `data-option` on `<html>`)

| Option | Inks on stock | Pick it when |
|---|---|---|
| `fluor-pink-teal` (default) | Fluorescent pink + teal on off-white | The loudest and most recognisable pairing, and the one closest to real riso. |
| `yellow-blue` | Sunflower yellow + medium blue on off-white | You want it calmer and more "Dutch print studio". Blue carries all the text, yellow only highlights. It reads the most grown-up. |
| `nachtdruk` | Light pink + mint on black stock | Dark preference. Overprint switches from `multiply` to `screen`, so light inks brighten where they overlap, the way opaque inks behave on dark board. This is picked automatically for `prefers-color-scheme: dark`. |

The whole difference between options lives in the tokens: `--blend`, `--grain`, `--riso-1/2`, the
flood-page accent (`--c-flood-accent`) and the semantic set.

## Risky bits

- **Mess vs. trust.** The tilt, tape and handwriting can make it feel unserious to a CTO or a
  recruiter. I've limited that with rules: tilt ≤ 1.1°, notes only as asides, and none of it on
  the day-job spread (one title, "Tech lead · Infra team", in small caps), which is flat and quiet on purpose.
- **Bagel Fat One is loud.** It has one weight and lots of character. Set too small or too
  often, it turns childish. It only appears on h2 and up and on the cover.
- **Overprint is a CSS trick.** The `::after` copy uses `content: attr(data-ink) / ""` (empty alt
  text, so screen readers skip it) and `background-clip: text`. It needs `data-ink` to match
  the heading text. An Astro `<Overprint>` component should generate both from one prop.
- **Copy to confirm:** the margin note "this took three evenings" on the gotchas page came from
  the art direction, not from a confirmed fact. "Hallway lights…" and the other fridge-list
  automations are the placeholders from CONTENT §4.7. Client names are kept to a single small
  line (CONTENT §3.1, still `[CONFIRM]`).

## Scaling to 10+ projects

The project collage is a grid with two featured cut-outs and then compact cards on 3 of 12
columns (2-up on tablet, 1-up on phone). Tilt cycles through `nth-child(4n+…)`, so any number of
cards keeps a varied rhythm without hand-placing. Past ~12 projects you'd make it a second
"issue": an archive page (`/projects`) with the same cards and the homepage keeping its 6. New
case studies become new "cover stories" that reuse the sheet + folio pattern.

## Build notes

- **Astro components:** `Sheet` (folio + grid), `Folio`, `Overprint`, `Note`, `Tape`,
  `Sticker` (round / tag / warn), `Halftone` (photo, label prop), `StatusChip`, `NowList`,
  `SpecTable`, `BudgetBar` (data in, legend as real text), `ArchDiagram` (nested-list data),
  `DecisionCard`, `GotchaNote`, `ProjectEntry` (featured / compact / tint), `TitleFact`,
  `AreaBlock`, `Bridge`, `Principle`, `Toolbox`, `BackCover`, `ReviewBar` (dev only).
- **Fonts to self-host (WOFF2, Latin + Latin-ext):** Bagel Fat One (one static file),
  Atkinson Hyperlegible Next (variable, wght 200–800; roman only is enough), Shantell Sans
  (variable, subset to wght 500–600 with INFM and BNCE). That makes three files. Code uses the system
  mono stack, so there's no fourth family. Preload Bagel only, because it's the cover.
- **Effects cost:** grain is a single fixed `body::before` layer behind the content, tiled from a
  220px inline-SVG `feTurbulence` data URI and rasterised once. Halftones are CSS
  radial-gradients. Doodles are a single inline `<symbol>` sprite. There are no images.
- **JS (~2 KB, optional):** option switch (URL → localStorage → color-scheme), keeps the option
  on links between pages, and the one-off "press run" of drum 2 on the cover name
  (IntersectionObserver, skipped under reduced motion). Without JS the page renders in the
  default option, everything visible.
- Real photos would get a duotone halftone pass at build time (sharp + a 2-colour threshold
  map), so they print in the active option's inks.

## Self-score (BRIEF §7)

| Criterion | Score | Why |
|---|---|---|
| Recognisable | 5 | Screened overprint headlines, folios and a clogs sticker on the cover are hard to forget. |
| Credible | 4 | Spec sheet, RAM bar, nested-box diagram and the flat day-job spread hold the depth. Some senior readers may still find the playfulness a notch too much. |
| Personal | 4 | The format fits the DIY homelab and Rotterdam-printshop energy. The idea isn't unique to Guus, but the content makes it his. |
| Durable | 3 | Riso zine is a recognisable 2020s look and could date. The grid and type system underneath will outlast the ink effects, which you could tone down later. |
| Buildable | 5 | Static CSS, three fonts, ~2 KB JS, no images. Every effect is a token or a pseudo-element. |
