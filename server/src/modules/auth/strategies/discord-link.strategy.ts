import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions, Profile } from 'passport-discord';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DiscordLinkStrategy extends PassportStrategy(Strategy, 'discord-link') {
  constructor(private readonly configService: ConfigService) {
    const options: StrategyOptions = {
      clientID: configService.get<string>('DISCORD_CLIENT_ID')!,
      clientSecret: configService.get<string>('DISCORD_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('DISCORD_LINK_CALLBACK_URL')!,
      scope: ['identify', 'email'],
    };

    super(options);
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<Profile> {
    // Return raw profile; the controller handles linking logic
    return profile;
  }
}
