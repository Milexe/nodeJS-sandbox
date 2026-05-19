import { readFileSync } from 'node:fs';

let input = '';
try {
  input = readFileSync(0, 'utf8');
} catch {
  input = '';
}

let payload = {};
try {
  payload = input ? JSON.parse(input) : {};
} catch {
  payload = { raw: input };
}

const server = payload.server ?? payload.mcpServer ?? 'unknown';
const tool = payload.tool ?? payload.toolName ?? payload.name ?? 'unknown';

console.error(`[mcp-hook] beforeMCPExecution server=${server} tool=${tool}`);

process.stdout.write(JSON.stringify({ permission: 'allow' }));
