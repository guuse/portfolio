# r2-beeld · Beeld voorop (image first)

## The idea
An image-led, editorial portfolio, built the way a photographer's or studio's site would be. Big
photos do most of the work: a tall portrait next to a short serif headline, a full-bleed image for
the featured project, and an asymmetric grid of wide, tall and square crops with plain captions
underneath. Work and About are short text sections between those image moments. There's no concept
or theme. The quality comes from scale contrast, generous space and calm type.

## Options (tokens only)
Round 3 replaced the round-2 `wit`/`donker` options with `kobalt`, `signaal` and `nacht`; see
"Round 3" below. Switch with the review bar, `?option=`, or localStorage (`r2-beeld:option`).

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

## Round 3: chosen direction, developed further
Guus picked Beeld voorop but not its colours, and found it "too standard". It can be a little
nerdier, "but really not too much".

### Colours: three new options (`data-option`)
| Option | Surface | Ink | Accent | Character |
|---|---|---|---|---|
| `kobalt` (default) | `#f9fbfe` crisp cool white | `#090f1c` | `#1045d9` ultramarine | bright, clean, confident |
| `signaal` | `#edebe7` warm-grey paper | `#10171f` | `#ff7716` tangerine, as a highlight block only; links/focus in navy `#1c3e81` | printed matter, safety signage |
| `nacht` | `#0a1328` deep ink-blue | near-white | `#fbc044` sodium amber | night, the prints pop |

Each project has a vivid tone per option (sky/cobalt, jade, sun yellow, coral, lilac, plus portrait
and About tones) and a deeper *project ink* for text. Every pair is measured live in `system.html`.
All pass: body text 15 to 18:1, muted text 7.4:1 or more, UI lines 3.5:1 or more, project inks 6.6:1
or more. Photo labels sit on a paper chip (15:1 or more on every tone). `<em>` follows the option:
cobalt or amber italic with a hand-drawn line, or ink on a tangerine marker block in Signaal.

### Structural moves (less "standard")
1. **Cutting mat in the hero.** The portrait and two loose prints lie on a faint grid with a small
   ruler, bleeding off the right edge. They're tilted and straighten on hover.
2. **The featured image bleeds off the right edge** and a title card overlaps it like a magazine
   spread.
3. **Projects as an index.** A sticky, numbered index (01 to 05) sits beside a nine-column image grid.
   Hovering or focusing a line lights up its image and dims the others, and the other way round.
   Every image is a contact-sheet frame with corner crop marks and a numbered label chip.

### The nerdy layer (subtle, meta only)
1. **Geist Mono** for metadata only: kicker, frame numbers, captions, index numbers, footer.
   Headlines and body text never use it.
2. **Figure captions as file metadata:** `fig.03 — finds/overview.png · 4:5`.
3. **Tags as code chips:** `proxmox`, `k8s`, `home-assistant`.
4. **Footer status line:** `● all systems normal · last deploy a1c9e2f · 3 Nov 2026`. These are
   illustrative values (see the HTML comment); a build step should fill `data-build="commit|date"`.
5. **Project page:** a short Argo CD `Application` snippet next to "How it works", plus the diagram.
   Confirm that the repo path (`guuse/homeserver`, `apps/rules-of-99`) may be shown.

Fonts: Instrument Serif, Schibsted Grotesk and Geist Mono (the allowed third family, for meta only).

## Round 4: Nacht × Nuchter, fuller and interactive
Guus chose **Beeld voorop × Nacht × Nuchter**, heading style `a`. Those are now the defaults: with
no params the repo pages open in `nacht` (`:where(:root)` tokens) with the nuchter copy
server-rendered. Kobalt, Signaal, the other voices and Sans headings stay switchable in the
review bar.

