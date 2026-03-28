# Wiki Edit Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Track create/update/delete edits to characters, arcs, gambles, organizations, events, and chapters in the edit log, then surface those edits in the global changelog and user activity timelines.

**Architecture:** Service-level logging following the existing guides/media/annotations pattern — each service's mutating methods receive a `userId` and call `EditLogService`. A new public endpoint `GET /edit-log/user/:id` exposes per-user wiki edits for the activity timeline. The frontend `PublicActivityTimeline` component fetches and merges wiki edits alongside submissions, and is added to the own-profile page.

**Tech Stack:** NestJS (TypeORM, Passport/JWT), Next.js 15 (App Router), TypeScript, Mantine UI

---

## File Map

**Modified — Server**
- `server/src/entities/edit-log.entity.ts` — add `CHAPTER` to enum
- `server/src/modules/edit-log/edit-log.module.ts` — add `Chapter` entity
- `server/src/modules/edit-log/edit-log.service.ts` — add Chapter name resolution + `getWikiEditsByUser` method
- `server/src/modules/edit-log/edit-log.controller.ts` — add `GET /edit-log/user/:id`
- `server/src/modules/characters/characters.service.ts` — accept `userId`, call edit log
- `server/src/modules/characters/characters.controller.ts` — inject `@CurrentUser()`
- `server/src/modules/characters/characters.module.ts` — import `EditLogModule`
- `server/src/modules/arcs/arcs.service.ts` — accept `userId`, call edit log
- `server/src/modules/arcs/arcs.controller.ts` — inject `@CurrentUser()`
- `server/src/modules/arcs/arcs.module.ts` — import `EditLogModule`
- `server/src/modules/gambles/gambles.service.ts` — accept `userId`, call edit log
- `server/src/modules/gambles/gambles.controller.ts` — inject `@CurrentUser()`
- `server/src/modules/gambles/gambles.module.ts` — import `EditLogModule`
- `server/src/modules/organizations/organizations.service.ts` — accept `userId`, call edit log
- `server/src/modules/organizations/organizations.controller.ts` — inject `@CurrentUser()`
- `server/src/modules/organizations/organizations.module.ts` — import `EditLogModule`
- `server/src/modules/events/events.service.ts` — accept `userId` on `update`/`remove`, call edit log
- `server/src/modules/events/events.controller.ts` — inject `@CurrentUser()` on mod-only routes
- `server/src/modules/events/events.module.ts` — import `EditLogModule`
- `server/src/modules/chapters/chapters.service.ts` — accept `userId`, call edit log
- `server/src/modules/chapters/chapters.controller.ts` — inject `@CurrentUser()`
- `server/src/modules/chapters/chapters.module.ts` — import `EditLogModule`

**Modified — Client**
- `client/src/lib/api.ts` — add `getWikiEditsByUser`
- `client/src/app/changelog/ChangelogPageContent.tsx` — add `chapter` to filters
- `client/src/components/PublicActivityTimeline.tsx` — fetch + render wiki edits
- `client/src/app/profile/ProfilePageClient.tsx` — render `PublicActivityTimeline`

---

### Task 1: Add CHAPTER to EditLog enum and update name resolution

**Files:**
- Modify: `server/src/entities/edit-log.entity.ts`
- Modify: `server/src/modules/edit-log/edit-log.module.ts`
- Modify: `server/src/modules/edit-log/edit-log.service.ts`

- [ ] **Step 1: Add CHAPTER to the EditLogEntityType enum**

In `server/src/entities/edit-log.entity.ts`, add `CHAPTER = 'chapter'` to the enum:

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
  CHAPTER = 'chapter',   // ← add this line
}
```

- [ ] **Step 2: Register Chapter entity in EditLogModule**

In `server/src/modules/edit-log/edit-log.module.ts`:

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
import { EditLogService } from './edit-log.service';
import { EditLogController } from './edit-log.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EditLog, Guide, Media, Annotation,
      Character, Gamble, Arc, Organization, Event, Chapter,
    ]),
  ],
  controllers: [EditLogController],
  providers: [EditLogService],
  exports: [EditLogService],
})
export class EditLogModule {}
```

- [ ] **Step 3: Inject Chapter repository and add name resolution in EditLogService**

In `server/src/modules/edit-log/edit-log.service.ts`:

Add the import at the top:
```typescript
import { Chapter } from '../../entities/chapter.entity';
```

Add the repository injection in the constructor (after `private eventRepository`):
```typescript
@InjectRepository(Chapter)
private chapterRepository: Repository<Chapter>,
```

In `resolveEntityNames`, add a CHAPTER branch inside the `Promise.all([...])` array (after the EVENT block):
```typescript
groups.has(EditLogEntityType.CHAPTER)
  ? (async () => {
      const ids = groups.get(EditLogEntityType.CHAPTER)!;
      const rows = await this.chapterRepository.find({
        where: { id: In(ids) } as any,
        select: ['id', 'number', 'title'] as any,
      });
      for (const row of rows) {
        const label = row.number != null
          ? `Ch. ${row.number}${row.title ? ` — ${row.title}` : ''}`
          : (row.title ?? `Chapter ${row.id}`);
        nameMap.set(`${EditLogEntityType.CHAPTER}:${row.id}`, label);
      }
    })()
  : Promise.resolve(),
```

In `resolveEntityNamesByType`, add a `'chapter'` case to the switch:
```typescript
case 'chapter':
  await (async () => {
    const rows = await this.chapterRepository.find({
      where: { id: In(ids) } as any,
      select: ['id', 'number', 'title'] as any,
    });
    for (const row of rows) {
      const label = row.number != null
        ? `Ch. ${row.number}${row.title ? ` — ${row.title}` : ''}`
        : (row.title ?? `Chapter ${row.id}`);
      nameMap.set(row.id, label);
    }
  })();
  break;
```

