# Contributing to Hallway

## Workflow

1. Fork or branch off `main`.
2. Fetch the Blowfish theme submodule: `git submodule update --init --recursive`.
3. `hugo server` for live preview on `http://localhost:1313`.
4. Edit content in `content/`, config in `config/_default/`, layout overrides in
   `layouts/`, JS in `static/js/`, styles in `assets/css/custom.css`, palette in
   `assets/css/schemes/wynn.css`.
5. `hugo` (or the Docker build) to produce the static site.
6. `cd tests && npm install && npx playwright test` against a running preview.
7. Open a PR against `main`.

## Writing content

Pages under `content/` are ordinary Markdown, plus one Discord borrowing:

```markdown
-# Membership does not imply endorsement of any guild.
```

A paragraph starting with `-# ` renders as **subtext** — smaller and dimmer —
the same as it does in Discord. Inline markup inside it works normally. The
marker has to be the first thing in the paragraph, so put a blank line above
it; on a later line of an existing paragraph it stays literal. If you want a
literal `-#` at the start of a paragraph, write `&#45;#`.

This is not Markdown, and Hugo has no paragraph render hook to implement it in,
so `layouts/partials/subtext.html` rewrites it after rendering. Any new layout
that prints `.Content` needs to pipe it through that partial, or `-#` will show
up verbatim on those pages.

### Icons

By convention icons live on the `/about` hub only, set by `icon:` in a page's
front matter (see below) — page bodies stay plain Markdown.

If you do want one in a body, a heading takes it as a markdown attribute:

```markdown
### A Housing Contact {icon="location-dot"}
```

Anywhere else — a table cell, mid-sentence — use the theme's shortcode,
`{{%/* icon "signal" */%}}`. Any name in `themes/blowfish/assets/icons/` or in
our own `assets/icons/` works.

**Don't put the shortcode in a heading.** It renders, but Hugo's placeholder
token ends up in the generated id, so `## {{%/* icon "list-ol" */%}} Seat
Allocation` gets `id="hahahugoshortcode7s0hbhb-seat-allocation"` and every link
to `#seat-allocation` breaks silently. Use the attribute form for headings.

### Adding a page under About

Three things, none of which involve editing `about/_index.md`:

1. Write `content/about/<name>.md` with a `description` — it becomes the page's
   blurb on the `/about` hub, so make it the question the page answers.
2. Add `icon: "<name>"` and `back: "about"` to its front matter.
3. Add it to the About group in `config/_default/menus.en.toml`, with an
   absolute `pageRef` (`/about/<name>`) and a `weight` that puts it where you
   want it.

The hub reads that menu group, so the card appears on its own.

## Commit messages

Prefix each commit with one of `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`. Lowercase, colon-space, imperative subject.

Examples:

- `fix: correct role bit ordering in request_code.js`
- `feat: add recruitment status list to homepage`
- `docs: explain the /join flow end-to-end`

## Blowfish theme

Blowfish ships upstream at [nunocoracao/blowfish](https://github.com/nunocoracao/blowfish),
pinned to a tag by the `themes/blowfish` submodule. **Don't** edit files under
`themes/blowfish/` — override at `layouts/` instead so a `git submodule update`
stays clean.

Two things about it are worth knowing before you write any CSS:

- Its `main.css` is **precompiled Tailwind**, shipped in the repo. A utility
  class the theme doesn't already use itself does not exist in the bundle, so
  adding one to our markup silently does nothing. Write plain CSS in
  `assets/css/custom.css` against the scheme variables instead.
- The scheme variables are **comma-separated** triplets (`250, 247, 240`), so
  `rgb(var(--color-neutral) / 0.6)` is invalid and the whole declaration gets
  dropped. Use `rgba(var(--color-neutral), 0.6)`.

Architecture and the /join flow are in [DESIGN.md](DESIGN.md).
