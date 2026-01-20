import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * CSRF Protection Guard
 *
 * Protects against Cross-Site Request Forgery attacks by validating that
 * state-changing requests come from legitimate sources.
 *
 * Protection mechanisms:
 * 1. Custom header validation - Requires X-Requested-With header (can't be sent cross-origin without CORS preflight)
 * 2. Origin validation - Validates Origin header matches allowed origins
 *
 * This guard should be applied to all POST, PUT, PATCH, DELETE endpoints
 * that modify state.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  private allowedOrigins: string[];

  constructor(private readonly configService: ConfigService) {
    // Get allowed origins from config
    const defaultDevOrigins = [
      'http://localhost:3000',
      'http://localhost:3002',
    ];
    const rawOriginList =
      this.configService.get<string>('CORS_ALLOWED_ORIGINS') ||
      this.configService.get<string>('FRONTEND_URL') ||
      '';
    const configuredOrigins = rawOriginList
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    this.allowedOrigins =
      this.configService.get<string>('NODE_ENV') === 'production'
        ? configuredOrigins
        : Array.from(new Set([...defaultDevOrigins, ...configuredOrigins]));
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method.toUpperCase();

    // Only apply CSRF protection to state-changing methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return true;
    }

    // Method 1: Check for custom header
    // Browsers don't send custom headers on cross-origin requests without CORS preflight
    // If CORS blocks the preflight, the request never reaches here
    const requestedWith = request.headers['x-requested-with'];
    if (requestedWith === 'XMLHttpRequest' || requestedWith === 'Fetch') {
      return true;
    }

    // Method 2: Validate Origin header
    const origin = request.headers['origin'];
    if (origin) {
      if (this.allowedOrigins.includes(origin)) {
        return true;
      }
      // Origin header present but not in allowed list
      throw new ForbiddenException('Invalid request origin');
    }

    // Method 3: Validate Referer header (fallback for same-origin requests)
    const referer = request.headers['referer'];
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        const refererOrigin = refererUrl.origin;
        if (this.allowedOrigins.includes(refererOrigin)) {
          return true;
        }
      } catch {
        // Invalid referer URL, continue to reject
      }
    }

    // SECURITY: CSRF bypass is dangerous and should NEVER be available in production
    // Both conditions must be met: explicitly development AND bypass explicitly enabled
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const bypassEnabled = this.configService.get<string>('ALLOW_CSRF_BYPASS');

    // Only allow bypass in development - production is always protected
    if (nodeEnv === 'development' && bypassEnabled === 'true') {
      // Log warning but allow the request in development only
      console.warn(
        `[CSRF] Warning: Request to ${request.method} ${request.path} missing valid origin/referer headers. Allowing due to ALLOW_CSRF_BYPASS=true in development.`,
      );
      return true;
    }

    // No valid CSRF protection found - reject in production
    throw new ForbiddenException(
      'CSRF validation failed. Ensure your request includes proper headers.',
    );
  }
}
