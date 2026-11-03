# Design system: foundations

The five directions look nothing alike, but they share **one structure**. Whichever direction
wins (or whichever mix of them), the build plugs into the same token contract, the same
component inventory and the same quality bar. That is what lets us swap a direction's skin
without rewriting the site.

```
foundations (this doc)      ← shared rules: architecture, scales, a11y, motion, perf
   └─ tokens.schema.json    ← the token names every direction must define
   └─ base.css              ← reset + utility primitives, direction-agnostic
directions/0N-*/system.html ← that direction's *values* for the tokens + its component styling
```

---

## 1. Token architecture

Three tiers. Components **only** read tier 3 (or tier 2 where no component token exists).
Primitives are never referenced from components.

| Tier | Prefix | Example | Who changes it |
|---|---|---|---|
| 1 · Primitive | `--p-` | `--p-orange-500: oklch(68% 0.19 45)` | Direction author |
| 2 · Semantic | `--` (role) | `--surface`, `--ink`, `--accent`, `--line` | Theme/option switch |
| 3 · Component | `--c-<comp>-` | `--c-chip-bg`, `--c-spec-row-gap` | Component author |

**Colour is authored in OKLCH.** It gives perceptually even ramps, makes contrast predictable
across hues, and `color-mix(in oklch, …)` produces honest tints. Each primitive ships with a
hex fallback in `system.html` for design tools.

### 1.1 Required semantic tokens

Every direction **and every option** must define all of these (see `tokens.schema.json`):

```
Surfaces   --surface  --surface-raised  --surface-sunken  --surface-inverse
Ink        --ink  --ink-muted  --ink-subtle  --ink-inverse
Accent     --accent  --accent-ink (text on accent)  --accent-soft
Signal     --ok  --warn  --danger   (status chips, "learned the hard way")
Lines      --line  --line-strong  --focus
Type       --font-display  --font-body  --font-mono
Radius     --radius-s  --radius-m  --radius-l  (0 is a legitimate value)
Shadow     --shadow-1  --shadow-2  ("none" is a legitimate value)
```

### 1.2 Options = token overrides, not new CSS

Each direction has **2–3 options** (palette, mood, density, type pairing). An option is
implemented as a `data-option="…"` attribute on `<html>` that **only overrides tokens**. If an
option needs structural CSS, it isn't an option, it's a different direction.

```html
<html data-direction="spec" data-option="paper">
```
```css
:root[data-option="night"] { --surface: var(--p-ink-950); --ink: var(--p-paper-50); … }
```

Dark mode follows the same mechanism: `prefers-color-scheme` picks the default option, and a
user's choice (stored in `localStorage`, wrapped in try/catch) wins.

---

## 2. Typography

### 2.1 Fluid type scale

One modular scale, interpolated between a **360px** and a **1440px** viewport with `clamp()`.
Ratio at small screens is **1.2** (minor third), at large screens **1.333** (perfect fourth).
Directions may push the display steps further. That's where personality lives.

| Step | Token | 360px | 1440px | Use |
|---|---|---|---|---|
| −2 | `--step--2` | 11.1px | 11.3px | Labels, legal, axis ticks |
| −1 | `--step--1` | 13.3px | 15px | Meta, captions, mono data |
| 0 | `--step-0` | 16px | 18px | Body |
| 1 | `--step-1` | 19.2px | 24px | Lead, H4 |
| 2 | `--step-2` | 23px | 32px | H3 |
| 3 | `--step-3` | 27.6px | 42.6px | H2 |
| 4 | `--step-4` | 33.2px | 56.8px | H1 (section) |
| 5 | `--step-5` | 39.8px | 75.7px | Display |
| 6 | `--step-6` | 47.8px | 101px | Hero (directions may go far beyond) |

`--step-0: clamp(1rem, 0.9583rem + 0.1852vw, 1.125rem);` and so on: generated values live in
`base.css`.

### 2.2 Rules

