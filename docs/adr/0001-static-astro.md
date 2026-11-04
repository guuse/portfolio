# 0001: A static Astro site, no UI framework

**Status:** accepted, November 2026

## Context

The site is a CV, a projects page and three case studies. The content changes a few times a
year; the drawings and motion are the only interactive parts. It is served from a homelab, so
whatever runs there should be boring.

## Decision

- **Astro 7**, `output: "static"`, TypeScript in strict mode. Every page is pre-rendered.
- **No UI framework.** Interactivity is a handful of vanilla TypeScript modules loaded through
  Astro's `<script>` (bundled, deferred, hashed into the CSP). The heaviest page ships about
  19 KB of script, gzipped (the homepage, with all three card drawings); a case study 14–17 KB.
- **Copy that Guus edits** (experience, interests, skills, projects) lives in content
  collections as YAML with zod schemas. Case-study narrative stays in the `.astro` page, next
  to the scenes it describes.
- URLs end in a slash (`trailingSlash: "always"`, `build.format: "directory"`), which matches
  nginx's directory handling.

## Consequences

- The container is nginx with files; there is no server code to patch.
- New content ships through a rebuild and a new image (ADR 0004), which takes minutes.
- Without a framework, components are Astro components with scoped styles; anything stateful
  has to stay small enough to write by hand. So far that is a feature.
