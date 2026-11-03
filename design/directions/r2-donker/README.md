# R2 · Donker & strak

**The idea.** A dark, quiet, premium portfolio that gets out of the way. A warm near-black page,
one grotesk, thin dividers, big images and a lot of room. There's no concept behind it: the quality
comes from a firm 12-column grid (labels in columns 1–4, text from column 5), a confident
two-tone headline, and three small, well-made motions: a short staggered rise on load, images
that scale slowly on hover, and accent lines that draw in under links.

## Options (tokens only)
- **`nacht`** (default): warm near-black (OKLCH hue 65, closer to dark walnut than to a blue
  screen), bone-white ink, apricot accent. Ink 16.9:1, muted 10.4:1, subtle 5.8:1.
- **`grafiet`**: a lighter cool graphite (hue 250), frost-white ink, brass accent. Ink 14.2:1,
  muted 9.5:1, subtle 6.0:1.

Switch with the review bar, `?option=grafiet`, or localStorage (`r2-donker-option`).

## Why it fits Guus
He asked for "just a normal website". This is the quietest possible version of a *good* one. It's
dark because an infra person's work happens on dark screens, but it never borrows terminal
clichés: no mono, no green, no glow. The warmth (a warm black, bone ink, apricot) keeps it
personal rather than corporate.

## Type
**Schibsted Grotesk** (Google Fonts, variable 400–900) for everything. It's a grotesk with real
details (the compact *a*, the sharp *t*, the open *G*) that stay calm in paragraphs, so a single
family can carry both the 100px headline and the body text. There is no mono: meta uses
tabular numerals, which keeps the page away from "techy".

## What it needs
- **Real photos.** A portrait (4:5), and per project one landscape image (feature 4:3, cards 3:2,
  project hero 21:9). Every placeholder is captioned with what to shoot. Dark, low-key photos or
  screenshots with dark UI suit it best; bright screenshots are fine on the raised surface.
- Confirm: the email, the LinkedIn URL (currently `#`), the Quizmaster stack (shown as a dashed
  "Stack to confirm" tag), and the Terraform mention in the tools.

## How it scales
Projects are data (`projects.js`); the feature and the card are two layouts of the same record.
The card grid is 2 columns from 720px up. With an odd number of remaining projects the last card
spans the full row as a wide 21:9 card, so there is never a lonely card (currently 4 = 2×2).
The project page is a label/body section list, so any project can use any subset of sections.

## Build notes
- Files: `index.html`, `project.html`, `system.html`, `donker.css` (on top of
  `../../system/base.css`), `projects.js` (data, rotation, next-project), `review.js`
  (option + review bar, loaded in `<head>` so the option applies before paint).
- Rotation: the HTML is server-rendered with the Homelab featured. JS picks a random project per
  load (or `?featured=<id>`), renders it as the feature and lists the rest in order.
- Motion lives in `@layer utilities` behind `prefers-reduced-motion: no-preference`; with reduce,
  the entrance is off and anchor scrolling jumps.
- Whole-card links use a stretched `::after` on the title link; focus rings move to the card via
  `:has(a:focus-visible)`.
- Placeholders are pure CSS: one OKLCH hue per project (`data-tone`), a soft radial light and an
  SVG-noise grain. Lightness and chroma come from option tokens (`--ph-l`, `--ph-c`).
