# Fluxer Chat Widget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a floating chat widget (bottom-left, all non-admin pages) showing the #usogui Fluxer channel with a persistent announcement banner and the ability for Fluxer-linked users to send messages as themselves.

**Architecture:** NestJS `fluxer-chat` module proxies the Fluxer REST API (bot token for reads, stored user OAuth token for sends); frontend `FluxerChatWidget` polls every 4s when expanded; the latest `@everyone`/`@here` message is persisted in a single-row `fluxer_announcement` DB table so it survives beyond the 100-message window.

**Tech Stack:** NestJS 11, TypeORM, PostgreSQL, Next.js 15, React 19, Mantine UI, Lucide React, Fluxer REST API v1

---

## File Map

**Create (server):**
- `server/src/entities/fluxer-announcement.entity.ts` — single-row TypeORM entity for latest announcement
- `server/src/modules/fluxer-chat/fluxer-chat.module.ts`
- `server/src/modules/fluxer-chat/fluxer-chat.service.ts` — Fluxer API proxy, announcement detection, message send
- `server/src/modules/fluxer-chat/fluxer-chat.controller.ts` — 3 endpoints
- `server/src/modules/fluxer-chat/dto/send-message.dto.ts`
- `server/src/modules/fluxer-chat/fluxer-chat.service.spec.ts`
- `server/src/modules/fluxer-chat/fluxer-chat.controller.spec.ts`

**Modify (server):**
- `server/src/entities/user.entity.ts` — add `fluxerAccessToken` column
- `server/src/modules/users/users.service.ts` — add token to `updateFluxerInfo` and `linkFluxer`
- `server/src/modules/auth/strategies/fluxer.strategy.ts` — pass `accessToken` to `validateFluxerUser`
- `server/src/modules/auth/auth.service.ts` — accept + persist `fluxerAccessToken` in `validateFluxerUser` and `linkFluxerToUser`
- `server/src/app.module.ts` — register `FluxerChatModule`
- `server/src/config/env.validation.ts` — add `FLUXER_BOT_TOKEN`, `FLUXER_CHAT_CHANNEL_ID`
- `server/.env` — add actual values
- `server/.env.example` — add placeholder entries

**Create (client):**
- `client/src/components/FluxerChatWidget.tsx`

**Modify (client):**
- `client/src/lib/api.ts` — add `getFluxerMessages`, `getFluxerAnnouncement`, `sendFluxerMessage`
- `client/src/components/LayoutWrapper.tsx` — mount `<FluxerChatWidget />`

**Migrations (generated, not hand-written):**
- Migration 1: add `fluxerAccessToken` to `user`
- Migration 2: create `fluxer_announcement` table

---

## Task 1: Add `fluxerAccessToken` column to User entity

**Files:**
- Modify: `server/src/entities/user.entity.ts`

- [ ] **Step 1: Add the column**

In `server/src/entities/user.entity.ts`, after the `fluxerAvatar` column (line 77), add:

```typescript
  @Column({ type: 'varchar', nullable: true, select: false })
  fluxerAccessToken: string | null;
```

The `select: false` means TypeORM will NOT include this column in normal queries — it must be explicitly selected. This prevents it from accidentally appearing in API responses.

- [ ] **Step 2: Generate migration**

```bash
cd server && yarn db:generate
```

When prompted for a name, use `AddFluxerAccessTokenToUser`. The migration file appears in `server/src/migrations/`. Verify it contains an `addColumn` for `fluxer_access_token` on the `user` table.

- [ ] **Step 3: Run migration**

```bash
cd server && yarn db:migrate
```

Expected: `Migration AddFluxerAccessTokenToUser has been executed successfully.`

- [ ] **Step 4: Commit**

```bash
git add server/src/entities/user.entity.ts server/src/migrations/
git commit -m "feat: add fluxerAccessToken column to user entity"
```

---

## Task 2: Update UsersService to persist `fluxerAccessToken`

**Files:**
- Modify: `server/src/modules/users/users.service.ts`

- [ ] **Step 1: Update `updateFluxerInfo` signature**

Find `updateFluxerInfo` (around line 423). Change its `data` parameter to accept an optional `fluxerAccessToken`:

```typescript
  async updateFluxerInfo(
    userId: number,
    data: {
      fluxerUsername: string;
      fluxerAvatar: string | null;
      fluxerAccessToken?: string | null;
    },
  ): Promise<void> {
    const updatePayload: Partial<User> = {
      fluxerUsername: data.fluxerUsername,
      fluxerAvatar: data.fluxerAvatar,
    };
    if (data.fluxerAccessToken !== undefined) {
      updatePayload.fluxerAccessToken = data.fluxerAccessToken;
    }
    await this.repo.update(userId, updatePayload);
  }
```

