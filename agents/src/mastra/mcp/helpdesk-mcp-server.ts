#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString:
    process.env.HELPDESK_DATABASE_URL ??
    'postgresql://postgres:postgres@localhost:5432/app',
});

const server = new McpServer({
  name: 'Help Desk MCP',
  version: '1.0.0',
});

server.registerTool(
  'get-ticket',
  {
    title: 'Get Ticket',
    description:
      'Busca informações de chamados (tickets) de helpdesk no banco de dados. Aceita o código do ticket (ex: TK-A1B2C3D4) e/ou o email do cliente. Pelo menos um dos dois deve ser informado.',
    inputSchema: {
      code: z
        .string()
        .optional()
        .describe('Código do ticket no formato TK-XXXXXXXX'),
      email: z.string().email().optional().describe('Email do cliente'),
    },
  },
  async ({ code, email }) => {
    if (!code && !email) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Informe pelo menos um dos campos: code ou email',
          },
        ],
      };
    }

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (code) {
      params.push(code);
      conditions.push(`code = $${params.length}`);
    }
    if (email) {
      params.push(email);
      conditions.push(`email = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT id, code, status, name, email, phone, description,
             ticket_type_id, assigned_to_id, organization_id,
             created_at, updated_at, sentiment
      FROM tickets
      ${where}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const result = await pool.query(sql, params);

    const tickets = result.rows.map((row) => ({
      id: row.id,
      code: row.code,
      status: row.status,
      name: row.name,
      email: row.email,
      phone: row.phone,
      description: row.description,
      ticket_type_id: row.ticket_type_id,
      assigned_to_id: row.assigned_to_id,
      organization_id: row.organization_id,
      created_at:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : String(row.created_at),
      updated_at:
        row.updated_at instanceof Date
          ? row.updated_at.toISOString()
          : String(row.updated_at),
      sentiment: row.sentiment,
    }));

    const payload = { tickets, count: tickets.length };

    return {
      content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
