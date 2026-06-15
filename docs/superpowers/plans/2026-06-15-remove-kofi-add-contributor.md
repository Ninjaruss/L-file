# Remove Ko-fi / Add Contributor Promotion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all Ko-fi and monetary support infrastructure, replace Ko-fi-gated features with editor-role gates, and replace the "Support the project" About page section with a "Become a contributor/editor" section.

**Architecture:** Big-bang removal in one pass — backend badge refactor → users controller update → donations module deletion → frontend profile gate changes → frontend UI/content changes. Migration SQL is generated and presented to the user (not auto-executed).

**Tech Stack:** NestJS 11 (backend), Next.js 15 / React 19 / Mantine UI (frontend), TypeORM + PostgreSQL via Supabase, TypeScript (strict)

---

## File Map

| File | Change |
|------|--------|
| `server/src/entities/badge.entity.ts` | Remove `SUPPORTER`, `ACTIVE_SUPPORTER`, `SPONSOR` from `BadgeType` enum |
| `server/src/modules/badges/badges.service.ts` | Remove donation imports, `donationRepository`, `processAutomaticBadges` and its helpers, `hasActiveSupporterBadge`; simplify `awardBadge`; update `expireUserBadges`; rename `getAllSupporters` → `getContributors` (CUSTOM only); remove donation stats from `getBadgeStatistics` |
| `server/src/modules/badges/badges.module.ts` | Remove `Donation` from `TypeOrmModule.forFeature` |
| `server/src/modules/badges/badges.controller.ts` | Rename `GET /badges/supporters` → `GET /badges/contributors` |
| `server/src/modules/users/users.controller.ts` | Replace `hasActiveSupporterBadge` call with role check (`editor` or `admin`) in `updateCustomRole` |
| `server/src/app.module.ts` | Remove `DonationsModule` import and registration |
| `server/src/main.ts` | Remove `'donations'` Swagger tag |
| `server/src/config/env.validation.ts` | Remove `KOFI_WEBHOOK_TOKEN` field |
| `server/src/database/seeds/badge.seeder.ts` | Remove the three donation-based badge entries |
| `server/src/database/seeds/badges.seed.ts` | Remove the three donation-based badge entries |
| `server/src/modules/donations/` | **Delete entire directory** |
| `server/src/entities/donation.entity.ts` | **Delete** |
| `server/src/modules/badges/dto/kofi-webhook.dto.ts` | **Delete** |
| `client/src/types/index.ts` | Remove `Donation` interface |
| `client/src/app/profile/ProfilePageClient.tsx` | Replace `hasActiveSupporterBadge` (badge-based) with `isEditor` (role-based); update `handleSaveCustomRole` guard |
| `client/src/app/profile/ProfileSettingsPanel.tsx` | Replace `hasActiveSupporterBadge` prop with `isEditor`; update gate messaging |
| `client/src/components/ProfilePictureSelector.tsx` | Remove `userBadges` fetch + `isSupporter` logic; add `isEditor` from `user.role`; update `ExclusiveTab` |
| `client/src/app/about/AboutPageContent.tsx` | Replace Ko-fi hero with "Become a contributor" card; update Supporters→Contributors section; remove Ko-fi from contact |
| `client/src/components/Footer.tsx` | Replace Ko-fi "Support Us" link with GitHub link |
| `client/src/components/SupportersList.tsx` | Update fetch URL to `/badges/contributors`; rename "Our Supporters" to "Contributors"; remove Ko-fi CTA; update empty-state copy |

---

## Task 1: Update `BadgeType` enum — remove donation types

**Files:**
- Modify: `server/src/entities/badge.entity.ts`

- [ ] **Step 1: Replace the enum block**

In `server/src/entities/badge.entity.ts`, replace:
```typescript
export enum BadgeType {
  SUPPORTER = 'supporter',
  ACTIVE_SUPPORTER = 'active_supporter',
  SPONSOR = 'sponsor',
  CUSTOM = 'custom',
}
```
With:
```typescript
export enum BadgeType {
  CUSTOM = 'custom',
}
```

Also update the `@ApiProperty` example on the `type` column (line ~43) to use `BadgeType.CUSTOM`:
```typescript
  @ApiProperty({
    description: 'Badge type',
    enum: BadgeType,
    example: BadgeType.CUSTOM,
  })
  @Column({ type: 'enum', enum: BadgeType })
  type: BadgeType;
```

---

## Task 2: Rewrite `badges.service.ts` — remove all donation-dependent code

**Files:**
- Modify: `server/src/modules/badges/badges.service.ts`

- [ ] **Step 1: Replace the entire file**

Replace `server/src/modules/badges/badges.service.ts` with:

```typescript
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull } from 'typeorm';
import { Badge, BadgeType } from '../../entities/badge.entity';
import { UserBadge } from '../../entities/user-badge.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class BadgesService {
  private readonly logger = new Logger(BadgesService.name);

  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,
    @InjectRepository(UserBadge)
    private readonly userBadgeRepository: Repository<UserBadge>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAllBadges(): Promise<Badge[]> {
    return this.badgeRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', name: 'ASC' },
    });
  }

  async findBadgeById(id: number): Promise<Badge> {
    const badge = await this.badgeRepository.findOne({ where: { id } });
    if (!badge) {
      throw new NotFoundException(`Badge with ID ${id} not found`);
    }
    return badge;
  }

  async getUserBadges(userId: number): Promise<UserBadge[]> {
    return this.userBadgeRepository.find({
      where: { userId, isActive: true },
      relations: ['badge'],
      order: { badge: { displayOrder: 'ASC' }, awardedAt: 'DESC' },
    });
  }

  async getUserActiveBadges(userId: number): Promise<UserBadge[]> {
    const now = new Date();
    return this.userBadgeRepository.find({
      where: [
        { userId, isActive: true, expiresAt: IsNull() },
        { userId, isActive: true, expiresAt: MoreThan(now) },
      ],
      relations: ['badge'],
      order: { badge: { displayOrder: 'ASC' }, awardedAt: 'DESC' },
    });
  }

  async getAllUserBadges(userId: number): Promise<UserBadge[]> {
    return this.userBadgeRepository.find({
      where: { userId },
      relations: ['badge', 'revokedBy'],
      order: { badge: { displayOrder: 'ASC' }, awardedAt: 'DESC' },
    });
  }

  async awardBadge(
    userId: number,
    badgeId: number,
    reason?: string,
    awardedByUserId?: number,
    metadata?: any,
    year?: number,
    expiresAt?: string | Date,
  ): Promise<UserBadge> {
    this.logger.log(
      `Awarding badge ${badgeId} to user ${userId}. Reason: ${reason || 'Not specified'}`,
    );

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const badge = await this.findBadgeById(badgeId);

    const existingBadge = await this.userBadgeRepository.findOne({
      where: { userId, badgeId, isActive: true },
    });

    if (existingBadge) {
      this.logger.warn(
        `User ${userId} already has active badge ${badgeId} (${badge.name})`,
      );
      throw new BadRequestException('User already has this active badge');
    }

    const finalExpiresAt = expiresAt ? new Date(expiresAt) : null;

    const userBadge = this.userBadgeRepository.create({
      userId,
      badgeId,
      year: year ?? null,
      reason,
      awardedByUserId,
      metadata,
      expiresAt: finalExpiresAt,
    });

    const savedBadge = await this.userBadgeRepository.save(userBadge);
    this.logger.log(
      `Successfully awarded badge ${badge.name} to user ${user.username} (${userId})`,
    );

    return savedBadge;
  }

  async revokeBadge(
    userId: number,
    badgeId: number,
    reason?: string,
    revokedByUserId?: number,
  ): Promise<void> {
    const userBadge = await this.userBadgeRepository.findOne({
      where: { userId, badgeId, isActive: true },
    });

    if (!userBadge) {
      throw new NotFoundException('Active user badge not found');
    }

    userBadge.isActive = false;
    userBadge.revokedAt = new Date();
    userBadge.revokedReason = reason || 'No reason provided';
    userBadge.revokedByUserId = revokedByUserId || null;

    await this.userBadgeRepository.save(userBadge);
  }

  async expireUserBadges(): Promise<number> {
    this.logger.log('Starting badge expiration check...');
    const now = new Date();
    const expiredBadges = await this.userBadgeRepository.find({
      where: {
        isActive: true,
        expiresAt: MoreThan(new Date('2000-01-01')),
      },
      relations: ['badge', 'user'],
    });

    let expiredCount = 0;
    for (const userBadge of expiredBadges) {
      if (userBadge.expiresAt && userBadge.expiresAt <= now) {
        userBadge.isActive = false;
        await this.userBadgeRepository.save(userBadge);
        expiredCount++;

        this.logger.log(
          `Expired badge ${userBadge.badge?.name} for user ${userBadge.user?.username} (${userBadge.userId})`,
        );
      }
    }

    this.logger.log(
      `Badge expiration check completed. Expired ${expiredCount} badges.`,
    );
    return expiredCount;
  }

  async getContributors(): Promise<any[]> {
    return this.userBadgeRepository
      .createQueryBuilder('userBadge')
      .leftJoinAndSelect('userBadge.user', 'user')
      .leftJoinAndSelect('userBadge.badge', 'badge')
      .where('badge.type = :type', { type: BadgeType.CUSTOM })
      .andWhere('userBadge.isActive = :isActive', { isActive: true })
      .orderBy('userBadge.awardedAt', 'ASC')
      .getMany();
  }

  async getBadgeStatistics(): Promise<any> {
    this.logger.log('Generating badge statistics...');

    const badgeStats = await this.userBadgeRepository
      .createQueryBuilder('userBadge')
      .leftJoin('userBadge.badge', 'badge')
      .select('badge.type', 'type')
      .addSelect('COUNT(userBadge.id)', 'count')
      .addSelect(
        'COUNT(CASE WHEN userBadge.isActive = true THEN 1 END)',
        'activeCount',
      )
      .where('userBadge.isActive = :isActive', { isActive: true })
      .groupBy('badge.type')
      .getRawMany();

    const soonToExpire = await this.userBadgeRepository
      .createQueryBuilder('userBadge')
      .select('COUNT(userBadge.id)', 'count')
      .where('userBadge.isActive = :isActive', { isActive: true })
      .andWhere('userBadge.expiresAt BETWEEN :now AND :sevenDaysFromNow', {
        now: new Date(),
        sevenDaysFromNow: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      .getRawOne();

    const statistics = {
      badges: badgeStats,
      expiringIn7Days: parseInt(soonToExpire.count) || 0,
      generatedAt: new Date(),
    };

    this.logger.log('Badge statistics generated successfully');
    return statistics;
  }
}
```

---

## Task 3: Update `badges.module.ts` — remove Donation dependency

**Files:**
- Modify: `server/src/modules/badges/badges.module.ts`