- **Illustrations instead of empty boxes.** Each project's visual is an inline SVG drawn in
  `projects.js` (`ILLO`). The SVGs use CSS classes, so they pick up each project's tone and every
  option. Each one is labelled `illustration` and none of them pretends to be a screenshot:
  homelab (git push → Argo CD → k3s with app chips + Home Assistant with a Zigbee mesh, over
  Tailscale; a pulse travels along the deploy line), Rules of 99 (a four-seat table, life totals,
  room code `K7QX2P`), finds (an email digest, every 2 h 08:00–23:00), Quizmaster (a phone with a
  timer ring), Scryfall (plain words → `c:g otag:ramp -t:land usd<1` → 128 cards). The portrait
  and personal photos stay as tasteful photo placeholders.
- **More substance.** A "recently" line per Work area (kept generic). In About, a *currently*
  list and a grouped toolbox. Per project: year, status (Live / In progress / Personal), stack
  chips, story and 2–3 "how it works" points (facts from the project READMEs, public-safe only).
- **Detail view.** Every project opens an in-page sheet at `#<id>` (plain names, no `#p/…`), with
  a larger visual, facts, story, how it works and links. There's previous/next inside. Esc, the
  close button, the backdrop or browser back closes it. Focus moves to the title, stays inside
  the sheet, and returns to the trigger when it closes. The page behind is `inert`.
- **Prints** can be nudged with a mouse or pen (up to 70px) and spring back. Touch keeps scrolling.
- **Email** is selectable text with a Copy button (`navigator.clipboard`, falls back to selecting
  the text). No `mailto:`. External links open in a new tab with `rel="noopener"`.
- **Artifact.** `node design/directions/r2-beeld/build-artifact.js` re-bakes `index.html` and
  writes `artifact.html`: one self-contained file (about 105 KB) with no doctype/html/head/body
  tags. It starts with `<title>`, the viewport-fit meta and Google Fonts, then the inlined CSS
  (base + beeld), the markup and the inlined JS (projects + site). It is nacht + nuchter only,
  with no review bar, no copy.js, no localStorage and no external requests besides fonts. The
  side gutter sits on `.site` as `padding-left/right: max(16px, env(safe-area-inset-*, 0px))`.
- New files: `site.js` (prints, copy button) and `build-artifact.js`.

## Round 5: from mock-up to an implementation-ready site
All copy now comes from `design/CONTENT-v5.md` (`copy.js` is no longer loaded, and the review bar
keeps only Kleur and Koppen). Real photos are in `assets/photos/` and real app screenshots in
`assets/shots/`. Both are used as `<img>` with intrinsic `width`/`height`, `decoding="async"`,
`loading="lazy"` below the fold and written alt text. Drawn illustrations are left only where no
real image exists: homelab architecture, home automation (wall panel + Zigbee mesh) and AI tooling.

**Structure:**
- Hero with the three photos as prints on the mat.
- Numbers strip.
- Experience: intro, the highlight with a small stack diagram (day-one services → one platform
  from git → AWS/Azure), 8 competency cards, how I work, and the toolbox.
- Projects: 5 bundles; the featured one rotates per load.
- About with the two tall photos.
- Contact with a copy button.

**The case-study detail view** (`#<id>`) shows:
- a lead visual, the story and facts;
- numbers and the RAM bar;
- a screenshot gallery (scroll-snap strip) with a lightbox (← →, Esc, swipe, caption, counter,
  focus kept inside and returned to the thumbnail);
- for the MTG suite and AI tooling, each part as a sub-section with its own images, chips and
  public link;
- decisions, learned the hard way, the Argo snippet, and the automation rows;
- previous/next cards.

`project.html?id=<id>` renders the same template as a standalone page, with the Homelab
pre-rendered into the HTML.

### UX pass 1: readability
- Small text now has a floor: meta/mono 12px or more (`--step-meta`), secondary text 15–16px
  (`--step-small`), body 16–18px. Line length is capped at 46–70ch everywhere.
