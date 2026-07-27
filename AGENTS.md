# Hallway

Public website for the Wynncraft Guild Hall at [hall.wynnvets.org](https://hall.wynnvets.org). Full architecture reference is in [DESIGN.md](DESIGN.md).

## Fast facts

- **Build tool:** Hugo (static site generator, single Go binary).
- **Theme:** [Ananke](https://github.com/theNewDynamic/gohugo-theme-ananke), vendored via git submodule at `themes/ananke`.
- **Runtime:** nginx (from Dockerfile stage 2). No dynamic backend of its own — `/api/join/*` is reverse-proxied to Hall-Monitor. Nothing else under `/api/` is; see `nginx.conf` for why.
- **Deployed** as its own stack in the wynnvets [vets-deploy](../vets-deploy) repo on the `proxy` (Traefik) + `hall-internal` (bot API) networks.

## Layout landmarks

- `content/` — Markdown pages. `_index.md` per section.
- `layouts/join/single.html` — the ONLY override of an Ananke layout; needed for the form markup on /join.
- `static/js/lookup.js` + `static/js/request_code.js` — the /join page's client-side logic.
- `hugo.toml` — site config (`theme`, `baseURL`, params).
- `nginx.conf` — split between static serve and the `/api/join/*` reverse-proxy. Widening that prefix would republish Hall-Monitor's Minecraft-side verify endpoint to the web.

## Don't

- Don't edit files inside `themes/ananke/` — override at `layouts/` instead so `git submodule update` stays clean.
- Don't change the bit ordering in `request_code.js` without updating `role_bits.py` in Hall-Monitor first — they must stay in sync.
- Don't add a Node/JS runtime backend. Static files + reverse-proxy is enough.
