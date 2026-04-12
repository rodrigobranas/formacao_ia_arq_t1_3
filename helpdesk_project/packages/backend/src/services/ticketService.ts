import { db } from "../data/database";
import { generateUniqueCode } from "./ticketCodeService";
import { validateSupportTicketImages } from "./ticketAttachmentImageValidationService";
import {
  classifyTicketType,
  classifySentiment,
  type SentimentValue,
} from "./ticketClassifyService";
import {
  ValidationError,
  NotFoundError,
  list as listTicketTypes,
} from "./ticketTypeService";

const MAX_BASE64_SIZE = 1_370_000;

export interface AttachmentInput {
  filename: string;
  contentType: string;
  content: string;
}

export interface CreateTicketInput {
  name: string;
  email: string;
  phone: string;
  description: string;
  ticketTypeId?: number;
  attachments?: AttachmentInput[];
}

export interface Ticket {
  id: number;
  code: string;
  status: string;
  name: string;
  email: string;
  phone: string;
  description: string;
  ticketTypeId: number | null;
  ticketTypeName: string | null;
  sentiment: string | null;
  assignedToId: number | null;
  assignedToName: string | null;
  organizationId: number;
  createdAt: string;
  updatedAt: string;
}

export interface TicketListItem {
  id: number;
  code: string;
  status: string;
  name: string;
  ticketTypeName: string | null;
  sentiment: string | null;
  assignedToName: string | null;
  createdAt: string;
}

export interface TicketComment {
  id: number;
  ticketId: number;
  userId: number;
  userName: string;
  content: string;
  attachments: TicketAttachment[];
  createdAt: string;
}

export interface TicketAttachment {
  id: number;
  filename: string;
  contentType: string;
  content: string;
  createdAt: string;
}

export interface TicketAssignment {
  assignedToName: string;
  assignedByName: string;
  createdAt: string;
}

export interface TicketDetail extends Ticket {
  comments: TicketComment[];
  attachments: TicketAttachment[];
  assignments: TicketAssignment[];
}

