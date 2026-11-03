# 0002: Design tokens in DTCG JSON, built by Style Dictionary

**Status:** accepted, November 2026

## Context

The mock's `site.css` grew over 17 rounds: each round overrode the last, so the real values
were the ones that happened to win at the bottom of the file. The production site needs one
place to change a colour or a size.

## Decision

- Tokens are **DTCG-format JSON** in `tokens/`, in layers:
  - `primitive/`: raw colour ramps. Every navy shade is built from one hue token.
  - `scale/`: type, space, radii, durations, easings, the stage breakpoint.
  - `theme/nacht.json`: the semantic colours (surface, ink, accent, line, focus, and the
    illustration materials). A light theme would be a second file with the same names.
- **Style Dictionary 5** (`npm run tokens`) writes three files:
  - `src/styles/tokens.css`: custom properties in `@layer tokens`, with references kept as
    `var()`, so changing a primitive restyles everything built on it.
  - `src/styles/tokens.ts`: a typed map, used by the styleguide and by JavaScript (for
    example the breakpoint for `matchMedia`).
  - `src/styles/tokens-preview.css`: one class per token, so the styleguide can show
    swatches and samples without style attributes (ADR 0006).
- The generated files are **build outputs and gitignored**. `dev`, `build`, `typecheck` and
  `test` run `tokens` first, so a fresh clone works with any of them.
- Unit tests check that every reference resolves and that every text and surface pair meets
  WCAG AA contrast.

## Consequences

- One token edit restyles the site. The values came from the mock's round-12 Nacht palette,
  with one change: strong lines went from 48% to 50% lightness to reach 3:1.
- CSS media queries can't read custom properties, so the stage breakpoint is repeated as
  `900px` in two stylesheets. The token documents that.
- Part-specific tints inside the drawings (shirts, book covers, card faces) stay as literals
  in `src/styles/art.css`; the shared materials are tokens.
