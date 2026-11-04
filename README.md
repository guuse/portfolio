# ekkelenkamp.dev

The source of my personal site: a static [Astro](https://astro.build) site with code-drawn SVG
scenes, served from my homelab.

```
push to main → CI → image on GHCR → Argo CD → k3s → Cloudflare Tunnel → ekkelenkamp.dev
```

The why behind the choices is in [`docs/adr/`](docs/adr/), the deploy setup in
[`infrastructure/`](infrastructure/README.md), and the design system lives at
[/design-system/](https://ekkelenkamp.dev/design-system/).

Code is [MIT](LICENSE). The writing, photos and illustrations are © Guus Ekkelenkamp. Icon sets
keep their own licences (`src/assets/icons/`).
