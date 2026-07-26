# Multi-stage build: Hugo compiles the site, nginx serves the /public output.

FROM klakegg/hugo:0.111.3-ext-alpine AS builder
WORKDIR /site

# Vendored Ananke theme (git submodule at ./themes/ananke) — copied in explicitly
# so builds don't require the .git directory or network access.
COPY . .
RUN hugo --minify --destination /out

FROM nginx:alpine
COPY --from=builder /out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
