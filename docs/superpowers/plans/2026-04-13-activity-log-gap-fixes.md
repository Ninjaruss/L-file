# Activity Log Gap Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill all missing gaps in edit log coverage — add QUOTE entity type, log quote/guide/media/annotation approvals attributed to the submitter, log event creation, and add display-time event consolidation on the frontend.

**Architecture:** Each backend task is an isolated service-level change. The entity enum is extended first (Task 1), then the EditLogService is wired for quotes (Task 2), then each service gets its missing log calls (Tasks 3–7). Frontend tasks (Tasks 8–9) are independent of each other and of the backend tasks beyond API contract.

**Tech Stack:** NestJS 11, TypeORM, PostgreSQL (Supabase pooler), Next.js 15, React 19, TypeScript, Mantine UI

---

## File Map

| File | Change |
|---|---|
| `server/src/entities/edit-log.entity.ts` | Add `QUOTE = 'quote'` to `EditLogEntityType` enum |
| `server/src/migrations/TIMESTAMP-AddQuoteToEditLogEnum.ts` | Hand-craft migration to extend Postgres enum |
| `server/src/modules/edit-log/edit-log.module.ts` | Add `Quote` entity to `TypeOrmModule.forFeature` |
| `server/src/modules/edit-log/edit-log.service.ts` | Inject Quote repo; add QUOTE to resolvers, `getSubmissionEditsByUser`, `getRecentApprovedSubmissions`, `getEditCountByUserGrouped` |
| `server/src/modules/quotes/quotes.module.ts` | Import `EditLogModule` |
| `server/src/modules/quotes/quotes.service.ts` | Inject `EditLogService`; add `logCreate` (on approve), `logUpdate`, `logDelete` |
| `server/src/modules/events/events.service.ts` | Add `logCreate` in `create()` |
| `server/src/modules/events/events.controller.ts` | Thread `@CurrentUser()` into `create()` |
| `server/src/modules/guides/guides.service.ts` | Add `logCreate` in `approve()` |
| `server/src/modules/media/media.service.ts` | Add `logCreate` in `approveSubmission()` |
| `server/src/modules/annotations/annotations.service.ts` | Add `logCreate` in `approve()` |
| `client/src/lib/api.ts` | Add `'quote'` to `getRecentSubmissions` return type |
| `client/src/components/RecentActivityFeed.tsx` | Add `'quote'` to `SubmissionEntry` type and entity maps |
| `client/src/app/changelog/ChangelogPageContent.tsx` | Add `'quote'` support + event consolidation logic |

---

## Task 1: Add QUOTE to EditLogEntityType and create migration

**Files:**
- Modify: `server/src/entities/edit-log.entity.ts`
- Create: `server/src/migrations/1744500000000-AddQuoteToEditLogEnum.ts`

> TypeORM's migration generator doesn't reliably detect Postgres enum value additions. Follow the existing pattern in `1743210000000-AddIsMinorEditAndEnumValues.ts` and hand-craft the migration.

- [ ] **Step 1: Add QUOTE to the enum**

In `server/src/entities/edit-log.entity.ts`, find `EditLogEntityType` and add the new value:

```typescript
export enum EditLogEntityType {
  CHARACTER = 'character',
  GAMBLE = 'gamble',
  ARC = 'arc',
  ORGANIZATION = 'organization',
  EVENT = 'event',
  GUIDE = 'guide',
  MEDIA = 'media',
  ANNOTATION = 'annotation',
  CHAPTER = 'chapter',
  TAG = 'tag',
  CHARACTER_RELATIONSHIP = 'character_relationship',
  CHARACTER_ORGANIZATION = 'character_organization',
  QUOTE = 'quote',
}
```

- [ ] **Step 2: Create the migration file**