Also update `getEditCountByUserGrouped` to include `CHAPTER` in the default counts object:
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
};
```

- [ ] **Step 4: Verify the server builds**

```bash
cd server && yarn build
```
Expected: build completes with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add server/src/entities/edit-log.entity.ts \
        server/src/modules/edit-log/edit-log.module.ts \
        server/src/modules/edit-log/edit-log.service.ts
git commit -m "feat(edit-log): add CHAPTER entity type and name resolution"
```

---

### Task 2: Wire edit logging into Characters

**Files:**
- Modify: `server/src/modules/characters/characters.service.ts`
- Modify: `server/src/modules/characters/characters.controller.ts`
- Modify: `server/src/modules/characters/characters.module.ts`

- [ ] **Step 1: Inject EditLogService into CharactersService**

In `server/src/modules/characters/characters.service.ts`, add the import:
```typescript
import { EditLogService } from '../edit-log/edit-log.service';
import { EditLogEntityType, EditLogAction } from '../../entities/edit-log.entity';
```

Add to the constructor (after `private readonly mediaService`):
```typescript
private readonly editLogService: EditLogService,
```

- [ ] **Step 2: Update CharactersService mutating methods to accept userId and log**

Replace the existing `create` method:
```typescript
async create(createCharacterDto: CreateCharacterDto, userId: number): Promise<Character> {
  const { organizationIds: _ignored, ...characterData } = createCharacterDto;
  const character = this.repo.create(characterData);
  const saved = await this.repo.save(character);
  await this.editLogService.logCreate(EditLogEntityType.CHARACTER, saved.id, userId);
  return saved;
}
```

Replace the existing `update` method:
```typescript
async update(
  id: number,
  updateCharacterDto: UpdateCharacterDto,
  userId: number,
): Promise<Character> {
  const character = await this.repo.findOne({ where: { id } });
  if (!character) {
    throw new NotFoundException(`Character with id ${id} not found`);
  }
  const { organizationIds: _ignored, ...characterData } = updateCharacterDto;
  Object.assign(character, characterData);
  const saved = await this.repo.save(character);
  const changedFields = Object.keys(characterData).filter(k => characterData[k as keyof typeof characterData] !== undefined);
  await this.editLogService.logUpdate(EditLogEntityType.CHARACTER, id, userId, changedFields);
  return saved;
}
```

Replace the existing `remove` method:
```typescript
async remove(id: number, userId: number): Promise<{ affected: number }> {
  await this.editLogService.logDelete(EditLogEntityType.CHARACTER, id, userId);
  const result = await this.repo.delete(id);
  if (!result.affected || result.affected === 0) {
    throw new NotFoundException(`Character with id ${id} not found`);
  }
  return { affected: result.affected };
}
```

- [ ] **Step 3: Update CharactersController to pass current user**

In `server/src/modules/characters/characters.controller.ts`, the `CurrentUser` decorator is already imported. Update the three mutating handlers:

```typescript
// Replace the create handler (line ~241):
@Roles(UserRole.MODERATOR, UserRole.ADMIN, UserRole.EDITOR)
create(@Body() data: CreateCharacterDto, @CurrentUser() user: User) {
  return this.service.create(data, user.id);
}

// Replace the update handler (line ~290):
@Roles(UserRole.MODERATOR, UserRole.ADMIN, UserRole.EDITOR)
async update(@Param('id') id: number, @Body() data: UpdateCharacterDto, @CurrentUser() user: User) {
  const result = await this.service.update(id, data, user.id);
  if (!result) {
    throw new NotFoundException(`Character with id ${id} not found`);
  }
  return { message: 'Updated successfully' };
}

// Replace the remove handler (line ~323):
@Roles(UserRole.MODERATOR, UserRole.ADMIN, UserRole.EDITOR)
async remove(@Param('id') id: number, @CurrentUser() user: User) {
  const result = await this.service.remove(id, user.id);
  if (result.affected === 0) {
    throw new NotFoundException(`Character with id ${id} not found`);
  }
  return { message: 'Deleted successfully' };
}
```

- [ ] **Step 4: Import EditLogModule into CharactersModule**

In `server/src/modules/characters/characters.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CharactersService } from './characters.service';
import { CharactersController } from './characters.controller';
import { Character } from '../../entities/character.entity';
import { Gamble } from '../../entities/gamble.entity';
import { Organization } from '../../entities/organization.entity';
import { ServicesModule } from '../../services/services.module';
import { PageViewsModule } from '../page-views/page-views.module';
import { MediaModule } from '../media/media.module';
import { EditLogModule } from '../edit-log/edit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Character, Gamble, Organization]),
    ServicesModule,
    PageViewsModule,
    MediaModule,
    EditLogModule,
  ],
  providers: [CharactersService],
  controllers: [CharactersController],
})
export class CharactersModule {}
```

- [ ] **Step 5: Build to verify**

