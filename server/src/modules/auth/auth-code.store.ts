import { randomBytes } from 'crypto';

const CODE_TTL_MS = 5 * 60 * 1000;

interface AuthCodeEntry {
  refreshToken: string;
  accessToken: string;
  expiresAt: number;
}

const codes = new Map<string, AuthCodeEntry>();

function purgeExpired(): void {
  const now = Date.now();
  for (const [code, entry] of codes) {
    if (entry.expiresAt <= now) {
      codes.delete(code);
    }
  }
}

export function createAuthCode(
  refreshToken: string,
  accessToken: string,
): string {
  purgeExpired();
  const code = randomBytes(32).toString('hex');
  codes.set(code, {
    refreshToken,
    accessToken,
    expiresAt: Date.now() + CODE_TTL_MS,
  });
  return code;
}

export function consumeAuthCode(
  code: string,
): { refreshToken: string; accessToken: string } | null {
  purgeExpired();
  const entry = codes.get(code);
  if (!entry) return null;
  codes.delete(code);
  if (entry.expiresAt <= Date.now()) return null;
  return {
    refreshToken: entry.refreshToken,
    accessToken: entry.accessToken,
  };
}