- [ ] **Step 2: Update `linkFluxer` signature**

Find `linkFluxer` (around line 436). Add optional `fluxerAccessToken`:

```typescript
  async linkFluxer(
    userId: number,
    data: {
      fluxerId: string;
      fluxerUsername: string;
      fluxerAvatar: string | null;
      fluxerAccessToken?: string | null;
    },
  ): Promise<void> {
    const updatePayload: Partial<User> = {
      fluxerId: data.fluxerId,
      fluxerUsername: data.fluxerUsername,
      fluxerAvatar: data.fluxerAvatar,
    };
    if (data.fluxerAccessToken !== undefined) {
      updatePayload.fluxerAccessToken = data.fluxerAccessToken;
    }
    await this.repo.update(userId, updatePayload);
  }
```

- [ ] **Step 3: Update `createFluxerUser` to accept the token**

Find `createFluxerUser` (around line 325). Add `fluxerAccessToken` as an optional field to the `data` parameter and include it in the saved entity:

```typescript
  async createFluxerUser(data: {
    fluxerId: string;
    fluxerUsername: string;
    fluxerAvatar: string | null;
    username: string;
    email: string | null;
    role?: UserRole;
    fluxerAccessToken?: string | null;
  }): Promise<User> {
```

Inside the method, wherever the `User` object is built before `this.repo.save(user)`, also set:

```typescript
    if (data.fluxerAccessToken !== undefined) {
      user.fluxerAccessToken = data.fluxerAccessToken;
    }
```

(The exact line varies — look for where properties like `fluxerAvatar` are assigned to `user` and add this alongside them.)

- [ ] **Step 4: Add `clearFluxerAccessToken` helper**

Add after the `linkFluxer` method:

```typescript
  async clearFluxerAccessToken(userId: number): Promise<void> {
    await this.repo.update(userId, { fluxerAccessToken: null });
  }
```

- [ ] **Step 4: Build check**

```bash
cd server && yarn build
```

Expected: no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/users/users.service.ts
git commit -m "feat: add fluxerAccessToken support to UsersService"
```

---

## Task 3: Thread `accessToken` through Fluxer OAuth strategy and AuthService

**Files:**
- Modify: `server/src/modules/auth/strategies/fluxer.strategy.ts`
- Modify: `server/src/modules/auth/auth.service.ts`

- [ ] **Step 1: Update `FluxerStrategy.validate()` to pass token**

In `server/src/modules/auth/strategies/fluxer.strategy.ts`, change the `validate` method to pass `accessToken` through:

```typescript
  async validate(accessToken: string, _refreshToken: string): Promise<User> {
    console.log(
      '[FLUXER STRATEGY] validate() called, fetching user profile...',
    );
    const response = await fetch('https://api.fluxer.app/v1/oauth2/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '(unreadable)');
      console.error(
        `[FLUXER STRATEGY] Failed to fetch profile: ${response.status} ${response.statusText}`,
        body,
      );
      throw new Error(
        `Failed to fetch Fluxer user profile: ${response.status}`,
      );
    }

    const data = await response.json();
    console.log('[FLUXER STRATEGY] Profile response keys:', Object.keys(data));
    const profile = data.user;
    if (!profile) {
      console.error(
        '[FLUXER STRATEGY] No .user in response:',
        JSON.stringify(data).substring(0, 500),
      );
      throw new Error('Fluxer profile response missing user data');
    }
    console.log(
      '[FLUXER STRATEGY] Got profile for:',
      profile.username,
      'id:',
      profile.id,
    );
    return await this.authService.validateFluxerUser(profile, accessToken);
  }
