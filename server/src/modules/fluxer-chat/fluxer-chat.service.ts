import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { FluxerAnnouncement } from '../../entities/fluxer-announcement.entity';
import { User } from '../../entities/user.entity';

export interface FluxerMessageAuthor {
  id: string;
  username: string;
  avatar: string | null;
}

export interface FluxerMessage {
  id: string;
  content: string;
  timestamp: string;
  author: FluxerMessageAuthor;
}

@Injectable()
export class FluxerChatService {
  private readonly logger = new Logger(FluxerChatService.name);
  private readonly botToken: string;
  private readonly channelId: string;
  private readonly webhookUrl: string;
  // 2-second in-memory cache to prevent burst requests
  private messagesCache: { data: FluxerMessage[]; expiresAt: number } | null =
    null;

  constructor(
    @InjectRepository(FluxerAnnouncement)
    private readonly announcementRepo: Repository<FluxerAnnouncement>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    this.botToken = this.configService.get<string>('FLUXER_BOT_TOKEN')!;
    this.channelId = this.configService.get<string>('FLUXER_CHAT_CHANNEL_ID')!;
    this.webhookUrl = this.configService.get<string>('FLUXER_WEBHOOK_URL')!;
  }

  async getMessages(): Promise<FluxerMessage[]> {
    const now = Date.now();
    if (this.messagesCache && this.messagesCache.expiresAt > now) {
      return this.messagesCache.data;
    }

    let raw: any[];
    try {
      const res = await fetch(
        `https://api.fluxer.app/v1/channels/${this.channelId}/messages?limit=50`,
        { headers: { Authorization: `Bot ${this.botToken}` } },
      );
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        this.logger.error(`Failed to fetch Fluxer messages: ${res.status} ${res.statusText} — ${body}`);
        return this.messagesCache?.data ?? [];
      }
      raw = await res.json();
    } catch (err) {
      this.logger.error('Error fetching Fluxer messages:', err);
      return this.messagesCache?.data ?? [];
    }

    if (!Array.isArray(raw)) {
      this.logger.error('Unexpected Fluxer messages response shape:', JSON.stringify(raw).slice(0, 200));
      return this.messagesCache?.data ?? [];
    }

    // Side-effect: persist newest @everyone/@here as announcement
    await this.updateAnnouncementFromMessages(raw);

    // Fluxer returns newest-first; reverse for chronological display
    const messages = [...raw].reverse().map(this.formatMessage);
    this.messagesCache = { data: messages, expiresAt: now + 2000 };
    return messages;
  }

  async getAnnouncement(): Promise<FluxerAnnouncement | null> {
    const stored = await this.announcementRepo.findOne({ where: { id: 1 } });
    if (!stored) {
      await this.seedAnnouncementFromHistory();
      return this.announcementRepo.findOne({ where: { id: 1 } });
    }
    return stored;
  }

  async sendMessage(userId: number, content: string): Promise<FluxerMessage> {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user?.fluxerId) {
      throw new ForbiddenException('FLUXER_TOKEN_MISSING');
    }

    const avatarUrl = user.fluxerAvatar
      ? `https://fluxerusercontent.com/avatars/${user.fluxerId}/${user.fluxerAvatar}.png`
      : undefined;

    let res: Response;
    try {
      res = await fetch(`${this.webhookUrl}?wait=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          username: user.fluxerUsername ?? user.username,
          ...(avatarUrl && { avatar_url: avatarUrl }),
        }),
      });
    } catch {
      throw new BadRequestException('Failed to reach Fluxer webhook');
    }

    if (!res.ok) {
      throw new BadRequestException('Failed to send message via Fluxer webhook');
    }

    return this.formatMessage(await res.json());
  }

  private formatMessage = (m: any): FluxerMessage => ({
    id: m.id,
    content: m.content,
    timestamp: m.timestamp,
    author: {
      id: m.author.id,
      username: m.author.global_name ?? m.author.username,
      avatar: m.author.avatar ?? null,
    },
  });

  private async updateAnnouncementFromMessages(messages: any[]): Promise<void> {
    const pings = messages.filter(
      (m) =>
        typeof m.content === 'string' &&
        (m.content.includes('@everyone') || m.content.includes('@here')),
    );
    if (pings.length === 0) return;

    // Higher snowflake ID = more recent message
    const newest = pings.reduce((a, b) =>
      BigInt(a.id) > BigInt(b.id) ? a : b,
    );

    const current = await this.announcementRepo.findOne({ where: { id: 1 } });
    if (current && BigInt(current.messageId) >= BigInt(newest.id)) return;

    await this.announcementRepo.save({
      id: 1,
      messageId: newest.id,
      content: newest.content,
      authorUsername: newest.author.global_name ?? newest.author.username,
      authorId: newest.author.id,
      timestamp: new Date(newest.timestamp),
    });
  }

  private async seedAnnouncementFromHistory(): Promise<void> {
    let raw: any[];
    try {
      const res = await fetch(
        `https://api.fluxer.app/v1/channels/${this.channelId}/messages?limit=100`,
        { headers: { Authorization: `Bot ${this.botToken}` } },
      );
      if (!res.ok) return;
      raw = await res.json();
    } catch {
      return;
    }
    await this.updateAnnouncementFromMessages(raw);
  }
}
