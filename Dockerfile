# Multi-stage build: Hugo compiles the site, nginx serves the /public output.
#
# `klakegg/hugo` images stopped being maintained in 2023, so we use
# `hugomods/hugo` — an actively-maintained community image tracking
# upstream releases. The `exts` variant ships the extended binary needed
# by Ananke's SCSS pipeline.
FROM hugomods/hugo:exts AS builder
WORKDIR /site

# Vendored Ananke theme (git submodule at ./themes/ananke) — copied in explicitly
# so builds don't require the .git directory or network access.
COPY . .
RUN hugo --minify --destination /out

FROM nginx:alpine
COPY --from=builder /out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