Create `server/src/migrations/1744500000000-AddQuoteToEditLogEnum.ts`:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuoteToEditLogEnum1744500000000 implements MigrationInterface {
  name = 'AddQuoteToEditLogEnum1744500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "edit_log_entitytype_enum" ADD VALUE IF NOT EXISTS 'quote'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing enum values directly.
    // A full enum recreation would be required. Omitted for safety.
  }
}
```

- [ ] **Step 3: Preview the migration**

Run from `server/`:
```bash
yarn db:migrate:dry-run
```

Expected output includes `AddQuoteToEditLogEnum1744500000000` in the pending list. No errors.

- [ ] **Step 4: Apply the migration**

Run from `server/`:
```bash
yarn db:migrate
```

Expected: `Migration AddQuoteToEditLogEnum1744500000000 has been executed successfully.`

- [ ] **Step 5: Build to verify no TypeScript errors**

Run from `server/`:
```bash
yarn build
```

Expected: exit 0, no errors.

- [ ] **Step 6: Commit**

```bash
git add server/src/entities/edit-log.entity.ts server/src/migrations/1744500000000-AddQuoteToEditLogEnum.ts
git commit -m "feat: add QUOTE to EditLogEntityType enum and migration"
```

---

## Task 2: Wire Quote into EditLogModule and EditLogService

**Files:**
- Modify: `server/src/modules/edit-log/edit-log.module.ts`
- Modify: `server/src/modules/edit-log/edit-log.service.ts`

- [ ] **Step 1: Add Quote entity to EditLogModule**

In `server/src/modules/edit-log/edit-log.module.ts`, add the `Quote` import and include it in `TypeOrmModule.forFeature`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EditLog } from '../../entities/edit-log.entity';
import { Guide } from '../../entities/guide.entity';
import { Media } from '../../entities/media.entity';
import { Annotation } from '../../entities/annotation.entity';
import { Character } from '../../entities/character.entity';
import { Gamble } from '../../entities/gamble.entity';
import { Arc } from '../../entities/arc.entity';
import { Organization } from '../../entities/organization.entity';
import { Event } from '../../entities/event.entity';
import { Chapter } from '../../entities/chapter.entity';
import { Quote } from '../../entities/quote.entity';
import { EditLogService } from './edit-log.service';
import { EditLogController } from './edit-log.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EditLog,
      Guide,
      Media,
      Annotation,
      Character,
      Gamble,
      Arc,
      Organization,
      Event,
      Chapter,
      Quote,
    ]),
  ],
  controllers: [EditLogController],
  providers: [EditLogService],
  exports: [EditLogService],
})
export class EditLogModule {}
```

- [ ] **Step 2: Inject Quote repository into EditLogService**

In `server/src/modules/edit-log/edit-log.service.ts`, add the Quote import and inject the repository:

Add to imports at the top:
```typescript
import { Quote, QuoteStatus } from '../../entities/quote.entity';
```

Add to the constructor (after `@InjectRepository(Chapter)`):
```typescript
@InjectRepository(Quote)
private quoteRepository: Repository<Quote>,
```

- [ ] **Step 3: Add QUOTE to resolveEntityNames**

In `resolveEntityNames`, add a `QUOTE` branch inside the `Promise.all([...])` array, after the `CHAPTER` branch:

```typescript
groups.has(EditLogEntityType.QUOTE)
  ? (async () => {
      const ids = groups.get(EditLogEntityType.QUOTE)!;
      const rows = await this.quoteRepository.find({
        where: { id: In(ids) } as any,
        select: ['id', 'text'] as any,
      });
      for (const row of rows) {
        if (row.text) {
          const truncated =
            row.text.length > 80 ? row.text.slice(0, 80) + '…' : row.text;
          nameMap.set(`${EditLogEntityType.QUOTE}:${row.id}`, truncated);
        }
      }
    })()
  : Promise.resolve(),
```

- [ ] **Step 4: Add QUOTE to resolveEntityNamesByType**

In `resolveEntityNamesByType`, add a `'quote'` case inside the `switch` statement, after the `'chapter'` case:

```typescript
case 'quote': {
  const rows = await this.quoteRepository.find({
    where: { id: In(ids) } as any,
    select: ['id', 'text'] as any,
  });
  for (const row of rows) {
    if (row.text) {
      const truncated =
        row.text.length > 80 ? row.text.slice(0, 80) + '…' : row.text;
      nameMap.set(row.id, truncated);
    }
  }
  break;
}
```

- [ ] **Step 5: Add QUOTE to getSubmissionEditsByUser**

In `getSubmissionEditsByUser`, update the `entityType: In([...])` array:

```typescript
entityType: In([
  EditLogEntityType.GUIDE,
  EditLogEntityType.MEDIA,
  EditLogEntityType.ANNOTATION,
  EditLogEntityType.QUOTE,
]),
```

- [ ] **Step 6: Add QUOTE to getEditCountByUserGrouped**

In `getEditCountByUserGrouped`, add `QUOTE` to the `counts` initialization object:

```typescript
const counts: Record<EditLogEntityType, number> = {
  [EditLogEntityType.CHARACTER]: 0,
  [EditLogEntityType.GAMBLE]: 0,
  [EditLogEntityType.ARC]: 0,
  [EditLogEntityType.ORGANIZATION]: 0,
  [EditLogEntityType.EVENT]: 0,
  [EditLogEntityType.GUIDE]: 0,
  [EditLogEntityType.MEDIA]: 0,
  [EditLogEntityType.ANNOTATION]: 0,
  [EditLogEntityType.CHAPTER]: 0,
  [EditLogEntityType.TAG]: 0,
  [EditLogEntityType.CHARACTER_RELATIONSHIP]: 0,
  [EditLogEntityType.CHARACTER_ORGANIZATION]: 0,
  [EditLogEntityType.QUOTE]: 0,
};
```

- [ ] **Step 7: Add quotes to getRecentApprovedSubmissions**

In `getRecentApprovedSubmissions`, update the return type, the `Promise.all`, and the `combined` array.

**Update the return type** — change `type: 'guide' | 'media' | 'annotation'` to `type: 'guide' | 'media' | 'annotation' | 'quote'` in the method signature (two places: the return type and the `combined` array type declaration).

**Update Promise.all** — destructure `quotes` alongside the existing three:

```typescript
const [guides, media, annotations, quotes] = await Promise.all([
  this.guideRepository.find({
    where: { status: GuideStatus.APPROVED },
    relations: ['author'],
    order: { createdAt: 'DESC' },
  }),
  this.mediaRepository.find({
    where: { status: MediaStatus.APPROVED },
    relations: ['submittedBy'],
    order: { createdAt: 'DESC' },
  }),
  this.annotationRepository.find({
    where: { status: AnnotationStatus.APPROVED },
    relations: ['author'],
    order: { createdAt: 'DESC' },
  }),
  this.quoteRepository.find({
    where: { status: QuoteStatus.APPROVED },
    relations: ['submittedBy'],
    order: { createdAt: 'DESC' },
  }),
]);
```

**Add quotes to `combined`** — append after the `...annotations.map(...)` spread:

```typescript
...quotes
  .filter((q) => q.submittedBy)
  .map((q) => ({
    id: q.id,
    type: 'quote' as const,
    title: q.text.length > 80 ? q.text.slice(0, 80) + '…' : q.text,
    createdAt: q.createdAt,
    submittedBy: q.submittedBy
      ? {
          id: q.submittedBy.id,
          username: q.submittedBy.username,
          fluxerAvatar: q.submittedBy.fluxerAvatar ?? undefined,
          fluxerId: q.submittedBy.fluxerId ?? undefined,
        }
      : null,
  })),
```

- [ ] **Step 8: Build to verify no TypeScript errors**

Run from `server/`:
```bash
yarn build
```

Expected: exit 0, no errors.

- [ ] **Step 9: Commit**

```bash
git add server/src/modules/edit-log/edit-log.module.ts server/src/modules/edit-log/edit-log.service.ts
git commit -m "feat: wire Quote entity into EditLogModule and EditLogService"
```

---

## Task 3: Add edit logging to QuotesService

**Files:**
- Modify: `server/src/modules/quotes/quotes.module.ts`
- Modify: `server/src/modules/quotes/quotes.service.ts`

- [ ] **Step 1: Import EditLogModule in QuotesModule**

Replace the contents of `server/src/modules/quotes/quotes.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { Quote } from '../../entities/quote.entity';
import { Character } from '../../entities/character.entity';
import { EditLogModule } from '../edit-log/edit-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([Quote, Character]), EditLogModule],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
```

- [ ] **Step 2: Inject EditLogService into QuotesService**

In `server/src/modules/quotes/quotes.service.ts`, add these imports:

```typescript
import { EditLogService } from '../edit-log/edit-log.service';
import { EditLogEntityType } from '../../entities/edit-log.entity';
import { diffFields } from '../../common/utils/diff-fields';
```

Add `EditLogService` to the constructor (after `private charactersRepository`):

```typescript
constructor(
  @InjectRepository(Quote)
  private quotesRepository: Repository<Quote>,
  @InjectRepository(Character)
  private charactersRepository: Repository<Character>,
  private readonly editLogService: EditLogService,
) {}
```

- [ ] **Step 3: Add logCreate in approve()**

In the `approve` method, the quote currently loads without the `submittedBy` relation. Update it and log after saving:

Replace the existing `approve` method:

