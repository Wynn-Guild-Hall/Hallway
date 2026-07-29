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

The builder stage asserts two things before the image is worth building, because
neither failure announces itself. Hugo treats a **missing theme as a warning**,
not an error: given an empty `themes/blowfish` — what a clone whose submodule was
never checked out looks like — it exits 0 and emits a tree containing static
files and no `index.html`. nginx then fills the gap with its own "Welcome to
nginx!" page, so the deploy reports success while the site is gone. The guards
are `test -f themes/blowfish/theme.toml` before the build and
`test -f /out/index.html` after it; the second is the general invariant and
catches this class of failure whatever its cause.

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

Three, each for a reason the theme can't be configured around:

- `layouts/join/single.html` — the eligibility form. No theme layout has a
  concept of it.
- `layouts/partials/home/background.html` — the homepage hero. The theme's
  version renders the configured *author* as a circular avatar plus social
  links and a recent-articles list; ours keeps its background-image mechanics
  and replaces the content block, because the crest is a hexagon that
  `rounded-full` would clip, there is no author, and the page's job is to route
  people to `/join`.
- `layouts/_default/single.html` — a verbatim copy of the theme's file with one
  line changed, for the `-#` subtext support described below.

Every other page uses Blowfish's built-in layouts unchanged.

### Discord-style `-#` subtext

Content here is written by people who spend their day in Discord, so the site
supports Discord's subtext marker: a paragraph opening with `-# ` renders
smaller and dimmer, for asides and disclaimers.

Nothing in markdown means that, and it cannot be added at parse time — Hugo's
render hooks cover links, images, headings, blockquotes, code blocks, tables
and passthroughs, and a paragraph is none of those, so Goldmark hands the
marker through as literal text. Teaching Goldmark the syntax would mean a
custom Hugo binary, which would cost this build its single-binary,
network-free property. So the rewrite happens one step later, in
`layouts/partials/subtext.html`, which takes rendered content HTML and turns
paragraphs that open with the marker into `<p class="hall-subtext">`. Running
after rendering is what lets bold, links and emoji work inside a subtext line.

The cost is that the partial has to be reached from every layout that prints
`.Content`. Two of those are ours. The third is Blowfish's `_default/single.html`,
which renders every ordinary page (`/about`, `/what`, `/why`, `/who`, `/how`),
and is therefore copied into `layouts/` with that one line changed. A
whole-file copy for a one-line diff is a poor trade in isolation and a good one
here: a syntax that worked on the homepage but not on the pages beside it would
be a worse trap than a file to re-sync on theme bumps. The header comment on
the copy gives the `diff` command that checks it.

Styling is `.hall-subtext` in `custom.css`, sized in `em` so subtext stays
proportional to the context it appears in.

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
