# Multi-stage build: Hugo compiles the site, nginx serves the /public output.
#
# `klakegg/hugo` images stopped being maintained in 2023, so we use
# `hugomods/hugo` — an actively-maintained community image tracking
# upstream releases. The `std` variant ships extended Hugo + git + Sass,
# which Ananke's SCSS pipeline needs. Explicitly pinned so a future
# upstream bump can't silently break the site build.
#
# When bumping, first check theNewDynamic/gohugo-theme-ananke's
# `netlify.toml` for its minimum Hugo version — Ananke currently
# requires ≥ 0.160.0.
FROM hugomods/hugo:std-0.164.0 AS builder
WORKDIR /site

# Vendored Ananke theme (git submodule at ./themes/ananke) — copied in explicitly
# so builds don't require the .git directory or network access.
COPY . .
RUN hugo --minify --destination /out

FROM nginx:alpine
COPY --from=builder /out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