```typescript
async approve(id: number): Promise<Quote> {
  const quote = await this.quotesRepository.findOne({
    where: { id },
    relations: ['submittedBy'],
  });
  if (!quote) throw new NotFoundException(`Quote with ID ${id} not found`);
  if (quote.status !== QuoteStatus.PENDING) {
    throw new BadRequestException('Only pending quotes can be approved');
  }
  quote.status = QuoteStatus.APPROVED;
  quote.rejectionReason = null;
  const saved = await this.quotesRepository.save(quote);
  if (quote.submittedBy?.id) {
    await this.editLogService.logCreate(
      EditLogEntityType.QUOTE,
      saved.id,
      quote.submittedBy.id,
    );
  }
  return saved;
}
```

- [ ] **Step 4: Add logUpdate in update()**

In the `update` method, diff the fields before applying the update and log after. Replace the existing `update` method:

```typescript
async update(
  id: number,
  updateQuoteDto: UpdateQuoteDto,
  user: User,
): Promise<Quote> {
  const quote = await this.findOne(id);

  if (
    quote.submittedBy.id !== user.id &&
    user.role !== UserRole.MODERATOR &&
    user.role !== UserRole.ADMIN
  ) {
    throw new ForbiddenException('You can only update your own quotes');
  }

  if (
    updateQuoteDto.characterId &&
    updateQuoteDto.characterId !== quote.character.id
  ) {
    const character = await this.charactersRepository.findOne({
      where: { id: updateQuoteDto.characterId },
    });
    if (!character) {
      throw new NotFoundException(
        `Character with ID ${updateQuoteDto.characterId} not found`,
      );
    }
  }

  const changedFields = diffFields(quote, updateQuoteDto);
  await this.quotesRepository.update(id, updateQuoteDto);
  if (changedFields.length > 0) {
    await this.editLogService.logUpdate(
      EditLogEntityType.QUOTE,
      id,
      user.id,
      changedFields,
    );
  }
  return this.findOne(id);
}
```

- [ ] **Step 5: Add logDelete in remove()**

In the `remove` method, add logging after the entity is removed. Replace the existing `remove` method:

```typescript
async remove(id: number, user: User): Promise<void> {
  const quote = await this.findOne(id);

  if (
    quote.submittedBy.id !== user.id &&
    user.role !== UserRole.MODERATOR &&
    user.role !== UserRole.ADMIN
  ) {
    throw new ForbiddenException('You can only delete your own quotes');
  }

  await this.quotesRepository.remove(quote);
  await this.editLogService.logDelete(EditLogEntityType.QUOTE, id, user.id);
}
```

- [ ] **Step 6: Build to verify no TypeScript errors**

Run from `server/`:
```bash
yarn build
```

Expected: exit 0, no errors.

- [ ] **Step 7: Commit**

```bash
git add server/src/modules/quotes/quotes.module.ts server/src/modules/quotes/quotes.service.ts
git commit -m "feat: add edit log coverage to QuotesService (create on approve, update, delete)"
```

---

## Task 4: Log event creation in EventsService

**Files:**
- Modify: `server/src/modules/events/events.service.ts`
- Modify: `server/src/modules/events/events.controller.ts`

`EditLogService` is already injected in `EventsService`. The `create` controller method is already behind `JwtAuthGuard`, so the user is always present.

- [ ] **Step 1: Add userId parameter to EventsService.create()**

In `server/src/modules/events/events.service.ts`, update the `create` signature and add `logCreate` after saving:

Find the `async create(data: CreateEventDto): Promise<Event>` method and replace it:

```typescript
async create(data: CreateEventDto, userId?: number): Promise<Event> {
  const { characterIds, ...eventData } = data;

  const cleanedData = {
    ...eventData,
    type: data.type || EventType.DECISION,
    status: data.status || EventStatus.PENDING,
    chapterNumber: Number(eventData.chapterNumber) || 1,
    spoilerChapter:
      eventData.spoilerChapter && !isNaN(Number(eventData.spoilerChapter))
        ? Number(eventData.spoilerChapter)
        : undefined,
    arcId:
      eventData.arcId && !isNaN(Number(eventData.arcId))
        ? Number(eventData.arcId)
        : undefined,
  };

  const event = this.repo.create(cleanedData);

  if (characterIds && characterIds.length > 0) {
    const validCharacterIds = characterIds.filter((id) => !isNaN(Number(id)));
    if (validCharacterIds.length > 0) {
      const characters = await this.characterRepo.findByIds(
        validCharacterIds.map((id) => Number(id)),
      );
      event.characters = characters;
    }
  }

  const saved = await this.repo.save(event);

  if (userId) {
    await this.editLogService.logCreate(
      EditLogEntityType.EVENT,
      saved.id,
      userId,
    );
  }

  return saved;
}
```