- [ ] **Step 1: Remove Donation import and forFeature registration**

Replace the entire file with:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BadgesService } from './badges.service';
import { BadgesController } from './badges.controller';
import { Badge } from '../../entities/badge.entity';
import { UserBadge } from '../../entities/user-badge.entity';
import { User } from '../../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Badge, UserBadge, User])],
  providers: [BadgesService],
  controllers: [BadgesController],
  exports: [BadgesService],
})
export class BadgesModule {}
```

---

## Task 4: Rename `supporters` endpoint → `contributors` in `badges.controller.ts`

**Files:**
- Modify: `server/src/modules/badges/badges.controller.ts`

- [ ] **Step 1: Replace the supporters endpoint**

Find and replace the `getSupporters` method:
```typescript
  @Get('supporters')
  @ApiOperation({ summary: 'Get all supporters list' })
  @ApiResponse({ status: 200, description: 'List of supporters' })
  async getSupporters() {
    return this.badgesService.getAllSupporters();
  }
```
With:
```typescript
  @Get('contributors')
  @ApiOperation({ summary: 'Get contributors with custom badges' })
  @ApiResponse({ status: 200, description: 'List of contributors' })
  async getContributors() {
    return this.badgesService.getContributors();
  }
```

---

## Task 5: Update `users.controller.ts` — role-based custom role gate

**Files:**
- Modify: `server/src/modules/users/users.controller.ts`

- [ ] **Step 1: Replace `hasActiveSupporterBadge` check with role check**

Find this block (around line 695):
```typescript
  async updateCustomRole(
    @CurrentUser() user: User,
    @Body() updateCustomRoleDto: UpdateCustomRoleDto,
  ) {
    const hasActiveBadge = await this.badgesService.hasActiveSupporterBadge(
      user.id,
    );

    if (!hasActiveBadge) {
      throw new NotFoundException(
        'Active supporter badge required to set custom role',
      );
    }

    await this.service.updateCustomRole(
      user.id,
      updateCustomRoleDto.customRole,
    );
    return { message: 'Custom role updated successfully' };
  }
```

Replace with:
```typescript
  async updateCustomRole(
    @CurrentUser() user: User,
    @Body() updateCustomRoleDto: UpdateCustomRoleDto,
  ) {
    if (user.role !== UserRole.EDITOR && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Editor or admin role required to set custom role',
      );
    }

    await this.service.updateCustomRole(
      user.id,
      updateCustomRoleDto.customRole,
    );
    return { message: 'Custom role updated successfully' };
  }
```

- [ ] **Step 2: Add `ForbiddenException` to the NestJS imports at the top of the file**

Find the `@nestjs/common` import line and add `ForbiddenException` to the list if it isn't already there. Example:
```typescript
import {
  Controller,
  Get,
  Post,
  // ... existing imports ...
  ForbiddenException,
} from '@nestjs/common';
```

- [ ] **Step 3: Also update the Swagger ApiResponse decorator for `updateCustomRole`**

Find:
```typescript
  @ApiResponse({ status: 403, description: 'Active supporter badge required' })
```
Replace with:
```typescript
  @ApiResponse({ status: 403, description: 'Editor or admin role required' })
```

---

## Task 6: Remove `DonationsModule` from app wiring

**Files:**
- Modify: `server/src/app.module.ts`
- Modify: `server/src/main.ts`
- Modify: `server/src/config/env.validation.ts`

- [ ] **Step 1: `app.module.ts` — remove DonationsModule**

Remove this import line:
```typescript
import { DonationsModule } from './modules/donations/donations.module';
```

Remove `DonationsModule,` from the `imports` array (around line 111).

- [ ] **Step 2: `main.ts` — remove 'donations' Swagger tag**

Find and remove:
```typescript
    .addTag('donations', 'Donations - Support and contributor management')
```

- [ ] **Step 3: `env.validation.ts` — remove KOFI_WEBHOOK_TOKEN**

Find and remove:
```typescript
  KOFI_WEBHOOK_TOKEN?: string;
```

---

## Task 7: Update badge seeds — remove three donation badges

**Files:**
- Modify: `server/src/database/seeds/badge.seeder.ts`
- Modify: `server/src/database/seeds/badges.seed.ts`

- [ ] **Step 1: `badge.seeder.ts` — remove Supporter, Active Supporter, Sponsor entries**

Remove these three objects from the `badges` array:
```typescript
      {
        name: 'Supporter',
        description: 'Awarded to supporters who have made a donation',
        type: BadgeType.SUPPORTER,
        icon: '💎',
        color: '#FFD700',
        backgroundColor: '#1A1A1A',
        displayOrder: 1,
        isActive: true,
        isManuallyAwardable: false,
      },
      {
        name: 'Active Supporter',
        description:
          'Active supporter with donation in the last year - can set custom titles',
        type: BadgeType.ACTIVE_SUPPORTER,
        icon: '⭐',
        color: '#00FF00',
        backgroundColor: '#0D1B2A',
        displayOrder: 2,
        isActive: true,
        isManuallyAwardable: false,
      },
      {
        name: 'Sponsor',
        description:
          'Generous sponsor with $25+ in total donations - access to exclusive content',
        type: BadgeType.SPONSOR,
        icon: '👑',
        color: '#FF6B35',
        backgroundColor: '#2D1B69',
        displayOrder: 3,
        isActive: true,
        isManuallyAwardable: false,
      },