```bash
cd server && yarn build
```
Expected: no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/characters/
git commit -m "feat(characters): log create/update/delete to edit log"
```

---

### Task 3: Wire edit logging into Arcs

**Files:**
- Modify: `server/src/modules/arcs/arcs.service.ts`
- Modify: `server/src/modules/arcs/arcs.controller.ts`
- Modify: `server/src/modules/arcs/arcs.module.ts`

- [ ] **Step 1: Inject EditLogService into ArcsService**

In `server/src/modules/arcs/arcs.service.ts`, add imports:
```typescript
import { EditLogService } from '../edit-log/edit-log.service';
import { EditLogEntityType } from '../../entities/edit-log.entity';
```

Add to constructor (after `private readonly mediaService`):
```typescript
private readonly editLogService: EditLogService,
```

- [ ] **Step 2: Update ArcsService mutating methods**

Replace `create`:
```typescript
async create(data: CreateArcDto, userId: number) {
  const arc = this.repo.create({
    name: data.name,
    order: data.order,
    description: data.description,
    startChapter: data.startChapter,
    endChapter: data.endChapter,
    parentId: data.parentId,
  });
  const saved = await this.repo.save(arc);
  await this.editLogService.logCreate(EditLogEntityType.ARC, saved.id, userId);
  return saved;
}
```

Replace `update`:
```typescript
async update(id: number, data: Partial<Arc>, userId: number) {
  const result = await this.repo.update(id, data);
  if (result.affected && result.affected > 0) {
    const changedFields = Object.keys(data).filter(k => data[k as keyof typeof data] !== undefined);
    await this.editLogService.logUpdate(EditLogEntityType.ARC, id, userId, changedFields);
  }
  return result;
}
```

Replace `remove`:
```typescript
async remove(id: number, userId: number) {
  await this.editLogService.logDelete(EditLogEntityType.ARC, id, userId);
  return this.repo.delete(id);
}
```

- [ ] **Step 3: Update ArcsController to pass current user**

In `server/src/modules/arcs/arcs.controller.ts`, add the missing import at the top (after the existing imports):
```typescript
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';
```

Update the three mutating handlers:
```typescript
// create handler (around line 282):
@Roles(UserRole.MODERATOR, UserRole.ADMIN, UserRole.EDITOR)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
create(@Body() createArcDto: CreateArcDto, @CurrentUser() user: User) {
  return this.service.create(createArcDto, user.id);
}

// update handler (around line 327):
@Roles(UserRole.MODERATOR, UserRole.ADMIN, UserRole.EDITOR)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
async update(@Param('id') id: number, @Body() data: UpdateArcDto, @CurrentUser() user: User) {
  const result = await this.service.update(id, data, user.id);
  if (result.affected === 0) {
    throw new NotFoundException(`Arc with id ${id} not found`);
  }
  return { message: 'Updated successfully' };
}

// remove handler: find the existing remove and add @CurrentUser() user: User and pass user.id
async remove(@Param('id') id: number, @CurrentUser() user: User) {
  const result = await this.service.remove(id, user.id);
  if ((result as any).affected === 0) {
    throw new NotFoundException(`Arc with id ${id} not found`);
  }
  return { message: 'Deleted successfully' };
}
```

- [ ] **Step 4: Import EditLogModule into ArcsModule**

In `server/src/modules/arcs/arcs.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArcsService } from './arcs.service';
import { ArcsController } from './arcs.controller';
import { Arc } from '../../entities/arc.entity';
import { Chapter } from '../../entities/chapter.entity';
import { Gamble } from '../../entities/gamble.entity';
import { ServicesModule } from '../../services/services.module';
import { MediaModule } from '../media/media.module';
import { EditLogModule } from '../edit-log/edit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Arc, Chapter, Gamble]),
    ServicesModule,
    MediaModule,
    EditLogModule,
  ],
  providers: [ArcsService],
  controllers: [ArcsController],
})
export class ArcsModule {}
```

- [ ] **Step 5: Build to verify**

```bash
cd server && yarn build
```
Expected: no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/arcs/
git commit -m "feat(arcs): log create/update/delete to edit log"
```

---

### Task 4: Wire edit logging into Gambles

**Files:**
- Modify: `server/src/modules/gambles/gambles.service.ts`
- Modify: `server/src/modules/gambles/gambles.controller.ts`
- Modify: `server/src/modules/gambles/gambles.module.ts`

- [ ] **Step 1: Inject EditLogService into GamblesService**

In `server/src/modules/gambles/gambles.service.ts`, add imports:
```typescript
import { EditLogService } from '../edit-log/edit-log.service';
import { EditLogEntityType } from '../../entities/edit-log.entity';
```

Add to constructor (after `private readonly mediaService`):
```typescript
private readonly editLogService: EditLogService,
```

- [ ] **Step 2: Update GamblesService mutating methods**

The `create` method returns the saved gamble via `this.findOne(savedGamble.id)` on the last line (line ~55). Update its signature and add logging after the save:

```typescript
async create(createGambleDto: CreateGambleDto, userId: number): Promise<Gamble> {
  // ... existing body unchanged up to the final return ...
  const result = await this.findOne(savedGamble.id);
  await this.editLogService.logCreate(EditLogEntityType.GAMBLE, savedGamble.id, userId);
  return result;
}
```

The `update` method returns `this.findOne(id)` at the end. Update signature:
```typescript
async update(id: number, updateGambleDto: UpdateGambleDto, userId: number): Promise<Gamble> {
  // ... existing body unchanged ...
  const result = await this.findOne(id);
  const changedFields = Object.keys(updateGambleDto).filter(
    k => updateGambleDto[k as keyof UpdateGambleDto] !== undefined
  );
  await this.editLogService.logUpdate(EditLogEntityType.GAMBLE, id, userId, changedFields);
  return result;
}
```

The `remove` method:
```typescript
async remove(id: number, userId: number): Promise<DeleteResult> {
  await this.findOne(id); // Validates existence
  await this.editLogService.logDelete(EditLogEntityType.GAMBLE, id, userId);
  return await this.gamblesRepository.delete(id);
}
```

- [ ] **Step 3: Update GamblesController to pass current user**

In `server/src/modules/gambles/gambles.controller.ts`, add imports:
```typescript
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';
```

Update the three handlers (the `@Post()` create handler, the `@Put(':id')` update handler, and the `@Delete(':id')` remove handler):