- [ ] **Step 2: Pass user.id from the controller**

In `server/src/modules/events/events.controller.ts`, find the `create` endpoint (around line 327) and update it to pass the current user's id:

```typescript
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.EDITOR, UserRole.USER)
@ApiBearerAuth()
@ApiOperation({
  summary: 'Create a new event',
  description: 'Create a new event (requires authentication)',
})
@ApiBody({ type: CreateEventDto })
async create(
  @Body(ValidationPipe) createEventDto: CreateEventDto,
  @CurrentUser() user: User,
) {
  return await this.service.create(createEventDto, user.id);
}
```

- [ ] **Step 3: Build to verify no TypeScript errors**

Run from `server/`:
```bash
yarn build
```

Expected: exit 0, no errors.

- [ ] **Step 4: Commit**

```bash
git add server/src/modules/events/events.service.ts server/src/modules/events/events.controller.ts
git commit -m "feat: log event creation in EventsService"
```

---

## Task 5: Log guide approval as submitter CREATE in GuidesService

**Files:**
- Modify: `server/src/modules/guides/guides.service.ts`

`EditLogService` is already injected in `GuidesService`. The `approve` method already loads the guide with `relations: ['author', 'tags']`, so `guide.authorId` is available directly as a column.

- [ ] **Step 1: Add logCreate after guide is approved**

In `server/src/modules/guides/guides.service.ts`, find the `approve` method. Replace the final two lines:

```typescript
// Before (existing):
guide.status = GuideStatus.APPROVED;
guide.rejectionReason = null;

return await this.guideRepository.save(guide);
```

```typescript
// After:
guide.status = GuideStatus.APPROVED;
guide.rejectionReason = null;

const saved = await this.guideRepository.save(guide);
await this.editLogService.logCreate(
  EditLogEntityType.GUIDE,
  saved.id,
  guide.authorId,
);
return saved;
```

- [ ] **Step 2: Build to verify no TypeScript errors**

Run from `server/`:
```bash
yarn build
```

Expected: exit 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add server/src/modules/guides/guides.service.ts
git commit -m "feat: log guide approval as CREATE attributed to submitter"
```

---

## Task 6: Log media approval as submitter CREATE in MediaService

**Files:**
- Modify: `server/src/modules/media/media.service.ts`

`EditLogService` is already injected in `MediaService`. The `approveSubmission` method already loads the media with `relations: ['submittedBy']`.

- [ ] **Step 1: Add logCreate after media is approved**

In `server/src/modules/media/media.service.ts`, find the `approveSubmission` method. Replace the save + email block to capture the saved result and add logging:

```typescript
// Before (existing):
media.status = MediaStatus.APPROVED;
const savedMedia = await this.mediaRepo.save(media);

// Skip email for test user, if no submitter, or if no email
if (media.submittedBy?.email && !this.isTestUser(media.submittedBy.email)) {
  await this.emailService.sendMediaApprovalNotification(
    media.submittedBy.email,
    media.description || 'your submission',
  );
}

return savedMedia;
```

```typescript
// After:
media.status = MediaStatus.APPROVED;
const savedMedia = await this.mediaRepo.save(media);

if (media.submittedBy?.id) {
  await this.editLogService.logCreate(
    EditLogEntityType.MEDIA,
    savedMedia.id,
    media.submittedBy.id,
  );
}

// Skip email for test user, if no submitter, or if no email
if (media.submittedBy?.email && !this.isTestUser(media.submittedBy.email)) {
  await this.emailService.sendMediaApprovalNotification(
    media.submittedBy.email,
    media.description || 'your submission',
  );
}

return savedMedia;
```

- [ ] **Step 2: Build to verify no TypeScript errors**

Run from `server/`:
```bash
yarn build
```

Expected: exit 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add server/src/modules/media/media.service.ts
git commit -m "feat: log media approval as CREATE attributed to submitter"
```

---

## Task 7: Log annotation approval as submitter CREATE in AnnotationsService

**Files:**
- Modify: `server/src/modules/annotations/annotations.service.ts`

