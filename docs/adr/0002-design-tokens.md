# 0002: Design tokens in DTCG JSON, built by Style Dictionary

**Status:** accepted, November 2026

## Context

The mock's `site.css` grew over 17 rounds: each round overrode the last, so the real values
were the ones that happened to win at the bottom of the file. The production site needs one
place to change a colour or a size.

## Decision

- Tokens are **DTCG-format JSON** in `tokens/`, in layers:
  - `primitive/`: raw colour ramps. Every navy and cloud shade is built from one hue token.
  - `scale/`: type, a 4px space scale and the page's named spaces, radii, durations, easings,
    breakpoints.
  - `theme/nacht.json`: the semantic colours (surface, ink, accent, line, focus, and the
    illustration materials). A second theme is a second file with the same names: each theme
    is resolved on its own and written to its own selector (`:root, [data-theme="nacht"]` for
    the default, `[data-theme="<name>"]` for the rest), so themes never collide, and the
    build refuses a theme that adds or misses a name.
- **Style Dictionary 5** (`npm run tokens`) writes four files:
  - `src/styles/tokens.css`: custom properties in `@layer tokens`, with references kept as
    `var()`, so changing a primitive restyles everything built on it.
  - `src/styles/tokens.ts`: a typed map (with hex for opaque colours), plus breakpoints,
    pixel sizes and durations as numbers: the styleguide, `matchMedia`, the header height
    in the scroll scenes, the toast timer, `theme-color` and the web manifest all read it.
  - `src/styles/media.css`: the breakpoints as `@custom-media` (`--md`, `--below-md`, …).
  - `src/styles/tokens-preview.css`: one class per token, so the styleguide can show
    swatches and samples without style attributes (ADR 0006).
- The generated files are **build outputs and gitignored**. `dev`, `build`, `typecheck` and
  `test` run `tokens` first, so a fresh clone works with any of them.
- Unit tests check that every reference resolves and that every text and surface pair meets
  WCAG AA contrast.

## Consequences

- One token edit restyles the site. The values came from the mock's round-12 Nacht palette,
  with one change: strong lines went from 48% to 50% lightness to reach 3:1.
- CSS media queries can't read custom properties, and browsers don't support
  `@custom-media` yet, so a small PostCSS plugin (`integrations/custom-media.ts`) substitutes
  the generated custom media at build time. No stylesheet repeats a breakpoint's number.
- Part-specific tints inside the drawings (shirts, book covers, card faces) live in
  `src/styles/art.css`, but every hue there is an offset of the navy hue token
  (`calc(var(--hue-navy) - 4)`), and the packet's band and seam are derived from the accent,
  so the drawings turn with the palette. A unit test fails on a colour with a hue of its own.
- The social cards and favicons are committed images (`npm run assets`), so they follow a
  token change only when they are re-rendered.
