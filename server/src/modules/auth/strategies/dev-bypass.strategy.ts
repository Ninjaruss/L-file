import { Injectable, ForbiddenException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { User } from '../../../entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

// SECURITY: Constant-time string comparison to prevent timing attacks
function safeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  // Ensure both strings are the same length to prevent length-based timing leaks
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    // Compare against self to maintain constant time even when lengths differ
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

@Injectable()
export class DevBypassStrategy extends PassportStrategy(
  Strategy,
  'dev-bypass',
) {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async validate(req: Request): Promise<User> {
    const nodeEnv = this.configService.get<string>('NODE_ENV');

    // SECURITY: Defense-in-depth - strict check even though guard should have caught this
    if (nodeEnv !== 'development') {
      throw new ForbiddenException(
        'Development bypass only available in development environment',
      );
    }

    // SECURITY: Defense-in-depth - verify secret again
    const devBypassSecret = this.configService.get<string>('DEV_BYPASS_SECRET');
    const providedSecret = req.body?.devSecret || req.headers['x-dev-secret'];

    // SECURITY: Use constant-time comparison to prevent timing attacks
    if (
      !devBypassSecret ||
      !providedSecret ||
      !safeCompare(providedSecret, devBypassSecret)
    ) {
      throw new ForbiddenException('Invalid development bypass credentials');
    }

    const isAdmin = req.body?.asAdmin === true;

    return await this.authService.validateDevBypass(isAdmin);
  }
}
