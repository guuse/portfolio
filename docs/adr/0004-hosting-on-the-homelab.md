# 0004: Hosted on the homelab

**Status:** accepted, November 2026

## Context

The site is about running platforms, and the homelab case study describes a git-driven
delivery setup. A static host would be simpler; serving the site from the setup it describes
is more honest, and it's a postcard for that setup.

## Decision

The same flow the homelab page describes:

```
push to main → GitHub Actions: ci.yml, then release.yml
             → image ghcr.io/guuse/portfolio:<full commit SHA> (nginx-unprivileged + dist/)
             → Argo CD Image Updater sees it, commits the new tag to infrastructure/
             → Argo CD syncs the Kustomize app to k3s
             → Traefik → Cloudflare Tunnel → https://ekkelenkamp.dev
```

- The image is nginx serving the static build, non-root and read-only.
- `release.yml` ignores the manifests in `infrastructure/`, so Image Updater's own commit to
  `kustomization.yaml` does not start another build (the loop from the homelab lessons). A
  change to `infrastructure/nginx/` or the `Dockerfile` does, because it changes the image.
- The site is public through the Cloudflare Tunnel with no Access in front: the one
  deliberate exception among the homelab's apps.
- The details and the out-of-band steps are in `infrastructure/README.md`.

## Consequences

- The site's uptime is the homelab's uptime: one node, a laptop on a UPS-sized battery.
  For a personal site, that's an acceptable trade.
- Content changes take a full build and a sync, a few minutes from merge to live.