`EditLogService` is already injected in `AnnotationsService`. The `approve` method already loads the annotation with `relations: ['author']`.

- [ ] **Step 1: Add logCreate after annotation is approved**

In `server/src/modules/annotations/annotations.service.ts`, find the `approve` method. Replace the final line:

```typescript
// Before (existing):
annotation.status = AnnotationStatus.APPROVED;
annotation.rejectionReason = null;
return await this.annotationRepository.save(annotation);
```

```typescript
// After:
annotation.status = AnnotationStatus.APPROVED;
annotation.rejectionReason = null;
const saved = await this.annotationRepository.save(annotation);
await this.editLogService.logCreate(
  EditLogEntityType.ANNOTATION,
  saved.id,
  annotation.author.id,
);
return saved;
```

- [ ] **Step 2: Build to verify no TypeScript errors**

Run from `server/`:
```bash
yarn build
```

Expected: exit 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add server/src/modules/annotations/annotations.service.ts
git commit -m "feat: log annotation approval as CREATE attributed to submitter"
```

---

## Task 8: Add quote support to frontend components and API client

**Files:**
- Modify: `client/src/lib/api.ts`
- Modify: `client/src/components/RecentActivityFeed.tsx`
- Modify: `client/src/app/changelog/ChangelogPageContent.tsx`

`textColors.quote` already exists in `mantine-theme.ts`. The entity color maps in both components don't yet include `'quote'`.

- [ ] **Step 1: Update getRecentSubmissions return type in api.ts**

In `client/src/lib/api.ts`, find `getRecentSubmissions` (around line 1128). Update the `type` field in the return type:

```typescript
// Before:
type: 'guide' | 'media' | 'annotation'

