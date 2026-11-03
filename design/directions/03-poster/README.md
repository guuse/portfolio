# 03 · Affiche (poster)

**Concept.** The homepage set like a Rotterdam festival poster or exhibition catalogue: type is the
image, numbers are the graphics. One variable display face (Anybody) does all the shouting. It runs
from ultra-condensed to ultra-expanded, and that width contrast is the identity. A book face
(Newsreader) does the explaining. A strict 12-column grid is drawn in the hero and broken on
purpose: a red field with a giant "15" bleeds off the page, "16 GB" becomes four flat colour fields
(10 / 3 / 2 / 1), a lone "0" stands in for the clogs the bot has never found, running heads run
vertically in the margin. Flat colour, hard edges, radius 0, no shadows, no gradients.

**Why it fits Guus.** His content is full of good numbers (16 GB, 15 services, 33,000 cards, every
2 h, 0 clogs). A poster system turns them into the visuals, so there's no need for stock
illustrations or icons. It's Dutch and Rotterdam-specific without being kitsch. The magazine
structure (feature opener, spec sheet, pull quote, numbered decisions, index) gives the homelab the
depth of a properly edited story. The day job gets the same treatment: its own full-bleed feature
band (black) right before the homelab band (red). Its headline comes from what the work is ("How
it's built. Where it runs. Who gets in."). His one title (tech lead, infra team) stays small, as a fact.

## Options (token overrides only, `data-option` on `<html>`)

| Option | Palette | Pick it when |
|---|---|---|
| `rotterdam` (default) | signal red, black, off-white | The canonical poster. Loudest, most recognisable. |
| `polder` | grass green, sky blue, white, tulip orange | Want it friendlier and fresher, less "agency". Clashes are softer. |
| `nachtdruk` (default for dark preference) | black stock, off-white type, one fluorescent pink | Dark mode, or if the red feels too political/corporate. Most "club flyer". |

All values come from one palette definition (OKLCH). A Node script generates `tokens.css` and the
contrast tables in `system.html`, so they can't drift apart. Every pair passes its target: body ≥ 7:1,
muted ≥ 4.5, accent text ≥ 4.5, rules/focus ≥ 3.

## Client feedback round 1 (applied)

- The laptop's brand and model, and the CPU model, are gone everywhere: copy, aria labels, SVG titles,
  placeholders, spec table, system sheet. The mini PCs have no brands either.
  A case-insensitive grep over this folder for the brand, model and CPU names returns nothing.
- Hero: one-liner A, sub-line "Tech lead of the infra team at Harborn, Rotterdam.", title/meta per
  CONTENT §0. The masthead meta row reads "Security · Cloud · Architecture" as a topic line only.
- Work is rebuilt as a **co-lead feature band**, placed directly before the homelab. It has a fitted
  three-line headline, a TitleLine (the single title "Tech lead · Infra team" as a mono fact
  between rules), the new intro, then "What the job covers": three **AreaBlocks** (Security /
  Cloud & platform / Architecture, labelled as areas, not roles) as three flat fields, an "Also" list
  with the single client line, and the **BridgeQuote** leading into the homelab. There are no
  shields, padlocks or slashed title stacks, and no client case-study treatment.
- The toolbox gained a Security group. `system.html` documents the new components (FeatureBand,
  TitleLine, AreaBlock, BridgeQuote) and a do/don't on how to set the title.
- Round 2: the three-title wording is gone everywhere; there is one title, tech lead of the infra team.

## Risks

- **Loud.** It could read as a design-studio site more than an engineer's. Mitigation: the body copy
  is calm serif at a proper measure, and the spec table and diagram are sober.
- **Fitted type depends on the webfont.** The `--fit` values are measured for Anybody. If the font
  fails, `poster.js` refits by measuring, and without JS the fallback may run slightly short or long
  (clipped, never scrolling). Changing a headline means re-measuring its `--fit` (a 10-line script).
- **The red** (rotterdam) sits close to political or sale-poster territory. Polder and nachtdruk are
  the escape hatches.
- **Density on mobile.** The poster logic survives at 390px, but the page is long (about 20k px).

## Scaling to 10+ projects

The projects section is an index: two featured spreads (each with one huge number), then compact
numbered rows. Ten more projects are ten more rows. The numerals run 03, 04 … 12, and each project
can nominate one "hero number" if it gets promoted to featured. If the list gets long, the index
could get its own page, with the homepage showing the top two plus five rows.

## Build notes

- **Astro components:** `Masthead`, `Hero`, `StatusChip`, `SectionHeader`, `FeatureBand`,
  `TitleLine`, `AreaBlock`, `BridgeQuote`, `NowList`, `SpecTable`, `BudgetBar`, `ArchDiagram` (HTML,
  not SVG), `DecisionCard`, `GotchaNote`, `ProjectFeatured`, `ProjectRow`, `Principle`, `Toolbox`,
  `Footer`, `ReviewBar` (mock only). Content comes from collections. `FitLine` takes text plus a width
  setting and computes `--fit` at build time with fontkit, so nobody hand-measures.
- **Fonts to self-host:** Anybody variable (wdth 50–150, wght 100–900; subset Latin + Latin-ext,
  ~60–70 KB, the only preload), Newsreader variable roman + italic (~45 KB subset), IBM Plex Mono
  400/500 (~2 × 15 KB). Plex could be cut for `ui-monospace` to stay at 3 files and under 120 KB.
- **JS:** about 1.5 KB: option switch plus the fit safety net. Everything renders without JS; fitted
  type is pure CSS (`container-type: inline-size` + `calc(100cqi / var(--fit))`).
- **CSS:** layers per FOUNDATIONS. `tokens.css` is generated, `poster.css` holds components. No
  gradients except one hard-stop hatch pattern for "spare".

## Self-score (BRIEF §7)

| Criterion | Score | Honest note |
|---|---|---|
| Recognisable | 5 | The "15" field, the four 16 GB fields and the lone "0" stick. Nobody else's portfolio looks like this. |
| Credible | 4 | The magazine structure gives both features real depth. The loudness can work against "serious" for some CTO readers. |
| Personal | 4 | Rotterdam, Dutch design and his own numbers make it his. The style itself could be borrowed by another designer. |
| Durable | 3 | Poster styles date. The strict system (one face, tokens, index) helps, but expect a refresh in two years. |
| Buildable | 5 | Static, pure CSS, tiny JS, one display font file doing most of the work. |

## Files

`index.html`, `system.html`, `poster.css`, `tokens.css` (generated), `poster.js`, `README.md`.
Previews in `../../previews/03-poster--*.png`.