```typescript
// @Post() create handler:
@Roles(UserRole.MODERATOR, UserRole.ADMIN, UserRole.EDITOR)
async create(
  @Body(ValidationPipe) createGambleDto: CreateGambleDto,
  @CurrentUser() user: User,
): Promise<Gamble> {
  return this.gamblesService.create(createGambleDto, user.id);
}

// @Put(':id') update handler:
@Roles(UserRole.MODERATOR, UserRole.ADMIN, UserRole.EDITOR)
async update(
  @Param('id', ParseIntPipe) id: number,
  @Body(ValidationPipe) data: UpdateGambleDto,
  @CurrentUser() user: User,
): Promise<Gamble> {
  const result = await this.gamblesService.update(id, data, user.id);
  if (!result) {
    throw new NotFoundException(`Gamble with id ${id} not found`);
  }
  return result;
}

// @Delete(':id') remove handler:
@Roles(UserRole.MODERATOR, UserRole.ADMIN, UserRole.EDITOR)
async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
  const result = await this.gamblesService.remove(id, user.id);
  if (!result || result.affected === 0) {
    throw new NotFoundException(`Gamble with id ${id} not found`);
  }
  return { message: 'Deleted successfully' };
}
```

- [ ] **Step 4: Import EditLogModule into GamblesModule**

In `server/src/modules/gambles/gambles.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamblesController } from './gambles.controller';
import { GamblesService } from './gambles.service';
import { Gamble } from '../../entities/gamble.entity';
import { Character } from '../../entities/character.entity';
import { Chapter } from '../../entities/chapter.entity';
import { GambleFaction } from '../../entities/gamble-faction.entity';
import { GambleFactionMember } from '../../entities/gamble-faction-member.entity';
import { MediaModule } from '../media/media.module';
import { EditLogModule } from '../edit-log/edit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Gamble, Character, Chapter, GambleFaction, GambleFactionMember]),
    MediaModule,
    EditLogModule,
  ],
  controllers: [GamblesController],
  providers: [GamblesService],
  exports: [GamblesService],
})
export class GamblesModule {}
```

- [ ] **Step 5: Build to verify**

```bash
cd server && yarn build
```
Expected: no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/gambles/
git commit -m "feat(gambles): log create/update/delete to edit log"
```

---

### Task 5: Wire edit logging into Organizations

**Files:**
- Modify: `server/src/modules/organizations/organizations.service.ts`
- Modify: `server/src/modules/organizations/organizations.controller.ts`
- Modify: `server/src/modules/organizations/organizations.module.ts`

- [ ] **Step 1: Inject EditLogService into OrganizationsService**

In `server/src/modules/organizations/organizations.service.ts`, add imports:
```typescript
import { EditLogService } from '../edit-log/edit-log.service';
import { EditLogEntityType } from '../../entities/edit-log.entity';
```

Add to constructor (after `private readonly mediaService`):
```typescript
private readonly editLogService: EditLogService,
```

- [ ] **Step 2: Update OrganizationsService mutating methods**

Replace `create`:
```typescript
async create(data: Partial<Organization>, userId: number): Promise<Organization> {
  const organization = this.repo.create(data);
  const saved = await this.repo.save(organization);
  await this.editLogService.logCreate(EditLogEntityType.ORGANIZATION, saved.id, userId);
  return saved;
}
```

Replace `update`:
```typescript
async update(id: number, data: Partial<Organization>, userId: number) {
  const result = await this.repo.update(id, data);
  if (result.affected === 0)
    throw new NotFoundException(`Organization with ID ${id} not found`);
  const changedFields = Object.keys(data).filter(k => data[k as keyof typeof data] !== undefined);
  await this.editLogService.logUpdate(EditLogEntityType.ORGANIZATION, id, userId, changedFields);
  return this.findOne(id);
}
```

Replace `remove`:
```typescript
async remove(id: number, userId: number) {
  await this.editLogService.logDelete(EditLogEntityType.ORGANIZATION, id, userId);
  const result = await this.repo.delete(id);
  if (result.affected === 0)
    throw new NotFoundException(`Organization with ID ${id} not found`);
  return { deleted: true };
}
```

- [ ] **Step 3: Update OrganizationsController to pass current user**

In `server/src/modules/organizations/organizations.controller.ts`, add imports:
```typescript
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';
```

Update the three handlers:
```typescript
// create handler:
create(@Body() data: CreateOrganizationDto, @CurrentUser() user: User): Promise<Organization> {
  return this.service.create(data, user.id);
}

// update handler:
update(@Param('id') id: number, @Body() data: UpdateOrganizationDto, @CurrentUser() user: User) {
  return this.service.update(id, data, user.id);
}

// remove handler:
remove(@Param('id') id: number, @CurrentUser() user: User) {
  return this.service.remove(id, user.id);
}
```

- [ ] **Step 4: Import EditLogModule into OrganizationsModule**

In `server/src/modules/organizations/organizations.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { Organization } from '../../entities/organization.entity';
import { MediaModule } from '../media/media.module';
import { EditLogModule } from '../edit-log/edit-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([Organization]), MediaModule, EditLogModule],
  providers: [OrganizationsService],
  controllers: [OrganizationsController],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
```

- [ ] **Step 5: Build to verify**

```bash
cd server && yarn build
```
Expected: no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/organizations/
git commit -m "feat(organizations): log create/update/delete to edit log"
```

---

### Task 6: Wire edit logging into Events