// After:
type: 'guide' | 'media' | 'annotation' | 'quote'
```

- [ ] **Step 2: Add quote to RecentActivityFeed**

In `client/src/components/RecentActivityFeed.tsx`:

**Update `SubmissionEntry` type:**
```typescript
interface SubmissionEntry {
  id: number
  kind: 'submission'
  type: 'guide' | 'media' | 'annotation' | 'quote'
  // ... rest unchanged
}
```

**Update `entityLink` map** — add a `quote` entry:
```typescript
function entityLink(entityType: string, entityId: number): string {
  const map: Record<string, string> = {
    character: '/characters',
    gamble: '/gambles',
    arc: '/arcs',
    organization: '/organizations',
    event: '/events',
    guide: '/guides',
    media: '/media',
    annotation: '#',
    quote: '/quotes',
  }
  const base = map[entityType.toLowerCase()] ?? '#'
  return entityId ? `${base}/${entityId}` : base
}
```

**Update `entityLabel` map** — add `quote: 'Quote'`:
```typescript
function entityLabel(entityType: string): string {
  const map: Record<string, string> = {
    character: 'Character',
    gamble: 'Gamble',
    arc: 'Arc',
    organization: 'Org',
    event: 'Event',
    guide: 'Guide',
    media: 'Media',
    annotation: 'Annotation',
    quote: 'Quote',
  }
  return map[entityType.toLowerCase()] ?? entityType
}
```

**Update `entityColor` map** — add `quote: textColors.quote`:
```typescript
function entityColor(entityType: string): string {
  const map: Record<string, string> = {
    character: textColors.character,
    gamble: textColors.gamble,
    arc: textColors.arc,
    organization: textColors.organization,
    event: textColors.event,
    guide: textColors.guide,
    media: textColors.media,
    annotation: textColors.secondary,
    quote: textColors.quote,
  }
  return map[entityType.toLowerCase()] ?? textColors.secondary
}
```

**Update `submissionIcon`** — add a quote case (use `MessageSquare` from lucide-react, add it to the import):

Add `MessageSquare` to the lucide import line:
```typescript
import { Clock, ArrowRight, BookOpen, Image, FileText, Edit3, Plus, Trash2, MessageSquare } from 'lucide-react'
```

Update `submissionIcon`:
```typescript
function submissionIcon(type: string) {
  if (type === 'guide') return <FileText size={12} />
  if (type === 'media') return <Image size={12} />
  if (type === 'quote') return <MessageSquare size={12} />
  return <BookOpen size={12} />
}
```

- [ ] **Step 3: Add quote support to ChangelogPageContent**

In `client/src/app/changelog/ChangelogPageContent.tsx`:

**Update `SubmissionEntry` type:**
```typescript
interface SubmissionEntry {
  id: number
  kind: 'submission'
  type: 'guide' | 'media' | 'annotation' | 'quote'
  // ... rest unchanged
}
```

**Update `EntityFilter` type** — add `'quote'`:
```typescript
type EntityFilter = 'all' | 'character' | 'gamble' | 'arc' | 'organization' | 'event' | 'guide' | 'media' | 'annotation' | 'chapter' | 'quote'
```

**Update `entityLink` map** — add `quote: '/quotes'`:
```typescript
function entityLink(entityType: string, entityId: number): string {
  const map: Record<string, string> = {
    character: '/characters',
    gamble: '/gambles',
    arc: '/arcs',
    organization: '/organizations',
    event: '/events',
    guide: '/guides',
    media: '/media',
    annotation: '#',
    chapter: '/chapters',
    quote: '/quotes',
  }
  return `${map[entityType.toLowerCase()] ?? '#'}/${entityId}`
}
```

**Update `entityColor` map** — add `quote: textColors.quote`:
```typescript
function entityColor(entityType: string): string {
  const map: Record<string, string> = {
    character: textColors.character,
    gamble: textColors.gamble,
    arc: textColors.arc,
    organization: textColors.organization,
    event: textColors.event,
    guide: textColors.guide,
    media: textColors.media,
    annotation: textColors.annotation,
    chapter: textColors.chapter,
    quote: textColors.quote,
  }
  return map[entityType.toLowerCase()] ?? textColors.secondary
}
```

**Add Quote to SUBMISSION_ENTITY_OPTIONS:**
```typescript
const SUBMISSION_ENTITY_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Guides', value: 'guide' },
  { label: 'Media', value: 'media' },
  { label: 'Annotations', value: 'annotation' },
  { label: 'Quotes', value: 'quote' },
]
```

**Add Quote to ALL_ENTITY_OPTIONS** (after the `annotation` entry):
```typescript
const ALL_ENTITY_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Characters', value: 'character' },
  { label: 'Gambles', value: 'gamble' },
  { label: 'Arcs', value: 'arc' },
  { label: 'Orgs', value: 'organization' },
  { label: 'Events', value: 'event' },
  { label: 'Chapters', value: 'chapter' },
  { label: 'Guides', value: 'guide' },
  { label: 'Media', value: 'media' },
  { label: 'Annotations', value: 'annotation' },
  { label: 'Quotes', value: 'quote' },
]
```

**Add `MessageSquare` to the lucide import** (add it alongside `Clock`):
```typescript
import { Clock, MessageSquare } from 'lucide-react'
```

- [ ] **Step 4: Verify TypeScript compiles**

Run from `client/`:
```bash
yarn build
```

Expected: exit 0, no type errors. (Build may warn about unrelated things — only TypeScript errors matter here.)

- [ ] **Step 5: Commit**

```bash
git add client/src/lib/api.ts client/src/components/RecentActivityFeed.tsx client/src/app/changelog/ChangelogPageContent.tsx
git commit -m "feat: add quote support to frontend feed components and API client"
```

---

## Task 9: Add display-time event consolidation to ChangelogPageContent

**Files:**
- Modify: `client/src/app/changelog/ChangelogPageContent.tsx`

Group consecutive event-create entries from the same user within a 5-minute window into a single collapsed row showing "created N events". This is a best-effort pass over the current page's data.

- [ ] **Step 1: Add groupEntries utility function**

In `client/src/app/changelog/ChangelogPageContent.tsx`, add this function above the `ChangelogPageContent` component definition. Also add `count?: number` to the `EditEntry` interface.

**Update `EditEntry` interface:**
```typescript
interface EditEntry {
  id: number
  kind: 'edit'
  action: string
  entityType: string
  entityId: number
  entityName?: string
  changedFields?: string[] | null
  createdAt: string
  user?: { id: number; username: string; fluxerAvatar?: string; fluxerId?: string } | null
  count?: number
}
```

**Add the groupEntries function:**
```typescript
const EVENT_CONSOLIDATION_WINDOW_MS = 5 * 60 * 1000 // 5 minutes

