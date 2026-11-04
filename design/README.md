# Design archive

This folder is **history, not source**. It holds the static mocks the site was designed with,
over 17 review rounds, before the production build in `src/` existed. Nothing in here is
built, tested or shipped (the container image excludes `design/`).

## How the site was designed

1. **Round 1** (`archive/round-1/`): five concept directions, each a few static pages.
2. **Round 2** (`directions/r2-*`): three directions on one shared token contract
   (`system/`). *Beeld voorop* (image first) won.
3. **Rounds 3 to 17** (`directions/r2-beeld/`): that direction, developed further. The
   [`r2-beeld/README.md`](directions/r2-beeld/README.md) logs what changed in every round and
   why: the Nacht palette, a calm homepage instead of card grids, the case studies, the flat
   technical illustration kit and, from round 16, the scroll scenes.
4. Copy decks: `BRIEF.md`, then `CONTENT*.md`. `CONTENT-v7.md` §E holds the writing rules the
   site still follows.
5. `previews/`: screenshots of each round at desktop and phone widths.

## The approved design

`directions/r2-beeld/` after round 17 is the spec the production site started as a port of (same
copy, same look, same drawings and motion), and the site has moved on since. `artifact/` there is
the last published mock.

| Mock                               | Production                         |
| ---------------------------------- | ---------------------------------- |
| `site.css` (round-12 Nacht values) | `tokens/` → `src/styles/`          |
| `art.js`, `art-mtg.js`             | `src/lib/art/` (build-time SVG)    |
| `scenes.js`                        | `src/lib/motion/` (client runtime) |
| `site.js`                          | `src/scripts/`                     |
| `index.html`, `*.html`             | `src/pages/`                       |

To look at a mock: `python3 -m http.server -d design/directions/r2-beeld 4321`.
