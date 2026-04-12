import { db } from "../data/database";

const NAME_MAX_LENGTH = 100;

export interface Organization {
  id: number;
  name: string;
  slug: string;
}

export interface ChangeOrganizationNameInput {
  name: string;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NameLengthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NameLengthError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

function requireName(value: unknown): string {
  if (typeof value !== "string") {
    throw new ValidationError("Name is required");
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    throw new ValidationError("Name is required");
  }

  if (normalizedValue.length > NAME_MAX_LENGTH) {
    throw new NameLengthError("Name must be at most 100 characters");
  }

  return normalizedValue;
}

export async function get(id: number): Promise<Organization | null> {
  return db.oneOrNone<Organization>(
    `SELECT id, name, slug
     FROM organizations
     WHERE id = $1`,
    [id],
  );
}

export async function changeName(
  organizationId: number,
  input: ChangeOrganizationNameInput,
): Promise<Organization> {
  const name = requireName(input.name);

  const organization = await db.oneOrNone<Organization>(
    `UPDATE organizations
     SET name = $1
     WHERE id = $2
     RETURNING id, name, slug`,
    [name, organizationId],
  );

  if (!organization) {
    throw new NotFoundError("Organization not found");
  }

  return organization;
}
