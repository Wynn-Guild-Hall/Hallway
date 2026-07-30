# Hallway

Public website for the Wynncraft Guild Hall at [hall.wynnvets.org](https://hall.wynnvets.org). Full architecture reference is in [DESIGN.md](DESIGN.md).

## Fast facts

- **Build tool:** Hugo (static site generator, single Go binary).
- **Theme:** [Blowfish](https://github.com/nunocoracao/blowfish), vendored via git submodule at `themes/blowfish`, pinned to a tag. Plain submodule — Blowfish needs no Hugo Modules, so the Docker build stays offline.
- **Runtime:** nginx (from Dockerfile stage 2). No dynamic backend of its own — `/api/join/*` is reverse-proxied to Hall-Monitor. Nothing else under `/api/` is; see `nginx.conf` for why.
- **Deployed** as its own stack in the wynnvets [vets-deploy](../vets-deploy) repo on the `proxy` (Traefik) + `hall-internal` (bot API) networks.

## Layout landmarks

- `config/_default/` — site config, split the way Blowfish splits its own: `hugo.toml` (core), `params.toml` (theme options), `languages.en.toml` (title, logo, author), `menus.en.toml` (nav), `markup.toml`.
- `content/` — Markdown pages. `_index.md` is the homepage hero; `about/_index.md` is a hub of four cards into `about/what.md`/`why.md`/`who.md`/`how.md`; `join/_index.md`. Those four carry `icon:` and `back: "about"` front matter, which puts them on the hub and gives them a link back to it, plus `aliases:` for the pre-move `/<name>/` URLs. The `icon:` draws that page's card on `/about` — the pages themselves carry no icons; their bodies are plain Markdown.
- `layouts/join/single.html` — the /join eligibility form. Selected by `layout: "single"` in that page's front matter.
- `layouts/partials/home/background.html` — override of Blowfish's hero. Ours keeps the theme's background-image mechanics but drops the author avatar/social-links/recent-articles block, because the crest is a hexagon (the theme's `rounded-full` clips it) and this is an organisation, not a person.
- `layouts/partials/subtext.html` — rewrites Discord's `-#` subtext marker into `<p class="hall-subtext">`. Runs on rendered HTML because Hugo has no paragraph render hook. Every layout that prints `.Content` pipes it through this.
- `layouts/_default/single.html` — a copy of the theme's with two changes: the subtext rewrite, and a back link for pages that set `back:` in front matter. Re-copy and re-apply on a theme bump; `diff --strip-trailing-cr` against the theme file should show only those two hunks and the header comment.
- `layouts/shortcodes/hall-sections.html` — the card grid on `/about`. Reads the About group out of `menus.en.toml`, so the sub-pages are declared once; each card's icon is the target page's `icon:` front matter and its blurb is that page's `description`.
- `layouts/_default/_markup/render-heading.html` — the theme's, plus `### A Housing Contact {icon="location-dot"}`. Nothing uses it (icons are hub-only by convention), but it's kept so that anyone who wants a body icon reaches for the attribute rather than the `icon` shortcode — a shortcode in a heading leaks Hugo's placeholder into the id and yields anchors like `hahahugoshortcode7s0hbhb-seat-allocation`.
- `assets/img/hall.webp` — the hero screenshot. `assets/img/guilds_wynn.png` — the crest, used as header logo and as the source for every favicon in `static/`.
- `assets/css/schemes/wynn.css` — the palette, sampled from the crest. `assets/css/custom.css` — everything else.
- `static/js/lookup.js` + `static/js/request_code.js` — the /join page's client-side logic.
- `nginx.conf` — split between static serve and the `/api/join/*` reverse-proxy. Widening that prefix would republish Hall-Monitor's Minecraft-side verify endpoint to the web.

## Don't

- Don't edit files inside `themes/blowfish/` — override at `layouts/` instead so `git submodule update` stays clean.
- Don't assume a green Hugo build means a working site. Hugo treats a **missing theme as a warning**: with an empty `themes/blowfish` it exits 0 and emits no `index.html`, and nginx then serves its own "Welcome to nginx!" page. The Dockerfile guards against exactly this — don't remove those two `test -f` checks. On a server, the cause is a clone that needs `git submodule update --init --recursive`.
- Don't reach for Tailwind utility classes in our own markup. Blowfish ships a **precompiled** `main.css`; a class the theme doesn't already use isn't in the bundle and will silently do nothing. Write plain CSS in `assets/css/custom.css`.
- Don't write `rgb(var(--color-x) / 0.5)`. The scheme triplets are comma-separated, so that's invalid CSS and the entire declaration is dropped — with no build error. Use `rgba(var(--color-x), 0.5)`.
- Don't add a `{{ .Content }}` to a layout without piping it through `partial "subtext.html"`. It won't error — the page just renders `-#` markers as literal text on that one layout, which is exactly the inconsistency the partial exists to avoid.
- Don't change the bit ordering in `request_code.js` without updating `role_bits.py` in Hall-Monitor first — they must stay in sync.
- Don't add a Node/JS runtime backend. Static files + reverse-proxy is enough.
