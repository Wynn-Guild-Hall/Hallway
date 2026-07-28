# Hallway — Design

## 1. What the site does

Three concerns:

1. **Static info** — a homepage explaining what the Guild Hall is.
2. **/join eligibility lookup** — a form that asks Hall-Monitor whether the entered Minecraft username belongs to a chief/owner of a major guild, and (if so) surfaces the four contact-role checkboxes.
3. **Live code display** — as the user ticks roles, the page recomputes a 4-bit integer over those roles and shows the resulting `HALL<NN>` code to type in Minecraft. The digits are zero-padded to two so the code matches the six-character shape of a dazebot account-link code; `static/js/request_code.js` mirrors `mc_command.format_code` in Hall-Monitor.

The site never submits an invite request itself. The Discord invite is issued at MC-time by Hall-Monitor after the user types the command on `verify.wynnvets.org`.

## 2. Build pipeline

Multi-stage Dockerfile:

- **Builder** — Hugo compiles the site (`hugo --minify`) into `/out`. The Blowfish theme is vendored via the `themes/blowfish` git submodule, pinned to a tag.
- **Runtime** — nginx serves `/out` on port 80.

Content is authored in Markdown under `content/`; site config lives in
`config/_default/`, split the way Blowfish splits its own so theme upgrades can
be diffed file-for-file.

Blowfish was chosen over the theme it replaced for one structural reason worth
recording: it installs as a **plain git submodule and ships its Tailwind CSS
precompiled**. Several otherwise-attractive Hugo themes (Osprey Delight among
them, which is where this site's visual direction comes from) distribute as Hugo
Modules that pull further modules of their own, which would put a Go toolchain
and network access into the Docker build. This build stays offline.

Two consequences of the precompiled CSS shape everything under `assets/css/`:

- Only utility classes the theme already uses exist in the bundle, so our own
  markup styles itself with plain CSS in `custom.css` rather than with Tailwind
  utilities that would resolve to nothing.
- The scheme's colour variables are comma-separated triplets, so the
  `rgb(var(--x) / alpha)` form is invalid and gets dropped silently. `rgba(var(--x), alpha)`
  is the form that works.

### Layout overrides

Only two, both for reasons the theme can't be configured around:

- `layouts/join/single.html` — the eligibility form. No theme layout has a
  concept of it.
- `layouts/partials/home/background.html` — the homepage hero. The theme's
  version renders the configured *author* as a circular avatar plus social
  links and a recent-articles list; ours keeps its background-image mechanics
  and replaces the content block, because the crest is a hexagon that
  `rounded-full` would clip, there is no author, and the page's job is to route
  people to `/join`.

Every other page uses Blowfish's built-in layouts unchanged.

### Assets

`assets/img/hall.webp` is the hero screenshot, converted from PNG (1.8 MB → 68 KB).
`assets/img/guilds_wynn.png` is the guild crest: header logo, hero crest, and the
source image for the favicons in `static/`, which override the theme's own.
`assets/css/schemes/wynn.css` is the palette, sampled from the crest — periwinkle
`#9F99DF` and red `#DF6C6C` from the shield, warm stone neutrals from the
parchment hexagon and its outline.

## 3. nginx routing

`nginx.conf` splits traffic:

- `/` and any other static path → served from the built `/public`.
- `/api/join/*` → reverse-proxied to `hall-monitor:${HALL_MONITOR_PORT}` over the `hall-internal` Docker network. Deliberately **not** all of `/api/`: `/api/verify` is the Minecraft-side path whose whole security model is that connecting to verify.wynnvets.org proves account ownership, and over HTTP that reduces to "name a chief, get an invite as them". Picolimbo reaches it on the `verify` network instead.

This is why Hall-Monitor has no Traefik labels: it's reachable only through nginx.

## 4. How the JS talks to Hall-Monitor

- `static/js/lookup.js` — POSTs the username to `/api/join/lookup`. On success it un-hides the role picker and dispatches a `hallway:lookup` event.
- `static/js/request_code.js` — listens for that event and for checkbox changes; recomputes the integer live using the bit ordering **Bit 0 = Events, Bit 1 = Housing, Bit 2 = Warring, Bit 3 = Ownership** (kept in sync with `role_bits.py` in Hall-Monitor — the canonical source of truth).

For the full join flow end-to-end (what happens after the user types `HALL<NN>` in-game), see Hall-Monitor's [DESIGN.md §2](../Hall-Monitor/DESIGN.md).

## 5. Portability

To move off Wynncraft Veterans infrastructure:

- Change `baseURL` in `config/_default/hugo.toml`.
- Change the `proxy_pass` upstream in `nginx.conf` if the Hall-Monitor service name/port differs.
- Rebuild the Docker image; nothing else here is host-specific.
