export const MCP_MODES = {
  READONLY: 'readonly',
  READWRITE: 'readwrite',
};

export function resolveMcpMode(value) {
  return value === MCP_MODES.READONLY ? MCP_MODES.READONLY : MCP_MODES.READWRITE;
}

export function resolveMcpServerName(mode) {
  return mode === MCP_MODES.READONLY ? 'app-live-readonly' : 'app-local';
}
