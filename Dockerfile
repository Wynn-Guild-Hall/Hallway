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
COPY . .

# Both guards exist because Hugo does NOT fail on a missing theme. Given an
# empty themes/blowfish — what a clone whose submodule was never checked out
# looks like — it logs "found no layout file for kind home" as a *warning*,
# exits 0, and emits a tree with no index.html. nginx then papers over the
# hole with its own "Welcome to nginx!" page, so the deploy reports success
# and the site is broken. That happened once; hence the check.
#
# If the first guard trips, the fix is in the clone, not here:
#   git submodule update --init --recursive
#
# The second is the general invariant, and catches the same class of failure
# whatever the cause: a build with no homepage is never a build worth shipping.
RUN set -eu; \
    test -f themes/blowfish/theme.toml || { \
      echo "ERROR: themes/blowfish is empty — the theme submodule is not checked out."; \
      echo "       Run: git submodule update --init --recursive"; \
      exit 1; \
    }; \
    hugo --minify --destination /out; \
    test -f /out/index.html || { \
      echo "ERROR: Hugo exited 0 but produced no /out/index.html."; \
      echo "       Shipping this would serve nginx's default page."; \
      exit 1; \
    }

FROM nginx:alpine
COPY --from=builder /out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
