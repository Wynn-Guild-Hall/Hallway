# Multi-stage build: Hugo compiles the site, nginx serves the /public output.
#
# `klakegg/hugo` images stopped being maintained in 2023, so we use
# `hugomods/hugo` — an actively-maintained community image tracking
# upstream releases. Explicitly pinned so a future upstream bump can't
# silently break the site build.
#
# Blowfish ships its Tailwind CSS precompiled and needs no Hugo Modules,
# so this stage needs neither a Sass compiler nor network access — it is
# a plain `hugo` run over the working tree.
#
# When bumping, first check nunocoracao/blowfish's README for its minimum
# Hugo version — Blowfish currently requires ≥ 0.158.0.
FROM hugomods/hugo:std-0.164.0 AS builder
WORKDIR /site

# Vendored Blowfish theme (git submodule at ./themes/blowfish) — copied in
# explicitly so builds don't require the .git directory or network access.
# A build that fails with "module not found" means the submodule wasn't
# checked out: run `git submodule update --init --recursive` in the clone.
COPY . .
RUN hugo --minify --destination /out

FROM nginx:alpine
COPY --from=builder /out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
