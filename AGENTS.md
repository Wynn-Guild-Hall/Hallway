# Hallway

Public website for the Wynncraft Guild Hall at [hall.wynnvets.org](https://hall.wynnvets.org). Full architecture reference is in [DESIGN.md](DESIGN.md).

## Fast facts

- **Build tool:** Hugo (static site generator, single Go binary).
- **Theme:** [Blowfish](https://github.com/nunocoracao/blowfish), vendored via git submodule at `themes/blowfish`, pinned to a tag. Plain submodule — Blowfish needs no Hugo Modules, so the Docker build stays offline.
- **Runtime:** nginx (from Dockerfile stage 2). No dynamic backend of its own — `/api/join/*` is reverse-proxied to Hall-Monitor. Nothing else under `/api/` is; see `nginx.conf` for why.
- **Deployed** as its own stack in the wynnvets [vets-deploy](../vets-deploy) repo on the `proxy` (Traefik) + `hall-internal` (bot API) networks.

## Layout landmarks

- `config/_default/` — site config, split the way Blowfish splits its own: `hugo.toml` (core), `params.toml` (theme options), `languages.en.toml` (title, logo, author), `menus.en.toml` (nav), `markup.toml`.
- `content/` — Markdown pages. `_index.md` is the homepage hero; `about.md`; `join/_index.md`.
- `layouts/join/single.html` — the /join eligibility form. Selected by `layout: "single"` in that page's front matter.
- `layouts/partials/home/background.html` — override of Blowfish's hero. Ours keeps the theme's background-image mechanics but drops the author avatar/social-links/recent-articles block, because the crest is a hexagon (the theme's `rounded-full` clips it) and this is an organisation, not a person.
- `assets/img/hall.webp` — the hero screenshot. `assets/img/guilds_wynn.png` — the crest, used as header logo and as the source for every favicon in `static/`.
- `assets/css/schemes/wynn.css` — the palette, sampled from the crest. `assets/css/custom.css` — everything else.
- `static/js/lookup.js` + `static/js/request_code.js` — the /join page's client-side logic.
- `nginx.conf` — split between static serve and the `/api/join/*` reverse-proxy. Widening that prefix would republish Hall-Monitor's Minecraft-side verify endpoint to the web.

## Don't

- Don't edit files inside `themes/blowfish/` — override at `layouts/` instead so `git submodule update` stays clean.
- Don't reach for Tailwind utility classes in our own markup. Blowfish ships a **precompiled** `main.css`; a class the theme doesn't already use isn't in the bundle and will silently do nothing. Write plain CSS in `assets/css/custom.css`.
- Don't write `rgb(var(--color-x) / 0.5)`. The scheme triplets are comma-separated, so that's invalid CSS and the entire declaration is dropped — with no build error. Use `rgba(var(--color-x), 0.5)`.
- Don't change the bit ordering in `request_code.js` without updating `role_bits.py` in Hall-Monitor first — they must stay in sync.
- Don't add a Node/JS runtime backend. Static files + reverse-proxy is enough.