> Note: Only the moderator-level `PUT /:id` and admin-level `DELETE /:id` are logged as wiki edits. `POST /` (user submissions) and `PUT /:id/own` (user's own resubmissions) are NOT logged here — they go through the submission workflow.

**Files:**
- Modify: `server/src/modules/events/events.service.ts`
- Modify: `server/src/modules/events/events.controller.ts`
- Modify: `server/src/modules/events/events.module.ts`

- [ ] **Step 1: Inject EditLogService into EventsService**

In `server/src/modules/events/events.service.ts`, add imports:
```typescript
import { EditLogService } from '../edit-log/edit-log.service';
import { EditLogEntityType } from '../../entities/edit-log.entity';
```

Add to constructor (after `private characterRepo`):
```typescript
private readonly editLogService: EditLogService,
```

- [ ] **Step 2: Update EventsService `update` and `remove` to accept userId and log**

Update the `update` method signature (the mod-level update, not `updateOwnSubmission`). Find the existing `async update(id: number, data: UpdateEventDto)` and add `userId`:

```typescript
async update(id: number, data: UpdateEventDto, userId: number): Promise<Event> {
  // ... entire existing body unchanged ...
  const result = await this.findOne(id);
  if (!result) {
    throw new NotFoundException(`Event with ID ${id} not found after update`);
  }
  const { characterIds, ...updateData } = data;
  const changedFields = Object.keys(updateData).filter(
    k => updateData[k as keyof typeof updateData] !== undefined
  );
  if (characterIds !== undefined) changedFields.push('characters');
  await this.editLogService.logUpdate(EditLogEntityType.EVENT, id, userId, changedFields);
  return result;
}
```

Update the `remove` method:
```typescript
remove(id: number, userId: number) {
  this.editLogService.logDelete(EditLogEntityType.EVENT, id, userId).catch(() => {});
  return this.repo.delete(id);
}
```

- [ ] **Step 3: Update EventsController to pass current user on mod routes**

In `server/src/modules/events/events.controller.ts`, `CurrentUser` is already imported. Update only the `@Put(':id')` and `@Delete(':id')` handlers:

```typescript
// @Put(':id') mod-level update:
@Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.EDITOR)
async update(
  @Param('id', ParseIntPipe) id: number,
  @Body(ValidationPipe) updateEventDto: UpdateEventDto,
  @CurrentUser() user: User,
) {
  return await this.service.update(id, updateEventDto, user.id);
}

// @Delete(':id') admin delete:
@Roles(UserRole.ADMIN)
async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
  return await this.service.remove(id, user.id);
}
```

- [ ] **Step 4: Import EditLogModule into EventsModule**

In `server/src/modules/events/events.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event } from '../../entities/event.entity';
import { Character } from '../../entities/character.entity';
import { EditLogModule } from '../edit-log/edit-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([Event, Character]), EditLogModule],
  providers: [EventsService],
  controllers: [EventsController],
})
export class EventsModule {}
```

- [ ] **Step 5: Build to verify**

```bash
cd server && yarn build
```
Expected: no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/events/
git commit -m "feat(events): log mod-level update/delete to edit log"
```

---

### Task 7: Wire edit logging into Chapters

**Files:**
- Modify: `server/src/modules/chapters/chapters.service.ts`
- Modify: `server/src/modules/chapters/chapters.controller.ts`
- Modify: `server/src/modules/chapters/chapters.module.ts`

- [ ] **Step 1: Inject EditLogService into ChaptersService**

In `server/src/modules/chapters/chapters.service.ts`, add imports:
```typescript
import { EditLogService } from '../edit-log/edit-log.service';
import { EditLogEntityType } from '../../entities/edit-log.entity';
```

Add to constructor (after `private repo`):
```typescript
private readonly editLogService: EditLogService,
```

- [ ] **Step 2: Update ChaptersService mutating methods**

Replace `create`:
```typescript
async create(data: Partial<Chapter>, userId: number): Promise<Chapter> {
  const chapter = this.repo.create(data);
  const saved = await this.repo.save(chapter);
  await this.editLogService.logCreate(EditLogEntityType.CHAPTER, saved.id, userId);
  return saved;
}
```

Replace `update`:
```typescript
async update(id: number, data: Partial<Chapter>, userId: number) {
  const result = await this.repo.update(id, data);
  if (result.affected && result.affected > 0) {
    const changedFields = Object.keys(data).filter(k => data[k as keyof typeof data] !== undefined);
    await this.editLogService.logUpdate(EditLogEntityType.CHAPTER, id, userId, changedFields);
  }
  return result;
}
```

Replace `remove`:
```typescript
async remove(id: number, userId: number) {
  await this.editLogService.logDelete(EditLogEntityType.CHAPTER, id, userId);
  return this.repo.delete(id);
}
```

- [ ] **Step 3: Update ChaptersController to pass current user**

In `server/src/modules/chapters/chapters.controller.ts`, add imports:
```typescript
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';
```

Update the three handlers:
```typescript
// create handler:
@Roles(UserRole.MODERATOR, UserRole.ADMIN, UserRole.EDITOR)
create(@Body() createChapterDto: CreateChapterDto, @CurrentUser() user: User) {
  return this.service.create(createChapterDto, user.id);
}

// update handler:
@Roles(UserRole.MODERATOR, UserRole.ADMIN, UserRole.EDITOR)
async update(
  @Param('id') id: number,
  @Body() data: UpdateChapterDto,
  @CurrentUser() user: User,
): Promise<Chapter> {
  const result = await this.service.update(id, data, user.id);
  if (result.affected === 0) {
    throw new NotFoundException(`Chapter with id ${id} not found`);
  }
  const updatedChapter = await this.service.findOne(id);
  if (!updatedChapter) {
    throw new NotFoundException(`Chapter with id ${id} not found after update`);
  }
  return updatedChapter;
}

// remove handler:
@Roles(UserRole.MODERATOR, UserRole.ADMIN, UserRole.EDITOR)
async remove(@Param('id') id: number, @CurrentUser() user: User): Promise<{ id: number }> {
  const result = await this.service.remove(id, user.id);
  if (result.affected === 0) {
    throw new NotFoundException(`Chapter with id ${id} not found`);
  }
  return { id };
}
```

- [ ] **Step 4: Import EditLogModule into ChaptersModule**

In `server/src/modules/chapters/chapters.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChaptersService } from './chapters.service';
import { ChaptersController } from './chapters.controller';
import { Chapter } from '../../entities/chapter.entity';
import { EditLogModule } from '../edit-log/edit-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([Chapter]), EditLogModule],
  providers: [ChaptersService],
  controllers: [ChaptersController],
})
export class ChaptersModule {}
```

- [ ] **Step 5: Build to verify**

```bash
cd server && yarn build
```
Expected: no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/chapters/
git commit -m "feat(chapters): log create/update/delete to edit log"
```

