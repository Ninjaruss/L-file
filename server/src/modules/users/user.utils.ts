import { User } from '../../entities/user.entity';

const SENSITIVE_FIELDS = [
  'password',
  'refreshToken',
  'refreshTokenExpiresAt',
  'emailVerificationToken',
  'passwordResetToken',
  'passwordResetExpires',
  'fluxerAccessToken',
] as const;

export function sanitizeUser<T extends Partial<User>>(
  user: T,
): Omit<T, (typeof SENSITIVE_FIELDS)[number]> {
  const sanitized = { ...user };
  for (const field of SENSITIVE_FIELDS) {
    delete (sanitized as Record<string, unknown>)[field];
  }
  return sanitized as Omit<T, (typeof SENSITIVE_FIELDS)[number]>;
}

export function sanitizeUsers<T extends Partial<User>>(
  users: T[],
): Array<Omit<T, (typeof SENSITIVE_FIELDS)[number]>> {
  return users.map(sanitizeUser);
}
