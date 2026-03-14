# Memory Crystal Streamable HTTP MCP Server

Standalone MCP server that wraps Memory Crystal's hosted HTTP API and exposes it over the MCP Streamable HTTP transport.

## Features

Exposes these MCP tools:

- `memory_search` → `POST /api/mcp/recall`
- `memory_save` → `POST /api/mcp/capture`
- `memory_checkpoint` → `POST /api/mcp/checkpoint`
- `search_messages` → `POST /api/mcp/search-messages`
- `recent_messages` → `POST /api/mcp/recent-messages`
- `memory_stats` → `GET /api/mcp/stats`

## Config

Environment variables:

- `MEMORY_CRYSTAL_API_KEY` — optional at process level, but required unless the client sends `Authorization: Bearer <key>`
- `MEMORY_CRYSTAL_API_URL` — optional, defaults to `https://rightful-mockingbird-389.convex.site`
- `PORT` — optional, defaults to `3100`
- `HOST` — optional, defaults to `0.0.0.0`

## Install

From the monorepo root:

```bash
npm install
npm run build --workspace packages/mcp-server
```

## Run

```bash
MEMORY_CRYSTAL_API_KEY=your_api_key_here npm run start --workspace packages/mcp-server
```

Server endpoints:

- MCP: `http://localhost:3100/mcp`
- Health: `http://localhost:3100/health`

## Claude Code

```bash
claude mcp add memory-crystal --transport http http://localhost:3100/mcp
```

If you want the server to rely on header-based auth instead of an env var, make sure your client includes:

```http
Authorization: Bearer <your-memory-crystal-api-key>
```

## Codex CLI

```bash
codex mcp add memory-crystal http://localhost:3100/mcp
```

## Deploy

This package is a plain Node HTTP service and can be deployed on Railway, Fly.io, Render, or any container/runtime that can run:

```bash
npm run start --workspace packages/mcp-server
```

### Railway (monorepo)

This repo already has a root `railway.toml` for the web app, so the MCP service must use its own config file.

Use these **service settings** in Railway for the `mcp-server` service:

- **Root Directory:** `/packages/mcp-server`
- **Railway Config File:** `/packages/mcp-server/railway.toml`
- **Port:** `3100`

The package-local `railway.toml` handles:

- build: `npm install && npm run build`
- start: `node dist/index.js`
- healthcheck: `/health`
- watch path: `/packages/mcp-server/**`

Why this matters: Railway will otherwise pick up the repo-root `railway.toml` and boot the Next.js web app instead of the MCP server.

## Notes

- The server uses the official `@modelcontextprotocol/sdk` Streamable HTTP transport.
- It is implemented as a stateless HTTP MCP endpoint at `/mcp`.
- All backend requests to Memory Crystal are authenticated with `Authorization: Bearer <apiKey>`.
