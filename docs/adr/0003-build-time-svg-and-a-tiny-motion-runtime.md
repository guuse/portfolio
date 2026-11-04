# 0003: Drawings rendered at build time, a small runtime that only animates

**Status:** accepted, November 2026

## Context

The case studies are told in illustrated scenes that move as you scroll. In the mock the
drawings came from `art.js` (baked into the HTML by a Node script) and the motion from
`scenes.js`. The motion is half the story, but the page must also read without it: without
JavaScript, with reduced motion, and for screen readers.

## Decision

- **The kit is TypeScript that runs at build time** (`src/lib/art`). Each scene function
  returns SVG markup drawn in its final state, which is what everyone sees first. It started as
  a port of the mock's drawings and has moved on since; unit tests check that the output is
  deterministic and never uses style attributes.
- **Layout constants live in `*.layout.ts` files** that both the drawings and the motion
  import, so a moved part can't leave its animation behind.
- **The client runtime only animates** (`src/lib/motion`). It finds parts by `data-k` and
  changes transform and opacity, nothing else. Packets are built with `createElementNS`
  (no HTML strings, ADR 0006). Their routes are sampled from each path's `d` by the same
  parser the still frames use (`src/lib/art/geometry.ts`), never with `getPointAtLength()`,
  which forces layout and causes long tasks on phones.
- **One shared `requestAnimationFrame` loop** (`scheduler.ts`). It sleeps when nothing is on
  screen (IntersectionObserver) or the tab is hidden, and caps the time step after a stall.
  Each animator is created the first time its drawing is seen. The runtime is imported only
  on pages with drawings, once the page is idle, and only the scene families (platform,
  homelab, MTG) that the page's drawings need, in parallel with the controller.
- **`prefers-reduced-motion: reduce`** means the runtime never starts: the stills stay.
- Each scene is a labelled `role="img"`, and its step text is the narrative. Copies made for
  narrow screens are `aria-hidden`.

## Consequences

- The pages are complete as HTML. Lighthouse sees no long tasks from the motion.
- The drawings are markup, so they are part of the page weight (the platform page carries
  about 100 KB of SVG before compression). Covers and social cards are pre-rendered images.
- Changing a drawing means editing TypeScript, not a design tool. The styleguide shows
  every part of the kit.
