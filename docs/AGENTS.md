# Docs AGENTS

## Package Identity

- Purpose: documentation and onboarding artifacts for the Memory Crystal plugin repo.
- Scope: standards for docs layout, references, and links.

## Setup Commands

- `ls docs`
- `rg -n "##" docs/**/*.md`

## Patterns & Conventions

- Use numbered sections (`00-` to `10-`) for all long-lived documentation.
- Keep compatibility shims (deprecated docs) with explicit `[SUPERSCEEDED]`.
- All links must be repo-relative.
- Prefer small, focused docs with a `README.md` in every docs subfolder.

### ✅ DO / ❌ DON'T

- ✅ `./00-project-overview/README.md`
- ✅ `./01-architecture/README.md`
- ✅ `./DOCUMENTATION_INDEX.md`
- ✅ `./02-setup-guides/INSTALL.md`
- ❌ `../../../../absolute/or/external/path`

## Touch Points / Key Files

- `./README.md`
- `./DOCUMENTATION_INDEX.md`
- `./00-project-overview/ROADMAP.md`
- `./02-setup-guides/INSTALL.md`
- `./07-operations/OPERATIONS.md`

## JIT Index Hints

- `rg -n "Superseded|superseded|Deprecated" docs/**/*.md`
- `rg -n "https://|/Users/|file://"`
- `ls docs/*`

## Common Gotchas

- Old top-level docs moved into section folders; old paths now point to superseded wrappers.

## Pre-PR Checks

- Check: no absolute links in `docs` (use repo-relative only).
- Check: each section folder contains `README.md`.
