# Scripts AGENTS

## Package Identity

- Purpose: bootstrap, wiring, smoke testing, and lifecycle automation for the VexClaw plugin.
- Scope: `scripts/*.sh`.

## Setup Commands

- Install plugin dependencies: `npm install`
- Run bootstrap: `npm run vexclaw:bootstrap`
- Validate environment and wiring: `npm run vexclaw:doctor`
- Enable integration: `npm run vexclaw:enable`
- Disable integration: `npm run vexclaw:disable`
- Smoke validation: `npm run test:smoke`

## Conventions

- Use `bash` with `set -euo pipefail` (or at minimum `set -e`) for all scripts.
- Prefer strict argument parsing and explicit exit handling.
- Keep idempotent behavior for `--dry-run` modes.
- Resolve repo paths defensively from script location.
- Shell-only changes should keep behavior backwards-compatible with existing `vexclaw-*` command names.

### ✅ DO / ❌ DON'T

- ✅ `scripts/vexclaw-doctor.sh`
- ✅ `scripts/vexclaw-bootstrap.sh`
- ❌ `scripts/*.sh` with silent partial writes or no validation.

## Touch Points / Key Files

- `./vexclaw-doctor.sh`
- `./vexclaw-bootstrap.sh`
- `./vexclaw-init.sh`
- `./vexclaw-enable.sh`
- `./vexclaw-disable.sh`
- `./vexclaw-e2e.sh`

## JIT Index Hints

- List scripts: `rg --files scripts/*.sh`
- Search integration checks: `rg -n "OPENCLAW_DIR|DRY_RUN|--dry-run|--purge" scripts/*.sh`
- Find env requirements: `rg -n "CONVEX_URL|OPENAI_API_KEY|OBSIDIAN_VAULT_PATH|VEXCLAW_" scripts/*.sh`

## Common Gotchas

- `openclaw` CLI may be absent in non-interactive environments, so scripts should tolerate restart failures and emit explicit guidance.
- Some flows are warning-heavy when `.env` contains placeholder values (`sk-...` / `your-deployment.convex.cloud`).

## Pre-PR Checks

- `npm run test:smoke`
