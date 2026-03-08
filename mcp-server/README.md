# @memorycrystal/mcp-server

Persistent memory for AI assistants via the Model Context Protocol.

## Install

```bash
npm install -g @memorycrystal/mcp-server
```

## Configure

Set environment variables:
- `CRYSTAL_API_KEY` — your Memory Crystal API key (get it at memorycrystal.ai/dashboard)
- `CRYSTAL_SITE` — optional, defaults to `https://rightful-mockingbird-389.convex.site`

## Claude Desktop

Add to `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "memory-crystal": {
      "command": "crystal-mcp",
      "env": {
        "CRYSTAL_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Claude Code

Add to `.claude/mcp.json` in your project:

```json
{
  "mcpServers": {
    "memory-crystal": {
      "command": "crystal-mcp",
      "env": {
        "CRYSTAL_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Or run directly:
```bash
CRYSTAL_API_KEY=your-key crystal-mcp
```

## Codex

Add to your Codex MCP config or pass via environment:
```bash
CRYSTAL_API_KEY=your-key npx @memorycrystal/mcp-server
```

## Available Tools

| Tool | Description |
|------|-------------|
| `crystal_wake` | Get a contextual briefing at session start |
| `crystal_remember` | Save a memory (decision, lesson, goal, etc.) |
| `crystal_recall` | Semantic search across your memories |
| `crystal_recent` | Get recently accessed memories |
| `crystal_search_messages` | Search conversation history |
| `crystal_what_do_i_know` | Summarize what's known about a topic |
| `crystal_why_did_we` | Explain the reasoning behind past decisions |
| `crystal_checkpoint` | Save a session checkpoint |
| `crystal_forget` | Archive (soft-delete) a memory |
| `crystal_stats` | Get memory usage stats |

## Memory Stores

- **sensory** — immediate context, fades fastest
- **episodic** — events and conversations
- **semantic** — facts and knowledge
- **procedural** — how-to knowledge and workflows
- **prospective** — goals and future intentions

## Memory Categories

`decision` · `lesson` · `person` · `rule` · `event` · `fact` · `goal` · `workflow` · `conversation`
