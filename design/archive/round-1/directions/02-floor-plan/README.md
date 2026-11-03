# 02 · Plattegrond (floor plan)

## Concept

The site is Guus's home, drawn as an architectural floor plan seen from above. The hero is a
plan of a plausible Dutch apartment (poché walls, door swings, windows, furniture, dimensions in
mm, areas in m² with a decimal comma), and the rooms are the navigation: the **hal** is the
intro, the **werkplek** (the study, the biggest room after the living room) is the day job, the
**meterkast** (the Dutch utility cupboard by the front door) is the homelab, the **woonkamer** is
home automation, the **berging** downstairs holds six boxes of side projects, the **keuken** is
how he works and what's in the pantry, and the **voordeur** is the contact. Zigbee devices are
drawn in their rooms with a dashed mesh back to the coordinator behind the TV, and the light
switches work. The plan is labelled "not to scale, not my actual address".

## Why it fits Guus

The star project is a house that runs itself, and the day job is deciding how systems are built,
where they run and who gets in. A floor plan is literally that: a drawing of who can go where.
It is specific to a person who automates his home, it's a little bit Dutch, and the humour comes
from the content (the homelab in the meterkast, side projects in boxes, a "last phone leaves"
button that switches the plan off).

## The options (tokens only, `data-option` on `<html>`)

| Option | What it is | Pick it when |
|---|---|---|
| `daylight` (default light) | Warm cartridge paper, graphite linework, architect's pastel colour codes per room, one tomato accent | The default. Clearest, most "architect's drawing" |
| `blueprint` | A diazo/cyanotype print: Prussian-blue paper with grain and tonal wash, white linework, marker-yellow accent | If you want it to feel more like a print than a page; strongest single image |
| `lights-out` (default dark) | The evening plan: dark rooms, lit rooms glow amber; the "everything off when the last phone leaves" automation becomes visible | Visitors who prefer dark; the best showcase for the light-switch interaction |

## Feedback rounds applied

- No laptop brand or model anywhere ("an old laptop", "second-hand laptop", "11th-gen Intel").
- The day job has the same weight as the homelab: the **werkplek** became the large north-east
  room (13,1 m², was a 7,4 m² box room) and gets a full-size section placed right before the
  homelab: one title fact (**Tech lead · Infra team**), the intro, and the three areas of the job
  (Security / Cloud & platform / Architecture) drawn as a *programma*: three rooms in one walled
  block with doors between them. A doorway line ("Same rules, smaller blast radius") leads into
  the meterkast. Security has its own shelf in the toolbox.
- Security, cloud and architecture are presented as areas of the job, never as titles.

## What's risky

- **The concept can become a costume.** It works because it is drawn correctly; a sloppy plan
  would read as a gimmick. Any change to the plan needs someone who cares about line weights.
- **The plan is a dense image on phones.** Below 600px it crops to the apartment, hides
  annotations and dimensions, and enlarges the room tags; the room schedule under it is the real
  navigation. It's good, not as good as desktop.
- **Dutch room names** are flavour. Every one has its English beside it, but a non-Dutch reader
  could still find "meterkast" a hurdle; the one-line explanation does the work.
- The illustrative plan could be read as a real address. It's labelled twice as not.

## How it scales to 10+ projects

New side projects become new boxes in the berging (numbered *dozen*; the compact grid takes any
number). A new big topic becomes a new room: the plan has a balcony and a *zolder* is still
available. Case studies can get their own *detail* drawings (like Detail 04, the TV wall) and
section drawings (like Doorsnede A–A), which is a format that grows without new components.

## Build notes

- **Astro components:** `SiteHeader`, `FloorPlan` (generated SVG + room data from a content
  collection: rooms, areas, devices, mesh), `KeyPlan` (one `<symbol>`, current room via a CSS
  variable on `<use>`), `RoomHeader`, `RoomSchedule` + `LightSwitch`, `StatusChip`, `NowList`,
  `RoleFacts`, `Programme`, `Bridge`, `SpecTable`, `RamFloor`, `SectionDrawing`, `Decision`,
  `Revision`, `ProjectBox` (featured/compact), `Tags`, `Principle`, `Pantry`, `Footer` +
  `TitleBlock`, `Photo`.
- The plan is generated from data (in the mock by a small Node script: rooms as polygons, a
  `door()` helper that computes swing arcs, windows, devices, mesh). In Astro that becomes a
  build-time component, so the plan stays editable as data, not as hand-edited path soup.
  The woonkamer detail is a static cropped copy of the plan art (`<use>` can't take the
  document's styles).
- **Fonts to self-host** (3 files): Bricolage Grotesque (variable: opsz, wdth, wght), Atkinson
  Hyperlegible Next (variable wght; roman only in production), Fragment Mono (regular). Subset
  Latin + Latin-ext. Preload only Bricolage.
- **JS (~4 KB, optional):** option switch, room lights (buttons with `aria-pressed`, mirrored in
  the plan), schedule-row ↔ plan hover sync, compact plan crop on phones, current room in the
  nav. Without JS: rooms are plain links, the plan shows a default evening state, switches
  are hidden.
- Weight: the hero plan inline is ~23 KB of SVG (≈5 KB gzipped), the detail copy another ~19 KB.
  In production the detail could be a cropped static SVG file, lazy loaded.

## Self-score (BRIEF §7, honest)

| Criterion | Score | Why |
|---|---|---|
| Recognisable | 5 | Nobody else's portfolio opens on a floor plan with working light switches |
| Credible | 4 | The plan earns trust through accuracy, and the spec schedule, section drawing and revisions carry real depth. The concept could still make a CTO smile before they read |
| Personal | 5 | Home automation, the meterkast, a Dutch flat, the berging with bikes: only Guus |
| Durable | 3 | Architectural conventions age well, but a metaphor this strong can feel heavy by year two; the system (schedules, notes, revisions) survives without the plan |
| Buildable | 4 | Static SVG + CSS + 4 KB of JS. The plan generator is the only bespoke part |