export interface PublicTicketStatus {
  code: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

function validateRequiredField(
  value: string | undefined,
  fieldName: string,
): string {
  if (!value || value.trim().length === 0) {
    throw new ValidationError(`${fieldName} is required`);
  }
  return value.trim();
}

function validateAttachments(attachments: AttachmentInput[] | undefined): void {
  if (!attachments) return;
  for (const attachment of attachments) {
    if (attachment.content.length > MAX_BASE64_SIZE) {
      throw new ValidationError("Attachment exceeds maximum size of 1MB");
    }
  }
}

export async function createTicket(
  input: CreateTicketInput,
  organizationId: number,
): Promise<{ code: string }> {
  const name = validateRequiredField(input.name, "Name");
  const email = validateRequiredField(input.email, "Email");
  const phone = validateRequiredField(input.phone, "Phone");
  const description = validateRequiredField(input.description, "Description");
  validateAttachments(input.attachments);
  await validateSupportTicketImages(description, input.attachments);

  if (input.ticketTypeId !== undefined) {
    const ticketType = await db.oneOrNone<{ id: number }>(
      "SELECT id FROM ticket_types WHERE id = $1 AND organization_id = $2",
      [input.ticketTypeId, organizationId],
    );
    if (!ticketType) {
      throw new NotFoundError("Ticket type not found");
    }
  }

  const ticketInput = { name, email, description };
  let ticketTypeId = input.ticketTypeId ?? null;
  let sentiment: SentimentValue | null = null;

  if (!ticketTypeId) {
    const types = await listTicketTypes(organizationId);
    if (types.length > 0) {
      try {
        const result = await classifyTicketType(ticketInput, types);
        ticketTypeId = result.ticketTypeId;
      } catch {
        // Classification failed; proceed with null ticket_type_id
      }
    }
  }

  try {
    const result = await classifySentiment(ticketInput);
    sentiment = result.sentiment;
  } catch {
    // Classification failed; proceed with null sentiment
  }

  const code = await generateUniqueCode();

  return db.tx(async (t) => {
    const ticket = await t.one<{ id: number; code: string }>(
      `INSERT INTO tickets (code, name, email, phone, description, ticket_type_id, sentiment, organization_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, code`,
      [
        code,
        name,
        email,
        phone,
        description,
        ticketTypeId,
        sentiment,
        organizationId,
      ],
    );

    if (input.attachments && input.attachments.length > 0) {
      for (const attachment of input.attachments) {
        await t.none(
          `INSERT INTO ticket_attachments (ticket_id, filename, content_type, content)
           VALUES ($1, $2, $3, $4)`,
          [
            ticket.id,
            attachment.filename,
            attachment.contentType,
            attachment.content,
          ],
        );
      }
    }

    return { code: ticket.code };
  });
}

export interface TicketListResult {
  data: TicketListItem[];
  total: number;
}

export async function listTickets(
  organizationId: number,
  statusFilter?: string[],
  search?: string,
  limit?: number,
  offset?: number,
): Promise<TicketListResult> {
  const conditions = ["t.organization_id = $1"];
  const params: unknown[] = [organizationId];
  let paramIndex = 2;

  if (statusFilter && statusFilter.length > 0) {
    conditions.push(`t.status IN ($${paramIndex}:csv)`);
    params.push(statusFilter);
    paramIndex++;
  }

  if (search && search.trim().length > 0) {
    const searchTerm = `%${search.trim().toLowerCase()}%`;
    conditions.push(
      `(LOWER(t.name) LIKE $${paramIndex} OR LOWER(t.email) LIKE $${paramIndex} OR LOWER(t.phone) LIKE $${paramIndex} OR LOWER(t.description) LIKE $${paramIndex})`,
    );
    params.push(searchTerm);
    paramIndex++;
  }

  const whereClause = conditions.join(" AND ");

  const countResult = await db.one<{ count: string }>(
    `SELECT COUNT(*) AS count FROM tickets t WHERE ${whereClause}`,
    params,
  );
  const total = parseInt(countResult.count, 10);

  const queryParams = [...params];
  let limitOffsetClause = "";
  if (limit !== undefined) {
    limitOffsetClause += ` LIMIT $${paramIndex}`;
    queryParams.push(limit);
    paramIndex++;
  }
  if (offset !== undefined) {
    limitOffsetClause += ` OFFSET $${paramIndex}`;
    queryParams.push(offset);
    paramIndex++;
  }

  const data = await db.manyOrNone<TicketListItem>(
    `SELECT t.id, t.code, t.status, t.name,
           tt.name AS "ticketTypeName",
           t.sentiment,
           u.name AS "assignedToName",
           t.created_at AS "createdAt"
    FROM tickets t
    LEFT JOIN ticket_types tt ON tt.id = t.ticket_type_id
    LEFT JOIN users u ON u.id = t.assigned_to_id
    WHERE ${whereClause}
    ORDER BY t.created_at DESC${limitOffsetClause}`,
    queryParams,
  );

  return { data, total };
}

export async function getTicketById(
  ticketId: number,
  organizationId: number,
): Promise<TicketDetail> {
  const ticket = await db.oneOrNone<Ticket>(
    `SELECT t.id, t.code, t.status, t.name, t.email, t.phone, t.description,
            t.ticket_type_id AS "ticketTypeId",
            tt.name AS "ticketTypeName",
            t.sentiment,
            t.assigned_to_id AS "assignedToId",
            u.name AS "assignedToName",
            t.organization_id AS "organizationId",
            t.created_at AS "createdAt",
            t.updated_at AS "updatedAt"
     FROM tickets t
     LEFT JOIN ticket_types tt ON tt.id = t.ticket_type_id
     LEFT JOIN users u ON u.id = t.assigned_to_id
     WHERE t.id = $1 AND t.organization_id = $2`,
    [ticketId, organizationId],
  );

  if (!ticket) {
    throw new NotFoundError("Ticket not found");
  }

  const comments = await db.manyOrNone<Omit<TicketComment, "attachments">>(
    `SELECT tc.id, tc.ticket_id AS "ticketId", tc.user_id AS "userId",
            u.name AS "userName", tc.content,
            tc.created_at AS "createdAt"
     FROM ticket_comments tc
     JOIN users u ON u.id = tc.user_id
     WHERE tc.ticket_id = $1
     ORDER BY tc.created_at ASC`,
    [ticketId],
  );

  const commentAttachments =
    comments.length > 0
      ? await db.manyOrNone<TicketAttachment & { ticketCommentId: number }>(
          `SELECT ta.id, ta.filename, ta.content_type AS "contentType",
                ta.content, ta.created_at AS "createdAt",
                ta.ticket_comment_id AS "ticketCommentId"
         FROM ticket_attachments ta
         WHERE ta.ticket_id = $1 AND ta.ticket_comment_id IS NOT NULL
         ORDER BY ta.created_at ASC`,
          [ticketId],
        )
      : [];

  const commentsWithAttachments: TicketComment[] = comments.map((comment) => ({
    ...comment,
    attachments: commentAttachments.filter(
      (a) => a.ticketCommentId === comment.id,
    ),
  }));

  const attachments = await db.manyOrNone<TicketAttachment>(
    `SELECT ta.id, ta.filename, ta.content_type AS "contentType",
            ta.content, ta.created_at AS "createdAt"
     FROM ticket_attachments ta
     WHERE ta.ticket_id = $1 AND ta.ticket_comment_id IS NULL
     ORDER BY ta.created_at ASC`,
    [ticketId],
  );

  const assignments = await db.manyOrNone<TicketAssignment>(
    `SELECT ato.name AS "assignedToName",
            aby.name AS "assignedByName",
            ta.created_at AS "createdAt"
     FROM ticket_assignments ta
     JOIN users ato ON ato.id = ta.assigned_to_id
     JOIN users aby ON aby.id = ta.assigned_by_id
     WHERE ta.ticket_id = $1
     ORDER BY ta.created_at ASC`,
    [ticketId],
  );

  return {
    ...ticket,
    comments: commentsWithAttachments,
    attachments,
    assignments,
  };
}

export async function getFullTicketByCode(
  code: string,
  organizationId: number,
): Promise<PublicTicketStatus> {
  const ticket = await db.oneOrNone<PublicTicketStatus>(
    `SELECT * FROM tickets
     WHERE code = $1 AND organization_id = $2`,
    [code, organizationId],
  );

  if (!ticket) {
    throw new NotFoundError("Ticket not found");
  }

  return ticket;
}

export async function getTicketByCode(
  code: string,
  organizationId: number,
): Promise<PublicTicketStatus> {
  const ticket = await db.oneOrNone<PublicTicketStatus>(
    `SELECT code, status, created_at AS "createdAt", updated_at AS "updatedAt"
     FROM tickets
     WHERE code = $1 AND organization_id = $2`,
    [code, organizationId],
  );

  if (!ticket) {
    throw new NotFoundError("Ticket not found");
  }

  return ticket;
}

export async function assignTicket(
  ticketId: number,
  userId: number,
  organizationId: number,
): Promise<void> {
  const ticket = await db.oneOrNone<{ id: number; status: string }>(
    "SELECT id, status FROM tickets WHERE id = $1 AND organization_id = $2",
    [ticketId, organizationId],
  );

  if (!ticket) {
    throw new NotFoundError("Ticket not found");
  }

  if (ticket.status !== "new") {
    throw new ValidationError("Only new tickets can be assigned");
  }

  await db.tx(async (t) => {
    await t.none(
      `UPDATE tickets SET status = 'assigned', assigned_to_id = $1, updated_at = NOW()
       WHERE id = $2`,
      [userId, ticketId],
    );
    await t.none(
      `INSERT INTO ticket_assignments (ticket_id, assigned_to_id, assigned_by_id)
       VALUES ($1, $2, $3)`,
      [ticketId, userId, userId],
    );
  });
}

export async function forwardTicket(
  ticketId: number,
  targetUserId: number,
  currentUserId: number,
  organizationId: number,
): Promise<void> {
  const ticket = await db.oneOrNone<{
    id: number;
    status: string;
    assignedToId: number | null;
  }>(
    `SELECT id, status, assigned_to_id AS "assignedToId"
     FROM tickets WHERE id = $1 AND organization_id = $2`,
    [ticketId, organizationId],
  );

  if (!ticket) {
    throw new NotFoundError("Ticket not found");
  }

  if (ticket.status !== "assigned") {
    throw new ValidationError("Only assigned tickets can be forwarded");
  }

  if (ticket.assignedToId === targetUserId) {
    throw new ValidationError(
      "Cannot forward ticket to the same user currently assigned",
    );
  }

  const targetUser = await db.oneOrNone<{ id: number }>(
    "SELECT id FROM users WHERE id = $1 AND organization_id = $2",
    [targetUserId, organizationId],
  );

  if (!targetUser) {
    throw new ValidationError("Target user not found in the same organization");
  }

  await db.tx(async (t) => {
    await t.none(
      `UPDATE tickets SET assigned_to_id = $1, updated_at = NOW()
       WHERE id = $2`,
      [targetUserId, ticketId],
    );
    await t.none(
      `INSERT INTO ticket_assignments (ticket_id, assigned_to_id, assigned_by_id)
       VALUES ($1, $2, $3)`,
      [ticketId, targetUserId, currentUserId],
    );
  });
}

export async function closeTicket(
  ticketId: number,
  organizationId: number,
): Promise<void> {
  const ticket = await db.oneOrNone<{ id: number; status: string }>(
    "SELECT id, status FROM tickets WHERE id = $1 AND organization_id = $2",
    [ticketId, organizationId],
  );

  if (!ticket) {
    throw new NotFoundError("Ticket not found");
  }

  if (ticket.status !== "assigned") {
    throw new ValidationError("Only assigned tickets can be closed");
  }

  await db.none(
    "UPDATE tickets SET status = 'closed', updated_at = NOW() WHERE id = $1",
    [ticketId],
  );
}

export async function addComment(
  ticketId: number,
  userId: number,
  content: string,
  organizationId: number,
  attachments?: AttachmentInput[],
): Promise<{ id: number }> {
  const ticket = await db.oneOrNone<{ id: number }>(
    "SELECT id FROM tickets WHERE id = $1 AND organization_id = $2",
    [ticketId, organizationId],
  );

  if (!ticket) {
    throw new NotFoundError("Ticket not found");
  }

  const trimmedContent = validateRequiredField(content, "Content");
  validateAttachments(attachments);

  return db.tx(async (t) => {
    const comment = await t.one<{ id: number }>(
      `INSERT INTO ticket_comments (ticket_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [ticketId, userId, trimmedContent],
    );

    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        await t.none(
          `INSERT INTO ticket_attachments (ticket_id, ticket_comment_id, filename, content_type, content)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            ticketId,
            comment.id,
            attachment.filename,
            attachment.contentType,
            attachment.content,
          ],
        );
      }
    }

    return { id: comment.id };
  });
}