```

- [ ] **Step 2: `badges.seed.ts` — remove the same three entries**

Remove:
```typescript
    {
      name: 'Supporter',
      description: 'Awarded to supporters who have made a donation',
      type: BadgeType.SUPPORTER,
      icon: '💎',
      color: '#FFD700',
      backgroundColor: '#1A1A1A',
      displayOrder: 1,
      isActive: true,
      isManuallyAwardable: false,
    },
    {
      name: 'Active Supporter',
      description: 'Active supporter with donation in the last year',
      type: BadgeType.ACTIVE_SUPPORTER,
      icon: '⭐',
      color: '#00FF00',
      backgroundColor: '#0D1B2A',
      displayOrder: 2,
      isActive: true,
      isManuallyAwardable: false,
    },
    {
      name: 'Sponsor',
      description: 'Generous sponsor with $25+ in total donations',
      type: BadgeType.SPONSOR,
      icon: '👑',
      color: '#FF6B35',
      backgroundColor: '#2D1B69',
      displayOrder: 3,
      isActive: true,
      isManuallyAwardable: false,
    },
```

---

## Task 8: Delete donations module files

**Files:**
- Delete: `server/src/modules/donations/donations.controller.ts`
- Delete: `server/src/modules/donations/donations.service.ts`
- Delete: `server/src/modules/donations/donations.module.ts`
- Delete: `server/src/entities/donation.entity.ts`
- Delete: `server/src/modules/badges/dto/kofi-webhook.dto.ts`

- [ ] **Step 1: Delete all Ko-fi / donation files**

Run:
```bash
rm -rf server/src/modules/donations
rm server/src/entities/donation.entity.ts
rm server/src/modules/badges/dto/kofi-webhook.dto.ts
```

---

## Task 9: Commit backend changes and verify server build

**Files:** (all modified above)

- [ ] **Step 1: Run the server build**

```bash
cd server && yarn build
```

Expected: `Found 0 errors. Watching for file changes.` (or similar clean output with no TypeScript errors).

If errors appear, fix them before continuing. Common causes: remaining import of `Donation` somewhere, or a reference to the removed `BadgeType` values.

- [ ] **Step 2: Commit**

```bash
git add server/src/entities/badge.entity.ts \
  server/src/modules/badges/badges.service.ts \
  server/src/modules/badges/badges.module.ts \
  server/src/modules/badges/badges.controller.ts \
  server/src/modules/users/users.controller.ts \
  server/src/app.module.ts \
  server/src/main.ts \
  server/src/config/env.validation.ts \
  server/src/database/seeds/badge.seeder.ts \
  server/src/database/seeds/badges.seed.ts
git add -u server/src/modules/donations server/src/entities/donation.entity.ts server/src/modules/badges/dto/kofi-webhook.dto.ts
git commit -m "$(cat <<'EOF'
chore(server): remove Ko-fi / donations infrastructure

- Remove DonationsModule, Donation entity, Ko-fi webhook DTO
- Remove SUPPORTER, ACTIVE_SUPPORTER, SPONSOR badge types
- Remove processAutomaticBadges and donation-driven badge logic
- Gate custom role behind editor/admin role instead of supporter badge
- Rename /badges/supporters → /badges/contributors (CUSTOM badges only)
- Remove donation stats from getBadgeStatistics
- Remove KOFI_WEBHOOK_TOKEN env var and 'donations' Swagger tag
- Update seeds to drop the three donation badge entries

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: ⏸ Migration SQL — run on Supabase before continuing

**STOP HERE.** Present the following SQL to the user and wait for them to confirm it has been run on Supabase before proceeding to frontend changes.

```sql
-- ─── Remove Ko-fi donation badges ────────────────────────────────────────────
-- Step 1: Delete user_badge rows that reference the three donation badge types
--         (must happen before deleting the badge rows due to FK)
DELETE FROM "user_badge"
  WHERE "badgeId" IN (
    SELECT "id" FROM "badge"
    WHERE "type" IN ('supporter', 'active_supporter', 'sponsor')
  );

-- Step 2: Delete the badge rows themselves
DELETE FROM "badge" WHERE "type" IN ('supporter', 'active_supporter', 'sponsor');

-- Step 3: Update the PostgreSQL enum type for badge.type
--         (TypeORM uses the name badge_type_enum by convention — verify in
--          your Supabase schema if unsure: SELECT typname FROM pg_type WHERE typname LIKE 'badge%')
ALTER TYPE "badge_type_enum" RENAME TO "badge_type_enum_old";
CREATE TYPE "badge_type_enum" AS ENUM ('custom');
ALTER TABLE "badge"
  ALTER COLUMN "type" TYPE "badge_type_enum"
  USING "type"::text::"badge_type_enum";
DROP TYPE "badge_type_enum_old";

-- Step 4: Drop the donation table (cascade removes any lingering FK refs)
DROP TABLE IF EXISTS "donation" CASCADE;
```

> **Note on enum name:** Run `SELECT typname FROM pg_type WHERE typname LIKE 'badge%';` in Supabase SQL editor first to confirm the exact enum type name. If it differs from `badge_type_enum`, adjust Steps 3 accordingly.

---

## Task 11: Remove `Donation` type from client types

**Files:**
- Modify: `client/src/types/index.ts`

- [ ] **Step 1: Remove the `Donation` interface**

Find and remove the entire `Donation` interface block:
```typescript
export interface Donation {
  // ... all fields including donationDate, provider: 'kofi' | 'manual', etc.
}
```

---

## Task 12: Update `ProfilePageClient` + `ProfileSettingsPanel` — role-based gate

