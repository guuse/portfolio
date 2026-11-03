# 05 · Wandpaneel (wall panel)

## Concept

The site is the wall panel of Guus's smart home, turned into a status interface for a person.
The first screen is one dense, typeset panel of live-feeling state: the Rotterdam clock, a guess
at where Guus is right now ("is at Harborn", derived from the time of day, never tracked), what
he's on duty for at Harborn (security, cloud & platform, architecture), Argo CD at 16/16, the last
deploy, the RAM budget as sixteen 1 GB cells, the Finder's countdown to its next run, 283 finds
and 0 Rover clogs ("Still looking."). On wide screens the panel sits in a physical tablet frame on
a plaster wall. Every tile links into a "detail view" below: rows for specs, settings toggles for
principles, an event log for the gotchas, trigger → action rows for automations, job panes for the
day job. Numbers are the imagery.

## Why it fits Guus

He actually has a wall panel, and the homelab is the thing he's proudest of. A status UI is the
most honest way to "show depth instead of claiming it": every number on the first screen is real
(or plainly labelled illustrative) and every one opens into the story behind it. The day job gets
its own tile on the first screen and a full detail view right before the homelab, and the two are
tied together: each job pane ends with a "same rule at home" link into the matching homelab
section, and the view closes with the bridge line ("Same rules, smaller blast radius"). Job titles
only appear as small facts; the copy says what the work is.

## Options (tokens only)

| Option | What it is | Pick it when |
|---|---|---|
| `daylight` (default light) | Warm cream screen on a plaster wall, umber ink, one lamp-amber accent, soft frame shadow | The default. Friendly, warm, reads as a physical object |
| `oled` (default for dark preference) | True black, hairlines instead of shadows, one vivid orange, no glows | Dark-mode visitors; the most "premium device" version |
| `e-ink` | Pure greyscale, 0 radius, CSS dither patterns in meters, no tweening, seconds hidden, a 300 ms black/white refresh flash on switching (skipped under reduced motion) | The most distinctive; a great "remember it tomorrow" option, could be an easter egg |

All three override tokens only (`--c-seg-*` and `--c-day-*` hold the dither patterns,
`--c-dur: 0ms` and `--c-seconds: none` carry e-ink behaviour).

## Risks

- **Dashboard look.** The direction lives next to the banned bento grid. It's defended by
  information-driven spans (no two tiles in a row are the same size), real data density, tabular
  numerals instead of icons, restrained radius, one hero tile and the device frame. A careless
  build (equal tiles, icons) would collapse into a SaaS template quickly.
- **Fake live data.** Readouts are illustrative or clock-derived. The panel says so in one line
  and the "Guus is" note says "guessed from the clock, not tracked". In production, Argo/deploy/
  finds counts should come from build-time data, or stay clearly illustrative.
- **The panel is taller than 900 px at 1440 wide**: the fourth tile row (Finder, finds, clogs)
  sits just below the fold. Intentional: the cut invites the scroll.
- **Real content lives below the fold.** Anyone who only looks at the panel gets the summary; the
  depth needs one scroll. The detail views are long but each starts with "← Panel".

## Scaling to 10+ projects

The Projects view is a device list: two featured panes, then compact rows (name, line, body,
status chip). Ten more projects are ten more rows, no layout change. The panel itself doesn't
grow: tiles are chosen for numbers worth reading (at most one new tile per year, e.g. a project
that earns a metric). Toolbox groups are `auto-fit` columns and absorb new groups.

## Build notes

- **Astro components:** `Panel` (frame + grid), `Tile` (label, value, sub, href) with variants
  `ClockTile`, `DutyTile`, `ArgoTile`, `RamTile`, `FinderTile`; `DetailView` (bar + head + slot),
  `Rows`, `Setting`, `Automation`, `EventLog`/`Event`, `Record`, `JobPane`, `Bridge`, `ArchLayer`
  (recursive), `Budget`, `ProjectFeatured`, `ProjectRow`, `ToolGroup`, `ReviewBar` (dev only).
  Content from collections mirroring CONTENT.md; Argo count, last SHA and deploy date injected at
  build time.
- **Fonts to self-host:** Onest variable (wght 200–800, Latin + Latin-ext) and Martian Mono
  variable (wdth 75–112.5, wght 300–700), both WOFF2 subsets, `font-display: swap`, preload Onest.
- **JS:** `wandpaneel.js` is about 7 KB unminified: option switch (URL → localStorage →
  prefers-color-scheme), tabs, the Europe/Amsterdam clock, the clock-derived status and day bar,
  the Finder countdown, sunset-based hallway light and the RAM use drift. Without JS every readout
  shows sensible static text ("is in Rotterdam", "Runs every 2 h", "CET") and tabs render stacked.
  Known gap: without JS a dark-preference visitor gets `daylight` (avoids duplicating the OLED
  token block in a media query; easy to add at build time).
- **Files:** `index.html`, `system.html`, `wandpaneel.css` (tokens, options, components),
  `wandpaneel.js`.

## Self-score (BRIEF §7)

| Criterion | Score | Why |
|---|---|---|
| Recognisable | 4 | "Guus is at Harborn." in huge type next to a ticking clock and "Rover clogs found: 0" is memorable; e-ink especially so. Loses a point because "dashboard" is a known genre |
| Credible | 5 | Real numbers everywhere, each one opens into the decision, the log entry or the spec behind it; the day job's "same rule at home" links make the role claims believable |
| Personal | 5 | Only works for someone who actually runs a wall panel, a homelab and a clog-hunting bot |
| Durable | 3 | Status UIs date faster than editorial layouts, and the live gimmicks may feel less fresh in two years. The token system and detail views age fine |
| Buildable | 4 | Static, tiny JS, no libraries. The only real work is build-time data for Argo/deploy/finds and keeping the panel honest |