- **Measure:** body copy 60–72ch (`max-width: 68ch`). Mono data blocks can go wider.
- **Line height:** body 1.55, headings `1.05–1.15`, display `0.9–1.0`. Tighten as size grows.
- **Tracking:** display type gets negative tracking (−0.02 to −0.04em). All-caps labels get
  positive tracking (+0.06 to +0.12em). Never track lowercase body text.
- **Numerals:** spec tables and data use `font-variant-numeric: tabular-nums slashed-zero`.
- **Variable fonts first.** One file per family with axes beats four static weights. Use
  `font-optical-sizing: auto` where the font supports `opsz`.
- **Max two families + one mono** per direction.
- **Fonts:** Google Fonts for the mocks. For production, self-host WOFF2 subsets (Latin +
  Latin-ext, so ë/é/ĳ work), `font-display: swap`, preload only the hero face.
- **Banned as primary identity:** Inter, Poppins, Space Grotesk, Montserrat, Roboto. (Fine as a
  body fallback deep in the stack.)

---

## 3. Space, size & layout

### 3.1 Spacing

4px base, a non-linear scale. Token names are t-shirt sizes so they read in markup.

| Token | px | Token | px |
|---|---|---|---|
| `--space-3xs` | 4 | `--space-l` | 32 |
| `--space-2xs` | 8 | `--space-xl` | 48 |
| `--space-xs` | 12 | `--space-2xl` | 64 |
| `--space-s` | 16 | `--space-3xl` | 96 |
| `--space-m` | 24 | `--space-4xl` | 144 |

Section spacing is fluid: `--space-section: clamp(4rem, 2rem + 8vw, 10rem)`.

### 3.2 Grid

- **12 columns** on ≥ 960px, **6** on 600–959px, **4** under 600px.
- Gutter `clamp(16px, 2vw, 32px)`. Page margin `clamp(16px, 4vw, 64px)`. Never less than 16px.
- Max content width **1440px**. Text never spans more than 8 of 12 columns.
- Directions are encouraged to **break the grid deliberately** (bleed, overlap, offset), but
  only from a grid. Breaking needs something to break.

### 3.3 Breakpoints (content-driven, min-width)

`600px` (phablet → tablet) · `960px` (tablet → desktop) · `1280px` (wide) · `1600px` (huge).
Components prefer **container queries** over viewport media queries.

---

## 4. Colour & contrast

- **WCAG 2.2 AA minimum, aim for AAA on body text.** Body ink on surface ≥ 7:1, muted ink
  ≥ 4.5:1, subtle ink (labels only, never paragraphs) ≥ 3:1, accent used as text ≥ 4.5:1, UI
  boundaries and focus rings ≥ 3:1 against adjacent colours.
- Each `system.html` prints the **actual measured ratio** next to every ink/surface pair.
- **Never rely on colour alone** for status. Pair `--ok/--warn/--danger` with an icon, a word or
  a shape.
- One accent, used sparingly. If everything is orange, nothing is.

---

## 5. Component inventory

The homepage is built from these. Every direction styles **all of them** in `system.html`.

| Component | Purpose | Notes |
|---|---|---|
| `SiteHeader` | Name/mark, 4–5 nav links, option/theme switch | Sticky or not, direction's choice. Skip-link first. |
| `Hero` | Name, one-liner, sub-line, status | Must fit above the fold at 360×640 |
| `StatusChip` | "Currently: …" | Live dot optional, must respect reduced motion |
| `NowList` | 3–4 short items | |
| `SectionHeader` | Index/number + title + optional kicker | Numbering system is a direction identity point |
| `SpecTable` | Key/value specs (homelab) | `<dl>` or `<table>`, tabular numerals |
| `BudgetBar` | RAM split 10/3/2/1 of 16 | Accessible: real text values, not just widths |
| `ArchDiagram` | Layered architecture | Inline SVG or HTML, readable at 360px, text selectable |
| `DecisionCard` | Decision + why | |
| `GotchaNote` | "Learned the hard way" | Uses `--warn`/`--danger` + label |
| `ProjectEntry` | Side project: name, line, bullets, stack, status, link | Featured + compact variants |
| `Tag` | Stack items | Plain text, not pills-with-icons |
| `Principle` | Numbered "how I work" item | |
| `Toolbox` | Grouped tool list | No skill bars, no logos-wall |
| `Footer` | Contact, links, build meta | |
| `Link` / `Button` | | Underline links in body text. Hover ≠ only affordance. |

