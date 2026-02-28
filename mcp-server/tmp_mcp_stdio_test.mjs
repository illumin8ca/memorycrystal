import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['dist/index.js'],
  cwd: process.cwd(),
  env: {
    ...process.env,
    CONVEX_URL: 'https://rightful-mockingbird-389.convex.cloud',
    OPENAI_API_KEY: 'sk-test',
    CRYSTAL_MCP_MODE: 'stdio',
  },
});

const client = new Client({ name: 'mcptest', version: '0.0.1' }, { capabilities: { tools: {} } });

async function run() {
  await client.connect(transport);
  console.log('connected');

  const tools = await client.listTools();
  console.log('tools_count', tools.tools?.length);

  const checks = [
    ['crystal_stats', {}],
    ['crystal_recent', { limit: 3 }],
    ['crystal_wake', {}],
    ['crystal_search_messages', { query: 'debug session' }],
    ['crystal_what_do_i_know', { topic: 'system' }],
    ['crystal_why_did_we', { decision: 'deploy memory architecture' }],
    ['crystal_checkpoint', { mode: 'list', limit: 2 }],
    ['crystal_recall', { query: 'test query' }],
    ['crystal_remember', {
      store: 'semantic',
      category: 'fact',
      title: 'Test memory title',
      content: 'Integration test memory content for audit.',
      tags: ['test', 'audit'],
    }],
    ['crystal_forget', { memoryId: 'does-not-exist' }],
  ];

  for (const [toolName, args] of checks) {
    try {
      const resp = await client.callTool({ name: toolName, arguments: args });
      console.log(`\n${toolName} ->`);
      console.log(JSON.stringify(resp, null, 2));
    } catch (error) {
      console.log(`\n${toolName} ERROR`);
      console.log(String(error));
    }
  }

  await client.close();
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
