# VexClaw Operations

## Health checks

Run from repo root:

- `scripts/vexclaw-doctor.sh --dry-run` (safe mode, no writes)
- `scripts/vexclaw-doctor.sh` (full check)
- `npm run test:smoke` (alias of doctor smoke mode)
- `npm run vexclaw:bootstrap` (fresh install flow)
- `npm run vexclaw:e2e` (full bootstrap + enable + wiring verification)

## Enable / disable

Enable:

```bash
npm run vexclaw:enable
```

Fresh install:

```bash
npm run vexclaw:bootstrap
```

Disable:

```bash
npm run vexclaw:disable
```

If you need a preview:

```bash
scripts/vexclaw-enable.sh --dry-run
scripts/vexclaw-disable.sh --dry-run
```

## File checklist

- `plugin/openclaw-hook.json` — manifest consumed by plugin loader.
- `plugin/handler.js` — runtime hook handler and status output.
- `plugin/HOOK.md` — hook and install contract.
- `../02-setup-guides/INSTALL.md` — install playbook.
- `../OPERATIONS.md` — legacy operations wrapper.

## Troubleshooting

- If doctor fails because dependencies are missing, run `npm run vexclaw:init`.
- If MCP tools fail at runtime, rebuild with:

```bash
cd mcp-server
npm install
npm run build
```

- If plugin files are not discovered, set one of:
  - `OPENCLAW_PLUGIN_DIR`
  - `OPENCLAW_DIR`

Graph foundation status:

```bash
cd /path/to/openclaw-vexclaw
npx convex run vexclaw/graph:getKnowledgeGraphFoundationStatus
```

## Roadmap and future upgrades

See `ROADMAP.md` for the current product and engineering roadmap.

For the typed graph implementation plan, see `PRD_TYPED_KNOWLEDGE_GRAPH.md`.

## Secrets and local state

- Keep `.env` out of source control.
- Keep `.env.example` tracked for onboarding.
- Plugin state is stored in `.vexclaw/` and included in gitignore.

## Canonical docs

- Install and bootstrap: `../02-setup-guides/INSTALL.md`
- Roadmap: `../00-project-overview/ROADMAP.md`