```

- [ ] **Step 2: Update `AuthService.validateFluxerUser` to accept and store token**

In `server/src/modules/auth/auth.service.ts`, change `validateFluxerUser`:

```typescript
  async validateFluxerUser(profile: any, accessToken?: string): Promise<User> {
    const {
      id: fluxerId,
      username: fluxerUsername,
      avatar,
      email,
      global_name: displayName,
    } = profile;

    let user = await this.usersService.findByFluxerId(fluxerId);

    if (!user) {
      const adminFluxerId = this.configService.get<string>('ADMIN_FLUXER_ID');
      const isAdmin = adminFluxerId && fluxerId === adminFluxerId;
      const siteUsername = (displayName || fluxerUsername).replace('#', '_');

      user = await this.usersService.createFluxerUser({
        fluxerId,
        fluxerUsername,
        fluxerAvatar: avatar || null,
        username: siteUsername,
        email: email || null,
        role: isAdmin ? UserRole.ADMIN : UserRole.USER,
        fluxerAccessToken: accessToken ?? null,
      });
    } else {
      await this.usersService.updateFluxerInfo(user.id, {
        fluxerUsername,
        fluxerAvatar: avatar || null,
        fluxerAccessToken: accessToken ?? null,
      });
    }

    // Attach token in-memory so linkFluxerToUser can read it from req.user
    if (accessToken) {
      (user as any)._fluxerAccessToken = accessToken;
    }

    return user;
  }
```

- [ ] **Step 3: Update `AuthService.linkFluxerToUser` to forward token to target user**

In `auth.service.ts`, change `linkFluxerToUser`:

```typescript
  async linkFluxerToUser(userId: number, fluxerUser: any): Promise<void> {
    const fluxerId = fluxerUser.fluxerId;
    const fluxerUsername = fluxerUser.fluxerUsername;
    const fluxerAvatar = fluxerUser.fluxerAvatar;
    const fluxerAccessToken = (fluxerUser as any)._fluxerAccessToken ?? null;

    if (!fluxerId) {
      throw new ForbiddenException('Fluxer profile data is missing');
    }

    const existingUser = await this.usersService.findByFluxerId(fluxerId);
    if (existingUser && existingUser.id !== userId) {
      if (existingUser.id === fluxerUser.id) {
        await this.usersService.remove(existingUser.id);
      } else {
        throw new ForbiddenException(
          'This Fluxer account is already linked to another user',
        );
      }
    }

    await this.usersService.linkFluxer(userId, {
      fluxerId,
      fluxerUsername,
      fluxerAvatar: fluxerAvatar || null,
      fluxerAccessToken,
    });
  }
```

- [ ] **Step 4: Build check**

```bash
cd server && yarn build
```

Expected: no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/auth/strategies/fluxer.strategy.ts server/src/modules/auth/auth.service.ts
git commit -m "feat: persist Fluxer OAuth access token through login and link flows"
```

---

## Task 4: Create `FluxerAnnouncement` entity and migration

**Files:**
- Create: `server/src/entities/fluxer-announcement.entity.ts`

- [ ] **Step 1: Create the entity file**

```typescript
// server/src/entities/fluxer-announcement.entity.ts
import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('fluxer_announcement')
export class FluxerAnnouncement {
  // Always 1 — enforces single-row constraint
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar' })
  messageId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar' })
  authorUsername: string;

  @Column({ type: 'varchar' })
  authorId: string;

  @Column({ type: 'timestamptz' })
  timestamp: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

- [ ] **Step 2: Generate migration**

```bash
cd server && yarn db:generate
```

Name it `CreateFluxerAnnouncementTable`. Verify the migration creates table `fluxer_announcement` with columns: `id`, `message_id`, `content`, `author_username`, `author_id`, `timestamp`, `updated_at`.

- [ ] **Step 3: Run migration**

```bash
cd server && yarn db:migrate
```

Expected: `Migration CreateFluxerAnnouncementTable has been executed successfully.`

- [ ] **Step 4: Commit**

```bash
git add server/src/entities/fluxer-announcement.entity.ts server/src/migrations/
git commit -m "feat: add FluxerAnnouncement entity and migration"
```

---

## Task 5: Add env vars

**Files:**
- Modify: `server/src/config/env.validation.ts`
- Modify: `server/.env`
- Modify: `server/.env.example`

- [ ] **Step 1: Add to env validation**

In `server/src/config/env.validation.ts`, inside the `EnvironmentVariables` class after the `ADMIN_FLUXER_ID` block (around line 86), add:

```typescript
  // --- Fluxer Chat Bot ---
  @IsString()
  FLUXER_BOT_TOKEN: string;

  @IsString()
  FLUXER_CHAT_CHANNEL_ID: string;
