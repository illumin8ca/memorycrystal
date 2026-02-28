# 06-Deployment

## Scope

Build, deployment, and runtime release behavior.

## Deployment commands

- `cd mcp-server && npm run build`
- `npm run convex:deploy`

## Runtime

- OpenClaw wiring is enabled via `scripts/crystal-enable.sh`.
- Plugin command wiring is configured by `scripts/crystal-enable.sh` and `scripts/crystal-doctor.sh`.