**Files:**
- Modify: `client/src/app/profile/ProfilePageClient.tsx`
- Modify: `client/src/app/profile/ProfileSettingsPanel.tsx`

- [ ] **Step 1: `ProfilePageClient.tsx` — replace `hasActiveSupporterBadge` with `isEditor`**

Find:
```typescript
  const hasActiveSupporterBadge = userBadges.some(ub => ub.badge?.type === 'active_supporter')
```
Replace with:
```typescript
  const isEditor = user?.role === 'editor' || user?.role === 'admin'
```

- [ ] **Step 2: `ProfilePageClient.tsx` — update `handleSaveCustomRole` guard**

Find:
```typescript
  const handleSaveCustomRole = useCallback(async () => {
    if (!hasActiveSupporterBadge) return
```
Replace with:
```typescript
  const handleSaveCustomRole = useCallback(async () => {
    if (!isEditor) return
```

Also update the dependency array further down:
```typescript
  }, [hasActiveSupporterBadge, refreshUser, profileData.customRole])
```
→
```typescript
  }, [isEditor, refreshUser, profileData.customRole])
```

- [ ] **Step 3: `ProfilePageClient.tsx` — update the ProfileSettingsPanel prop**

Find:
```tsx
                <ProfileSettingsPanel
                  user={user!}
                  hasActiveSupporterBadge={hasActiveSupporterBadge}
```
Replace with:
```tsx
                <ProfileSettingsPanel
                  user={user!}
                  isEditor={isEditor}
```

- [ ] **Step 4: `ProfileSettingsPanel.tsx` — update props interface**

Find:
```typescript
interface ProfileSettingsPanelProps {
  user: SettingsPanelUser
  hasActiveSupporterBadge: boolean
```
Replace with:
```typescript
interface ProfileSettingsPanelProps {
  user: SettingsPanelUser
  isEditor: boolean
```

- [ ] **Step 5: `ProfileSettingsPanel.tsx` — update destructured prop**

Find:
```typescript
export default function ProfileSettingsPanel({
  user,
  hasActiveSupporterBadge,
```
Replace with:
```typescript
export default function ProfileSettingsPanel({
  user,
  isEditor,
```

- [ ] **Step 6: `ProfileSettingsPanel.tsx` — update the Custom Role gate block**

Find:
```tsx
        {!hasActiveSupporterBadge ? (
          <Alert style={{ color: getEntityThemeColor(theme, 'character') }} variant="light">
            <Stack gap="xs">
              <Text size="sm" fw={500}>Custom roles are exclusive to active supporters!</Text>
              <Text size="sm">Support us on Ko-fi to unlock this feature.</Text>
              <Button component="a" href="https://ko-fi.com/ninjaruss" target="_blank" rel="noopener noreferrer" size="sm">
                ☕ Support on Ko-fi
              </Button>
            </Stack>
          </Alert>
        ) : (
```
Replace with:
```tsx
        {!isEditor ? (
          <Alert style={{ color: getEntityThemeColor(theme, 'character') }} variant="light">
            <Stack gap="xs">
              <Text size="sm" fw={500}>Custom roles are available to editors and admins.</Text>
              <Text size="sm">Apply for the editor role to unlock this feature.</Text>
            </Stack>
          </Alert>
        ) : (
```

---

## Task 13: Update `ProfilePictureSelector` — role-based exclusive artwork gate

**Files:**
- Modify: `client/src/components/ProfilePictureSelector.tsx`

- [ ] **Step 1: Remove `userBadges` state and the badge-fetch effect**

Find and remove:
```typescript
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
```

Find and remove the entire `useEffect` that fetches badges (starts with `// Fetch badges on open`):
```typescript
  // Fetch badges on open
  useEffect(() => {
    if (!opened || !currentUserId) return;
    fetch(`${API_BASE_URL}/users/${currentUserId}/badges`)
      ...
      .catch(() => setUserBadges([]));
  }, [opened, currentUserId]);
```

- [ ] **Step 2: Remove `hasActiveBadge` and `isSupporter`, add `isEditor`**

Find and remove:
```typescript
  const hasActiveBadge = useCallback((type: BadgeType): boolean => {
    return userBadges.some(ub =>
      ub?.badge?.type === type &&
      ub?.isActive &&
      (!ub?.expiresAt || new Date(ub.expiresAt) > new Date())
    );
  }, [userBadges]);

  const isSupporter = hasActiveBadge(BadgeType.SUPPORTER) || hasActiveBadge(BadgeType.ACTIVE_SUPPORTER) || hasActiveBadge(BadgeType.SPONSOR);
```

Add in their place (after the existing state declarations):
```typescript
  const isEditor = user.role === 'editor' || user.role === 'admin';
```

- [ ] **Step 3: Replace all `isSupporter` references with `isEditor`**

There are three occurrences in the JSX — all the `isSupporter` references in the Tabs section and the `ExclusiveTab` call. Replace each one:
- `disabled={!isSupporter}` → `disabled={!isEditor}`
- `{!isSupporter && (` → `{!isEditor && (`
- `<ExclusiveTab isSupporter={isSupporter} />` → `<ExclusiveTab isEditor={isEditor} />`

- [ ] **Step 4: Update `ExclusiveTab` component signature and content**