```

- [ ] **Step 2: Add to `server/.env`**

Add these two lines (fill in your actual bot token value):

```
FLUXER_BOT_TOKEN=<your bot token here>
FLUXER_CHAT_CHANNEL_ID=1479626873328890392
```

- [ ] **Step 3: Add to `server/.env.example`**

Add these two lines:

```
FLUXER_BOT_TOKEN=your_fluxer_bot_token
FLUXER_CHAT_CHANNEL_ID=your_fluxer_channel_id
```

- [ ] **Step 4: Build check**

```bash
cd server && yarn build
```

Expected: no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add server/src/config/env.validation.ts server/.env.example
git commit -m "feat: add FLUXER_BOT_TOKEN and FLUXER_CHAT_CHANNEL_ID env vars"
```

(Do NOT commit `server/.env` — it contains secrets.)

---

## Task 6: Create `fluxer-chat` NestJS module

**Files:**
- Create: `server/src/modules/fluxer-chat/dto/send-message.dto.ts`
- Create: `server/src/modules/fluxer-chat/fluxer-chat.service.ts`
- Create: `server/src/modules/fluxer-chat/fluxer-chat.controller.ts`
- Create: `server/src/modules/fluxer-chat/fluxer-chat.module.ts`

- [ ] **Step 1: Create the DTO**

```typescript
// server/src/modules/fluxer-chat/dto/send-message.dto.ts
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ description: 'Message content', maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}
```

- [ ] **Step 2: Create the service**

```typescript
// server/src/modules/fluxer-chat/fluxer-chat.service.ts
import {
  Injectable,
  ForbiddenException,
  BadRequestException,
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
  private readonly botToken: string;
  private readonly channelId: string;
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
        // Return stale cache on Fluxer API error
        return this.messagesCache?.data ?? [];
      }
      raw = await res.json();
    } catch {
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
    // Explicitly select fluxerAccessToken (column has select:false)
    const user = await this.userRepo
      .createQueryBuilder('user')
      .select(['user.id', 'user.fluxerId', 'user.fluxerAccessToken'])
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user?.fluxerAccessToken) {
      throw new ForbiddenException('FLUXER_TOKEN_MISSING');
    }

    let res: Response;
    try {
      res = await fetch(
        `https://api.fluxer.app/v1/channels/${this.channelId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: user.fluxerAccessToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        },
      );
    } catch {
      throw new BadRequestException('Failed to reach Fluxer API');
    }

    if (res.status === 401) {
      await this.userRepo.update(userId, { fluxerAccessToken: null });
      throw new ForbiddenException('FLUXER_TOKEN_EXPIRED');
    }

    if (res.status === 403) {
      throw new ForbiddenException('FLUXER_NO_PERMISSION');
    }

    if (!res.ok) {
      throw new BadRequestException('Failed to send message to Fluxer');
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
```

- [ ] **Step 3: Create the controller**

```typescript
// server/src/modules/fluxer-chat/fluxer-chat.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { FluxerChatService, FluxerMessage } from './fluxer-chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';
import { FluxerAnnouncement } from '../../entities/fluxer-announcement.entity';

@ApiTags('fluxer-chat')
@Controller('fluxer-chat')
export class FluxerChatController {
  constructor(private readonly fluxerChatService: FluxerChatService) {}

  @Get('messages')
  @ApiOperation({ summary: 'Get recent messages from the #usogui channel' })
  @ApiOkResponse({ description: 'Array of message objects' })
  async getMessages(): Promise<FluxerMessage[]> {
    return this.fluxerChatService.getMessages();
  }

  @Get('announcement')
  @ApiOperation({ summary: 'Get the latest @everyone/@here announcement' })
  @ApiOkResponse({ description: 'Announcement object or null' })
  async getAnnouncement(): Promise<FluxerAnnouncement | null> {
    return this.fluxerChatService.getAnnouncement();
  }

  @Post('messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a message to #usogui as the logged-in user' })
  @ApiOkResponse({ description: 'The created message' })
  @ApiResponse({ status: 403, description: 'FLUXER_TOKEN_MISSING | FLUXER_TOKEN_EXPIRED | FLUXER_NO_PERMISSION' })
  async sendMessage(
    @CurrentUser() user: User,
    @Body() dto: SendMessageDto,
  ): Promise<FluxerMessage> {
    return this.fluxerChatService.sendMessage(user.id, dto.content);
  }
}
```

- [ ] **Step 4: Create the module**

```typescript
// server/src/modules/fluxer-chat/fluxer-chat.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FluxerChatController } from './fluxer-chat.controller';
import { FluxerChatService } from './fluxer-chat.service';
import { FluxerAnnouncement } from '../../entities/fluxer-announcement.entity';
import { User } from '../../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FluxerAnnouncement, User])],
  controllers: [FluxerChatController],
  providers: [FluxerChatService],
})
export class FluxerChatModule {}
```

- [ ] **Step 5: Build check**

```bash
cd server && yarn build
```

Expected: no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/fluxer-chat/ server/src/entities/fluxer-announcement.entity.ts
git commit -m "feat: add fluxer-chat NestJS module with messages, announcement, and send endpoints"
```

