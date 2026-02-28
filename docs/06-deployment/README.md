# 06-Deployment

## Scope

Build, deployment, and runtime release behavior.

## Deployment commands

- `cd mcp-server && npm run build`
- `npm run convex:deploy`

## Runtime

- OpenClaw wiring is enabled via `scripts/vexclaw-enable.sh`.
- Plugin command wiring is configured by `scripts/vexclaw-enable.sh` and `scripts/vexclaw-doctor.sh`.