- The illustrations have two drawings each. Containers under 560px get a compact one with
  fewer, larger labels (about 14–19px at phone width) through a container query. The tiny
  9px ruler numbers became 12px.
- Contrast on Nacht (measured): body 16.5:1, muted 9.9:1, subtle 6:1, accent 11:1. Labels on
  screenshots and illustrations sit on a chip.
- Removed or rephrased jargon a non-technical visitor would trip over. Each project card says
  what it is in one plain line; tech words live in chips and case studies.

### UX pass 2: flow and hierarchy
- Within the first screen a recruiter sees who (name, Rotterdam), level (tech lead, 10+ / 8+
  years in the numbers strip right below), stack (intro + numbers) and contact (Get in touch).
- Nav order matches the page (Experience → Projects → About → Contact). The header is sticky on
  wider screens, the nav marks the section in view with `aria-current`, and anchors offset for
  the header. On phones the header scrolls away to save space.
- The sticky index now lists all five projects with status, starts below the sticky header,
  highlights the matching card both ways and opens the case study.
- Competency 08 links straight into the AI tooling case study.

### UX pass 3: interaction and polish
- Everything clickable has a hover, focus-visible and pressed state. Cards lift, gallery
  thumbnails show a zoom badge (always visible on touch), and buttons move down 1px when pressed.
- Detail view and lightbox: keyboard (Tab stays inside, Esc closes the top layer only, ← → in
  the lightbox), screen readers (`role="dialog"`, `aria-modal`, labelled, page behind `inert`,
  live caption), touch (swipe in the lightbox, a full-height sheet on phones).
- No layout shift: every image has intrinsic dimensions, and gallery thumbnails get a fixed
  height so their width comes from the aspect ratio.
- Grid safety: the featured project is removed from the grid, so the grid always has four cards
  in the 3:2 / 4:5 / 1:1 / 4:3 rhythm. Screenshots sit `contain`-ed on a tonal stage, so any
  crop works. A tall slot uses the phone screenshot where one exists. Empty fields (no chips,
  no link, no parts) render nothing, not empty rows.
- Checked at 320px for every featured project and every detail view: no horizontal scroll.
  No console errors and no failed image loads. Reduced motion turns off the pulse, the
  transitions and the zooms.

Previews: `design/previews/r5-beeld--*.png`. Run `node build-artifact.js` after editing; it bakes
`index.html` and `project.html` and writes `artifact.html` (images stay as files under `assets/`).

**Content update (v5, later in round 5):** the numbers strip now reads 8 clusters and 1,500+ pods.
The highlight gets a facts row (8 clusters · 1,500+ pods on the largest · NL, EU and Japan ·
client training) and a regions row in the diagram. Operators are written in Python (Go removed),
and LinkedIn links to the real profile.

### Round 5b (lead's UX review)
- **Screenshots fill their frames.** Cover fit from the top left, thin border, no dotted mat or
  crop marks. Those stay on illustrations only.
- **Calmer project grid.** Four equal 16:10 cards in two columns beside the sticky index, no
  stagger, and always the desktop screenshot.
- **Featured illustrations** are drawn clear of the overlapping title card. Checked with every
  project featured.
- **Hero prints** are now the portrait plus Grimoire and Rules of 99 screenshots with captions.
  Bouldering and sunset appear only in About.
- **Highlight** no longer repeats the strip's numbers. It shows "every project gets, on day one"
  (namespace, CI/CD pipeline, monitoring & alerts, TLS, access control) and two small facts:
  NL, EU and Japan; training programmes with clients.
- **AI illustration:** text on yellow and teal fills is now dark.
- **Phones:** a round portrait next to the kicker, so a face is on the first screen.

## Round 6: three projects, the platform first, diagrams that explain
Source: `design/CONTENT-v6.md`, including its addendum.

