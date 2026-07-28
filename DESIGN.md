# Hallway — Design

## 1. What the site does

Three concerns:

1. **Static info** — a homepage explaining what the Guild Hall is.
2. **/join eligibility lookup** — a form that asks Hall-Monitor whether the entered Minecraft username belongs to a chief/owner of a major guild, and (if so) surfaces the four contact-role checkboxes.
3. **Live code display** — as the user ticks roles, the page recomputes a 4-bit integer over those roles and shows the resulting `HALL<NN>` code to type in Minecraft. The digits are zero-padded to two so the code matches the six-character shape of a dazebot account-link code; `static/js/request_code.js` mirrors `mc_command.format_code` in Hall-Monitor.

The site never submits an invite request itself. The Discord invite is issued at MC-time by Hall-Monitor after the user types the command on `verify.wynnvets.org`.

## 2. Build pipeline

Multi-stage Dockerfile:

- **Builder** — Hugo compiles the site (`hugo --minify`) into `/out`. The Ananke theme is vendored via the `themes/ananke` git submodule.
- **Runtime** — nginx serves `/out` on port 80.

Content is authored in Markdown under `content/`. The `/join` page uses a custom layout override at `layouts/join/single.html` because Ananke's default `single.html` doesn't ship the form markup we need. Every other page uses Ananke's built-in layouts unchanged.

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

- Change `baseURL` in `hugo.toml`.
- Change the `proxy_pass` upstream in `nginx.conf` if the Hall-Monitor service name/port differs.
- Rebuild the Docker image; nothing else here is host-specific.
