import { MCPClient } from '@mastra/mcp';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPathCandidates = [
  resolve(__dirname, 'helpdesk-mcp-server.ts'),
  resolve(__dirname, '../mcp/helpdesk-mcp-server.ts'),
  resolve(__dirname, '../../src/mastra/mcp/helpdesk-mcp-server.ts'),
];

const serverPath =
  serverPathCandidates.find((candidate) => existsSync(candidate)) ??
  serverPathCandidates[0];

export const helpdeskMcpClient = new MCPClient({
  id: 'helpdesk-mcp',
  servers: {
    helpdesk: {
      command: 'npx',
      args: ['tsx', serverPath],
      env: {
        ...(process.env.HELPDESK_DATABASE_URL
          ? { HELPDESK_DATABASE_URL: process.env.HELPDESK_DATABASE_URL }
          : {}),
      },
    },
  },
});
