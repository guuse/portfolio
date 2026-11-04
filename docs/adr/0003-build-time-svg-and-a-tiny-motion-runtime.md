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
- **Parts are looked up when an animator is built**, never per frame, and a key the drawing
  doesn't have throws there; a unit test builds and plays every scene and card from the
  rendered markup. An animator that throws is reported and its drawing goes back to its still;
  the rest of the page keeps moving.
- **Scroll scenes come to rest** (WCAG 2.2.2): new traffic thins out over the next 2.2–3.2 s
  after the reader stops scrolling; at 3.2 s no new packets, LEDs and wobbles stop, the packets
  on their way travel on for 0.8 s and any left fade over 0.8 s, so the last change is at 4.8 s.
  The hosting scheduler snaps to its final pods 1 s after rest. The scene isn't ticked again
  until the next scroll. A card plays one 3.5 s pass and settles for 0.8 s, and the pass
  never falls behind the wall clock, so it is over by 4.3 s however slow the frames are.
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
  135 KB of SVG before compression, 23 KB gzipped, measured on the build of 4 November 2026).
  Covers and social cards are pre-rendered images.
- Changing a drawing means editing TypeScript, not a design tool. The styleguide shows
  every part of the kit.