---

## Task 7: Register `FluxerChatModule` in `AppModule`

**Files:**
- Modify: `server/src/app.module.ts`

- [ ] **Step 1: Add import and registration**

Add the import at the top of `server/src/app.module.ts` (with the other module imports):

```typescript
import { FluxerChatModule } from './modules/fluxer-chat/fluxer-chat.module';
```

Add `FluxerChatModule` to the `imports` array in `@Module`, after `EditLogModule`:

```typescript
    EditLogModule,
    FluxerChatModule,
```

- [ ] **Step 2: Build and start dev server to verify endpoints appear**

```bash
cd server && yarn build
```

Expected: no errors. Optionally `yarn start:dev` and check `http://localhost:3001/api-docs` — you should see a `fluxer-chat` section with 3 endpoints.

- [ ] **Step 3: Commit**

```bash
git add server/src/app.module.ts
git commit -m "feat: register FluxerChatModule in AppModule"
```

---

## Task 8: Write and run backend tests

**Files:**
- Create: `server/src/modules/fluxer-chat/fluxer-chat.service.spec.ts`
- Create: `server/src/modules/fluxer-chat/fluxer-chat.controller.spec.ts`

- [ ] **Step 1: Write the service spec (announcement detection logic)**

```typescript
// server/src/modules/fluxer-chat/fluxer-chat.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException } from '@nestjs/common';
import { FluxerChatService } from './fluxer-chat.service';
import { FluxerAnnouncement } from '../../entities/fluxer-announcement.entity';
import { User } from '../../entities/user.entity';

const mockAnnouncementRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
};

const mockUserRepo = {
  createQueryBuilder: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  }),
  update: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'FLUXER_BOT_TOKEN') return 'test-bot-token';
    if (key === 'FLUXER_CHAT_CHANNEL_ID') return '1234567890';
    return undefined;
  }),
};

describe('FluxerChatService', () => {
  let service: FluxerChatService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FluxerChatService,
        { provide: getRepositoryToken(FluxerAnnouncement), useValue: mockAnnouncementRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<FluxerChatService>(FluxerChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMessage', () => {
    it('throws FLUXER_TOKEN_MISSING when user has no access token', async () => {
      mockUserRepo.createQueryBuilder().getOne.mockResolvedValue({ id: 1, fluxerId: 'f1', fluxerAccessToken: null });

      await expect(service.sendMessage(1, 'hello')).rejects.toThrow(ForbiddenException);
      await expect(service.sendMessage(1, 'hello')).rejects.toThrow('FLUXER_TOKEN_MISSING');
    });
  });
});
```

- [ ] **Step 2: Run the spec to make sure it passes**

```bash
cd server && yarn test --testPathPattern=fluxer-chat.service.spec
```

Expected: `PASS src/modules/fluxer-chat/fluxer-chat.service.spec.ts` with all tests passing.

- [ ] **Step 3: Write the controller spec**

```typescript
// server/src/modules/fluxer-chat/fluxer-chat.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { FluxerChatController } from './fluxer-chat.controller';
import { FluxerChatService } from './fluxer-chat.service';

const mockFluxerChatService = {
  getMessages: jest.fn(),
  getAnnouncement: jest.fn(),
  sendMessage: jest.fn(),
};

describe('FluxerChatController', () => {
  let controller: FluxerChatController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FluxerChatController],
      providers: [{ provide: FluxerChatService, useValue: mockFluxerChatService }],
    }).compile();

    controller = module.get<FluxerChatController>(FluxerChatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getMessages delegates to service', async () => {
    const messages = [{ id: '1', content: 'hi', timestamp: '2026-01-01T00:00:00Z', author: { id: 'u1', username: 'Baku', avatar: null } }];
    mockFluxerChatService.getMessages.mockResolvedValue(messages);
    expect(await controller.getMessages()).toEqual(messages);
    expect(mockFluxerChatService.getMessages).toHaveBeenCalled();
  });

  it('getAnnouncement returns null when none exists', async () => {
    mockFluxerChatService.getAnnouncement.mockResolvedValue(null);
    expect(await controller.getAnnouncement()).toBeNull();
  });
});
```

