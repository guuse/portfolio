# infrastructure

How ekkelenkamp.dev gets from a commit to a browser. The site is static: one
container image (nginx plus the Astro build) running as two pods on a homelab
k3s cluster, deployed by Argo CD, reached through a Cloudflare Tunnel. There
is no inbound port anywhere.

```
 push to main
     │
     ▼
 GitHub Actions  release.yml: docker build (npm ci, astro build, gzip) ──▶ ghcr.io/guuse/portfolio:<sha>
                                                                              │  SBOM + provenance attached
                                                                              ▼
 Argo CD Image Updater  sees the newest SHA tag, commits it to infrastructure/kustomization.yaml
     │
     ▼
 Argo CD  syncs infrastructure/ (this directory) into namespace `portfolio`
     │
     ▼
 browser ─HTTPS─▶ Cloudflare edge ─tunnel─▶ cloudflared ─▶ Traefik :443 ─▶ Service ─▶ nginx pods :8080
                  (proxied DNS,              (dials out,     (Ingress by Host,
                   brotli, caching)           nothing in)     wildcard cert)
```

| File                           | What it is                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| `kustomization.yaml`           | The app. `images:` is written by Image Updater; don't edit the tag by hand.                      |
| `namespace.yaml`               | `portfolio`, enforcing the `restricted` Pod Security level.                                      |
| `deployment.yaml`              | 2 replicas, uid 101, read-only root, no capabilities, `/tmp` as the only writable mount.         |
| `service.yaml`, `ingress.yaml` | Traefik routes `ekkelenkamp.dev` and `www.ekkelenkamp.dev`; the default TLSStore holds the cert. |
| `pdb.yaml`                     | `minAvailable: 1`: voluntary disruptions take one pod at a time.                                 |
| `networkpolicy.yaml`           | In from Traefik (and cloudflared) only. Out: nothing.                                            |
| `nginx/`                       | `nginx.conf` plus includes, copied into the image by the root `Dockerfile`.                      |
| `homeserver/portfolio.yaml`    | The Argo CD `Application` and `ImageUpdater` that live in the homelab repo.                      |

## What nginx does

- `ekkelenkamp.dev`: serves `dist/` from `/srv/portfolio`. `/foo` 301s to `/foo/` with a relative
  `Location`; unknown paths get the site's own `404.html` with status 404, and so does a
  directory without an index (`/_astro/`, which nginx would answer with a 403).
- `www.ekkelenkamp.dev`: `301` to `https://ekkelenkamp.dev$request_uri`.
- `/healthz`: `200 ok`, not logged, `no-store`. Probes use it.
- Caching: `/_astro/*` is fingerprinted, so `max-age=31536000, immutable`, but only on a
  successful response: errors (4xx, 5xx) always revalidate. HTML is
  `max-age=0, must-revalidate` (ETag revalidation), so a deploy is live at once. Other
  public files get one hour.
- Compression: the image build gzips text assets ahead of time (`gzip_static`); anything else is
  gzipped on the fly. There is no brotli in nginx on purpose: `nginx-unprivileged` ships without
  the brotli module, and building one into the image isn't worth it when the Cloudflare edge
  already serves brotli/zstd to browsers. The origin only ever talks gzip to Cloudflare.
- Headers on every response, 404s included: the CSP below, HSTS with `preload`, `nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, COOP and CORP
  `same-origin`, and `X-Clacks-Overhead`.
- The access log has no IP addresses. There is no analytics, so there is nothing to keep them for.

## CSP

The policy is split by what each layer can know.

**Astro** writes a `<meta http-equiv="content-security-policy">` into every page, with
`default-src 'none'` and a SHA-256 hash for each inline script and style it emits. This is the
policy that governs scripts and styles, and since `astro preview` serves it too, the e2e tests
in CI run under the same policy as production.

**nginx** sends a header with what a `<meta>` policy cannot express (`frame-ancestors`) plus a
backstop for the rest (`base-uri`, `form-action`, `object-src`, `frame-src`, `worker-src`) and
`upgrade-insecure-requests`. It has no `default-src`, `script-src` or `style-src`, on purpose:
browsers enforce every policy they receive, and a header without each page's hashes would
block Astro's own inline scripts.

`upgrade-insecure-requests` is in the header only. On the real site it changes nothing (every
URL is same-origin and HTTPS, and HSTS with preload already forces that), but in the meta it
also applies to `astro preview` and the local container on plain `http://localhost`, where
Safari then upgrades every subresource to `https://localhost`, and the scripts, fonts and images fail.

