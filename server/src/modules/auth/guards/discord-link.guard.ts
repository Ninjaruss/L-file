import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class DiscordLinkGuard extends AuthGuard('discord-link') {}
