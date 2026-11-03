# 01 · Spec Sheet

**Concept.** Guus as a well-documented piece of hardware. The homepage is the datasheet of
the "GE-1, dual-function unit, Rev. 2026.11, made in Rotterdam": every section opens with a
drawing strip (§ number, name, DWG number, sheet x/7), specs sit in ruled tables with tabular
numerals, the old laptop is an orthographic outline drawing with numbered balloons and a parts
list, the RAM budget is a load diagram with dimension lines, the architecture is an exploded
plate diagram, the gotchas are an errata sheet, side projects are "compatible modules" with part
numbers, How I work is "operating instructions", the toolbox is a bill of materials and the
footer is a declaration of conformity (cookies: 0). One label-maker tape per view sits slightly
crooked and carries the status or the joke.

## Why it fits Guus

His work is documentation-first: context files, ADRs, a homelab guide good enough to rebuild
from in an afternoon. A datasheet is the visual form of that habit. It also makes the security /
cloud / architecture day job read as what it is (owning specs, interfaces and access) without
any shields or "architecting" language: the title ("Tech lead · Infra team") is one small table
row, the three areas the job covers are AR-01…03 sheets, and the work
section's figure shows the three questions he answers before a client project gets built. The
homelab's real numbers (10/3/2/1 GB, 16 manifests, 0 open ports, 0 Rover clogs) are exactly what
a spec sheet is for, and the humour lives in the labels ("Battery: the UPS", "Skill bars: not
included with this unit").

## Options (tokens only, `data-option` on `<html>`)

| Option | Look | Pick it when |
|---|---|---|
| `paper` (default light) | Warm off-white, near-black ink, safety orange | The default. Warmest, most "printed manual". |
| `night-shift` (default for dark preference) | Graphite, bone ink, phosphor amber | Dark-mode visitors, and if the site should feel more "lab at 1am". |
| `hi-vis` | Cool concrete, near-black, fluorescent yellow-green tape with an ink edge, 0 radius | The most graphic and youngest; workwear energy. Riskiest on cheap screens. |

All ink/surface pairs are measured in `system.html` (body ≥ 13:1 everywhere, muted ≥ 7.6:1,
labels ≥ 4.3:1, text on tape ≥ 5.5:1, accent-as-text ≥ 5.1:1).

## Round 1 client feedback (applied)

- The laptop's brand, model and CPU model are gone from copy, alt text, SVG titles, the spec
  table and the system sheet ("second-hand laptop · 11th-gen Intel, 4 cores / 8 threads").
  Mini PCs have no brands. A case-insensitive grep for the old brand and model names over this folder comes back empty.
- Title and meta follow CONTENT §0/§1: one-liner A, sub-line "Tech lead of the infra team at
  Harborn, Rotterdam." (round 2: one title only; security, cloud & platform and architecture are
  areas the job covers, never titles).
- §02 Work was rebuilt to carry as much weight as the homelab: the intro, a single title fact
  ("Tech lead · Infra team", small type), Fig. 3 (input → architecture → cloud & platform → security → output),
  three area sheets under "What the job covers" (Security / Cloud & platform / Architecture, each with a
  line and three numbered bullets), "Also fitted" (AI tooling, hands-on), the one-line client
  list, and the bridge ("Test rig") mapping the three rules to their homelab implementation
  with a dashed coupling line into §03. Security was added to the bill of materials.
- No client case-study treatment; clients are one small label line.

## Risks

- **Too clever by half.** Part numbers everywhere can tip into costume. Rule: a part number
  must index something real (a section, a decision, an erratum), never decorate.
- **Density.** It's a long, information-heavy page. The strips and TOC carry navigation, but a
  recruiter skimming on a phone still scrolls a lot. Mitigated by the hero key-specs table
  (title, location, contact in the first screen).
- **Tape legibility.** Embossed caps on a tilt are slower to read; keep tape copy under ~70
  characters and never put essential-only information there (the status also lives in Now).
- **Hi-vis** yellow is 1.01:1 against concrete; it only works because every yellow fill has an
  ink edge. Lose the edge, lose the shape.

## Scaling to 10+ projects

Two featured module sheets, the rest are rows in the compatibility table (part no., name,
line, status), which scales to dozens and sorts cleanly. A project that earns depth gets its own
DWG page using the same parts (spec table, errata, decisions) — the homelab is the template.
Errata and decision IDs (E-xx, DR-xx) are stable, so they can be linked from posts and commits.

## Build notes

- **Astro components:** `SiteHeader`, `Strip` + `SectionHeader`, `Tape`, `Sig` (status word +
  shape), `SpecTable`, `RevList`, `TitleFact`, `FlowFigure`, `AreaSheet`, `Bridge`,
  `BudgetBar` (data-driven from the `ram_gb` object, 1 GB = 1 grid column), `ArchPlate`
  (recursive, from a nested YAML tree), `DecisionList`, `ErrataSheet`, `Module`, `CompatTable`,
  `Steps`, `Bom`, `Declaration`, `Drawing` (SVG + parts list), `Photo`.
  Content in collections mirroring CONTENT.md; DWG/sheet numbers generated from section order.
- **Fonts to self-host:** Archivo variable (wdth 62–125, wght 100–900, upright only) and
  Martian Mono variable (wdth 75–112.5, wght 100–800). Latin + Latin-ext subsets, 2 files,
  preload Archivo only.
- **JS:** `spec.js` (~1.5 KB) for the option switch; the drawing's plot-in and tape "stick"
  animations are CSS, gated by a `.js` class and `prefers-reduced-motion`. Everything reads
  with JS off. The review bar is mock-only.
- **CSS:** `spec.css` on top of `system/base.css`, cascade layers as in FOUNDATIONS §10.
  Container queries would replace a few viewport media queries in the components in the build.

## Self-score (BRIEF §7)

| Criterion | Score | Note |
|---|---|---|
| Recognisable | 5 | Expanded name, outline drawing with balloons, crooked tape: it's memorable in one screen. |
| Credible | 5 | The format *is* depth: every number has a row, every mistake an erratum ID. The work section now carries the same rigour. |
| Personal | 4 | The content makes it Guus's (lid shut, clogs = 0, test rig). The datasheet frame itself could be borrowed by another engineer. |
| Durable | 4 | Manual typography ages well; the risk is the gimmick wearing thin, so it must stay content-led. |
| Buildable | 5 | Static HTML/CSS, two variable fonts, one tiny script, no images until real photos exist. |
