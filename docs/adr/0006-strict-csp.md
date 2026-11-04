# 0006: A strict, hash-based Content Security Policy

**Status:** accepted, November 2026

## Context

A static site has little to attack, which makes a strict policy cheap. The policy has to work
the same in `astro preview` (where the tests run) and in production.

## Decision

- Astro writes a `<meta http-equiv="content-security-policy">` into every page with
  `default-src 'none'` and a SHA-256 hash for every script and style it emits. Trusted Types
  are enforced: `require-trusted-types-for 'script'` makes every DOM sink that takes a string
  (`innerHTML` and the like) throw, and `trusted-types 'none'` allows no policy that could make
  one. nginx adds what a meta can't express (`frame-ancestors`, plus a backstop and the other
  headers). The meta's directives are in `astro.config.ts`; the header's are in
  `infrastructure/nginx/security-headers.conf`, and `infrastructure/README.md` explains the split.
- What that rules out, and how the code works around it:
  - **No `style=""` attributes**, including in generated SVG: stagger indices are `data-i`
    and set through the CSSOM; token previews are generated classes.
  - **No HTML from strings** in the browser: packets are built with `createElementNS`;
    copies of drawings are cloned nodes.
  - **No inline handlers, `is:inline` scripts, Shiki, or `<ClientRouter />`.**
- Stylesheets are inlined (hashed), and a small Vite plugin starts every stylesheet module
  with the cascade layer order, so
  `@layer reset, tokens, base, layout, components, utilities` holds whichever module a page
  happens to load first.

## Consequences

- A violation is a console error, and the e2e suite fails on any console error.
- A third-party embed is never a quick change; it would need a new ADR.
