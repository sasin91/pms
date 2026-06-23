import { compareSync, hashSync } from 'bcrypt';

export function hashPassword(password: string): string {
  return hashSync(password, 12);
}

export function verifyPassword(password: string, storedHash: string): boolean {
  return compareSync(password, storedHash);
}
