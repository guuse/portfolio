# r2-beeld · Beeld voorop (image first)

## The idea
An image-led, editorial portfolio, built the way a photographer's or studio's site would be. Big
photos do most of the work: a tall portrait next to a short serif headline, a full-bleed image for
the featured project, and an asymmetric grid of wide, tall and square crops with plain captions
underneath. Work and About are short text sections between those image moments. There's no concept
or theme. The quality comes from scale contrast, generous space and calm type.

## Options (tokens only)
- **`wit`** (default): a near-white, slightly cool gallery background with near-black ink and one
  quiet ink-blue accent for hover and focus.
- **`donker`**: a deep, neutral dark gallery wall. The photo tones stay identical (a real photo
  doesn't change with the background), so the images stand out more.

Switch with the review bar, `?option=wit|donker`, or localStorage (`r2-beeld:option`).

## Type
- **Instrument Serif** (display, used sparingly): the intro headline, section titles, project
  titles, the numbers and the email address. It's condensed and elegant, so a big headline sits
  next to a portrait like a magazine cover line without shouting. It also isn't a "tech" font.
- **Schibsted Grotesk** (everything else): a newspaper-born sans with sturdy, slightly
  characterful shapes. It keeps body text and captions clear without looking like a default UI font.
- Mono falls back to the system stack (no third family is loaded).

## Why it fits Guus
He asked for "just a normal website", and this is the most normal format there is: pictures of
the things he made, with a few honest sentences. The serif adds warmth and youth without
tech decoration, and it lets non-technical friends browse the site like a magazine. His projects
are real, physical and visual (a laptop under the TV, a wall panel, a game table, a quiz on a phone),
so photos tell that story better than any diagram-as-decoration.

## What it needs: real photos
The direction depends on them. Shot list (placeholders already in the right ratio):
- Portrait of Guus, **4:5**, calm light, plenty of background.
- Homelab: the setup under the TV (wide, landscape, used full-bleed), the wall panel (4:5), the
  Zigbee stick on its cable (1:1), and later the three mini PCs in their rack.
- Screenshots for Rules of 99, 2nd-hand finds, Quizmaster (ideally the quiz on an actual phone)
  and Scryfall. Present screenshots inside a device or on a plain tonal backdrop so they hold up
  at large sizes.
- Optional: a Commander night with friends (About, 3:2). Drop that image if it doesn't exist.

Keep the colour grading consistent (similar white balance, soft light). The placeholder tones
show the intended mood: muted slate, moss, sand, rose and sea-grey, never saturated.

## How it scales to more projects
- The featured slot is always one full-bleed image plus the story.
- The grid repeats a four-slot rhythm on desktop: wide 3:2 (7 columns), tall 4:5 (4 columns,
  dropped lower), square 1:1, then 4:3, staggered. A trailing single item (5, 9, ... in the grid)
  or a trailing third item spans the full width at 21:9, so there's never a lonely tile.
  On tablet it's a staggered two-up layout; on phones a single column.
- Every project page uses `project.html`'s template: title and meta, full-bleed hero, short
  sections in a label/text split, an image pair, numbers, lessons and a next-project teaser.

## Build notes
- Files: `index.html`, `project.html`, `system.html`, `beeld.css` (tokens + components, on top of
  `../../system/base.css`), `projects.js` (data, templates, rotation), `review.js` (review bar).
- **Rotation:** `projects.js` holds the five projects (CONTENT §4). On load it picks one at random,
  or the one in `?featured=<id>`, renders it in the feature layout and lists the rest in order.
  The HTML ships with the Homelab featured (server-rendered from the same templates), so it
  reads fine with JS off. In Astro, render the same two templates from a content collection and
  keep the tiny client-side pick.
- **Placeholders** (`.ph`): a tonal fill (`--tone-<id>`), a soft light fall-off, inline SVG grain
  and a "Photo: ..." label. Each has `role="img"` plus a label. For real images, swap the `div` for
  `<img>` with `width`/`height`, `object-fit: cover`, AVIF/WebP and lazy loading below the fold.
- Options are attribute-scoped (`[data-option]`), so `system.html` can show both palettes side by
  side. Contrast ratios there are measured live from the computed tokens.
- Motion: a slow hover zoom on images (1.025), underline draws on links and nav, arrow nudge on
  the link button. All of it is cut by `prefers-reduced-motion` through `base.css`.
- Open copy items: Quizmaster stack and story, the Scryfall stack, LinkedIn URL, Terraform in the
  tools line, and "Before Harborn" (left out until confirmed).

## Round 2b: a bit more playful
- **Voices:** `../../system/copy.js` is loaded on index and project; every keyed element carries
  `data-copy`, the HTML ships the *nuchter* strings and the review bar swaps the voice. The headline
  no longer holds the job: `hero.role` is a small role line under it. Long headlines (Persoonlijk)
  get `data-len="long"` and step down in size, so every voice fits from 320px up.
- **`<em>`:** italic Instrument Serif in the accent, with a hand-drawn line (inline SVG) that draws
  itself in once. It works in both Koppen styles; in Sans it's the one serif moment.
- **Koppen (`data-type`, tokens only):** `a` "Serif" (Instrument Serif, big and tight) and `b` "Sans"
  (Schibsted Grotesk 600, 0.8× scale, tighter tracking).
- **Playful moves:** two loose prints overlap the portrait at slight angles and straighten on hover
  (spring ease); each project has its own ink (dot before the title, hover colour, image-label
  chip); a "Now" line with a live dot; the primary CTA arrow bounces once on hover. Everything
  respects `prefers-reduced-motion`.
- **Review bar:** Kleur · Tekst · Koppen, from `?option=`, `?copy=`, `?type=`, then localStorage;
  changes update the URL with `replaceState`. Below 600px the groups fold behind "Opties".
- Shoot two extra hero photos: the wall panel (4:5) and a game night on the table (3:2).