**Where the meta sits.** Astro writes it into the head with its other head content, after the
page's own `<meta>`, `<link>` and font `<style>` elements; there is no supported way to move it
up. That's harmless: nothing before it executes (the only `<script>` there is JSON-LD, which is
data), and everything requested before it (icons, the manifest, the preloaded fonts) is
same-origin, which the policy allows anyway. The e2e suite checks both, so it stays that way.

Because the header leaves scripts to the meta, the image build **fails** if any page in `dist/`
is missing it.

### The contract for the app

1. Enable CSP in `astro.config.ts`, exactly:

   ```ts
   security: {
     csp: {
       algorithm: 'SHA-256',
       directives: [
         "default-src 'none'",
         "img-src 'self' data:",
         "font-src 'self'",
         "connect-src 'self'",
         "manifest-src 'self'",
         "base-uri 'none'",
         "form-action 'none'",
         "object-src 'none'",
         "require-trusted-types-for 'script'",
         "trusted-types 'none'",
       ],
     },
   },
   ```

2. **No `style="…"` attributes** in rendered HTML, build-time SVG included. Hashes do not cover
   attributes, so the browser drops them. The mock's `style="--i:3"` stagger indices become
   `data-i="3"` and the motion module sets `el.style.setProperty('--i', el.dataset.i)`. CSSOM
   writes from bundled scripts are allowed. Static values like `style="flex: 10"` become classes.
   Avoid `define:vars`.
3. **No HTML from strings.** Trusted Types is enforced, so `innerHTML`, `outerHTML`,
   `insertAdjacentHTML`, `document.write` and string `setTimeout` throw. Build nodes with
   `createElement`/`createElementNS`, clone a `<template>`, or render the SVG at build time.
   The mock's `scenes.js` uses `innerHTML` for packet glyphs; the port can't.
4. Scripts only through Astro `<script>` (bundled and hashed automatically). No inline
   `on*=` handlers, no `javascript:` URLs, no `is:inline` scripts. JSON-LD
   (`type="application/ld+json"`) is data, not script, and is fine.
5. Everything same-origin: Fontsource fonts, images from `astro:assets` or `public/`. No CDNs,
   no Google Fonts, no third-party embeds. `data:` is allowed for images only.
6. Set `markdown.syntaxHighlight` to `'prism'` or `false`. Shiki writes inline styles, and
   Astro warns about it at build time.
7. No `<ClientRouter />`, and no Astro `redirects` (do redirects in `nginx.conf`). No raw
   `.html` files in `public/`: every page must come from Astro so it carries the meta.
8. Routes: `trailingSlash: 'always'` and `build.format: 'directory'`, which matches nginx's
   `/foo` → `/foo/` redirect. The 404 page is `src/pages/404.astro`.
9. The image runs `npm ci --ignore-scripts` and then `npm run build` from a clean context with
   no `.git`, `design/`, `docs/`, `tests/` or `*.md` (Markdown under `src/` is kept). The build
   must not depend on install scripts or on files outside that context.

A CSP violation shows up as a console error, so the e2e "no console errors" check catches
regressions under `npm run preview`.

## Out-of-band setup (once)

None of this is in git. In order:

1. **First image.** Merge to `main`; `release` pushes `ghcr.io/guuse/portfolio:<sha>`.
2. **Make the package public.** GitHub → Packages → `portfolio` → Package settings → Change
   visibility → Public. The repo is public and so is everything in the image, and a public
   package means the pods need no pull secret. (If you'd rather keep it private: create
   `ghcr-pull` in the `portfolio` namespace the same way the other apps do, and add
   `imagePullSecrets: [{name: ghcr-pull}]` to the pod spec.) Under Package settings → Manage
   Actions access, check that this repo has **write** access.
3. **Argo CD.** Copy `homeserver/portfolio.yaml` to `argocd/applications/portfolio.yaml` in the
   homelab repo. Check that the shared `argocd/git-creds` token can write Contents on
   `guuse/portfolio`, because Image Updater commits the tag here. Until its first write-back,
   the placeholder tag in `kustomization.yaml` leaves the pods in `ImagePullBackOff`. That is
   expected and takes a few minutes at most.
