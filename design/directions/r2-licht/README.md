# r2-licht · Licht & rustig

**The idea.** A light, calm, text-first personal homepage. One left edge, one comfortable
reading column (40rem), and a few deliberate wider moments (72rem) where images and the
project list live. Hierarchy comes from type and space, not from boxes: hairlines separate
sections, a serif headline says who Guus is, a quiet sans does everything else. No concept, no
decoration; the details are in the hovers (the list thumbnail grows, the title turns accent, an
arrow slides in), a gentle fade on load, and good focus states.

**Round 2b (warmer, more playful).** Four copy voices from `system/copy.js` (`data-copy`,
Nuchter server-rendered), the job moved to a small role line, and four quiet playful moves:
a hand-drawn accent underline under the headline `<em>` (an inline-SVG token per option, draws
itself in once), a round portrait chip in the header that waves on hover, each project its own
soft tone + deeper accent (placeholder, row wash, hover title, links), and a cursor-following
preview on the project list (mouse only, off under reduced motion). Plus a "Now" line with a
live dot. **Koppen** (`data-type`): `a` Serif (Newsreader 400) · `b` Sans (Hanken Grotesk 650,
tighter, 90% scale). The review bar has Kleur / Tekst / Koppen (`?option=`, `?copy=`, `?type=`,
persisted + replaceState) and collapses behind "Opties" under 760px.

**Options** (tokens only, `data-option` on `<html>`):
- `licht` (default): near-white with a hint of blue (#f9fcfe), ink #131921, one clear blue accent (#1e59cd).
- `zacht`: pale sage ground (#e8f4eb), deep green ink and accent (#005c3b). Same layout.

Both pass AA everywhere and AAA for body text; measured ratios are in `system.html`.

**Fonts.** *Newsreader* (display, regular weight, optical sizing) for the headline, section
leads and project titles; *Hanken Grotesk* for text and UI. Newsreader at large optical sizes is
fine and calm rather than "editorial-loud", and set in cool white and blue it avoids the
cream-serif-terracotta default. Hanken Grotesk is warm and slightly round without being a
startup sans. Two voices: the serif for what Guus says, the sans for the facts.

**Why it fits Guus.** He asked for "just a normal website". This is that, done carefully: it
reads like a person, not a product, and it gets out of the way of the projects. It works for a
recruiter skimming the work section and a friend clicking through the homelab page.

**What it needs.**
- A real portrait (4:5, natural light, plain background works best on this palette).
- Real photos/screenshots per project: 16:9 for the feature and the case-page hero, cropped
  to 4:3 for list thumbnails. Placeholder captions say what to shoot.
- To confirm: LinkedIn URL, email address, Quizmaster story and stack (it currently has no
  tags, the layout handles that), Scryfall stack, Terraform in the tools line, and the
  **years** (only Homelab = 2026 is from the copy; 2025/2026 on the others are placeholders).

**How it scales.** Projects are data (`projects.js`, later an Astro content collection). The
featured slot and list row are two renderers over the same record. The list is a plain `<ul>`:
ten projects is still one calm list; past that, add a "show all" or group by year. Every project
gets `project.html` as its template (back link, title, line, tags, hero, sections, numbers,
learned, next).

**Build notes.**
- `style.css` builds on `../../system/base.css` (layers, scales). Tokens in `@layer tokens`;
  `zacht` only overrides primitives and tones.
- `projects.js`: data + `render()` + `pick()`. The HTML is server-rendered with Homelab
  featured (no JS = Homelab). On load it picks at random, or `?featured=<id>`, and swaps the
  feature + list if different. Nothing is stored. Also works under Node (`module.exports`),
  which is how the static HTML was generated.
- `review.js`: review bar option switch (`?option=` → localStorage → `licht`), a radiogroup
  with arrow keys. Review tooling only; drop it in production.
- The homelab diagram is HTML/CSS, not SVG: it reflows to 320px and its text stays readable
  and selectable.
- Motion: 520ms fade-and-rise on load, 160ms hovers; all off under `prefers-reduced-motion`
  (via base.css).
