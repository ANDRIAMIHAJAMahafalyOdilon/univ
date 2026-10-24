import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 10;

export function hash(value: string): Promise<string> {
  return bcrypt.hash(value, BCRYPT_ROUNDS);
}

export function verify(value: string, stored: string): Promise<boolean> {
  return bcrypt.compare(value, stored);
}

export function isBcryptHash(value: string): boolean {
  return value.startsWith("$2");
}

export function legacySha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}