- **Page order:** hero (portrait, bouldering, sunset), Off the clock, numbers, Experience,
  How I work, Projects (3 + Also), Contact. Hovering or focusing Bouldering or Travel lifts the
  matching print. Magic and Tinkering open their case studies.
- **Projects are static.** In order: hosting platform, homelab & home automation, MTG suite.
  Each is a large feature with alternating sides. The old rotation and the 5-item index are gone.
  Home automation was merged into the homelab. AI tooling and Scouting moved into the Also list.
- **`diagrams.js`** holds eight animated SVG diagrams:
  - delivery: commit → CI tag → Image Updater → Argo CD → acceptance, then production;
  - infra: a PR through 7 gates, where a policy blocks a public bucket, it's fixed and passes;
    plus a daily drift check;
  - logs: Alloy → Loki → encrypted storage → Grafana;
  - map: 8 clusters in NL, EU and JP;
  - edge: CloudFront → EU / Tokyo, with the resource syncer;
  - push: git push to running pods, with the battery as a UPS;
  - ways: tailnet, Tunnel and Funnel, with 0 open ports;
  - box: the 16 GB split and the Zigbee stick on USB.

  Each diagram has a full and a compact drawing (container query at 620px) and uses drawn
  glyphs. It plays while in view (IntersectionObserver), loops calmly, and has a replay button.
  Under reduced motion it shows the final, fully labelled state.
- **Case studies:** keyed sections (a, b, c…) with a lead, bullets and the matching diagram.
  The platform adds its foundation, reliability, the CLI (shown without `apply`) and a "How it
  grew" timeline. The homelab adds Home Assistant, the gotchas and the snippet. MTG keeps its
  four parts and galleries.
- **Artifact contrast bug:** fixed with unlayered `html, body { color; background }` and body
  font/size/line-height in `build-artifact.js`. Verified with a hostile `body{font:14px
  system-ui;color:#000}` reset injected before the artifact.

### Iteration log
1. **Built everything, then measured** every diagram label against its card in the browser.
   Fixed six overflows: the logs card, the CloudFront line, the pill labels and the USB card.
   Removed the focus ring on the programmatically focused detail title, and shortened the PR
   status text.
2. **Diagram pass at 1440 and 390:**
   - widened the CI and Image Updater cards for the live text (`pushed v2.4.0-rc.1`);
   - moved the battery badge;
   - gave the memory bar a separate legend (segment names no longer clash);
   - rebuilt the compact infra pipeline as a fixed PR card above full-width stages (the moving
     card ran off a phone screen);
   - rerouted the compact "ways in" paths so they no longer cross card text;
   - moved the 1,500+ callout off the cluster dots.
3. **Polish:**
   - the pointer line in Experience wrapped as flex pieces (now inline);
   - the phone nav fits four items;
   - reduced motion now drops the transition delays;
   - `system.html` shows the new feature and all eight diagrams live.

   Verified: no console errors, no horizontal scroll at 320px (page and each detail view), and
   0 label overflows on desktop and mobile.

Previews: `design/previews/r6-beeld--*.png` (desktop, full, mobile, mobile-full, anim-*,
detail-*-N, mobile-detail-*, lightbox, reduced-motion, lift, system).

## Round 7 (polish pass)
1. **Delivery story:** rc.1 lands in acceptance and is held there while production stays on
   v2.3.0. Then v2.4.0 is cut and promoted to production. Version labels flash when they change.
   Verified with frame captures: rc.1/v2.3.0 → rc.1/v2.4.0.
2. **Feature visuals stay inside the page** with all four borders. No more viewport bleed.
3. **Diagram tabs:** platform (delivery, infra pipeline, logging, regions) and homelab (git push
   → running, ways in, inside the box). They advance when a diagram finishes, after at least 6 s,
   with a progress bar. They pause on hover or focus and use ARIA tabs with arrow, Home and End
   keys. They stay static under reduced motion.
4. **MTG collage:** Grimoire sits bottom-right over the deck strip, with a paper border and a
   tilt, and lifts on hover.
