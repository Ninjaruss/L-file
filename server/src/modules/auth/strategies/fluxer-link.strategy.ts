import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';

@Injectable()
export class FluxerLinkStrategy extends PassportStrategy(Strategy, 'fluxer-link') {
  constructor(private readonly configService: ConfigService) {
    super({
      authorizationURL: 'https://web.fluxer.app/oauth2/authorize',
      tokenURL: 'https://api.fluxer.app/v1/oauth2/token',
      clientID: configService.get<string>('FLUXER_CLIENT_ID')!,
      clientSecret: configService.get<string>('FLUXER_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('FLUXER_LINK_CALLBACK_URL')!,
      scope: 'identify email',
    });
  }

  async validate(accessToken: string, _refreshToken: string): Promise<any> {
    // Fetch user profile from Fluxer OAuth2 API
    const response = await fetch('https://api.fluxer.app/v1/oauth2/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch Fluxer user profile: ${response.status}`,
      );
    }

    const data = await response.json();
    // Return raw profile; the controller handles linking logic
    return data.user;
  }
}