4. **Cloudflare Tunnel public hostnames.** Zero Trust → Networks → Tunnels → the homelab
   tunnel → Public Hostname → Add, twice:

   | Field                            | Apex                                                  | www                       |
   | -------------------------------- | ----------------------------------------------------- | ------------------------- |
   | Subdomain / Domain               | _(empty)_ / `ekkelenkamp.dev`                         | `www` / `ekkelenkamp.dev` |
   | Service                          | `HTTPS` / `traefik.kube-system.svc.cluster.local:443` | same                      |
   | TLS → Origin Server Name         | `ekkelenkamp.dev`                                     | `www.ekkelenkamp.dev`     |
   | TLS → No TLS Verify              | off                                                   | off                       |
   | HTTP Settings → HTTP Host Header | `ekkelenkamp.dev`                                     | `www.ekkelenkamp.dev`     |

   **No Cloudflare Access application.** This is a public website. Every other tunnel hostname
   has an Access policy; this one is the deliberate exception.

5. **DNS.** Saving each hostname creates a proxied (orange-cloud) CNAME to the tunnel.
   - `www`: a specific record beats the `*.ekkelenkamp.dev` wildcard, so only `www` goes public.
     Every other subdomain stays as it was.
   - Apex: Cloudflare flattens a CNAME at the zone apex automatically. The wildcard never
     matched the apex. If an apex A/AAAA record exists, delete it first or the save fails.
   - If the dashboard refuses because of the wildcard, add the CNAME by hand
     (`<tunnel-id>.cfargotunnel.com`, proxied).
6. **Zone settings that inject scripts.** The CSP blocks anything Cloudflare adds to the HTML, so
   turn these off for `ekkelenkamp.dev` (or with a Configuration Rule for these two hostnames):
   Scrape Shield → **Email Address Obfuscation** (it would also break copy-email), **Rocket
   Loader**, and Web Analytics **automatic setup**. Leave Caching → Browser Cache TTL on
   "Respect existing headers".

HSTS uses `includeSubDomains`. That is safe because `.dev` is HSTS-preloaded as a whole TLD, so
every `*.ekkelenkamp.dev` host is already HTTPS-only in every browser.

## Verify

```bash
kubectl -n portfolio rollout status deploy/portfolio
kubectl -n portfolio get pods,svc,ingress,pdb,networkpolicy
kubectl -n argocd logs deploy/argocd-image-updater-controller | grep portfolio | tail

curl -sI https://ekkelenkamp.dev/                    # 200, CSP/HSTS/…, X-Clacks-Overhead
curl -sI https://www.ekkelenkamp.dev/projects/       # 301 → https://ekkelenkamp.dev/projects/
curl -sI https://ekkelenkamp.dev/nope/               # 404, same headers
curl -sI -H 'Accept-Encoding: gzip' https://ekkelenkamp.dev/_astro/<file>.js   # immutable, gzip/br
curl -s  https://ekkelenkamp.dev/coffee              # you'll see

# What is running, and what it was built from:
docker buildx imagetools inspect ghcr.io/guuse/portfolio:<sha> --format '{{ json .Provenance }}'
docker buildx imagetools inspect ghcr.io/guuse/portfolio:<sha> --format '{{ json .SBOM }}'
```

Locally, the same image the cluster runs, under the same constraints:

```bash
docker build -t portfolio:local .
docker run --rm --read-only --tmpfs /tmp --cap-drop ALL --security-opt no-new-privileges \
  -p 8080:8080 portfolio:local
curl -sI localhost:8080/ ; curl -sI -H 'Host: www.ekkelenkamp.dev' localhost:8080/
```

Then check the site on [Mozilla Observatory](https://developer.mozilla.org/en-US/observatory) and
in the browser console. A CSP problem announces itself there.

## Roll back

- **Normal: roll forward.** `git revert` the bad commit on `main`. `release` builds a new image,
  Image Updater pins it, and Argo CD rolls it out. Each pin is its own commit on
  `kustomization.yaml`, so `git log -p infrastructure/kustomization.yaml` shows what ran when.
- **Now, before CI finishes.** Image Updater re-pins the newest build and Argo CD self-heals, so
  editing the tag by hand does not stick. Turn off auto-sync on the `portfolio` Application in
  the Argo CD UI (the app-of-apps leaves child sync policies alone, so the toggle holds), then
  History and Rollback → the previous revision. Turn auto-sync back on once the revert has
  shipped.
- **A manifest change.** Revert it on `main`. It doesn't build an image, and Argo CD syncs it in
  about three minutes.

## Maintenance

- Base images are pinned by tag and digest in the `Dockerfile`, and actions by commit SHA in
  `release.yml`. Dependabot proposes bumps after a cooling-off period.
- Draining the single node: the PDB lets the first pod go and then waits, because its
  replacement has nowhere to schedule. For a planned reboot the site is down anyway, so use
  `kubectl drain <node> --ignore-daemonsets --delete-emptydir-data --disable-eviction`.