5. **Interest cards:** photo chips on Bouldering and Travel replace the "photo up top" hints.
6. **Numbers** count up once in view (strip, features, case studies), in tabular figures; the
   final value is server-rendered.
7. **Experience:** each card has one line, 2 bullets and chips at the bottom; card 07 got chips.
8. **Detail views:** a sticky table of contents sits in the panel bar (a–g + timeline, tracks
   scroll, jumps in-panel without touching the URL hash). On ≥1100px each section has its text
   on the left and a sticky diagram on the right.
9. The footer status line has `title="Illustrative for now: filled in at build time"`.
10. Re-checked with the hostile reset at 1440, 390 and 320px: no errors, no horizontal scroll,
    no label overflow. Previews: `design/previews/r7-beeld--*.png`.

## Round 8: a calm CV and separate project pages
Source: `design/CONTENT-v7.md` (synthesis of four reviews). §E (anti-"AI vibe") is treated as hard rules.

- **Pages:**
  - `index.html` is the CV (≈430 words): intro with a straight portrait and contact row,
    Experience as phases at one employer, Skills as a typeset list, Selected work (3 rows with
    static thumbnails) plus Also, About with two photos and languages, Contact.
  - `platform.html`, `homelab.html` and `mtg.html` are the case studies. Each follows: context,
    an overview visual, deep dives with their diagram alongside, results, trade-offs, lessons
    (symptom → cause → fix), stack, next.
  - `project.html` now redirects to `platform.html`. The modal, the rotation, the tabs, the
    review bar and the voices are gone.
- **Removed:**
  - all numbering;
  - mono micro-labels;
  - the status line, the "Now" dot, the ruler and mat;
  - tilted prints and the italic squiggle word;
  - card grids and chips on the CV;
  - the three accent colours (diagrams now use the single amber accent; the three ways in
    differ by line style).
- **Diagram corrections (§D):**
  - delivery now reads CI → registry ← Image Updater → commits the new image version to git →
    Argo CD;
  - "fails at preview";
  - Tailnet is the default, the others opt-in;
  - CloudFront cache behaviours route by path;
  - no `sha-` labels.
- **Files:**
  - `site.css` is one unlayered stylesheet (replaces `beeld.css`);
  - `site.js` handles the copy button, nav tracking, diagram mount and lightbox;
  - `diagrams.js`;
  - `build-artifact.js` bakes diagrams into the pages and renders the CV thumbnails once in
    their final state (needs Playwright). It writes `artifact/` with the CV fragment, the three
    full documents, the shared CSS and JS, and `assets/`.
- **Iterations:**
  1. Built everything, screenshotted it behind the hostile reset, and grepped for the banned
     patterns (none left).
  2. Merged the two-line Languages section into About. Calmer section spacing, larger phase
     titles, and the diagram sections laid out text + visual in two columns under a full-width
     heading.
  3. Smaller intro block (no forced height), photos before the languages line, remaining
     "nearest cluster" wording fixed, new `system.html`.

