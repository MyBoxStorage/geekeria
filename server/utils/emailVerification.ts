import crypto from 'crypto';

export function generateVerifyToken(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export function isTokenExpired(exp: Date | null): boolean {
  if (!exp) return true;
  return new Date() > exp;
}
