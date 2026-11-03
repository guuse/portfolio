# Architecture decisions

Short records of the choices that shape this repo: what was decided, why, and what it costs.
New ones get the next number; old ones are superseded, not edited.

| ADR                                                      | Decision                                                                      |
| -------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [0001](0001-static-astro.md)                             | A static Astro site, no UI framework                                          |
| [0002](0002-design-tokens.md)                            | Design tokens in DTCG JSON, built by Style Dictionary                         |
| [0003](0003-build-time-svg-and-a-tiny-motion-runtime.md) | Drawings rendered at build time, a small runtime that only animates           |
| [0004](0004-hosting-on-the-homelab.md)                   | Hosted on the homelab: GHCR → Argo CD Image Updater → k3s → Cloudflare Tunnel |
| [0005](0005-no-analytics.md)                             | No analytics, no cookies                                                      |
| [0006](0006-strict-csp.md)                               | A strict, hash-based Content Security Policy                                  |