---

### Task 8: Add public user wiki edits endpoint

**Files:**
- Modify: `server/src/modules/edit-log/edit-log.service.ts`
- Modify: `server/src/modules/edit-log/edit-log.controller.ts`

- [ ] **Step 1: Add `getWikiEditsByUser` to EditLogService**

In `server/src/modules/edit-log/edit-log.service.ts`, add this method after `getRecentApprovedSubmissions`:

```typescript
async getWikiEditsByUser(
  userId: number,
  options: { page?: number; limit?: number },
): Promise<{
  data: Array<EditLog & { entityName?: string }>;
  total: number;
  page: number;
  totalPages: number;
}> {
  const { page = 1, limit = 20 } = options;
  const wikiTypes = [
    EditLogEntityType.CHARACTER,
    EditLogEntityType.ARC,
    EditLogEntityType.GAMBLE,
    EditLogEntityType.ORGANIZATION,
    EditLogEntityType.EVENT,
    EditLogEntityType.CHAPTER,
  ];

  const [data, total] = await this.editLogRepository.findAndCount({
    where: { userId, entityType: In(wikiTypes) },
    relations: ['user'],
    order: { createdAt: 'DESC' },
    skip: (page - 1) * limit,
    take: limit,
  });

  const nameMap = await this.resolveEntityNames(data);
  const enriched = data.map((e) => ({
    ...e,
    entityName: nameMap.get(`${e.entityType}:${e.entityId}`),
  }));

  return { data: enriched, total, page, totalPages: Math.ceil(total / limit) };
}
```

- [ ] **Step 2: Add `GET /edit-log/user/:id` to EditLogController**

In `server/src/modules/edit-log/edit-log.controller.ts`, add after the `getRecentSubmissions` handler:

```typescript
@Get('user/:id')
@ApiOperation({ summary: 'Get wiki edits by a specific user (public)' })
@ApiParam({ name: 'id', type: Number })
@ApiQuery({ name: 'page', required: false, type: Number })
@ApiQuery({ name: 'limit', required: false, type: Number })
@ApiResponse({ status: 200, description: 'Paginated wiki edits for the user' })
async getWikiEditsByUser(
  @Param('id', ParseIntPipe) userId: number,
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
) {
  const safeLimit = Math.min(limit, 50);
  return this.editLogService.getWikiEditsByUser(userId, { page, limit: safeLimit });
}
```

Also add `ParseIntPipe` to the imports at the top of the controller if not already present:
```typescript
import {
  Controller, Get, Query, Param,
  ParseIntPipe, DefaultValuePipe, UseGuards,
} from '@nestjs/common';
```

And add `ApiParam` to the Swagger imports:
```typescript
import {
  ApiTags, ApiOperation, ApiQuery, ApiParam, ApiResponse, ApiBearerAuth,
} from '@nestjs/swagger';
```

- [ ] **Step 3: Build to verify**

```bash
cd server && yarn build
```
Expected: no TypeScript errors.

- [ ] **Step 4: Manual smoke test**

With the server running (`yarn start:dev`), hit the new endpoint for any user that has made edits:
```bash
curl http://localhost:3001/api/edit-log/user/1
```
Expected: JSON with `{ data: [...], total, page, totalPages }`. If no edits yet, `{ data: [], total: 0, page: 1, totalPages: 0 }`.

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/edit-log/
git commit -m "feat(edit-log): add getWikiEditsByUser service method and public endpoint"
```

---

### Task 9: Update API client and changelog filter

**Files:**
- Modify: `client/src/lib/api.ts`
- Modify: `client/src/app/changelog/ChangelogPageContent.tsx`

- [ ] **Step 1: Add `getWikiEditsByUser` to api.ts**

In `client/src/lib/api.ts`, add this method after `getRecentSubmissions` (after line 1140):

```typescript
async getWikiEditsByUser(userId: number, params?: { page?: number; limit?: number }) {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  const qs = query.toString()
  return this.get<{
    data: Array<{
      id: number
      action: string
      entityType: string
      entityId: number
      entityName?: string
      createdAt: string
      user?: { id: number; username: string; fluxerAvatar?: string; fluxerId?: string }
    }>
    total: number
    page: number
    totalPages: number
  }>(`/edit-log/user/${userId}${qs ? `?${qs}` : ''}`)
}
```

- [ ] **Step 2: Add `chapter` to ChangelogPageContent filters**

In `client/src/app/changelog/ChangelogPageContent.tsx`:

Update the `EntityFilter` type (line 25):
```typescript
type EntityFilter = 'all' | 'character' | 'gamble' | 'arc' | 'organization' | 'event' | 'guide' | 'media' | 'annotation' | 'chapter'
```

Update `ALL_ENTITY_OPTIONS` to add chapter:
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
]
```

Update `entityLink` to add chapter mapping:
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
  }
  return `${map[entityType.toLowerCase()] ?? '#'}/${entityId}`
}
```

Update `entityColor` to add chapter:
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
  }
  return map[entityType.toLowerCase()] ?? textColors.secondary
}
```

- [ ] **Step 3: Build the client to verify**