Find:
```typescript
function ExclusiveTab({ isSupporter }: { isSupporter: boolean }) {
  if (!isSupporter) {
    return (
      <Box ...>
        <Stack align="center" gap="lg" style={{ maxWidth: 320 }}>
          <Text size="xl" ta="center">✦</Text>
          <Text fw={700} size="lg" ta="center">Supporter Exclusive</Text>
          <Text size="sm" c="dimmed" ta="center">
            Exclusive artwork profile pictures are available to supporters.
            Support the database to unlock this feature and more!
          </Text>
          <Button
            component="a"
            href="https://ko-fi.com/ninjaruss"
            target="_blank"
            rel="noopener noreferrer"
            variant="filled"
            color="yellow"
            size="sm"
          >
            ☕ Support on Ko-fi
          </Button>
        </Stack>
      </Box>
    );
  }
```

Replace with:
```typescript
function ExclusiveTab({ isEditor }: { isEditor: boolean }) {
  if (!isEditor) {
    return (
      <Box
        style={{
          height: 420,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
        }}
      >
        <Stack align="center" gap="lg" style={{ maxWidth: 320 }}>
          <Text size="xl" ta="center">✦</Text>
          <Text fw={700} size="lg" ta="center">Editor Exclusive</Text>
          <Text size="sm" c="dimmed" ta="center">
            Exclusive artwork profile pictures are available to editors and admins.
            Apply for the editor role to unlock this feature.
          </Text>
        </Stack>
      </Box>
    );
  }
```

- [ ] **Step 5: Update the "coming soon" badge label inside `ExclusiveTab`**

Find (in the supporter-unlocked branch of `ExclusiveTab`):
```tsx
        <Badge variant="filled" color="yellow" size="lg">✦ SUPPORTER</Badge>
        <Text size="sm" c="dimmed" ta="center">
          Exclusive artwork will appear here when available. Thank you for your support!
```
Replace with:
```tsx
        <Badge variant="filled" color="violet" size="lg">✦ EDITOR</Badge>
        <Text size="sm" c="dimmed" ta="center">
          Exclusive artwork will appear here when available.
```

- [ ] **Step 6: Remove unused imports**

Remove `UserBadge` and `BadgeType` from the import line at the top if they are no longer used elsewhere in the file:
```typescript
import { UserBadge, BadgeType } from '../types';
```
→ remove or keep only what remains used (check for any other usage of `UserBadge`/`BadgeType` in the file first with a search).

---

## Task 14: Update `AboutPageContent.tsx` — contributor section

**Files:**
- Modify: `client/src/app/about/AboutPageContent.tsx`

- [ ] **Step 1: Update imports — remove `Coffee`, keep `Github` and `Mail`**

Find:
```typescript
import { Heart, Mail, Coffee, Github } from 'lucide-react'
```
Replace with:
```typescript
import { Mail, Github } from 'lucide-react'
```

- [ ] **Step 2: Remove `supportItems` array**

Find and remove the entire `supportItems` constant:
```typescript
const supportItems = [
  {
    primary: 'Buy me a coffee',
    secondary: 'Help cover hosting costs and development time'
  },
  ...
]
```

- [ ] **Step 3: Replace the Ko-fi hero card with the contributor card**

Find the entire `{/* Support Section */}` Grid.Col block:
```tsx
          {/* Support Section */}
          <Grid.Col span={12}>
            <Card radius="xl" p={0} style={accentCardStyle}>
              <Grid gutter={0}>
                <Grid.Col
                  span={{ base: 12, md: 8 }}
                  style={{
                    padding: rem(40),
                    borderRight: `1px solid ${hexToRgba(accentRedHex, 0.15)}`
                  }}
                >
                  <Stack gap="md">
                    <Text
                      style={{
                        fontFamily: 'var(--font-opti-goudy-text)',
                        fontSize: rem(44),
                        lineHeight: 1.1,
                        color: accentRedHex,
                        fontWeight: 400
                      }}
                    >
                      Support the project.
                    </Text>
                    <Text size="md" c={hexToRgba(whiteHex, 0.75)} style={{ maxWidth: rem(480) }}>
                      L-File is an independent fan project built in spare time by someone who genuinely loves Usogui.
                      Support helps cover hosting and development costs, keeping the site free and ad-free for the community.
                    </Text>
                    <Group gap="sm" mt="sm">
                      <Button
                        component="a"
                        href="https://ko-fi.com/ninjaruss"
                        target="_blank"
                        rel="noopener noreferrer"
                        size="lg"
                        variant="gradient"
                        gradient={{ from: accentRedHex, to: accentPurpleHex }}
                        leftSection={<Coffee size={20} />}
                      >
                        Support on Ko-fi
                      </Button>
                      <Button
                        component="a"
                        href="https://github.com/Ninjaruss/l-file"
                        target="_blank"
                        rel="noopener noreferrer"
                        size="lg"
                        variant="outline"
                        style={{
                          color: hexToRgba(whiteHex, 0.9),
                          borderColor: hexToRgba(whiteHex, 0.3)
                        }}
                        leftSection={<Github size={20} />}
                      >
                        GitHub
                      </Button>
                    </Group>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }} style={{ padding: rem(40) }}>
                  <Stack gap="lg">
                    {supportItems.slice(0, 3).map((item) => (
                      <Box
                        key={item.primary}
                        style={{
                          borderLeft: `2px solid ${hexToRgba(accentPurpleHex, 0.5)}`,
                          paddingLeft: rem(16)
                        }}
                      >
                        <Text fw={700} size="sm" c={whiteHex} mb={2}>{item.primary}</Text>
                        <Text size="xs" c={hexToRgba(whiteHex, 0.5)}>{item.secondary}</Text>
                      </Box>
                    ))}
                  </Stack>
                </Grid.Col>
              </Grid>
            </Card>
          </Grid.Col>
```

