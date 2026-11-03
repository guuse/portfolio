# ekkelenkamp.dev

The personal site of **Guus Ekkelenkamp**, tech lead of the infra team at Harborn in Rotterdam. What I do there, and the homelab-shaped rabbit hole I fall into after hours.

> **Status: phase 1, design.** This repo currently holds five design directions and the design
> system they share. Open [`index.html`](./index.html) in a browser to review them side by side.
> No build step needed.

## What's here

```
index.html                     ← design review hub: start here
design/
├── BRIEF.md                   ← goals, audiences, tone (round-2 note at the top)
├── CONTENT.md                 ← round-2 copy deck: plain, with a rotating featured project
├── system/                    ← shared foundations, token contract, base.css
├── directions/
│   ├── r2-licht/              ← Licht & rustig
│   ├── r2-donker/             ← Donker & strak
│   └── r2-beeld/              ← Beeld voorop
│       each with index.html · project.html · system.html · README.md
├── previews/                  ← screenshots per direction × option × viewport
└── archive/round-1/           ← the five concept directions from round 1
```

Each direction has two options (switch with the review bar bottom-left, or `?option=<name>`).
The featured project changes on every load; pin one with `?featured=<id>`.

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
