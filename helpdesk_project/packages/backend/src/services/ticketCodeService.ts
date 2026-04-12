import { db } from "../data/database";

const CODE_LENGTH = 8;
const CODE_PREFIX = "TK-";
const MAX_RETRIES = 3;
const ALPHANUMERIC_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateRandomCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    const index = Math.floor(Math.random() * ALPHANUMERIC_CHARS.length);
    code += ALPHANUMERIC_CHARS[index];
  }
  return `${CODE_PREFIX}${code}`;
}

export async function generateUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const code = generateRandomCode();
    const existing = await db.oneOrNone<{ id: number }>(
      "SELECT id FROM tickets WHERE code = $1 LIMIT 1",
      [code],
    );
    if (!existing) {
      return code;
    }
  }
  throw new Error("Failed to generate a unique ticket code after multiple attempts");
}
