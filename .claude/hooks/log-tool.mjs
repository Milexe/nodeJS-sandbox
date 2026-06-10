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

// Claude Code format: tool_name contains full name e.g. "mcp__app-local__list_drinks"
const toolName = payload.tool_name ?? 'unknown';
const [server, tool] = toolName.startsWith('mcp__')
  ? toolName.replace('mcp__', '').split('__').reduce((acc, v, i) => i === 0 ? [v, acc[1]] : [acc[0], [...(acc[1] || []), v].join('__')], [])
  : ['built-in', toolName];

console.error(`[tool-hook] PreToolUse server=${server} tool=${tool}`);

process.exit(0);
