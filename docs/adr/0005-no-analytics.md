# 0005: No analytics, no cookies

**Status:** accepted, November 2026

## Context

Visitor numbers for a personal site don't change what goes on it. Any tracking would need a
third-party script (breaking the CSP and the performance budget) or a cookie banner.

## Decision

No analytics, no cookies, no third-party requests. Fonts are self-hosted: the build reads
them from the Fontsource packages in node_modules and never from a CDN (it works with the
network off; `integrations/local-fonts.ts`). Every asset comes from the same origin. nginx
logs no IP addresses.

## Consequences

- There is no consent banner and nothing to disclose beyond the
  [privacy page](https://ekkelenkamp.dev/privacy/).
- If numbers are ever wanted, the bar is: cookieless, self-hosted, and same-origin, so it fits
  the CSP. That would be a new ADR.
