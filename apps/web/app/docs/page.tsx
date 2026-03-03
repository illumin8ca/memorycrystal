import Header from "../components/Header";
import Footer from "../components/Footer";

function BracketHeading({ children }: { children: string }) {
  return (
    <p className="text-xs font-mono text-secondary tracking-[0.28em] uppercase mb-4">
      <span className="text-accent">[ </span>
      {children}
      <span className="text-accent"> ]</span>
    </p>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="mt-4 bg-border/5 border border-border/30 p-4 overflow-x-auto text-sm">
      <code className="text-primary font-mono leading-relaxed whitespace-pre">{code}</code>
    </pre>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-void text-primary">
      <Header />
      <main className="max-w-5xl mx-auto px-6 lg:px-8 py-16">
        <BracketHeading>DOCUMENTATION</BracketHeading>
        <h1 className="font-heading text-5xl md:text-6xl">MCP API docs</h1>
        <p className="mt-5 max-w-3xl text-secondary">
          Memory Crystal gives your agents persistent memory through a simple HTTP API and an OpenClaw one-liner installer.
        </p>

        <section className="mt-10 space-y-6">
          <article className="glass-card border border-border/45 p-7">
            <h2 className="font-heading text-3xl">Quick start</h2>
            <p className="mt-3 text-secondary">Install the OpenClaw plugin and bootstrap memory in one command:</p>
            <CodeBlock code={`curl -fsSL https://memorycrystal.ai/install | bash`} />
          </article>

          <article className="glass-card border border-border/45 p-7">
            <h2 className="font-heading text-3xl">API key setup</h2>
            <p className="mt-3 text-secondary">
              1) Sign in to your dashboard at memorycrystal.ai<br />
              2) Open <span className="font-mono text-primary">Settings → API Keys</span><br />
              3) Click <span className="font-mono text-primary">Create New Key</span> and copy it immediately
            </p>
          </article>

          <article className="glass-card border border-border/45 p-7">
            <h2 className="font-heading text-3xl">Authentication</h2>
            <p className="mt-3 text-secondary">All MCP API requests require a Bearer token:</p>
            <CodeBlock
              code={`Authorization: Bearer mc_live_your_api_key_here`}
            />
          </article>

          <article className="glass-card border border-border/45 p-7">
            <h2 className="font-heading text-3xl">MCP API reference</h2>
            <p className="mt-3 text-secondary">Base URL: <span className="font-mono text-primary">https://memorycrystal.ai/api/mcp</span></p>

            <h3 className="mt-6 text-xl font-heading">POST /capture</h3>
            <CodeBlock
              code={`Request
{
  "content": "User prefers concise release notes",
  "store": "semantic",
  "tags": ["prefs", "writing"]
}

Response
{
  "ok": true,
  "memoryId": "mem_abc123"
}`}
            />

            <h3 className="mt-6 text-xl font-heading">POST /recall</h3>
            <CodeBlock
              code={`Request
{
  "query": "How should I format changelog updates?",
  "limit": 5
}

Response
{
  "ok": true,
  "results": [
    {
      "id": "mem_abc123",
      "content": "User prefers concise release notes",
      "score": 0.93
    }
  ]
}`}
            />

            <h3 className="mt-6 text-xl font-heading">POST /checkpoint</h3>
            <CodeBlock
              code={`Request
{
  "label": "pre-release-audit",
  "description": "State before production deploy"
}

Response
{
  "ok": true,
  "checkpointId": "chk_789xyz"
}`}
            />

            <h3 className="mt-6 text-xl font-heading">POST /wake</h3>
            <CodeBlock
              code={`Request
{
  "sessionId": "session_2026_03_03"
}

Response
{
  "ok": true,
  "briefing": "3 high-priority memories loaded",
  "topMemories": ["mem_abc123", "mem_def456"]
}`}
            />

            <h3 className="mt-6 text-xl font-heading">GET /stats</h3>
            <CodeBlock
              code={`Response
{
  "ok": true,
  "totalMemories": 214,
  "stores": {
    "semantic": 103,
    "episodic": 67,
    "procedural": 24,
    "prospective": 12,
    "sensory": 8
  }
}`}
            />
          </article>
        </section>
      </main>
      <Footer />
    </div>
  );
}