## Round 9 (fresh-review fixes)
- **CV:**
  - years on every phase, and no "current role" chip;
  - new role line, which breaks onto separate lines on mobile;
  - "Moving" to Pulumi;
  - client and region wording ("Dutch and international clients, on AWS (Ireland and Tokyo)
    and Azure");
  - a concrete example for the infra-engineer phase;
  - LinkedIn and GitHub only in the intro and footer;
  - two straight About photos, and a small portrait above the name on mobile;
  - typographic thumbnails in place of the fuzzy diagram crops.
- **Project pages each have their own shape.**
  - Platform: a lead paragraph with the numbers in prose, "How it grew" as the spine, then
    delivery, infrastructure (a numbered stage list), logs, Tokyo, trade-offs and lessons.
  - Homelab: a narrative page with two diagrams, a CSS memory bar, Home Assistant, the YAML and
    three lessons (including the new `paths-ignore` build-loop lesson).
  - MTG: the hero screenshot first, then each tool led by a two-column screenshot grid.
- **Removed:**
  - the Principles section, the stat tiles, the cluster map, the disclaimers and the
    bold-lead bullets;
  - the diagram frame, sheen, glow and Replay pill (a click on the diagram replays it);
  - decorative icons (lock, git, shield and laptop remain).
- **Technical fixes:**
  - "preview + policy" and "plan check" stages, with drift reported daily;
  - path-based CloudFront routing, and the ingress controller no longer named;
  - corrected disk and DNS lessons;
  - "card data tracks upstream nightly";
  - the 95%+ coverage is for the skills' helper scripts.
- **Grimoire is now Tutor.** Screenshot slots are filled by `build-artifact.js` from the first
  existing file in each candidate list (`SLOTS`), so the new `tutor-*` and `r99-game*` files
  drop in on the next build. `grimoire-*` is no longer used or copied.

## Round 11: the Rules of 99 home, translated
- **Home:**
  - a full-bleed cinematic hero (bouldering photo under a scrim, serif headline, gold kicker);
  - a stat row (10+ years, 8 clusters, 1,500+ pods, CKA);
  - a gold "See projects" button with email/copy, LinkedIn and GitHub as secondary actions;
  - the portrait and sunset as prints (hover lift, drag);
  - a cover-card strip of the three projects with "All projects";
  - shortened Experience, Skills and certifications, Outside work (hover lifts the matching
    photo; Travel now reads "mostly in Asia; Japan is my favourite"), and Contact.
- **`projects.html`:** big image-led cards (cover, meta, one-liner, 4 facts, stack, case-study
  button) plus the Also list. Nav: Home, Projects, Experience, Contact.
- **Case studies:** each opens with its cover as a hero, with a scrim and the title over it.
  MTG shows each app by its home screen (Rules of 99 lobby, Tutor library, Scryfall home on
  desktop and phone, skills banner), plus one in-game shot (combat) and Tutor's analysis.
- **`covers.js`:** renders designed covers with Playwright at 2× and writes
  `assets/covers/<id>-{wide,card}.webp` with @2x. The platform cover is the delivery flow, the
  homelab cover is the laptop with three ways in, and the MTG cover is a collage of the three
  app homes. `build-artifact.js` runs it and copies only the screenshots still in use.
- **Palette:** near-black base, warm white text, the gold of the Play button.

## Round 12: round-11 structure, round-10 styling
- Round 11 structure kept: cinematic hero with prints and stat row, the cover strip,
  `projects.html`, cover heroes on the case studies, the designed covers, and the MTG home
  screens.
- Round-10 Nacht palette restored (navy `#0a1328`, cool ink, amber used rarely). Scrims are
  tinted with the navy surface.
- Quiet actions: "See projects" is a 1px outlined button; email is text with the copy pill;
  LinkedIn and GitHub are plain links. "Read the case study" is a text link with an arrow.
- 4px radii and hairline borders; no glow; plain small labels (no letter-spaced caps); covers
  re-rendered on navy.
- Outside work is four uniform items (Bouldering, Travel, Games, Tinkering), not linked to
  projects. Each lifts a print or brightens the backdrop. The hobby wording avoids naming Magic.

## Round 13: About me first, more depth
The home page order is now: hero, About me (two paragraphs in Guus's words, plus the four
interests), Projects, Experience, What I've learned, Skills and certifications, Contact.
- **Experience:** each phase has 2–5 bullets and a small italic "What I learned" line.
- **What I've learned:** three principles plus the IPv6 dual-stack story. The same lesson was
  added to `platform.html`.
- **Skills:** reordered by strength, plus "Currently exploring" and "Knowledge sharing".
- **Contact:** "Want to talk platforms, homelabs or games? Mail me."
