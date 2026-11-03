# ekkelenkamp.dev

The personal site of **Guus Ekkelenkamp**, a developer in Rotterdam: what I do at
[Harborn](https://harborn.com), and the homelab-shaped rabbit hole I fall into after hours.

> **Status: phase 1, design.** This repo currently holds five design directions and the design
> system they share. Open [`index.html`](./index.html) in a browser to review them side by side.
> No build step needed.

## What's here

```
index.html                     ← design review hub: start here
design/
├── BRIEF.md                   ← goals, audiences, tone, the "not AI built" test, how to pick
├── CONTENT.md                 ← content inventory + copy deck (shared by all directions)
├── system/
│   ├── FOUNDATIONS.md         ← token architecture, type/space scales, grid, motion, a11y, perf budget
│   ├── tokens.schema.json     ← the semantic token contract every direction implements
│   └── base.css               ← shared reset + scales (cascade layers)
├── directions/
│   ├── 01-spec-sheet/         ← "Spec Sheet": industrial datasheet & label tape
│   ├── 02-floor-plan/         ← "Plattegrond": the site as a floor plan of a smart home
│   ├── 03-poster/             ← "Affiche": Rotterdam editorial poster, type as image
│   ├── 04-zine/               ← "Zine": risograph DIY zine, two-ink overprint
│   └── 05-wall-panel/         ← "Wandpaneel": the site as a home-dashboard wall panel
│       each with index.html (homepage) · system.html (design system sheet) · README.md
└── previews/                  ← screenshots per direction × option × viewport
```

Each direction ships **three options** (palette and mood) that you switch with the review bar in
the bottom-left corner, or deep-link with `?option=<name>`.

## Review locally

```bash
python3 -m http.server 4321
```

Then open http://localhost:4321. Opening `index.html` straight from disk works too.

## Roadmap

1. **Design** (now): pick a direction, or a mix, plus an option. Confirm the `[CONFIRM]` items in
   `design/CONTENT.md`. Shoot the photos listed as `PHOTO:` placeholders.
2. **Build**: Astro, content collections mirroring `CONTENT.md`, tokens from the chosen
   direction, self-hosted fonts, zero third-party requests. Perf budget in `FOUNDATIONS.md` §9.
3. **Ship**: on `ekkelenkamp.dev`.

### Hosting note

`ekkelenkamp.dev` is HSTS-preloaded, so it's HTTPS only. Today the zone carries a **tailnet-only
wildcard** for homelab infra. The public site should therefore live on the **apex** (and `www`)
with its own records, so infra hosts stay private:

- **Recommended:** Cloudflare Pages (or any static host) on the apex + `www`. A proxied record
  for the apex takes precedence over the wildcard for that name only.
- **Dogfood alternative:** serve it from the k3s cluster through the existing Cloudflare
  Tunnel. It's charming, but the site's uptime then equals the laptop's.

## License

Code: MIT (to be added at build time). Content and photos © Guus Ekkelenkamp.