---

## 6. Motion

Motion explains, it doesn't decorate.

| Token | Value | Use |
|---|---|---|
| `--dur-instant` | 80ms | Press states, toggles |
| `--dur-quick` | 160ms | Hover, focus, chip changes |
| `--dur-base` | 280ms | Panels, theme switch |
| `--dur-slow` | 520ms | Hero entrance, diagram reveal |
| `--ease-out` | `cubic-bezier(.2,.7,.2,1)` | Things arriving |
| `--ease-in-out` | `cubic-bezier(.6,0,.3,1)` | Things moving |
| `--ease-spring` | `linear(0, .52 9%, .89 18%, 1.03 27%, 1.04 33%, 1 45%, .99 60%, 1)` | Playful directions only |

- **`prefers-reduced-motion: reduce`** → all non-essential animation off, transitions ≤ 80ms
  opacity only. Non-negotiable.
- No scroll-jacking. No parallax on text. Scroll-driven animations (`animation-timeline: view()`)
  are allowed as progressive enhancement, never as the only way to see content.
- Nothing loops forever except an explicit "live" indicator, and that stops under reduced motion.

---

## 7. Accessibility checklist (every direction)

- [ ] Semantic landmarks: `header`, `nav`, `main`, `section[aria-labelledby]`, `footer`
- [ ] Skip link, visible on focus
- [ ] One `h1`, logical heading order
- [ ] `:focus-visible` ring using `--focus`, ≥ 2px, offset, ≥ 3:1
- [ ] All interactive targets ≥ 24×24px (aim 44×44 on touch)
- [ ] Diagrams have a text alternative (the same info as a list, or `aria-describedby`)
- [ ] Decorative SVG `aria-hidden="true"`; meaningful SVG has `<title>`
- [ ] Option switcher is a real `radiogroup` (or buttons with `aria-pressed`), keyboard-operable
- [ ] Works at 200% zoom and 320px width without horizontal scroll
- [ ] `lang="en"`; Dutch words wrapped in `<span lang="nl">`

---

## 8. Iconography & imagery

- **Prefer type, rules and shapes over icons.** If an icon is needed, draw it (inline SVG,
  1.5px stroke at 24px, square caps) in the direction's style. No icon-font, no generic
  Lucide-everything.
- **Photography:** real photos of the actual setup (the laptop, the Zigbee stick on its
  cable, the wall panel) beat any illustration. Mocks use placeholders labelled
  `PHOTO: …` so it's clear what to shoot. `[TODO Guus: shoot these]`
- Illustrations/diagrams are inline SVG drawn from the real architecture.

---

## 9. Performance budget (production)

| Metric | Budget |
|---|---|
| HTML+CSS (gzip) for `/` | ≤ 50 KB |
| JS on `/` | ≤ 15 KB (option switch + small enhancements), works without |
| Fonts | ≤ 3 files, ≤ 120 KB total WOFF2 |
| Images | AVIF/WebP, `width`/`height` set, lazy below the fold |
| LCP (4G, mid phone) | < 1.8s |
| CLS | < 0.02 |
| Lighthouse | 100 / 100 / 100 / 100 |
| Third-party requests | 0 (no analytics, no embeds, fonts self-hosted) |

---

## 10. Naming & file conventions (for the build)

- CSS: cascade layers `@layer reset, tokens, base, layout, components, utilities, options;`
- Class naming: component-first, lowercase-hyphen (`.spec-table`, `.spec-table__row`).
  No utility-framework soup in the markup.
- Tokens live in `src/styles/tokens/<direction>.css`, components in co-located Astro files.
- Content (projects, specs, decisions) lives in Astro content collections (Markdown + Zod
  schemas mirroring `CONTENT.md`), never hard-coded in components.