- [ ] **Step 4: Run the controller spec**

```bash
cd server && yarn test --testPathPattern=fluxer-chat.controller.spec
```

Expected: `PASS src/modules/fluxer-chat/fluxer-chat.controller.spec.ts`

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/fluxer-chat/fluxer-chat.service.spec.ts server/src/modules/fluxer-chat/fluxer-chat.controller.spec.ts
git commit -m "test: add fluxer-chat service and controller specs"
```

---

## Task 9: Add API methods to the frontend client

**Files:**
- Modify: `client/src/lib/api.ts`

- [ ] **Step 1: Define types and add methods**

In `client/src/lib/api.ts`, just before the closing `}` of the `ApiClient` class (before line 1976), add:

```typescript
  // --- Fluxer Chat ---

  async getFluxerMessages(): Promise<Array<{
    id: string
    content: string
    timestamp: string
    author: { id: string; username: string; avatar: string | null }
  }>> {
    return this.get('/fluxer-chat/messages')
  }

  async getFluxerAnnouncement(): Promise<{
    id: number
    messageId: string
    content: string
    authorUsername: string
    authorId: string
    timestamp: string
    updatedAt: string
  } | null> {
    return this.get('/fluxer-chat/announcement')
  }

  async sendFluxerMessage(content: string): Promise<{
    id: string
    content: string
    timestamp: string
    author: { id: string; username: string; avatar: string | null }
  }> {
    return this.post('/fluxer-chat/messages', { content })
  }
```

- [ ] **Step 2: Build check**

```bash
cd client && yarn build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/lib/api.ts
git commit -m "feat: add Fluxer chat API methods to ApiClient"
```

---

## Task 10: Build `FluxerChatWidget` component

**Files:**
- Create: `client/src/components/FluxerChatWidget.tsx`

- [ ] **Step 1: Create the component**

```tsx
// client/src/components/FluxerChatWidget.tsx
'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ActionIcon, Transition, TextInput } from '@mantine/core'
import { MessageCircle, X, Send, ExternalLink } from 'lucide-react'
import { useAuth } from '../providers/AuthProvider'
import { api } from '../lib/api'

const FLUXER_SERVER_INVITE = 'https://fluxer.gg/7ce7lrCc'
const POLL_INTERVAL_MS = 4000
const ANNOUNCEMENT_POLL_MS = 5 * 60 * 1000

type FluxerMsg = {
  id: string
  content: string
  timestamp: string
  author: { id: string; username: string; avatar: string | null }
}

type Announcement = {
  id: number
  messageId: string
  content: string
  authorUsername: string
  authorId: string
  timestamp: string
  updatedAt: string
} | null

