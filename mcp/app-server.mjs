import 'dotenv/config';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import pg from 'pg';
import { resolveMcpMode, resolveMcpServerName } from './mcp-config.mjs';
import { registerAuthReadTools } from './tools/auth-read-tools.mjs';
import { registerChatTools } from './tools/chat-tools.mjs';
import { registerDrinkTools } from './tools/drinks-tools.mjs';
import { registerDrinkResources } from './tools/drinks-resources.mjs';
import { registerDrinkPrompts } from './tools/drinks-prompts.mjs';

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL?.trim();
const mode = resolveMcpMode(process.env.MCP_MODE);
const serverName = resolveMcpServerName(mode);

if (!databaseUrl) {
  console.error('[app-mcp] DATABASE_URL is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
});

const server = new McpServer({
  name: serverName,
  version: '1.0.0',
});

const scopeLabel =
  mode === 'readonly' ? 'the connected read-only database' : 'the local application database';

registerDrinkTools(server, pool, { mode });
registerAuthReadTools(server, pool, scopeLabel);
registerChatTools(server, pool);
registerDrinkResources(server, pool);
registerDrinkPrompts(server);

process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`[app-mcp] Server "${serverName}" running on stdio (${mode})`);