function groupEntries(entries: FeedEntry[]): FeedEntry[] {
  const result: FeedEntry[] = []
  let i = 0
  while (i < entries.length) {
    const entry = entries[i]
    if (
      entry.kind === 'edit' &&
      (entry as EditEntry).action === 'create' &&
      (entry as EditEntry).entityType === 'event'
    ) {
      const editEntry = entry as EditEntry
      const group: EditEntry[] = [editEntry]
      let j = i + 1
      while (j < entries.length) {
        const next = entries[j]
        if (
          next.kind === 'edit' &&
          (next as EditEntry).action === 'create' &&
          (next as EditEntry).entityType === 'event' &&
          (next as EditEntry).user?.id === editEntry.user?.id &&
          Math.abs(
            new Date(next.createdAt).getTime() -
              new Date(editEntry.createdAt).getTime(),
          ) <= EVENT_CONSOLIDATION_WINDOW_MS
        ) {
          group.push(next as EditEntry)
          j++
        } else {
          break
        }
      }
      if (group.length > 1) {
        result.push({
          ...editEntry,
          entityName: `${group.length} events`,
          count: group.length,
        })
        i = j
      } else {
        result.push(entry)
        i++
      }
    } else {
      result.push(entry)
      i++
    }
  }
  return result
}
```

- [ ] **Step 2: Apply groupEntries after data is loaded**

In the `load` function inside `ChangelogPageContent`, apply `groupEntries` before calling `setEntries`. There are two code paths that call `setEntries`:

**For the `filterType === 'submissions'` branch** — submissions don't need grouping, leave unchanged.

**For the `filterType === 'all'` branch**, update the final lines:

```typescript
// Before:
const combined = [...editEntries, ...submissionEntries]
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  .slice((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT)
const totalCombined = (edits?.total ?? 0) + (submissions?.total ?? 0)
setEntries(combined)
setTotalPages(Math.ceil(totalCombined / PAGE_LIMIT))

// After:
const sorted = [...editEntries, ...submissionEntries]
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
const sliced = sorted.slice((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT)
const grouped = groupEntries(sliced)
const totalCombined = (edits?.total ?? 0) + (submissions?.total ?? 0)
setEntries(grouped)
setTotalPages(Math.ceil(totalCombined / PAGE_LIMIT))
```

- [ ] **Step 3: Update the edit entry renderer to handle consolidated rows**

In the render section for `entry.kind === 'edit'` entries, update the link and name display to handle the `count > 1` case (no link, just plain text):

Find where `displayName` and `link` are computed and add a consolidated check:

```typescript
if (entry.kind === 'edit') {
  const editEntry = entry as EditEntry
  const user = editEntry.user
  const isConsolidated = (editEntry.count ?? 1) > 1
  const link = isConsolidated ? '#' : entityLink(editEntry.entityType, editEntry.entityId)
  const displayName = isConsolidated
    ? editEntry.entityName!
    : (editEntry.entityName ?? `#${editEntry.entityId}`)
  const entityTypeLabel = isConsolidated
    ? ''
    : editEntry.entityType.charAt(0).toUpperCase() + editEntry.entityType.slice(1).toLowerCase()
  const eColor = entityColor(editEntry.entityType)
  // ... rest of render uses editEntry instead of entry
```

Replace `entry` with `editEntry` throughout the render block for this branch, and replace the `Anchor` around the displayName with a conditional:

```tsx
{isConsolidated ? (
  <Text
    size="sm"
    fw={500}
    style={{
      color: eColor,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }}
  >
    {displayName}
  </Text>
) : (
  <Anchor
    component={Link}
    href={link}
    size="sm"
    fw={500}
    style={{
      color: eColor,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }}
  >
    {displayName}
  </Anchor>
)}
```

And in the sub-row (entity type label + timestamp), hide the entity type label when consolidated:

```tsx
<Group gap={4}>
  {!isConsolidated && (
    <Text size="xs" style={{ color: eColor, fontWeight: 600 }}>{entityTypeLabel}</Text>
  )}
  {!isConsolidated && (
    <Text size="xs" c="dimmed" style={{ opacity: 0.5 }}>·</Text>
  )}
  <Clock size={11} style={{ color: textColors.tertiary, opacity: 0.5 }} />
  <Text size="xs" c="dimmed" style={{ opacity: 0.5 }}>{relativeTime(editEntry.createdAt)}</Text>
</Group>
```

- [ ] **Step 4: Verify TypeScript compiles**

Run from `client/`:
```bash
yarn build
```

Expected: exit 0, no type errors.

- [ ] **Step 5: Commit**

```bash
git add client/src/app/changelog/ChangelogPageContent.tsx
git commit -m "feat: consolidate consecutive event-create entries in changelog feed"
```
