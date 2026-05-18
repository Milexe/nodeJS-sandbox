import 'dotenv/config';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import pg from 'pg';
import { registerDrinkTools } from './tools/drinks-tools.mjs';

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  console.error('[app-mcp] DATABASE_URL is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
});

const server = new McpServer({
  name: 'app-local',
  version: '1.0.0',
});

registerDrinkTools(server, pool);

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
console.error('[app-mcp] Server running on stdio');