```bash
cd client && yarn build
```
Expected: build completes with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/lib/api.ts client/src/app/changelog/ChangelogPageContent.tsx
git commit -m "feat(client): add getWikiEditsByUser API method and chapter filter to changelog"
```

---

### Task 10: Update PublicActivityTimeline to show wiki edits

**Files:**
- Modify: `client/src/components/PublicActivityTimeline.tsx`

- [ ] **Step 1: Rewrite PublicActivityTimeline to merge wiki edits**

Replace the entire contents of `client/src/components/PublicActivityTimeline.tsx`:

```typescript
'use client'

import { useEffect, useMemo, useState } from 'react'
import { Anchor, Box, Text, Group, Button, Badge } from '@mantine/core'
import Link from 'next/link'
import { api } from '../lib/api'
import { textColors } from '../lib/mantine-theme'

// ── Submission types (community contributions) ────────────────────────────────
type SubmissionEventType = 'guide' | 'media' | 'annotation' | 'event'

const SUBMISSION_BORDER: Record<SubmissionEventType, string> = {
  guide:      '#3a7a4a',
  media:      '#3a4a6a',
  annotation: '#5a4a7a',
  event:      '#7a6020',
}
const SUBMISSION_BG: Record<SubmissionEventType, string> = {
  guide:      'rgba(34,197,94,0.04)',
  media:      'rgba(59,130,246,0.04)',
  annotation: 'rgba(124,58,237,0.04)',
  event:      'rgba(245,158,11,0.04)',
}
const SUBMISSION_COLOR: Record<SubmissionEventType, string> = {
  guide:      'rgba(34,197,94,0.8)',
  media:      'rgba(59,130,246,0.8)',
  annotation: 'rgba(124,58,237,0.8)',
  event:      'rgba(245,158,11,0.8)',
}

// ── Wiki entity types ─────────────────────────────────────────────────────────
type WikiEntityType = 'character' | 'arc' | 'gamble' | 'organization' | 'event' | 'chapter'

const WIKI_COLOR: Record<WikiEntityType, string> = {
  character:    textColors.character,
  arc:          textColors.arc,
  gamble:       textColors.gamble,
  organization: textColors.organization,
  event:        textColors.event,
  chapter:      textColors.chapter,
}

const ENTITY_LINK_MAP: Record<string, string> = {
  character:    '/characters',
  gamble:       '/gambles',
  arc:          '/arcs',
  organization: '/organizations',
  event:        '/events',
  guide:        '/guides',
  media:        '/media',
  chapter:      '/chapters',
}

// ── Unified timeline entry ────────────────────────────────────────────────────
interface TimelineEntry {
  kind: 'submission' | 'wiki'
  type: string          // submission type or entity type
  action?: string       // wiki only: 'create' | 'update' | 'delete'
  title: string
  href: string
  entityType?: string
  entityName?: string
  date: Date
  borderColor: string
  bgColor: string
  textColor: string
}

function submissionHref(type: string, id: number, entityType?: string, entityId?: number): string {
  if (type === 'guide') return `/guides/${id}`
  if (entityType && entityId) {
    return `${ENTITY_LINK_MAP[entityType.toLowerCase()] ?? '#'}/${entityId}`
  }
  return '#'
}

function wikiHref(entityType: string, entityId: number): string {
  return `${ENTITY_LINK_MAP[entityType.toLowerCase()] ?? '#'}/${entityId}`
}

function actionLabel(action: string): string {
  if (action === 'create') return 'created'
  if (action === 'delete') return 'deleted'
  return 'edited'
}

function actionColor(action: string): string {
  if (action === 'create') return 'green'
  if (action === 'delete') return 'red'
  return 'blue'
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return `${Math.floor(days / 7)}w`
}

interface PublicActivityTimelineProps {
  userId: number
  submissions: any[]
}

