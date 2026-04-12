import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../data/database";

const PASSWORD_MIN_LENGTH = 8;
const BCRYPT_SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = "24h";
const SLUG_MAX_LENGTH = 100;
const SLUG_UNIQUENESS_RETRIES = 3;
const SLUG_SUFFIX_LENGTH = 6;

type DatabaseConnection = Pick<typeof db, "one" | "oneOrNone">;

type UserRecord = {
  id: number;
  name: string;
  email: string;
  password: string;
  admin: boolean;
  organizationId: number;
  organizationName: string;
};

export interface SignupInput {
  organizationName: string;
  name: string;
  email: string;
  password: string;
}

export interface SignupResult {
  organization: {
    id: number;
    name: string;
    slug: string;
  };
  user: {
    id: number;
    name: string;
    email: string;
    admin: boolean;
  };
}

export interface SigninInput {
  email: string;
  password: string;
}

export interface SigninResult {
  token: string;
  user: {
    userId: number;
    name: string;
    admin: boolean;
    organizationName: string;
  };
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

export class InvalidCredentialsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCredentialsError";
  }
}

export function generateSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH);
  if (slug.length === 0) {
    throw new ValidationError("Organization name must contain at least one alphanumeric character");
  }
  return slug;
}

function generateRandomSuffix(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let suffix = "";
  for (let i = 0; i < SLUG_SUFFIX_LENGTH; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return suffix;
}

function getJwtSecret(): string {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwtSecret;
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

function buildSigninResult(user: UserRecord): SigninResult {
  const token = jwt.sign(
    {
      userId: user.id,
      organizationId: user.organizationId,
      admin: user.admin,
    },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN },
  );

  return {
    token,
    user: {
      userId: user.id,
      name: user.name,
      admin: user.admin,
      organizationName: user.organizationName,
    },
  };
}

export async function signup(input: SignupInput): Promise<SignupResult> {
  const organizationName = requireTrimmedString(input.organizationName, "Organization name");
  const name = requireTrimmedString(input.name, "Name");
  const email = normalizeEmail(input.email);
  const password = validatePassword(input.password);

  const baseSlug = generateSlug(organizationName);

  for (let attempt = 0; attempt <= SLUG_UNIQUENESS_RETRIES; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${generateRandomSuffix()}`.slice(0, SLUG_MAX_LENGTH);
    try {
      return await db.tx(async (transaction) => {
        await ensureEmailIsUnique(transaction, email);

        const organization = await transaction.one<{ id: number; name: string; slug: string }>(
          "INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id, name, slug",
          [organizationName, slug],
        );

        const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
        const user = await transaction.one<{
          id: number;
          name: string;
          email: string;
          admin: boolean;
        }>(
          `INSERT INTO users (name, email, password, admin, organization_id)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, name, email, admin`,
          [name, email, passwordHash, true, organization.id],
        );

        return {
          organization,
          user,
        };
      });
    } catch (error) {
      if (error instanceof DuplicateEmailError) {
        throw error;
      }

      if (isUniqueViolation(error)) {
        const isSlugViolation = typeof error === "object" &&
          error !== null &&
          "detail" in error &&
          typeof (error as { detail: unknown }).detail === "string" &&
          (error as { detail: string }).detail.toLowerCase().includes("slug");

        if (isSlugViolation && attempt < SLUG_UNIQUENESS_RETRIES) {
          continue;
        }

        throw new DuplicateEmailError("Email is already in use");
      }

      throw error;
    }
  }

  throw new Error("Failed to generate a unique slug after retries")
}

export async function signin(input: SigninInput): Promise<SigninResult> {
  const email = normalizeEmail(input.email);
  const password = requireTrimmedString(input.password, "Password");
  const user = await db.oneOrNone<UserRecord>(
    `SELECT
       users.id,
       users.name,
       users.email,
       users.password,
       users.admin,
       users.organization_id AS "organizationId",
       organizations.name AS "organizationName"
     FROM users
     INNER JOIN organizations
       ON organizations.id = users.organization_id
     WHERE LOWER(users.email) = LOWER($1)
     LIMIT 1`,
    [email],
  );

  if (!user) {
    throw new InvalidCredentialsError("Invalid credentials");
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    throw new InvalidCredentialsError("Invalid credentials");
  }

  return buildSigninResult(user);
}
