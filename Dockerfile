# syntax=docker/dockerfile:1.27.1
#
# ekkelenkamp.dev: build the static Astro site with Node, serve dist/ with an
# unprivileged nginx. The runtime image holds nginx, its config and the HTML;
# no Node, no npm, no source. Base images are pinned by tag and digest;
# Dependabot bumps both.

# ---- build --------------------------------------------------------------------
FROM node:22.23.4-alpine3.24@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS build

WORKDIR /app

ENV CI=true \
    ASTRO_TELEMETRY_DISABLED=1 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    npm_config_audit=false \
    npm_config_fund=false \
    npm_config_update_notifier=false

# Dependencies first, so a copy change does not reinstall the world.
# --ignore-scripts: no install-time code from the dependency tree runs here
# (and no git hooks get installed into a directory that is not a repo).
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts

COPY . .
RUN npm run build

# Every page must carry Astro's CSP <meta> (security.csp in astro.config):
# nginx's header deliberately leaves script-src/style-src to it, so a page
# without one would ship with no script policy at all. Fail the build instead.
RUN missing="$(find dist -name '*.html' -exec grep -L 'http-equiv="content-security-policy"' {} +)"; \
    if [ -n "$missing" ]; then \
      printf 'Pages without the CSP <meta> (enable security.csp in astro.config):\n%s\n' "$missing" >&2; \
      exit 1; \
    fi

# Precompress text assets for nginx's gzip_static. -n keeps the gzip header
# free of names and timestamps, so identical input gives identical bytes.
RUN find dist -type f -size +1k \
      \( -name '*.html' -o -name '*.css' -o -name '*.js' -o -name '*.mjs' -o -name '*.json' \
         -o -name '*.svg' -o -name '*.xml' -o -name '*.txt' -o -name '*.webmanifest' -o -name '*.ico' \) \
      -exec gzip -9 -k -n {} +

# ---- runtime ------------------------------------------------------------------
FROM nginxinc/nginx-unprivileged:1.31.7-alpine3.24@sha256:b5047b9b76845eac124358373c6852377c52e4b05834a47647e955dd91cb8f1e AS runtime

# Static labels; the release workflow adds source, revision, created and version.
LABEL org.opencontainers.image.title="ekkelenkamp.dev" \
      org.opencontainers.image.description="Guus Ekkelenkamp's portfolio: a static Astro site on an unprivileged nginx" \
      org.opencontainers.image.url="https://ekkelenkamp.dev" \
      org.opencontainers.image.licenses="MIT"

# Config and content are owned by root and only readable by nginx (uid 101).
# nginx.conf does not include conf.d/, so the image's default site is inert.
COPY infrastructure/nginx/nginx.conf /etc/nginx/nginx.conf
COPY infrastructure/nginx/security-headers.conf infrastructure/nginx/mime-extra.types /etc/nginx/portfolio/
COPY --from=build /app/dist /srv/portfolio

USER 101
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["wget", "-q", "-O", "/dev/null", "http://127.0.0.1:8080/healthz"]

# Run nginx directly: the base image's entrypoint scripts rewrite files under
# /etc/nginx, which a read-only root filesystem (rightly) refuses.
ENTRYPOINT ["nginx", "-e", "stderr", "-g", "daemon off;"]