Replace with:
```tsx
          {/* Contribute Section */}
          <Grid.Col span={12}>
            <Card radius="xl" p={0} style={accentCardStyle}>
              <Grid gutter={0}>
                <Grid.Col
                  span={{ base: 12, md: 8 }}
                  style={{
                    padding: rem(40),
                    borderRight: `1px solid ${hexToRgba(accentRedHex, 0.15)}`
                  }}
                >
                  <Stack gap="md">
                    <Text
                      style={{
                        fontFamily: 'var(--font-opti-goudy-text)',
                        fontSize: rem(44),
                        lineHeight: 1.1,
                        color: accentRedHex,
                        fontWeight: 400
                      }}
                    >
                      Become a contributor.
                    </Text>
                    <Text size="md" c={hexToRgba(whiteHex, 0.75)} style={{ maxWidth: rem(480) }}>
                      L-File is an independent fan project built in spare time. The best way to support it
                      is to contribute — whether that&apos;s improving the code or enriching the wiki with content.
                    </Text>
                    <Group gap="sm" mt="sm">
                      <Button
                        component="a"
                        href="https://github.com/Ninjaruss/l-file"
                        target="_blank"
                        rel="noopener noreferrer"
                        size="lg"
                        variant="gradient"
                        gradient={{ from: accentRedHex, to: accentPurpleHex }}
                        leftSection={<Github size={20} />}
                      >
                        View on GitHub
                      </Button>
                      <Button
                        component="a"
                        href="mailto:contact@ninjaruss.net"
                        size="lg"
                        variant="outline"
                        style={{
                          color: hexToRgba(whiteHex, 0.9),
                          borderColor: hexToRgba(whiteHex, 0.3)
                        }}
                        leftSection={<Mail size={20} />}
                      >
                        Apply as Editor
                      </Button>
                    </Group>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }} style={{ padding: rem(40) }}>
                  <Stack gap="lg">
                    {[
                      {
                        primary: 'Code contributions',
                        secondary: 'Open a pull request on GitHub — bug fixes, new features, and improvements are welcome.'
                      },
                      {
                        primary: 'Content contributions',
                        secondary: 'Apply for the editor role to add and curate characters, arcs, gambles, guides, and more.'
                      },
                      {
                        primary: 'Spread the word',
                        secondary: 'Share L-File with other Usogui fans.'
                      }
                    ].map((item) => (
                      <Box
                        key={item.primary}
                        style={{
                          borderLeft: `2px solid ${hexToRgba(accentPurpleHex, 0.5)}`,
                          paddingLeft: rem(16)
                        }}
                      >
                        <Text fw={700} size="sm" c={whiteHex} mb={2}>{item.primary}</Text>
                        <Text size="xs" c={hexToRgba(whiteHex, 0.5)}>{item.secondary}</Text>
                      </Box>
                    ))}
                  </Stack>
                </Grid.Col>
              </Grid>
            </Card>
          </Grid.Col>
```

- [ ] **Step 4: Update the Supporters → Contributors section**

Find:
```tsx
                <Box style={{ borderTop: `1px solid ${hexToRgba(accentPurpleHex, 0.3)}`, paddingTop: rem(12) }}>
                  <Title
                    order={3}
                    style={{
                      fontFamily: 'var(--font-opti-goudy-text)',
                      color: accentPurpleHex,
                      fontSize: rem(28),
                      fontWeight: 400
                    }}
                  >
                    Supporters
                  </Title>
                </Box>
                <Text size="md" c={hexToRgba(whiteHex, 0.8)}>
                  Thank you to everyone who has supported L-File through contributions, feedback, and sharing the project with other readers.
                </Text>
                <Text size="sm" c={hexToRgba(whiteHex, 0.6)}>
                  Ko-fi supporters automatically receive special badges on their profiles. Your support helps keep this project running!
                </Text>
```
Replace with:
```tsx
                <Box style={{ borderTop: `1px solid ${hexToRgba(accentPurpleHex, 0.3)}`, paddingTop: rem(12) }}>
                  <Title
                    order={3}
                    style={{
                      fontFamily: 'var(--font-opti-goudy-text)',
                      color: accentPurpleHex,
                      fontSize: rem(28),
                      fontWeight: 400
                    }}
                  >
                    Contributors
                  </Title>
                </Box>
                <Text size="md" c={hexToRgba(whiteHex, 0.8)}>
                  Thank you to everyone who has contributed to L-File — through code, content, feedback, and sharing the project with other readers.
                </Text>
                <Text size="sm" c={hexToRgba(whiteHex, 0.6)}>
                  Special badges are awarded by admins to recognise exceptional contributions to the database.
                </Text>
```

- [ ] **Step 5: Update the contact section — remove Ko-fi link**

Find the right column of the contact grid (it contains just the Ko-fi link):
```tsx
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Group gap="sm">
                      <Coffee size={20} />
                      <Anchor
                        href="https://ko-fi.com/ninjaruss"
                        target="_blank"
                        rel="noopener noreferrer"
                        c={whiteHex}
                        underline="hover"
                        size="md"
                      >
                        ko-fi.com/ninjaruss
                      </Anchor>
                    </Group>
                  </Grid.Col>
```
Replace with:
```tsx
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Group gap="sm">
                      <Github size={20} />
                      <Anchor
                        href="https://github.com/Ninjaruss/l-file"
                        target="_blank"
                        rel="noopener noreferrer"
                        c={whiteHex}
                        underline="hover"
                        size="md"
                      >
                        github.com/Ninjaruss/l-file
                      </Anchor>
                    </Group>
                  </Grid.Col>
```

