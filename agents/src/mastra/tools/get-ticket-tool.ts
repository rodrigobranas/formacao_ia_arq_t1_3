import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.APP_DATABASE_URL,
});

const ticketSchema = z.object({
  id: z.number(),
  code: z.string(),
  status: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  description: z.string(),
  ticket_type_id: z.number().nullable(),
  assigned_to_id: z.number().nullable(),
  organization_id: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  sentiment: z.string().nullable(),
});

export const getTicketTool = createTool({
  id: 'get-ticket',
  description:
    'Busca informações de chamados (tickets) de helpdesk no banco de dados. Aceita o código do ticket (ex: TK-A1B2C3D4) e/ou o email do cliente. Pelo menos um dos dois deve ser informado.',
  inputSchema: z
    .object({
      code: z
        .string()
        .optional()
        .describe('Código do ticket no formato TK-XXXXXXXX'),
      email: z.string().email().optional().describe('Email do cliente'),
    })
    .refine((data) => !!data.code || !!data.email, {
      message: 'Informe pelo menos um dos campos: code ou email',
    }),
  outputSchema: z.object({
    tickets: z.array(ticketSchema),
    count: z.number(),
  }),
  execute: async (context) => {
    const { code, email } = context;
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
      created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
      sentiment: row.sentiment,
    }));

    return { tickets, count: tickets.length };
  },
});
