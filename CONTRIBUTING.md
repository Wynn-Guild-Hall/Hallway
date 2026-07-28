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
