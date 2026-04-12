import { db } from "../data/database";

const NAME_MAX_LENGTH = 50;
const DESCRIPTION_MAX_LENGTH = 255;

export interface TicketType {
  id: number;
  name: string;
  description: string | null;
}

export interface CreateTicketTypeInput {
  name: string;
  description?: string;
}

export interface UpdateTicketTypeInput {
  name?: string;
  description?: string;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class InUseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InUseError";
  }
}

function validateName(name: string | undefined, required: boolean): string | undefined {
  if (name === undefined) {
    if (required) {
      throw new ValidationError("Name is required");
    }

    return undefined;
  }

  const normalizedName = name.trim();

  if (normalizedName.length === 0) {
    throw new ValidationError("Name is required");
  }

  if (normalizedName.length > NAME_MAX_LENGTH) {
    throw new ValidationError("Name must be at most 50 characters");
  }

  return normalizedName;
}

function requireName(name: string | undefined): string {
  const validatedName = validateName(name, true);

  if (validatedName === undefined) {
    throw new ValidationError("Name is required");
  }

  return validatedName;
}

function validateDescription(description: string | undefined): string | null | undefined {
  if (description === undefined) {
    return undefined;
  }

  const normalizedDescription = description.trim();

  if (normalizedDescription.length === 0) {
    return null;
  }

  if (normalizedDescription.length > DESCRIPTION_MAX_LENGTH) {
    throw new ValidationError("Description must be at most 255 characters");
  }

  return normalizedDescription;
}

async function ensureNameIsUnique(name: string, organizationId: number, excludeId?: number) {
  const existingTicketType = excludeId === undefined
    ? await db.oneOrNone<{ id: number }>(
        `SELECT id
         FROM ticket_types
         WHERE LOWER(name) = LOWER($1)
           AND organization_id = $2
         LIMIT 1`,
        [name, organizationId],
      )
    : await db.oneOrNone<{ id: number }>(
        `SELECT id
         FROM ticket_types
         WHERE LOWER(name) = LOWER($1)
           AND organization_id = $2
           AND id <> $3
         LIMIT 1`,
        [name, organizationId, excludeId],
      );

  if (existingTicketType) {
    throw new ConflictError("A ticket type with this name already exists");
  }
}

async function getTicketTypeById(id: number, organizationId: number) {
  return db.oneOrNone<TicketType>(
    `SELECT id, name, description
     FROM ticket_types
     WHERE id = $1
       AND organization_id = $2`,
    [id, organizationId],
  );
}

export async function list(organizationId: number): Promise<TicketType[]> {
  return db.manyOrNone<TicketType>(
    `SELECT id, name, description
     FROM ticket_types
     WHERE organization_id = $1
     ORDER BY name ASC`,
    [organizationId],
  );
}

export async function create(
  input: CreateTicketTypeInput,
  organizationId: number,
): Promise<TicketType> {
  const name = requireName(input.name);
  const description = validateDescription(input.description) ?? null;

  await ensureNameIsUnique(name, organizationId);

  return db.one<TicketType>(
    `INSERT INTO ticket_types (name, description, organization_id)
     VALUES ($1, $2, $3)
     RETURNING id, name, description`,
    [name, description, organizationId],
  );
}

export async function update(
  id: number,
  input: UpdateTicketTypeInput,
  organizationId: number,
): Promise<TicketType> {
  const existingTicketType = await getTicketTypeById(id, organizationId);

  if (!existingTicketType) {
    throw new NotFoundError("Ticket type not found");
  }

  const name = requireName(input.name ?? existingTicketType.name);
  const description = input.description === undefined
    ? existingTicketType.description
    : validateDescription(input.description);

  await ensureNameIsUnique(name, organizationId, id);

  return db.one<TicketType>(
    `UPDATE ticket_types
     SET name = $1, description = $2
     WHERE id = $3
       AND organization_id = $4
     RETURNING id, name, description`,
    [name, description ?? null, id, organizationId],
  );
}

export async function isInUse(id: number, organizationId: number): Promise<boolean> {
  const result = await db.one<{ inUse: boolean }>(
    `SELECT EXISTS(
       SELECT 1
       FROM tickets
       WHERE ticket_type_id = $1
         AND organization_id = $2
     ) AS "inUse"`,
    [id, organizationId],
  );

  return result.inUse;
}

export async function remove(id: number, organizationId: number): Promise<void> {
  const existingTicketType = await getTicketTypeById(id, organizationId);

  if (!existingTicketType) {
    throw new NotFoundError("Ticket type not found");
  }

  if (await isInUse(id, organizationId)) {
    throw new InUseError("Cannot delete ticket type that is in use by existing tickets");
  }

  await db.none("DELETE FROM ticket_types WHERE id = $1 AND organization_id = $2", [
    id,
    organizationId,
  ]);
}
