# Contributing to Hallway

## Workflow

1. Fork or branch off `main`.
2. Fetch the Ananke theme submodule: `git submodule update --init --recursive`.
3. `hugo server` for live preview on `http://localhost:1313`.
4. Edit content in `content/`, layout overrides in `layouts/`, JS in `static/js/`, styles in `static/css/style.css`.
5. `hugo` (or the Docker build) to produce the static site.
6. Open a PR against `main`.

## Commit messages

Prefix each commit with one of `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`. Lowercase, colon-space, imperative subject.

Examples:

- `fix: correct role bit ordering in request_code.js`
- `feat: add recruitment status list to homepage`
- `docs: explain the /join flow end-to-end`

## Ananke theme

Ananke ships upstream at [theNewDynamic/gohugo-theme-ananke](https://github.com/theNewDynamic/gohugo-theme-ananke). **Don't** edit files under `themes/ananke/` — override at `layouts/` instead so a `git submodule update` stays clean.

Architecture and the /join flow are in [DESIGN.md](DESIGN.md).