/** Deterministic pastel colour from a user ID string */
function avatarColor(id: string): string {
  const colors = ['#5865f2', '#e44', '#2a9d8f', '#e9c46a', '#f4a261', '#9b5de5', '#00bbf9']
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return colors[hash % colors.length]
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function FluxerChatWidget() {
  const { user, loginWithFluxer, linkFluxer } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<FluxerMsg[]>([])
  const [announcement, setAnnouncement] = useState<Announcement>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [tokenError, setTokenError] = useState<'missing' | 'expired' | 'no_permission' | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const announcePollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const hasFluxerLinked = Boolean(user?.fluxerId)

  const fetchMessages = useCallback(async () => {
    try {
      const data = await api.getFluxerMessages()
      setMessages(data)
    } catch {
      // silent — show stale messages
    }
  }, [])

  const fetchAnnouncement = useCallback(async () => {
    try {
      const data = await api.getFluxerAnnouncement()
      setAnnouncement(data)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    if (!open) {
      if (pollRef.current) clearInterval(pollRef.current)
      if (announcePollRef.current) clearInterval(announcePollRef.current)
      return
    }

    fetchMessages()
    fetchAnnouncement()

    pollRef.current = setInterval(fetchMessages, POLL_INTERVAL_MS)
    announcePollRef.current = setInterval(fetchAnnouncement, ANNOUNCEMENT_POLL_MS)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (announcePollRef.current) clearInterval(announcePollRef.current)
    }
  }, [open, fetchMessages, fetchAnnouncement])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || sending) return

    // Optimistic add
    const optimistic: FluxerMsg = {
      id: `optimistic-${Date.now()}`,
      content: trimmed,
      timestamp: new Date().toISOString(),
      author: {
        id: user?.fluxerId ?? 'me',
        username: user?.fluxerUsername ?? user?.username ?? 'You',
        avatar: user?.fluxerAvatar ?? null,
      },
    }
    setMessages(prev => [...prev, optimistic])
    setInput('')
    setSending(true)

    try {
      await api.sendFluxerMessage(trimmed)
      setTokenError(null)
    } catch (err: any) {
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setInput(trimmed)
      const code = err?.details?.message ?? err?.message ?? ''
      if (code.includes('FLUXER_TOKEN_EXPIRED') || code.includes('FLUXER_TOKEN_MISSING')) {
        setTokenError('expired')
      } else if (code.includes('FLUXER_NO_PERMISSION')) {
        setTokenError('no_permission')
      }
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Collapsed bubble */}
      <Transition mounted={!open} transition="fade" duration={150}>
        {(styles) => (
          <ActionIcon
            onClick={() => setOpen(true)}
            size={52}
            radius="xl"
            aria-label="Open Fluxer chat"
            style={{
              ...styles,
              position: 'fixed',
              bottom: 24,
              left: 24,
              zIndex: 999,
              background: 'linear-gradient(135deg, #5865f2, #7c3aed)',
              border: '2px solid rgba(255,255,255,0.15)',
              boxShadow: '0 4px 16px rgba(88,101,242,0.5)',
              color: '#ffffff',
            }}
          >
            <MessageCircle size={22} />
          </ActionIcon>
        )}
      </Transition>

      {/* Expanded panel */}
      <Transition mounted={open} transition="slide-up" duration={200}>
        {(styles) => (
          <div
            style={{
              ...styles,
              position: 'fixed',
              bottom: 24,
              left: 24,
              zIndex: 999,
              width: 340,
              maxHeight: 500,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 16,
              overflow: 'hidden',
              background: '#1a1a2e',
              border: '1px solid #2a2a4a',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #5865f2, #7c3aed)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, background: '#23d160', borderRadius: '50%' }} />
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}># usogui</span>
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>on Fluxer</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <a
                  href={FLUXER_SERVER_INVITE}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
                >
                  Join <ExternalLink size={10} />
                </a>
                <ActionIcon
                  onClick={() => setOpen(false)}
                  variant="transparent"
                  size="sm"
                  aria-label="Close chat"
                  style={{ color: 'rgba(255,255,255,0.8)' }}
                >
                  <X size={16} />
                </ActionIcon>
              </div>
            </div>

            {/* Announcement banner */}
            {announcement && (
              <div style={{
                background: 'rgba(88,101,242,0.15)',
                borderBottom: '1px solid rgba(88,101,242,0.3)',
                padding: '8px 14px',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 12 }}>📣</span>
                  <span style={{ color: '#a5b4fc', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Latest Announcement
                  </span>
                  <span style={{ color: '#555', fontSize: 10, marginLeft: 'auto' }}>
                    {relativeTime(announcement.timestamp)}
                  </span>
                </div>
                <div style={{ color: '#ddd', fontSize: 12, lineHeight: 1.5 }}>{announcement.content}</div>
                <div style={{ color: '#888', fontSize: 11, marginTop: 3 }}>— {announcement.authorUsername}</div>
              </div>
            )}

            {/* Message list */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              minHeight: 180,
            }}>
              {messages.length === 0 && (
                <div style={{ color: '#555', fontSize: 12, textAlign: 'center', marginTop: 20 }}>
                  No messages yet
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: msg.author.avatar
                      ? `url(https://fluxerusercontent.com/avatars/${msg.author.id}/${msg.author.avatar}.png) center/cover`
                      : avatarColor(msg.author.id),
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    color: '#fff',
                    fontWeight: 700,
                  }}>
                    {!msg.author.avatar && msg.author.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                      <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{msg.author.username}</span>
                      <span style={{ color: '#444', fontSize: 10 }}>{relativeTime(msg.timestamp)}</span>
                    </div>
                    <div style={{ color: '#ccc', fontSize: 12, lineHeight: 1.4, wordBreak: 'break-word' }}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Footer */}
            <div style={{ padding: 10, borderTop: '1px solid #2a2a4a', background: '#111122', flexShrink: 0 }}>
              {/* Full chat: Fluxer linked and no token error */}
              {hasFluxerLinked && !tokenError && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <TextInput
                    value={input}
                    onChange={(e) => setInput(e.currentTarget.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message #usogui..."
                    disabled={sending}
                    size="xs"
                    styles={{
                      root: { flex: 1 },
                      input: {
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        fontSize: 12,
                      },
                    }}
                  />
                  <ActionIcon
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    size={30}
                    radius="md"
                    style={{
                      background: 'linear-gradient(135deg, #5865f2, #7c3aed)',
                      color: '#fff',
                      flexShrink: 0,
                    }}
                    aria-label="Send message"
                  >
                    <Send size={14} />
                  </ActionIcon>
                </div>
              )}

              {/* Token expired / re-link needed */}
              {hasFluxerLinked && tokenError && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f87171', fontSize: 12, marginBottom: 8 }}>
                    {tokenError === 'no_permission'
                      ? 'You need to join the server to chat.'
                      : 'Your Fluxer session expired. Re-link to chat.'}
                  </div>
                  {tokenError !== 'no_permission' && (
                    <button
                      onClick={() => { linkFluxer(); setTokenError(null) }}
                      style={{
                        background: 'linear-gradient(135deg, #5865f2, #7c3aed)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 14px',
                        fontSize: 12,
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Re-link Fluxer
                    </button>
                  )}
                </div>
              )}

              {/* Logged in but no Fluxer linked */}
              {user && !hasFluxerLinked && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#aaa', fontSize: 12, marginBottom: 8 }}>
                    Link your Fluxer account to chat
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button
                      onClick={linkFluxer}
                      style={{
                        background: 'linear-gradient(135deg, #5865f2, #7c3aed)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 14px',
                        fontSize: 12,
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Link Fluxer
                    </button>
                    <a
                      href={FLUXER_SERVER_INVITE}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        color: '#ccc',
                        borderRadius: 6,
                        padding: '6px 14px',
                        fontSize: 12,
                        textDecoration: 'none',
                      }}
                    >
                      Join Server
                    </a>
                  </div>
                </div>
              )}

              {/* Not logged in */}
              {!user && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#aaa', fontSize: 12, marginBottom: 8 }}>
                    Log in with Fluxer to chat
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button
                      onClick={loginWithFluxer}
                      style={{
                        background: 'linear-gradient(135deg, #5865f2, #7c3aed)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 14px',
                        fontSize: 12,
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Login with Fluxer
                    </button>
                    <a
                      href={FLUXER_SERVER_INVITE}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        color: '#ccc',
                        borderRadius: 6,
                        padding: '6px 14px',
                        fontSize: 12,
                        textDecoration: 'none',
                      }}
                    >
                      Join Server
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Transition>
    </>
  )
}
```

- [ ] **Step 2: Build check**

```bash
cd client && yarn build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/FluxerChatWidget.tsx
git commit -m "feat: add FluxerChatWidget component"
```

---

## Task 11: Mount widget in `LayoutWrapper`

**Files:**
- Modify: `client/src/components/LayoutWrapper.tsx`

- [ ] **Step 1: Add the widget**

Replace the entire file content with:

```tsx
'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Box } from '@mantine/core'
import { Footer } from './Footer'
import { FluxerChatWidget } from './FluxerChatWidget'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith('/admin')

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}
    >
      <Box component="main" id="main-content" style={{ flex: 1 }}>
        {children}
      </Box>
      {!isAdminPage && <Footer />}
      {!isAdminPage && <FluxerChatWidget />}
    </Box>
  )
}
```

- [ ] **Step 2: Build check**

```bash
cd client && yarn build
```

Expected: no TypeScript errors, no ESLint errors.

- [ ] **Step 3: Smoke test manually**

Start both server and client:
```bash
# Terminal 1
cd server && yarn start:dev
# Terminal 2
cd client && yarn dev
```

1. Open `http://localhost:3000` — chat bubble visible bottom-left
2. Click bubble — widget expands showing messages from #usogui
3. Announcement banner visible if any `@everyone`/`@here` message exists in last 100
4. Not logged in → "Login with Fluxer" + "Join Server" buttons shown
5. Log in via Fluxer → if Fluxer linked, input field appears; can type and send
6. Open `http://localhost:3000/admin` — widget NOT visible

- [ ] **Step 4: Commit**

```bash
git add client/src/components/LayoutWrapper.tsx
git commit -m "feat: mount FluxerChatWidget in LayoutWrapper (excluded from admin)"
```

---

## Done

All tasks complete. The Fluxer chat widget is live on all non-admin pages. To verify the full stack end-to-end:

```bash
cd server && yarn build && yarn lint
cd client && yarn build && yarn lint
```

Both should produce zero errors.
