import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class DevBypassAuthGuard extends AuthGuard('dev-bypass') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const nodeEnv = this.configService.get<string>('NODE_ENV');

    // SECURITY: Strict check - only allow if explicitly set to 'development'
    // Empty string, undefined, null, or any other value will be rejected
    if (nodeEnv !== 'development') {
      throw new ForbiddenException(
        'Development bypass is not available in this environment',
      );
    }

    // SECURITY: Require a secret that should never be in production
    const devBypassSecret = this.configService.get<string>('DEV_BYPASS_SECRET');
    if (!devBypassSecret) {
      throw new ForbiddenException('Development bypass is not configured');
    }

    const request = context.switchToHttp().getRequest();
    const providedSecret =
      request.body?.devSecret || request.headers['x-dev-secret'];

    // SECURITY: Use constant-time comparison to prevent timing attacks
    // Timing attacks can reveal secret bytes by measuring response times
    try {
      const secretBuffer = Buffer.from(devBypassSecret, 'utf8');
      const providedBuffer = Buffer.from(providedSecret || '', 'utf8');

      // timingSafeEqual requires same-length buffers
      // If lengths differ, we still need to do a comparison to avoid timing leak
      if (secretBuffer.length !== providedBuffer.length) {
        // Compare with the secret itself to maintain constant time
        timingSafeEqual(secretBuffer, secretBuffer);
        throw new ForbiddenException('Invalid development bypass secret');
      }

      if (!timingSafeEqual(secretBuffer, providedBuffer)) {
        throw new ForbiddenException('Invalid development bypass secret');
      }
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Invalid development bypass secret');
    }

    return super.canActivate(context);
  }
}