---

## Task 15: Update `Footer.tsx` — replace Ko-fi with GitHub

**Files:**
- Modify: `client/src/components/Footer.tsx`

- [ ] **Step 1: Add `Github` to lucide-react imports, remove `Heart`**

Find:
```typescript
import { MessageCircle, Heart, ExternalLink, Info, BookOpen, Users, Dices, Image } from 'lucide-react'
```
Replace with:
```typescript
import { MessageCircle, Github, ExternalLink, Info, BookOpen, Users, Dices, Image } from 'lucide-react'
```

- [ ] **Step 2: Replace the Ko-fi CtaLink with a GitHub CtaLink**

Find:
```tsx
                <ColumnLabel>Support</ColumnLabel>
                <CtaLink
                  href="https://ko-fi.com/ninjaruss"
                  icon={Heart}
                  ariaLabel="Support us on Ko-fi (opens in new tab)"
                  accentColor="#ff5f5f"
                >
                  Support Us
                </CtaLink>
```
Replace with:
```tsx
                <ColumnLabel>Contribute</ColumnLabel>
                <CtaLink
                  href="https://github.com/Ninjaruss/l-file"
                  icon={Github}
                  ariaLabel="View source on GitHub (opens in new tab)"
                  accentColor="#e11d48"
                >
                  Open Source
                </CtaLink>
```

---

## Task 16: Update `SupportersList.tsx` — remove Ko-fi CTA, rebrand for contributors

**Files:**
- Modify: `client/src/components/SupportersList.tsx`

- [ ] **Step 1: Update the fetch URL**

Find:
```typescript
  const response = await fetch(`${API_BASE_URL}/badges/supporters`);
```
Replace with:
```typescript
  const response = await fetch(`${API_BASE_URL}/badges/contributors`);
```

- [ ] **Step 2: Update error-state heading**

Find:
```tsx
        <h2 className="text-xl font-bold mb-4 text-white">Our Supporters</h2>
        <p className="text-red-600 dark:text-red-400">Failed to load supporters: {error}</p>
```
Replace with:
```tsx
        <h2 className="text-xl font-bold mb-4 text-white">Contributors</h2>
        <p className="text-red-600 dark:text-red-400">Failed to load contributors: {error}</p>
```

- [ ] **Step 3: Update empty-state**

Find:
```tsx
        <h2 className="text-xl font-bold mb-4 text-white">Our Supporters</h2>
        <p className="text-white/55">
          No supporters yet. Be the first to support our database!
        </p>
```
Replace with:
```tsx
        <h2 className="text-xl font-bold mb-4 text-white">Contributors</h2>
        <p className="text-white/55">
          No contributors with special badges yet.
        </p>
```

- [ ] **Step 4: Update the main heading and subtitle**

Find:
```tsx
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold text-white">Our Supporters</h2>
        <span className="text-red-500">❤️</span>
      </div>

      <p className="text-white/55 mb-6">
        Thank you to all our amazing supporters who help keep this database running!
      </p>
```
Replace with:
```tsx
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold text-white">Contributors</h2>
      </div>

      <p className="text-white/55 mb-6">
        Thank you to everyone recognised for their contributions to L-File.
      </p>
```

- [ ] **Step 5: Update the group heading labels**

Find:
```tsx
              {badgeType === 'sponsor' && 'Sponsors'}
              {badgeType === 'supporter' && 'Supporters'}
              {badgeType === 'custom' && 'Special Contributors'}
```
Replace with:
```tsx
              {badgeType === 'custom' && 'Special Contributors'}
```
(The other two cases can never occur now since only `CUSTOM` badges are returned.)

- [ ] **Step 6: Remove the Ko-fi CTA at the bottom**

Find and remove the entire CTA block at the bottom of the `return`:
```tsx
      <div className="mt-8 pt-6 border-t border-white/10">
        <div className="text-center">
          <p className="text-sm text-white/55 mb-2">
            Want to support us?
          </p>
          <a
            href="https://ko-fi.com/ninjaruss"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors"
          >
            ☕ Support on Ko-fi
          </a>
        </div>
      </div>
```

---

## Task 17: Commit frontend changes and verify client build

**Files:** (all modified above)

- [ ] **Step 1: Run the client build**

```bash
cd client && yarn build
```

Expected: Build completes with no TypeScript errors. If errors appear, fix them before committing.

- [ ] **Step 2: Commit**

```bash
git add client/src/types/index.ts \
  client/src/app/profile/ProfilePageClient.tsx \
  client/src/app/profile/ProfileSettingsPanel.tsx \
  client/src/components/ProfilePictureSelector.tsx \
  client/src/app/about/AboutPageContent.tsx \
  client/src/components/Footer.tsx \
  client/src/components/SupportersList.tsx
git commit -m "$(cat <<'EOF'
feat(client): remove Ko-fi, promote contributor/editor role

- Remove Donation type from types/index.ts
- Gate custom role behind editor/admin role (was supporter badge)
- Gate exclusive profile artwork behind editor/admin role (was supporter badge)
- Replace Ko-fi hero on About page with "Become a contributor" section
- Replace Ko-fi contact link with GitHub repo link
- Replace Ko-fi footer link with GitHub link
- Rename SupportersList → Contributors, remove Ko-fi CTA

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```
