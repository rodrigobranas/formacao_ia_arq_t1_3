import bcrypt from "bcrypt";
import { db } from "../data/database";

const PASSWORD_MIN_LENGTH = 8;
const BCRYPT_SALT_ROUNDS = 10;

type DatabaseConnection = Pick<typeof db, "one" | "oneOrNone" | "manyOrNone">;

export interface User {
  id: number;
  name: string;
  email: string;
  admin: boolean;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  admin: boolean;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class DuplicateEmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateEmailError";
  }
}

export class PasswordLengthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PasswordLengthError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

function requireTrimmedString(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new ValidationError(`${label} is required`);
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    throw new ValidationError(`${label} is required`);
  }

  return normalizedValue;
}

function normalizeEmail(value: unknown): string {
  return requireTrimmedString(value, "Email").toLowerCase();
}

function validatePassword(value: unknown): string {
  const password = requireTrimmedString(value, "Password");

  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new PasswordLengthError("Password must be at least 8 characters");
  }

  return password;
}

function requireAdmin(value: unknown): boolean {
  if (typeof value !== "boolean") {
    throw new ValidationError("Admin is required");
  }

  return value;
}

async function ensureEmailIsUnique(connection: DatabaseConnection, email: string) {
  const existingUser = await connection.oneOrNone<{ id: number }>(
    "SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
    [email],
  );

  if (existingUser) {
    throw new DuplicateEmailError("Email is already in use");
  }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505";
}

async function getUserById(id: number, organizationId: number) {
  return db.oneOrNone<User>(
    `SELECT id, name, email, admin
     FROM users
     WHERE id = $1
       AND organization_id = $2`,
    [id, organizationId],
  );
}

export async function list(organizationId: number): Promise<User[]> {
  return db.manyOrNone<User>(
    `SELECT id, name, email, admin
     FROM users
     WHERE organization_id = $1
     ORDER BY name ASC, email ASC`,
    [organizationId],
  );
}

export async function create(input: CreateUserInput, organizationId: number): Promise<User> {
  const name = requireTrimmedString(input.name, "Name");
  const email = normalizeEmail(input.email);
  const password = validatePassword(input.password);
  const admin = requireAdmin(input.admin);

  try {
    await ensureEmailIsUnique(db, email);
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    return await db.one<User>(
      `INSERT INTO users (name, email, password, admin, organization_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, admin`,
      [name, email, passwordHash, admin, organizationId],
    );
  } catch (error) {
    if (error instanceof DuplicateEmailError) {
      throw error;
    }

    if (isUniqueViolation(error)) {
      throw new DuplicateEmailError("Email is already in use");
    }

    throw error;
  }
}

export async function remove(
  userId: number,
  organizationId: number,
  authenticatedUserId: number,
): Promise<void> {
  const existingUser = await getUserById(userId, organizationId);

  if (!existingUser) {
    throw new NotFoundError("User not found");
  }

  if (existingUser.id === authenticatedUserId) {
    throw new ForbiddenError("Admin cannot delete themselves");
  }

  await db.none("DELETE FROM users WHERE id = $1 AND organization_id = $2", [userId, organizationId]);
}