export default function PublicActivityTimeline({ userId, submissions }: PublicActivityTimelineProps) {
  const [wikiEdits, setWikiEdits] = useState<any[]>([])
  const [visibleCount, setVisibleCount] = useState(8)

  useEffect(() => {
    if (!userId) return
    api.getWikiEditsByUser(userId, { limit: 50 })
      .then((res) => setWikiEdits(res?.data ?? []))
      .catch(() => {}) // non-critical, degrade gracefully
  }, [userId])

  const events = useMemo<TimelineEntry[]>(() => {
    const submissionEntries: TimelineEntry[] = submissions
      .filter((s) => SUBMISSION_BORDER[s.type as SubmissionEventType])
      .map((s) => ({
        kind: 'submission' as const,
        type: s.type as string,
        title: (s.title ?? s.type) as string,
        href: submissionHref(s.type, s.id, s.entityType, s.entityId),
        entityType: s.entityType as string | undefined,
        entityName: s.entityName as string | undefined,
        date: new Date(s.createdAt),
        borderColor: SUBMISSION_BORDER[s.type as SubmissionEventType],
        bgColor: SUBMISSION_BG[s.type as SubmissionEventType],
        textColor: SUBMISSION_COLOR[s.type as SubmissionEventType],
      }))

    const wikiEntityTypes = new Set<string>(['character','arc','gamble','organization','event','chapter'])
    const wikiEntries: TimelineEntry[] = wikiEdits
      .filter((e) => wikiEntityTypes.has(e.entityType?.toLowerCase()))
      .map((e) => {
        const eType = e.entityType.toLowerCase() as WikiEntityType
        const color = WIKI_COLOR[eType] ?? textColors.secondary
        return {
          kind: 'wiki' as const,
          type: eType,
          action: e.action,
          title: e.entityName ?? `${eType} #${e.entityId}`,
          href: wikiHref(eType, e.entityId),
          date: new Date(e.createdAt),
          borderColor: color,
          bgColor: `${color}0a`,
          textColor: color,
        }
      })

    return [...submissionEntries, ...wikiEntries]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [submissions, wikiEdits])

  const visible = events.slice(0, visibleCount)

  return (
    <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '12px' }}>
      <Text style={{ fontSize: '17px', fontWeight: 600, color: '#d4d4d4', marginBottom: 12 }}>Activity</Text>

      {events.length === 0 ? (
        <Text style={{ fontSize: '15px', color: '#666', fontStyle: 'italic' }}>No public activity yet.</Text>
      ) : (
        <Box>
          {visible.map((ev, i) => (
            <Group
              key={`${ev.kind}-${ev.type}-${i}`}
              gap={10}
              align="stretch"
              style={{ marginBottom: i < visible.length - 1 ? '6px' : 0 }}
            >
              <Box style={{ width: '2px', background: ev.borderColor, borderRadius: '1px', flexShrink: 0 }} />
              <Box
                style={{
                  flex: 1, padding: '7px 10px',
                  background: ev.bgColor, borderRadius: '3px',
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'flex-start', gap: '8px',
                }}
              >
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Group gap={6} wrap="nowrap" mb={2}>
                    {ev.kind === 'wiki' && ev.action ? (
                      <Badge
                        size="xs"
                        color={actionColor(ev.action)}
                        variant="light"
                        style={{ flexShrink: 0 }}
                      >
                        {actionLabel(ev.action)}
                      </Badge>
                    ) : (
                      <Badge
                        size="xs"
                        variant="dot"
                        style={{ color: ev.textColor, borderColor: ev.borderColor, background: 'transparent', flexShrink: 0 }}
                      >
                        {ev.type}
                      </Badge>
                    )}
                    <Anchor
                      component={Link}
                      href={ev.href}
                      style={{ fontSize: '13px', color: '#e5e5e5', fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {ev.title}
                    </Anchor>
                  </Group>
                  {ev.kind === 'wiki' && (
                    <Text style={{ fontSize: '11px', color: ev.textColor, marginTop: '1px', opacity: 0.7 }}>
                      {ev.type.charAt(0).toUpperCase() + ev.type.slice(1)}
                    </Text>
                  )}
                  {ev.kind === 'submission' && ev.entityName && ev.entityType && (
                    <Text style={{ fontSize: '11px', color: '#888', marginTop: '1px' }} lineClamp={1}>
                      {ev.entityType.charAt(0).toUpperCase() + ev.entityType.slice(1).toLowerCase()}: {ev.entityName}
                    </Text>
                  )}
                </Box>
                <Text style={{ fontSize: '10px', color: '#555', fontFamily: 'monospace', flexShrink: 0, paddingTop: '1px' }}>
                  {timeAgo(ev.date)}
                </Text>
              </Box>
            </Group>
          ))}

          {events.length > visibleCount && (
            <Button
              variant="subtle" size="xs" fullWidth mt={8}
              onClick={() => setVisibleCount((v) => v + 8)}
              styles={{ root: { color: '#666', fontSize: '12px' } }}
            >
              Show more ({events.length - visibleCount} remaining)
            </Button>
          )}
        </Box>
      )}
    </Box>
  )
}
```

- [ ] **Step 2: Update the caller in UserProfileClient to pass userId**

In `client/src/app/users/[id]/UserProfileClient.tsx`, find the `PublicActivityTimeline` render (line ~374):
```typescript
// Before:
<PublicActivityTimeline submissions={submissions} />

// After:
<PublicActivityTimeline userId={user.id} submissions={submissions} />
```

- [ ] **Step 3: Build to verify**

```bash
cd client && yarn build
```
Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/PublicActivityTimeline.tsx \
        client/src/app/users/[id]/UserProfileClient.tsx
git commit -m "feat(activity-timeline): show wiki edits alongside submissions"
```

---

### Task 11: Add activity timeline to own profile page

**Files:**
- Modify: `client/src/app/profile/ProfilePageClient.tsx`

- [ ] **Step 1: Import PublicActivityTimeline in ProfilePageClient**

In `client/src/app/profile/ProfilePageClient.tsx`, add this import after the existing local imports:
```typescript
import PublicActivityTimeline from '../../components/PublicActivityTimeline'
```

- [ ] **Step 2: Add the timeline to the general tab layout**

In `ProfilePageClient.tsx`, find the general tab `<Tabs.Panel value="general">` section. It currently renders a 2-column grid containing `ProfileIntelPanel` on the left and `ReadingProgressBar + ProfileFieldLog` on the right, followed by a full-width `ProfileContentTabs`.

Add `PublicActivityTimeline` below `ProfileFieldLog` in the right column stack:

```typescript
<Stack gap="md">
  <ReadingProgressBar userProgress={user?.userProgress ?? 0} markerLabel="you" />
  <ProfileFieldLog
    guides={userGuides}
    submissions={submissions}
    user={user!}
    submissionEdits={submissionEdits}
  />
  {user?.id && (
    <PublicActivityTimeline
      userId={user.id}
      submissions={submissions.filter((s: any) =>
        ['guide', 'media', 'annotation', 'event'].includes(s.type) && s.status === 'approved'
      )}
    />
  )}
</Stack>
```

- [ ] **Step 3: Build to verify**

```bash
cd client && yarn build
```
Expected: no TypeScript errors.

- [ ] **Step 4: Manual end-to-end check**

1. Start both server (`cd server && yarn start:dev`) and client (`cd client && yarn dev`)
2. Log in as a moderator/admin account
3. Edit a character via the admin panel
4. Navigate to `/changelog` — the edit should appear in the feed
5. Navigate to `/users/<your-id>` — the edit should appear in the Activity panel
6. Navigate to `/profile` — the edit should appear in the Activity panel
7. Check the changelog entity filter — "Chapters" pill should be present

- [ ] **Step 5: Commit**

```bash
git add client/src/app/profile/ProfilePageClient.tsx
git commit -m "feat(profile): add wiki edit activity timeline to own profile page"
```
