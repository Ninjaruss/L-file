# Events Module Simplification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove approval workflow from the events module, add `pageNumber`, tighten permissions to editor+, and replace three divergent timeline UI components with a unified shared design system.

**Architecture:** Backend changes are self-contained in the events module. Frontend splits into: updating existing event pages to remove approval UI, building four shared components in `client/src/components/timeline/`, and refactoring the three existing timeline components to use them. Tasks are ordered so each group can be committed independently; backend must be done before frontend type changes.

**Tech Stack:** NestJS 11, TypeORM, PostgreSQL; Next.js 15, React 19, TypeScript, Mantine UI, Lucide React

---

## File Map

**Create:**
- `server/src/migrations/{timestamp}-SimplifyEventsRemoveApproval.ts` (generated)
- `server/src/modules/events/dto/filter-events.dto.ts`
- `client/src/components/timeline/types.ts`
- `client/src/components/timeline/TimelineSpoilerWrapper.tsx`
- `client/src/components/timeline/TimelineEventCard.tsx`
- `client/src/components/timeline/TimelineSection.tsx`
- `client/src/components/timeline/index.ts`

**Modify:**
- `server/src/entities/event.entity.ts`
- `server/src/modules/events/dto/create-event.dto.ts`
- `server/src/modules/events/dto/update-event.dto.ts`
- `server/src/modules/events/events.service.ts`
- `server/src/modules/events/events.controller.ts`
- `server/src/modules/events/events.service.spec.ts`
- `server/src/modules/events/events.controller.spec.ts`
- `client/src/types/index.ts`
- `client/src/lib/api.ts`
- `client/src/app/events/EventsPageContent.tsx`
- `client/src/app/events/[id]/EventPageClient.tsx`
- `client/src/app/submit-event/EventFormCard.tsx`
- `client/src/app/submit-event/SubmitEventPageContent.tsx`
- `client/src/app/events/[id]/edit/EditEventPageContent.tsx`
- `client/src/components/admin/Events.tsx`
- `client/src/components/CharacterTimeline.tsx`
- `client/src/components/ArcTimeline.tsx`
- `client/src/components/GambleTimeline.tsx`

---

## Task 1: Update Event Entity

**Files:**
- Modify: `server/src/entities/event.entity.ts`

- [ ] **Step 1: Replace the entity file**

  Replace the full contents of `server/src/entities/event.entity.ts` with:

  ```ts
  import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    ManyToMany,
    JoinTable,
    JoinColumn,
    Index,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { Arc } from './arc.entity';
  import { Character } from './character.entity';
  import { User } from './user.entity';
  import { Tag } from './tag.entity';
  import { Gamble } from './gamble.entity';
  import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

  export enum EventType {
    GAMBLE = 'gamble',
    DECISION = 'decision',
    REVEAL = 'reveal',
    SHIFT = 'shift',
    RESOLUTION = 'resolution',
  }

  @Entity()
  @Index(['arc'])
  @Index(['chapterNumber'])
  @Index(['title'])
  @Index(['type'])
  @Index(['spoilerChapter'])
  @Index(['createdBy'])
  export class Event {
    @ApiProperty({ description: 'Unique identifier of the event' })
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ description: 'Title of the event', example: 'The 17 Steps Tournament' })
    @Column({ length: 200 })
    title: string;

    @ApiProperty({ description: 'Detailed description of the event' })
    @Column({ type: 'text', nullable: false })
    description: string;

    @ApiProperty({ description: 'Type of event', enum: EventType, default: EventType.DECISION })
    @Column({ type: 'enum', enum: EventType, default: EventType.DECISION })
    type: EventType;

    @ApiProperty({ description: 'Chapter number where this event occurs', example: 45 })
    @Column()
    chapterNumber: number;

    @ApiPropertyOptional({ description: 'Page number within the chapter for sub-chapter ordering', example: 14 })
    @Column({ nullable: true })
    pageNumber: number;

    @ApiPropertyOptional({ description: 'Chapter number required before showing this event (spoiler protection)', example: 44 })
    @Column({ nullable: true })
    spoilerChapter: number;

    @ApiPropertyOptional({ description: 'Story arc this event belongs to', type: () => Arc })
    @ManyToOne(() => Arc, { nullable: true })
    @JoinColumn({ name: 'arcId' })
    arc: Arc;

    @ApiPropertyOptional({ description: 'ID of the arc this event belongs to', example: 1 })
    @Column({ nullable: true })
    arcId: number;

    @ApiPropertyOptional({ description: 'Gamble associated with this event', type: () => Gamble })
    @ManyToOne(() => Gamble, { nullable: true })
    @JoinColumn({ name: 'gambleId' })
    gamble: Gamble;

    @ApiPropertyOptional({ description: 'ID of the gamble associated with this event', example: 1 })
    @Column({ nullable: true })
    gambleId: number;

    @ManyToMany(() => Character)
    @JoinTable()
    characters: Character[];

    @ManyToOne(() => User, (user) => user.submittedEvents, { nullable: true })
    createdBy: User;

    @ManyToMany(() => Tag, (tag) => tag.events)
    tags: Tag[];

    @ApiProperty({ description: 'When this event was created' })
    @CreateDateColumn()
    createdAt: Date;

    @ApiProperty({ description: 'When this event was last updated' })
    @UpdateDateColumn()
    updatedAt: Date;
  }
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  cd server && yarn build
  ```

  Expected: compile errors referencing `EventStatus` in `events.service.ts` and `events.controller.ts` — these will be fixed in Tasks 4 and 5. If there are errors in *other* files, fix them now.

- [ ] **Step 3: Commit**

  ```bash
  cd server
  git add src/entities/event.entity.ts
  git commit -m "refactor(events): remove approval fields, add pageNumber to entity"
  ```

---

## Task 2: Generate and Run Database Migration

**Files:**
- Create: `server/src/migrations/{timestamp}-SimplifyEventsRemoveApproval.ts` (generated)

- [ ] **Step 1: Generate the migration**

  ```bash
  cd server && yarn db:generate SimplifyEventsRemoveApproval
  ```

  This compares the entity against the current DB schema and generates a migration file in `src/migrations/`. The timestamp prefix is set automatically.

- [ ] **Step 2: Preview the migration SQL**

  ```bash
  cd server && yarn db:migrate:dry-run
  ```

  Verify the output contains all of the following operations (exact SQL may differ slightly):
  - `ALTER TABLE "event" DROP COLUMN "status"`
  - `ALTER TABLE "event" DROP COLUMN "rejection_reason"`
  - `ALTER TABLE "event" ADD "page_number" integer`
  - Drop of the `event_status_enum` PostgreSQL enum type

  If the dry-run shows anything unexpected (e.g., dropping unrelated columns), do **not** proceed — investigate why the entity diverged from the DB schema before continuing.

- [ ] **Step 3: Run the migration**

  ```bash
  cd server && yarn db:migrate
  ```

  Expected output: `Migration SimplifyEventsRemoveApproval has been executed successfully.`

- [ ] **Step 4: Verify migration status**

  ```bash
  cd server && yarn db:status
  ```

  Expected: the new migration shows as applied.

- [ ] **Step 5: Commit**

  ```bash
  cd server
  git add src/migrations/
  git commit -m "chore(db): migration to remove event approval columns, add page_number"
  ```

---

## Task 3: Update DTOs

**Files:**
- Modify: `server/src/modules/events/dto/create-event.dto.ts`
- Modify: `server/src/modules/events/dto/update-event.dto.ts`
- Create: `server/src/modules/events/dto/filter-events.dto.ts`

- [ ] **Step 1: Replace `create-event.dto.ts`**

  ```ts
  import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
  import {
    IsString,
    IsNumber,
    IsOptional,
    IsArray,
    IsNotEmpty,
    MinLength,
    MaxLength,
    Min,
    ArrayMaxSize,
    IsEnum,
  } from 'class-validator';
  import { EventType } from '../../../entities/event.entity';

  export class CreateEventDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(200)
    @ApiProperty({ description: 'Event title', example: 'The 17 Steps Tournament' })
    title: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(10)
    @MaxLength(5000)
    @ApiProperty({ description: 'Event description' })
    description: string;

    @IsEnum(EventType)
    @IsOptional()
    @ApiPropertyOptional({ description: 'Type of event', enum: EventType, default: EventType.DECISION })
    type?: EventType;

    @IsNumber()
    @IsNotEmpty()
    @Min(1)
    @ApiProperty({ description: 'Chapter number where this event occurs', example: 45 })
    chapterNumber: number;

    @IsNumber()
    @IsOptional()
    @Min(1)
    @ApiPropertyOptional({ description: 'Page number within the chapter', example: 14 })
    pageNumber?: number;

    @IsNumber()
    @IsOptional()
    @Min(1)
    @ApiPropertyOptional({ description: 'Chapter number required before showing this event (spoiler protection)', example: 44 })
    spoilerChapter?: number;

    @IsNumber()
    @IsOptional()
    @Min(1)
    @ApiPropertyOptional({ description: 'ID of the arc this event belongs to', example: 1 })
    arcId?: number;

    @IsNumber()
    @IsOptional()
    @Min(1)
    @ApiPropertyOptional({ description: 'ID of the gamble associated with this event', example: 1 })
    gambleId?: number;

    @IsArray()
    @IsNumber({}, { each: true })
    @IsOptional()
    @ArrayMaxSize(20)
    @ApiPropertyOptional({ description: 'IDs of characters involved in this event', type: [Number], example: [1, 3, 5] })
    characterIds?: number[];
  }
  ```

- [ ] **Step 2: Replace `update-event.dto.ts`**

  ```ts
  import { PartialType } from '@nestjs/swagger';
  import { CreateEventDto } from './create-event.dto';

  export class UpdateEventDto extends PartialType(CreateEventDto) {}
  ```

- [ ] **Step 3: Create `filter-events.dto.ts`**

  ```ts
  import { ApiPropertyOptional } from '@nestjs/swagger';
  import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
  import { Type } from 'class-transformer';
  import { EventType } from '../../../entities/event.entity';

  export class FilterEventsDto {
    @IsEnum(EventType)
    @IsOptional()
    @ApiPropertyOptional({ enum: EventType, description: 'Filter by event type' })
    type?: EventType;

    @IsInt()
    @IsOptional()
    @Min(1)
    @Type(() => Number)
    @ApiPropertyOptional({ description: 'Filter by arc ID' })
    arcId?: number;

    @IsInt()
    @IsOptional()
    @Min(1)
    @Type(() => Number)
    @ApiPropertyOptional({ description: 'Filter by gamble ID' })
    gambleId?: number;

    @IsInt()
    @IsOptional()
    @Min(1)
    @Type(() => Number)
    @ApiPropertyOptional({ description: 'Filter by chapter number' })
    chapterNumber?: number;

    @IsInt()
    @IsOptional()
    @Min(1)
    @Type(() => Number)
    @ApiPropertyOptional({ description: 'Filter by character ID' })
    characterId?: number;

    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Search title and description' })
    search?: string;

    @IsInt()
    @IsOptional()
    @Min(0)
    @Type(() => Number)
    @ApiPropertyOptional({ description: 'User reading progress for spoiler protection' })
    userProgress?: number;

    @IsInt()
    @IsOptional()
    @Min(1)
    @Type(() => Number)
    @ApiPropertyOptional({ description: 'Page number (default: 1)', default: 1 })
    page?: number;

    @IsInt()
    @IsOptional()
    @Min(1)
    @Type(() => Number)
    @ApiPropertyOptional({ description: 'Items per page (default: 20)', default: 20 })
    limit?: number;

    @IsEnum(['chapterNumber', 'createdAt'])
    @IsOptional()
    @ApiPropertyOptional({ enum: ['chapterNumber', 'createdAt'], description: 'Sort field (default: chapterNumber)' })
    sort?: 'chapterNumber' | 'createdAt';

    @IsEnum(['ASC', 'DESC'])
    @IsOptional()
    @ApiPropertyOptional({ enum: ['ASC', 'DESC'], description: 'Sort direction (default: ASC)' })
    order?: 'ASC' | 'DESC';
  }
  ```

- [ ] **Step 4: Build to verify**

  ```bash
  cd server && yarn build
  ```

  Expected: still sees errors in `events.service.ts` and `events.controller.ts` (fixed in Tasks 4–5). No errors from the DTO files themselves.

- [ ] **Step 5: Commit**

  ```bash
  cd server
  git add src/modules/events/dto/
  git commit -m "refactor(events): update DTOs — remove status/rejectionReason, add pageNumber, new FilterEventsDto"
  ```

---

## Task 4: Update EventsService

**Files:**
- Modify: `server/src/modules/events/events.service.ts`

- [ ] **Step 1: Replace `events.service.ts`**

  ```ts
  import { Injectable, NotFoundException } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { Event, EventType } from '../../entities/event.entity';
  import { Character } from '../../entities/character.entity';
  import { CreateEventDto } from './dto/create-event.dto';
  import { UpdateEventDto } from './dto/update-event.dto';
  import { FilterEventsDto } from './dto/filter-events.dto';
  import { EditLogService } from '../edit-log/edit-log.service';
  import { EditLogEntityType } from '../../entities/edit-log.entity';
  import { diffFields } from '../../common/utils/diff-fields';

  @Injectable()
  export class EventsService {
    constructor(
      @InjectRepository(Event) private repo: Repository<Event>,
      @InjectRepository(Character) private characterRepo: Repository<Character>,
      private readonly editLogService: EditLogService,
    ) {}

    async findAll(filters: FilterEventsDto) {
      const { page = 1, limit = 20, sort = 'chapterNumber', order = 'ASC' } = filters;

      const query = this.repo
        .createQueryBuilder('event')
        .leftJoinAndSelect('event.arc', 'arc')
        .leftJoinAndSelect('event.characters', 'characters')
        .leftJoinAndSelect('event.gamble', 'gamble');

      if (filters.search) {
        query.andWhere(
          '(LOWER(event.title) LIKE LOWER(:search) OR LOWER(event.description) LIKE LOWER(:search))',
          { search: `%${filters.search}%` },
        );
      }
      if (filters.arcId) {
        query.andWhere('event.arcId = :arcId', { arcId: filters.arcId });
      }
      if (filters.gambleId) {
        query.andWhere('event.gambleId = :gambleId', { gambleId: filters.gambleId });
      }
      if (filters.chapterNumber) {
        query.andWhere('event.chapterNumber = :chapterNumber', { chapterNumber: filters.chapterNumber });
      }
      if (filters.characterId) {
        query.andWhere('characters.id = :characterId', { characterId: filters.characterId });
      }
      if (filters.type) {
        query.andWhere('event.type = :type', { type: filters.type });
      }
      if (filters.userProgress !== undefined) {
        query.andWhere(
          '(event.spoilerChapter IS NULL OR event.spoilerChapter <= :userProgress)',
          { userProgress: filters.userProgress },
        );
      }

      const allowedSort = ['chapterNumber', 'createdAt'];
      if (sort && allowedSort.includes(sort)) {
        query.orderBy(`event.${sort}`, order);
        if (sort === 'chapterNumber') {
          query.addOrderBy('event.pageNumber', 'ASC', 'NULLS LAST');
        }
      } else {
        query
          .orderBy('event.chapterNumber', 'ASC')
          .addOrderBy('event.pageNumber', 'ASC', 'NULLS LAST');
      }

      query.skip((page - 1) * limit).take(limit);
      const [data, total] = await query.getManyAndCount();
      return { data, total, page, totalPages: Math.ceil(total / limit) };
    }

    findOne(id: number): Promise<Event | null> {
      return this.repo.findOne({
        where: { id },
        relations: ['arc', 'characters', 'tags', 'gamble'],
      });
    }

    async create(data: CreateEventDto, userId?: number): Promise<Event> {
      const { characterIds, ...eventData } = data;

      const cleanedData = {
        ...eventData,
        type: data.type || EventType.DECISION,
        chapterNumber: Number(eventData.chapterNumber) || 1,
        pageNumber:
          eventData.pageNumber && !isNaN(Number(eventData.pageNumber))
            ? Number(eventData.pageNumber)
            : undefined,
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
        const validIds = characterIds.filter((id) => !isNaN(Number(id)));
        if (validIds.length > 0) {
          event.characters = await this.characterRepo.findByIds(
            validIds.map((id) => Number(id)),
          );
        }
      }

      const saved = await this.repo.save(event);

      if (userId) {
        await this.editLogService.logCreate(EditLogEntityType.EVENT, saved.id, userId);
      }

      return saved;
    }

    async update(id: number, data: UpdateEventDto, userId?: number): Promise<Event> {
      const { characterIds, ...updateData } = data;

      const cleanedUpdateData = { ...updateData };
      if (cleanedUpdateData.chapterNumber !== undefined) {
        cleanedUpdateData.chapterNumber = Number(cleanedUpdateData.chapterNumber) || 1;
      }
      if (cleanedUpdateData.pageNumber !== undefined) {
        cleanedUpdateData.pageNumber =
          cleanedUpdateData.pageNumber && !isNaN(Number(cleanedUpdateData.pageNumber))
            ? Number(cleanedUpdateData.pageNumber)
            : undefined;
      }
      if (cleanedUpdateData.spoilerChapter !== undefined) {
        cleanedUpdateData.spoilerChapter =
          cleanedUpdateData.spoilerChapter && !isNaN(Number(cleanedUpdateData.spoilerChapter))
            ? Number(cleanedUpdateData.spoilerChapter)
            : undefined;
      }
      if (cleanedUpdateData.arcId !== undefined) {
        cleanedUpdateData.arcId =
          cleanedUpdateData.arcId && !isNaN(Number(cleanedUpdateData.arcId))
            ? Number(cleanedUpdateData.arcId)
            : undefined;
      }

      const event = await this.repo.findOne({ where: { id }, relations: ['characters'] });
      if (!event) throw new NotFoundException(`Event with ID ${id} not found`);

      const changedFields = diffFields(event, cleanedUpdateData);
      if (characterIds !== undefined) changedFields.push('characters');

      if (Object.keys(cleanedUpdateData).length > 0) {
        await this.repo.update(id, cleanedUpdateData);
      }

      if (characterIds !== undefined) {
        const validIds = characterIds.filter((cid) => !isNaN(Number(cid)));
        event.characters =
          validIds.length > 0
            ? await this.characterRepo.findByIds(validIds.map((cid) => Number(cid)))
            : [];
        await this.repo.save(event);
      }

      const result = await this.findOne(id);
      if (!result) throw new NotFoundException(`Event with ID ${id} not found after update`);

      if (userId !== undefined) {
        await this.editLogService.logUpdate(EditLogEntityType.EVENT, id, userId, changedFields);
      }

      return result;
    }

    remove(id: number, userId?: number) {
      if (userId !== undefined) {
        this.editLogService
          .logDelete(EditLogEntityType.EVENT, id, userId)
          .catch(() => {});
      }
      return this.repo.delete(id);
    }

    async findGroupedByArc(filters?: { userProgress?: number; type?: EventType }) {
      const query = this.repo
        .createQueryBuilder('event')
        .leftJoinAndSelect('event.arc', 'arc')
        .leftJoinAndSelect('event.characters', 'characters')
        .leftJoinAndSelect('event.gamble', 'gamble');

      if (filters?.userProgress !== undefined) {
        query.andWhere(
          '(event.spoilerChapter IS NULL OR event.spoilerChapter <= :userProgress)',
          { userProgress: filters.userProgress },
        );
      }
      if (filters?.type) {
        query.andWhere('event.type = :type', { type: filters.type });
      }

      query
        .orderBy('event.chapterNumber', 'ASC')
        .addOrderBy('event.pageNumber', 'ASC', 'NULLS LAST');

      const events = await query.getMany();

      const arcGroups: Record<number, Event[]> = {};
      const noArcEvents: Event[] = [];

      events.forEach((event) => {
        if (event.arc) {
          if (!arcGroups[event.arc.id]) arcGroups[event.arc.id] = [];
          arcGroups[event.arc.id].push(event);
        } else {
          noArcEvents.push(event);
        }
      });

      const arcs = Object.values(arcGroups).map((arcEvents) => ({
        arc: arcEvents[0].arc,
        events: arcEvents,
      }));
      arcs.sort((a, b) => (a.arc.order || 0) - (b.arc.order || 0));

      return { arcs, noArc: noArcEvents };
    }
  }
  ```

- [ ] **Step 2: Build to verify**

  ```bash
  cd server && yarn build
  ```

  Expected: errors only in `events.controller.ts` (fixed in Task 5). No errors in the service file.

- [ ] **Step 3: Commit**

  ```bash
  cd server
  git add src/modules/events/events.service.ts
  git commit -m "refactor(events): simplify service — remove approval logic, update findAll with ID filters"
  ```

---

## Task 5: Update EventsController

**Files:**
- Modify: `server/src/modules/events/events.controller.ts`

- [ ] **Step 1: Replace `events.controller.ts`**

  ```ts
  import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    NotFoundException,
    UseGuards,
    ParseIntPipe,
    ValidationPipe,
  } from '@nestjs/common';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiBody,
    ApiBearerAuth,
  } from '@nestjs/swagger';
  import { EventsService } from './events.service';
  import { Event, EventType } from '../../entities/event.entity';
  import { CreateEventDto } from './dto/create-event.dto';
  import { UpdateEventDto } from './dto/update-event.dto';
  import { FilterEventsDto } from './dto/filter-events.dto';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { RolesGuard } from '../auth/guards/roles.guard';
  import { Roles } from '../auth/decorators/roles.decorator';
  import { CurrentUser } from '../auth/decorators/current-user.decorator';
  import { User, UserRole } from '../../entities/user.entity';

  @ApiTags('events')
  @Controller('events')
  export class EventsController {
    constructor(private readonly service: EventsService) {}

    @Get()
    @ApiOperation({ summary: 'Get all events', description: 'Paginated, filterable list of events' })
    @ApiResponse({ status: 200, description: 'List of events with pagination metadata' })
    async getAll(@Query(new ValidationPipe({ transform: true })) filters: FilterEventsDto) {
      return this.service.findAll(filters);
    }

    @Get('grouped/by-arc')
    @ApiOperation({ summary: 'Get events grouped by arc', description: 'All events grouped by story arc, ordered by chapter then page' })
    async getGroupedByArc(
      @Query('userProgress', new ParseIntPipe({ optional: true })) userProgress?: number,
      @Query('type') type?: EventType,
    ) {
      return this.service.findGroupedByArc({ userProgress, type });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a single event by ID' })
    @ApiParam({ name: 'id', type: 'number' })
    async getOne(@Param('id', ParseIntPipe) id: number): Promise<Event> {
      const event = await this.service.findOne(id);
      if (!event) throw new NotFoundException('Event not found');
      return event;
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.EDITOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new event (editor/moderator/admin)' })
    @ApiBody({ type: CreateEventDto })
    async create(
      @Body(ValidationPipe) createEventDto: CreateEventDto,
      @CurrentUser() user: User,
    ) {
      return this.service.create(createEventDto, user.id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.EDITOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update an event (editor/moderator/admin)' })
    @ApiParam({ name: 'id', type: 'number' })
    @ApiBody({ type: UpdateEventDto })
    async update(
      @Param('id', ParseIntPipe) id: number,
      @Body(ValidationPipe) updateEventDto: UpdateEventDto,
      @CurrentUser() user: User,
    ) {
      return this.service.update(id, updateEventDto, user.id);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete an event (admin only)' })
    @ApiParam({ name: 'id', type: 'number' })
    async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
      return this.service.remove(id, user.id);
    }
  }
  ```

- [ ] **Step 2: Build to verify clean compile**

  ```bash
  cd server && yarn build
  ```

  Expected: zero TypeScript errors.

- [ ] **Step 3: Commit**

  ```bash
  cd server
  git add src/modules/events/events.controller.ts
  git commit -m "refactor(events): simplify controller — remove approval/specialised endpoints, PATCH permissions"
  ```

---

## Task 6: Update Backend Tests

**Files:**
- Modify: `server/src/modules/events/events.service.spec.ts`
- Modify: `server/src/modules/events/events.controller.spec.ts`

- [ ] **Step 1: Replace `events.service.spec.ts`**

  ```ts
  import { Test, TestingModule } from '@nestjs/testing';
  import { getRepositoryToken } from '@nestjs/typeorm';
  import { EventsService } from './events.service';
  import { Event, EventType } from '../../entities/event.entity';
  import { Character } from '../../entities/character.entity';
  import { EditLogService } from '../edit-log/edit-log.service';
  import { NotFoundException } from '@nestjs/common';

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  };

  const mockRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    findByIds: jest.fn().mockResolvedValue([]),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({ ...mockQueryBuilder })),
  };

  const mockEditLog = {
    logCreate: jest.fn().mockResolvedValue(undefined),
    logUpdate: jest.fn().mockResolvedValue(undefined),
    logDelete: jest.fn().mockResolvedValue(undefined),
  };

  describe('EventsService', () => {
    let service: EventsService;

    beforeEach(async () => {
      jest.clearAllMocks();
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EventsService,
          { provide: getRepositoryToken(Event), useValue: mockRepo },
          { provide: getRepositoryToken(Character), useValue: mockRepo },
          { provide: EditLogService, useValue: mockEditLog },
        ],
      }).compile();

      service = module.get<EventsService>(EventsService);
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    describe('findAll', () => {
      it('returns paginated result with default page and limit', async () => {
        mockRepo.createQueryBuilder.mockReturnValue({ ...mockQueryBuilder });
        const result = await service.findAll({});
        expect(result).toEqual({ data: [], total: 0, page: 1, totalPages: 0 });
      });

      it('applies arcId filter when provided', async () => {
        const qb = { ...mockQueryBuilder };
        mockRepo.createQueryBuilder.mockReturnValue(qb);
        await service.findAll({ arcId: 3 });
        expect(qb.andWhere).toHaveBeenCalledWith(
          'event.arcId = :arcId',
          { arcId: 3 },
        );
      });

      it('applies search filter to title and description', async () => {
        const qb = { ...mockQueryBuilder };
        mockRepo.createQueryBuilder.mockReturnValue(qb);
        await service.findAll({ search: 'tournament' });
        expect(qb.andWhere).toHaveBeenCalledWith(
          '(LOWER(event.title) LIKE LOWER(:search) OR LOWER(event.description) LIKE LOWER(:search))',
          { search: '%tournament%' },
        );
      });

      it('does not apply status filter (no status field)', async () => {
        const qb = { ...mockQueryBuilder };
        mockRepo.createQueryBuilder.mockReturnValue(qb);
        await service.findAll({});
        const calls = qb.andWhere.mock.calls.map((c: unknown[]) => c[0]);
        expect(calls.every((c: unknown) => !String(c).includes('status'))).toBe(true);
      });
    });

    describe('create', () => {
      it('saves event without status field', async () => {
        const mockEvent = { id: 1, title: 'Test', chapterNumber: 1, type: EventType.DECISION };
        mockRepo.create.mockReturnValue(mockEvent);
        mockRepo.save.mockResolvedValue(mockEvent);

        await service.create({ title: 'Test', description: 'long enough desc', chapterNumber: 1 }, 1);

        const createCall = mockRepo.create.mock.calls[0][0];
        expect(createCall).not.toHaveProperty('status');
      });

      it('saves pageNumber when provided', async () => {
        const mockEvent = { id: 1, title: 'Test', chapterNumber: 1, pageNumber: 5 };
        mockRepo.create.mockReturnValue(mockEvent);
        mockRepo.save.mockResolvedValue(mockEvent);

        await service.create({
          title: 'Test',
          description: 'long enough desc',
          chapterNumber: 1,
          pageNumber: 5,
        }, 1);

        const createCall = mockRepo.create.mock.calls[0][0];
        expect(createCall.pageNumber).toBe(5);
      });
    });

    describe('findOne', () => {
      it('throws NotFoundException when event does not exist', async () => {
        mockRepo.findOne.mockResolvedValue(null);
        const result = await service.findOne(999);
        expect(result).toBeNull();
      });
    });

    describe('removed methods', () => {
      it('does not have updateOwnSubmission', () => {
        expect((service as unknown as Record<string, unknown>).updateOwnSubmission).toBeUndefined();
      });

      it('does not have findByArc', () => {
        expect((service as unknown as Record<string, unknown>).findByArc).toBeUndefined();
      });

      it('does not have findByGamble', () => {
        expect((service as unknown as Record<string, unknown>).findByGamble).toBeUndefined();
      });
    });
  });
  ```

- [ ] **Step 2: Replace `events.controller.spec.ts`**

  ```ts
  import { Test, TestingModule } from '@nestjs/testing';
  import { EventsController } from './events.controller';
  import { EventsService } from './events.service';
  import { NotFoundException } from '@nestjs/common';

  const mockService = {
    findAll: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, totalPages: 0 }),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findGroupedByArc: jest.fn().mockResolvedValue({ arcs: [], noArc: [] }),
  };

  describe('EventsController', () => {
    let controller: EventsController;

    beforeEach(async () => {
      jest.clearAllMocks();
      const module: TestingModule = await Test.createTestingModule({
        controllers: [EventsController],
        providers: [{ provide: EventsService, useValue: mockService }],
      }).compile();

      controller = module.get<EventsController>(EventsController);
    });

    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    describe('getAll', () => {
      it('delegates to service.findAll', async () => {
        await controller.getAll({});
        expect(mockService.findAll).toHaveBeenCalledWith({});
      });
    });

    describe('getGroupedByArc', () => {
      it('delegates to service.findGroupedByArc', async () => {
        await controller.getGroupedByArc(undefined, undefined);
        expect(mockService.findGroupedByArc).toHaveBeenCalledWith({
          userProgress: undefined,
          type: undefined,
        });
      });
    });

    describe('getOne', () => {
      it('returns event when found', async () => {
        const event = { id: 1, title: 'Test' };
        mockService.findOne.mockResolvedValue(event);
        const result = await controller.getOne(1);
        expect(result).toEqual(event);
      });

      it('throws NotFoundException when event not found', async () => {
        mockService.findOne.mockResolvedValue(null);
        await expect(controller.getOne(999)).rejects.toThrow(NotFoundException);
      });
    });

    describe('removed endpoints', () => {
      it('does not have an approve method', () => {
        expect((controller as unknown as Record<string, unknown>).approve).toBeUndefined();
      });

      it('does not have a reject method', () => {
        expect((controller as unknown as Record<string, unknown>).reject).toBeUndefined();
      });

      it('does not have updateOwnSubmission method', () => {
        expect((controller as unknown as Record<string, unknown>).updateOwnSubmission).toBeUndefined();
      });

      it('does not have getByArc method', () => {
        expect((controller as unknown as Record<string, unknown>).getByArc).toBeUndefined();
      });
    });
  });
  ```

- [ ] **Step 3: Run tests**

  ```bash
  cd server && yarn test -- --testPathPattern="events" --verbose
  ```

  Expected: all tests in `events.service.spec.ts` and `events.controller.spec.ts` pass.

- [ ] **Step 4: Run full test suite to confirm no regressions**

  ```bash
  cd server && yarn test
  ```

  Expected: all tests pass.

- [ ] **Step 5: Commit**

  ```bash
  cd server
  git add src/modules/events/events.service.spec.ts src/modules/events/events.controller.spec.ts
  git commit -m "test(events): update specs — remove approval tests, add pageNumber and ID-filter coverage"
  ```

---

## Task 7: Update Frontend Types and API Client

**Files:**
- Modify: `client/src/types/index.ts`
- Modify: `client/src/lib/api.ts`

- [ ] **Step 1: Update `Event` interface in `client/src/types/index.ts`**

  Find the `Event` interface (around line 56) and the `EventStatus` enum (around line 181). Make these changes:

  Remove the `EventStatus` enum entirely:
  ```ts
  // DELETE these lines:
  export enum EventStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
  }
  ```

  Replace the `Event` interface with:
  ```ts
  export interface Event {
    id: number;
    title: string;
    description: string;
    chapterNumber: number;
    pageNumber?: number | null;
    spoilerChapter?: number;
    type: 'gamble' | 'decision' | 'reveal' | 'shift' | 'resolution';
    gambleId?: number;
    gamble?: Gamble;
    arcId?: number;
    arc?: {
      id: number;
      name: string;
    };
    characters: Array<{
      id: number;
      name: string;
    }>;
    tags?: Array<{
      id: number;
      name: string;
    }>;
    createdBy?: {
      id: number;
      username: string;
    };
    createdAt: string;
    updatedAt: string;
  }
  ```

- [ ] **Step 2: Update `client/src/lib/api.ts`**

  Find and remove these methods (search for each by name):
  - `approveEvent` (around line 1467)
  - `rejectEvent` (around line 1471)
  - `updateOwnEvent` (around line 1455)
  - `getMyEventSubmission` (around line 1459)
  - `getEventsByArc` (around line 1475)
  - `getEventsByGamble` (around line 1483)
  - `getEventsByChapter` (around line 614)

  Update `updateEvent` to use `patch` instead of `put`:
  ```ts
  // Find:
  async updateEvent(id: number, data: any) {
    return this.put<any>(`/events/${id}`, data)
  }

  // Replace with:
  async updateEvent(id: number, data: any) {
    return this.patch<any>(`/events/${id}`, data)
  }
  ```

  Update `getEvents` to support new ID-based filter params (the existing signature already uses `any` params, so just update the JSDoc comment if present):
  ```ts
  async getEvents(params?: {
    page?: number
    limit?: number
    search?: string
    type?: string
    arcId?: number
    gambleId?: number
    chapterNumber?: number
    characterId?: number
    userProgress?: number
    sort?: string
    order?: string
  }) {
    const query = params ? new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString() : ''
    return this.get<{
      data: any[]
      total: number
      page: number
      totalPages: number
    }>(`/events${query ? `?${query}` : ''}`)
  }
  ```

- [ ] **Step 3: Build to verify**

  ```bash
  cd client && yarn build 2>&1 | head -60
  ```

  Expected: TypeScript errors pointing to files that still reference `EventStatus` or the removed API methods. Note them — they will be fixed in Tasks 8–12.

- [ ] **Step 4: Commit**

  ```bash
  cd client
  git add src/types/index.ts src/lib/api.ts
  git commit -m "refactor(events): remove EventStatus type, drop approval API methods, add pageNumber to Event type"
  ```

---

## Task 8: Update Events Browse Page

**Files:**
- Modify: `client/src/app/events/EventsPageContent.tsx`

- [ ] **Step 1: Remove status filter**

  Remove the `EventStatus` import:
  ```ts
  // DELETE:
  import { EventStatus } from '../../types'
  ```

  Remove the `eventStatusOptions` array:
  ```ts
  // DELETE:
  const eventStatusOptions = [
    { value: '', label: 'All Statuses' },
    { value: EventStatus.APPROVED, label: 'Verified' },
    { value: EventStatus.PENDING, label: 'Unverified' },
    { value: EventStatus.REJECTED, label: 'Rejected' }
  ]
  ```

  Remove the `selectedStatus` state and all references to it:
  ```ts
  // DELETE:
  const [selectedStatus, setSelectedStatus] = useState(initialStatus)

  // DELETE these from EventsPageContentProps:
  initialStatus: string

  // DELETE these from function signature:
  initialStatus,
  ```

  Remove `initialStatus` from `hasAnyFilter`:
  ```ts
  // Change:
  const hasAnyFilter = Boolean(searchTerm.trim() || selectedType || selectedStatus || selectedCharacter)
  // To:
  const hasAnyFilter = Boolean(searchTerm.trim() || selectedType || selectedCharacter)
  ```

  Remove all occurrences of `selectedStatus` from the `fetcher`, `updateUrl`, `handleClearAll`, and `handleStatusChange` callback. Remove `handleStatusChange` entirely. Remove `status` from URL params.

- [ ] **Step 2: Remove status from the hover modal**

  In `renderEventCard` / the hover modal `Paper`, find and remove the status `Badge`:
  ```tsx
  // DELETE the entire Group containing this:
  <Badge c={statusColor(hoveredEvent.status)} ...>
    {hoveredEvent.status === 'pending' ? 'Unverified' : ...}
  </Badge>
  ```

  Remove the `statusColor` helper function entirely.

- [ ] **Step 3: Remove the status `<Select>` from `filterSlot`**

  In the `filterSlot` prop, delete the entire second `<Select>` (the one with `placeholder="All Statuses"`).

- [ ] **Step 4: Build to verify**

  ```bash
  cd client && yarn build 2>&1 | grep "EventsPageContent" | head -20
  ```

  Expected: no errors from `EventsPageContent.tsx`.

- [ ] **Step 5: Commit**

  ```bash
  cd client
  git add src/app/events/EventsPageContent.tsx
  git commit -m "refactor(events): remove status filter and status badge from events browse page"
  ```

---

## Task 9: Update Event Detail Page

**Files:**
- Modify: `client/src/app/events/[id]/EventPageClient.tsx`

- [ ] **Step 1: Update edit permission check**

  Find (around line 60):
  ```ts
  const canEdit = user &&
    initialEvent.createdBy?.id === user.id &&
    (initialEvent.status === 'pending' || initialEvent.status === 'rejected')
  const isRejected = initialEvent.status === 'rejected'
  ```

  Replace with:
  ```ts
  const canEdit = user && ['editor', 'moderator', 'admin'].includes(user.role ?? '')
  ```

- [ ] **Step 2: Remove rejection reason banner and status badge**

  Search `EventPageClient.tsx` for any JSX that renders `initialEvent.status` or `isRejected` and delete those blocks. Common patterns to remove:
  - An `<Alert>` or banner showing rejection reason
  - A `<Badge>` displaying approval status

- [ ] **Step 3: Build to verify**

  ```bash
  cd client && yarn build 2>&1 | grep "EventPageClient" | head -20
  ```

  Expected: no errors from this file.

- [ ] **Step 4: Commit**

  ```bash
  cd client
  git add src/app/events/[id]/EventPageClient.tsx
  git commit -m "refactor(events): role-based edit permission, remove status/rejection display from event detail"
  ```

---

## Task 10: Update Submit Event Form

**Files:**
- Modify: `client/src/app/submit-event/EventFormCard.tsx`
- Modify: `client/src/app/submit-event/SubmitEventPageContent.tsx`

- [ ] **Step 1: Add `pageNumber` to `EventFormData` and form in `EventFormCard.tsx`**

  Update the `EventFormData` interface:
  ```ts
  export interface EventFormData {
    title: string
    description: string
    chapterNumber: number | ''
    pageNumber: number | ''       // ADD
    type: string
    spoilerChapter: number | ''
    characterIds: number[]
  }
  ```

  Add a `NumberInput` for page number in the form JSX, immediately after the chapter number input:
  ```tsx
  <NumberInput
    label="Page Number"
    description="Optional. Helps order events within the same chapter."
    placeholder="e.g. 14"
    min={1}
    value={data.pageNumber}
    onChange={(val) => onChange({ ...data, pageNumber: val as number | '' })}
    styles={dimmedInputStyles}
  />
  ```

- [ ] **Step 2: Update `SubmitEventPageContent.tsx`**

  Update the initial state of `batchEvents` to include `pageNumber`:
  ```ts
  const [batchEvents, setBatchEvents] = useState<EventFormData[]>([
    {
      title: '',
      description: '',
      chapterNumber: '' as number | '',
      pageNumber: '' as number | '',   // ADD
      type: '',
      spoilerChapter: '' as number | '',
      characterIds: []
    }
  ])
  ```

  In the submit handler, include `pageNumber` in the payload:
  ```ts
  // Find the api.createEvent call and add pageNumber:
  pageNumber: event.pageNumber ? Number(event.pageNumber) : undefined,
  ```

- [ ] **Step 3: Build to verify**

  ```bash
  cd client && yarn build 2>&1 | grep -E "EventFormCard|SubmitEvent" | head -20
  ```

  Expected: no errors.

- [ ] **Step 4: Commit**

  ```bash
  cd client
  git add src/app/submit-event/EventFormCard.tsx src/app/submit-event/SubmitEventPageContent.tsx
  git commit -m "feat(events): add pageNumber field to submit form"
  ```

---

## Task 11: Update Edit Event Page

**Files:**
- Modify: `client/src/app/events/[id]/edit/EditEventPageContent.tsx`

- [ ] **Step 1: Update `ExistingEvent` interface**

  Find the `ExistingEvent` interface and update it:
  ```ts
  interface ExistingEvent {
    id: number
    title: string
    description: string
    chapterNumber: number
    pageNumber?: number | null      // ADD
    type?: string | null
    arcId?: number | null
    gambleId?: number | null
    spoilerChapter?: number | null
    characters?: Array<{ id: number; name: string }>
    createdAt?: string
    updatedAt?: string
  }
  ```

- [ ] **Step 2: Add `pageNumber` to form state**

  In the `formData` state, add:
  ```ts
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    chapterNumber: 1 as number | '',
    pageNumber: '' as number | '',    // ADD
    type: '' as string,
    arcId: null as number | null,
    gambleId: null as number | null,
    spoilerChapter: '' as number | '',
    characterIds: [] as number[],
  })
  ```

  In the `useEffect` that populates form data from the fetched event, add:
  ```ts
  pageNumber: event.pageNumber ?? '',
  ```

- [ ] **Step 3: Update the API calls**

  The page currently calls `api.updateOwnEvent` (removed) and `api.getMyEventSubmission` (removed). Replace both:

  ```ts
  // Find:
  await api.updateOwnEvent(id, { ... })
  // Replace with:
  await api.updateEvent(id, { ... })

  // Find:
  api.getMyEventSubmission(id),
  // Replace with:
  api.getEvent(id),
  ```

  Include `pageNumber` in the update payload:
  ```ts
  await api.updateEvent(id, {
    title: formData.title.trim(),
    description: formData.description.trim(),
    chapterNumber: formData.chapterNumber as number,
    pageNumber: formData.pageNumber ? Number(formData.pageNumber) : undefined,
    type: formData.type || undefined,
    arcId: formData.arcId ?? undefined,
    gambleId: formData.gambleId ?? undefined,
    spoilerChapter: formData.spoilerChapter || undefined,
    characterIds: formData.characterIds.length ? formData.characterIds : undefined,
  })
  ```

- [ ] **Step 4: Add `pageNumber` `NumberInput` to the form JSX**

  After the chapter number `NumberInput`, add:
  ```tsx
  <NumberInput
    label="Page Number"
    description="Optional. Helps order events within the same chapter."
    placeholder="e.g. 14"
    min={1}
    value={formData.pageNumber}
    onChange={(val) => handleInputChange('pageNumber', val)}
    styles={dimmedInputStyles}
  />
  ```

- [ ] **Step 5: Remove status/rejection UI**

  Search for any JSX in this file that references `existingEvent.status`, `existingEvent.rejectionReason`, or the string `'rejected'` and delete those blocks.

- [ ] **Step 6: Build to verify**

  ```bash
  cd client && yarn build 2>&1 | grep "EditEventPageContent" | head -20
  ```

  Expected: no errors.

- [ ] **Step 7: Commit**

  ```bash
  cd client
  git add src/app/events/[id]/edit/EditEventPageContent.tsx
  git commit -m "refactor(events): update edit form — pageNumber field, remove status UI, use api.updateEvent"
  ```

---

## Task 12: Update Admin Events Panel

**Files:**
- Modify: `client/src/components/admin/Events.tsx`

- [ ] **Step 1: Remove `EventStatus` import**

  ```ts
  // DELETE:
  import { EventStatus } from '../../types'
  ```

- [ ] **Step 2: Remove approve/reject action buttons**

  Search for `approveEvent` and `rejectEvent` in the file. Delete:
  - Any `Button` or action component that calls `api.approveEvent` or `api.rejectEvent`
  - Any state managing approve/reject dialogs (dialog open state, rejection reason input)
  - Any `Dialog` component used for the reject workflow

- [ ] **Step 3: Remove status field from create/edit forms**

  Find the `SelectInput` with `source="status"` (or similar) and delete it from both `Create` and `Edit` form components.

  Find and delete the `rejectionReason` `TextInput` field.

- [ ] **Step 4: Remove status column from list view**

  Find the `<Datagrid>` component and delete the column showing status (likely a `FunctionField` or `SelectField` with `source="status"`).

  Remove status from the `<Filter>` component.

- [ ] **Step 5: Add `pageNumber` field**

  In both the `Create` and `Edit` form, add after the chapter number field:
  ```tsx
  <NumberInput source="pageNumber" label="Page Number" helperText="Optional — for ordering within a chapter" />
  ```

  In the `<Datagrid>`, add after the chapter number column:
  ```tsx
  <NumberField source="pageNumber" label="Page" />
  ```

- [ ] **Step 6: Build to verify**

  ```bash
  cd client && yarn build 2>&1 | grep "admin/Events" | head -20
  ```

  Expected: no errors.

- [ ] **Step 7: Commit**

  ```bash
  cd client
  git add src/components/admin/Events.tsx
  git commit -m "refactor(events): remove approval UI from admin panel, add pageNumber field"
  ```

---

## Task 13: Create Shared Timeline Types and SpoilerWrapper

**Files:**
- Create: `client/src/components/timeline/types.ts`
- Create: `client/src/components/timeline/TimelineSpoilerWrapper.tsx`

- [ ] **Step 1: Create `client/src/components/timeline/types.ts`**

  ```ts
  export interface TimelineEvent {
    id: number
    title: string
    description?: string | null
    chapterNumber: number
    pageNumber?: number | null
    type?: 'gamble' | 'decision' | 'reveal' | 'shift' | 'resolution' | null
    spoilerChapter?: number
    arcId?: number
    arcName?: string
    gambleId?: number
    characters?: Array<{ id: number; name: string }>
  }

  export interface TimelineArc {
    id: number
    name: string
    description?: string | null
    startChapter: number
    endChapter: number | null
  }
  ```

- [ ] **Step 2: Create `client/src/components/timeline/TimelineSpoilerWrapper.tsx`**

  ```tsx
  'use client'

  import React, { useState } from 'react'
  import { Box, Card, Group, Stack, Text, Tooltip, useMantineTheme } from '@mantine/core'
  import { AlertTriangle } from 'lucide-react'
  import { useProgress } from '../../providers/ProgressProvider'
  import { useSpoilerSettings } from '../../hooks/useSpoilerSettings'
  import { getAlphaColor } from '../../lib/mantine-theme'

  interface TimelineSpoilerWrapperProps {
    chapterNumber: number
    spoilerChapter?: number
    children: React.ReactNode
  }

  export default function TimelineSpoilerWrapper({
    chapterNumber,
    spoilerChapter,
    children,
  }: TimelineSpoilerWrapperProps) {
    const [revealed, setRevealed] = useState(false)
    const { userProgress } = useProgress()
    const { settings } = useSpoilerSettings()
    const theme = useMantineTheme()

    const effectiveProgress = settings.chapterTolerance > 0 ? settings.chapterTolerance : userProgress
    const effectiveChapter = spoilerChapter ?? chapterNumber
    const shouldHide =
      !settings.showAllSpoilers && effectiveProgress > 0 && effectiveChapter > effectiveProgress

    if (!shouldHide || revealed) return <>{children}</>

    return (
      <Box style={{ position: 'relative' }}>
        <Box style={{ opacity: 0.2, filter: 'blur(3px)', pointerEvents: 'none' }}>
          {children}
        </Box>
        <Tooltip
          label={`Chapter ${chapterNumber} spoiler — you're at Chapter ${effectiveProgress}. Click to reveal.`}
          withArrow
          position="top"
        >
          <Card
            withBorder
            radius="md"
            shadow="lg"
            p="sm"
            onClick={() => setRevealed(true)}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: getAlphaColor(theme.colors.red[7], 0.9),
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            <Stack gap={4} align="center">
              <Group gap={6} align="center" c="white">
                <AlertTriangle size={16} />
                <Text size="xs" fw={700}>
                  Chapter {chapterNumber} Spoiler
                </Text>
              </Group>
              <Text size="xs" c="rgba(255,255,255,0.9)">
                Click to reveal
              </Text>
            </Stack>
          </Card>
        </Tooltip>
      </Box>
    )
  }
  ```

- [ ] **Step 3: Build to verify**

  ```bash
  cd client && yarn build 2>&1 | grep "timeline/" | head -10
  ```

  Expected: no errors from the new files.

- [ ] **Step 4: Commit**

  ```bash
  cd client
  git add src/components/timeline/types.ts src/components/timeline/TimelineSpoilerWrapper.tsx
  git commit -m "feat(timeline): add shared TimelineEvent type and TimelineSpoilerWrapper"
  ```

---

## Task 14: Create TimelineEventCard

**Files:**
- Create: `client/src/components/timeline/TimelineEventCard.tsx`

- [ ] **Step 1: Create the file**

  ```tsx
  'use client'

  import React from 'react'
  import { Badge, Box, Card, Group, Stack, Text, rem, useMantineTheme } from '@mantine/core'
  import Link from 'next/link'
  import {
    getEventColorHex,
    getEventColorKey,
    getEventIcon,
    getEventLabel,
  } from '../../lib/timeline-constants'
  import { getEntityThemeColor } from '../../lib/mantine-theme'
  import TimelineSpoilerWrapper from './TimelineSpoilerWrapper'
  import type { TimelineEvent } from './types'

  interface TimelineEventCardProps {
    event: TimelineEvent
  }

  export default function TimelineEventCard({ event }: TimelineEventCardProps) {
    const theme = useMantineTheme()
    const eventColor = getEventColorHex(event.type)
    const EventIcon = getEventIcon(event.type)

    return (
      <TimelineSpoilerWrapper
        chapterNumber={event.chapterNumber}
        spoilerChapter={event.spoilerChapter}
      >
        <Card
          component={Link}
          href={`/events/${event.id}`}
          withBorder
          radius="md"
          shadow="sm"
          p="md"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: rem(12),
            textDecoration: 'none',
            color: 'inherit',
            background: theme.colors.dark[7] ?? theme.white,
            borderColor: 'rgba(255,255,255,0.08)',
            transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
            width: '100%',
          }}
        >
          {/* Type icon */}
          <Box
            style={{
              width: rem(36),
              height: rem(36),
              borderRadius: rem(8),
              background: `${eventColor}1a`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: eventColor,
              marginTop: rem(1),
            }}
          >
            <EventIcon size={18} />
          </Box>

          {/* Content */}
          <Stack gap={rem(6)} style={{ flex: 1, minWidth: 0 }}>
            <Text fw={600} size="sm" style={{ lineHeight: 1.35 }}>
              {event.title}
            </Text>

            <Group gap={rem(6)} wrap="wrap">
              <Badge
                variant="outline"
                size="xs"
                style={{
                  color: getEntityThemeColor(theme, 'chapter'),
                  borderColor: `${getEntityThemeColor(theme, 'chapter')}40`,
                }}
              >
                Ch. {event.chapterNumber}
                {event.pageNumber ? ` · p. ${event.pageNumber}` : ''}
              </Badge>
              {event.type && (
                <Badge
                  color={getEventColorKey(event.type)}
                  size="xs"
                  radius="sm"
                  leftSection={<EventIcon size={10} />}
                >
                  {getEventLabel(event.type)}
                </Badge>
              )}
            </Group>

            {event.description && (
              <Text
                size="xs"
                c="dimmed"
                style={{
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {event.description}
              </Text>
            )}
          </Stack>
        </Card>
      </TimelineSpoilerWrapper>
    )
  }
  ```

- [ ] **Step 2: Build to verify**

  ```bash
  cd client && yarn build 2>&1 | grep "TimelineEventCard" | head -10
  ```

  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  cd client
  git add src/components/timeline/TimelineEventCard.tsx
  git commit -m "feat(timeline): add shared TimelineEventCard component"
  ```

---

## Task 15: Create TimelineSection and Barrel Export

**Files:**
- Create: `client/src/components/timeline/TimelineSection.tsx`
- Create: `client/src/components/timeline/index.ts`

- [ ] **Step 1: Create `TimelineSection.tsx`**

  ```tsx
  'use client'

  import React from 'react'
  import { Badge, Box, Group, Stack, Text, rem, useMantineTheme } from '@mantine/core'
  import { getEventColorHex } from '../../lib/timeline-constants'
  import TimelineEventCard from './TimelineEventCard'
  import type { TimelineEvent } from './types'

  interface TimelineSectionProps {
    label: string
    subtitle?: string
    accentColor: string
    events: TimelineEvent[]
  }

  export default function TimelineSection({
    label,
    subtitle,
    accentColor,
    events,
  }: TimelineSectionProps) {
    const theme = useMantineTheme()

    return (
      <Stack gap={rem(4)}>
        {/* Section header */}
        <Group align="flex-start" gap={rem(12)} mb={rem(4)}>
          <Box
            style={{
              width: rem(3),
              borderRadius: rem(2),
              background: accentColor,
              alignSelf: 'stretch',
              minHeight: rem(36),
              flexShrink: 0,
            }}
          />
          <Stack gap={rem(2)} style={{ flex: 1 }}>
            <Group gap={rem(8)} align="center">
              <Text fw={700} size="sm" style={{ color: accentColor }}>
                {label}
              </Text>
              <Badge
                variant="outline"
                size="xs"
                style={{ color: accentColor, borderColor: `${accentColor}50`, opacity: 0.8 }}
              >
                {events.length} event{events.length !== 1 ? 's' : ''}
              </Badge>
            </Group>
            {subtitle && (
              <Text size="xs" c="dimmed">
                {subtitle}
              </Text>
            )}
          </Stack>
        </Group>

        {/* Rail with events */}
        <Box
          style={{
            position: 'relative',
            paddingLeft: rem(20),
          }}
        >
          {/* Vertical rail line */}
          <Box
            style={{
              position: 'absolute',
              left: rem(7),
              top: rem(8),
              bottom: rem(8),
              width: rem(2),
              borderRadius: rem(1),
              background: `linear-gradient(to bottom, ${accentColor}, transparent)`,
              opacity: 0.2,
            }}
          />

          <Stack gap={rem(10)}>
            {events.map((event) => {
              const dotColor = getEventColorHex(event.type)
              return (
                <Box
                  key={event.id}
                  id={`event-${event.id}`}
                  style={{ position: 'relative' }}
                >
                  {/* Rail dot */}
                  <Box
                    style={{
                      position: 'absolute',
                      left: rem(-13),
                      top: rem(14),
                      width: rem(14),
                      height: rem(14),
                      borderRadius: '50%',
                      background: dotColor,
                      border: `2px solid ${theme.colors.dark[7] ?? '#161616'}`,
                      boxShadow: `0 0 0 2px ${dotColor}`,
                      zIndex: 1,
                    }}
                  />
                  <TimelineEventCard event={event} />
                </Box>
              )
            })}
          </Stack>
        </Box>
      </Stack>
    )
  }
  ```

- [ ] **Step 2: Create `client/src/components/timeline/index.ts`**

  ```ts
  export { default as TimelineSection } from './TimelineSection'
  export { default as TimelineEventCard } from './TimelineEventCard'
  export { default as TimelineSpoilerWrapper } from './TimelineSpoilerWrapper'
  export type { TimelineEvent, TimelineArc } from './types'
  ```

- [ ] **Step 3: Build to verify**

  ```bash
  cd client && yarn build 2>&1 | grep -E "TimelineSection|index" | head -10
  ```

  Expected: no errors from the new timeline files.

- [ ] **Step 4: Commit**

  ```bash
  cd client
  git add src/components/timeline/
  git commit -m "feat(timeline): add TimelineSection and barrel export — shared timeline design system complete"
  ```

---

## Task 16: Refactor CharacterTimeline

**Files:**
- Modify: `client/src/components/CharacterTimeline.tsx`

- [ ] **Step 1: Replace `CharacterTimeline.tsx`**

  ```tsx
  'use client'

  import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
  import {
    Badge,
    Box,
    Button,
    Card,
    Divider,
    Group,
    Stack,
    Text,
    rem,
    useMantineTheme,
  } from '@mantine/core'
  import { getEntityThemeColor } from '../lib/mantine-theme'
  import { getEventColorKey, getEventIcon, getEventLabel } from '../lib/timeline-constants'
  import { Calendar, BookOpen, Eye, EyeOff, X } from 'lucide-react'
  import Link from 'next/link'
  import { TimelineSection } from './timeline'
  import type { TimelineEvent, TimelineArc } from './timeline'

  interface CharacterTimelineProps {
    events: TimelineEvent[]
    arcs: TimelineArc[]
    characterName: string
    firstAppearanceChapter: number
  }

  const CharacterTimeline = React.memo(function CharacterTimeline({
    events,
    arcs,
    characterName,
    firstAppearanceChapter,
  }: CharacterTimelineProps) {
    const theme = useMantineTheme()
    const [selectedEventTypes, setSelectedEventTypes] = useState<Set<string>>(new Set())
    const [showAllEvents, setShowAllEvents] = useState(false)

    const uniqueEventTypes = useMemo(() => {
      const types = new Set<string>()
      events.forEach((e) => { if (e.type) types.add(e.type) })
      return Array.from(types)
    }, [events])

    const filteredEvents = useMemo(() => {
      const sorted = [...events].sort((a, b) =>
        a.chapterNumber !== b.chapterNumber
          ? a.chapterNumber - b.chapterNumber
          : (a.pageNumber ?? 0) - (b.pageNumber ?? 0)
      )
      if (selectedEventTypes.size === 0) return sorted
      return sorted.filter((e) => e.type && selectedEventTypes.has(e.type))
    }, [events, selectedEventTypes])

    const timelineSections = useMemo(() => {
      const arcLookup = new Map(arcs.map((arc) => [arc.id, arc]))
      const arcEvents = new Map<number, TimelineEvent[]>()

      filteredEvents.forEach((event) => {
        if (!event.arcId || !arcLookup.has(event.arcId)) return
        if (!arcEvents.has(event.arcId)) arcEvents.set(event.arcId, [])
        arcEvents.get(event.arcId)!.push(event)
      })

      return Array.from(arcEvents.entries())
        .map(([arcId, arcEventsList]) => ({ arc: arcLookup.get(arcId)!, events: arcEventsList }))
        .sort((a, b) => a.arc.startChapter - b.arc.startChapter)
    }, [filteredEvents, arcs])

    const visibleSections = useMemo(
      () => (showAllEvents ? timelineSections : timelineSections.slice(0, 3)),
      [timelineSections, showAllEvents]
    )

    const uniqueChapters = useMemo(
      () =>
        Array.from(new Set(filteredEvents.map((e) => e.chapterNumber)))
          .sort((a, b) => a - b)
          .slice(0, 10),
      [filteredEvents]
    )

    const scrollToArc = useCallback((arcId: number) => {
      requestAnimationFrame(() => {
        document
          .getElementById(`timeline-arc-${arcId}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      })
    }, [])

    const scrollToChapter = useCallback(
      (chapterNumber: number) => {
        const target = filteredEvents.find((e) => e.chapterNumber === chapterNumber)
        if (!target) return
        requestAnimationFrame(() => {
          const el = document.getElementById(`event-${target.id}`)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            el.classList.add('timeline-event-highlight')
            setTimeout(() => el.classList.remove('timeline-event-highlight'), 2500)
          }
        })
      },
      [filteredEvents]
    )

    const toggleEventType = useCallback((type: string) => {
      setSelectedEventTypes((prev) => {
        const next = new Set(prev)
        next.has(type) ? next.delete(type) : next.add(type)
        return next
      })
    }, [])

    return (
      <Card className="gambling-card" withBorder radius="md" shadow="lg" p="xl">
        <Stack gap="lg">
          {/* Header */}
          <Group justify="space-between" align="flex-start" gap="md">
            <Group gap="sm" align="center">
              <Calendar size={20} />
              <Text fw={600}>{characterName} Timeline</Text>
            </Group>
            <Button
              component={Link}
              href={`/events?characterId=${encodeURIComponent(characterName)}`}
              size="xs"
              variant="outline"
              style={{ color: getEntityThemeColor(theme, 'gamble') }}
            >
              View All Events
            </Button>
          </Group>

          {/* First appearance */}
          {firstAppearanceChapter > 0 && (
            <Badge
              variant="filled"
              leftSection={<BookOpen size={14} />}
              radius="sm"
              onClick={() => scrollToChapter(firstAppearanceChapter)}
              style={{ color: getEntityThemeColor(theme, 'media'), cursor: 'pointer', alignSelf: 'flex-start' }}
            >
              First Appearance: Chapter {firstAppearanceChapter}
            </Badge>
          )}

          {/* Type filter */}
          {uniqueEventTypes.length > 0 && (
            <Stack gap="xs">
              <Text size="sm" c="dimmed">Filter by Event Type</Text>
              <Group gap={8} wrap="wrap">
                {uniqueEventTypes.map((type) => {
                  const isSelected = selectedEventTypes.has(type)
                  const EventIcon = getEventIcon(type)
                  return (
                    <Badge
                      key={type}
                      color={getEventColorKey(type)}
                      variant={isSelected ? 'filled' : 'outline'}
                      radius="sm"
                      leftSection={<EventIcon size={12} />}
                      onClick={() => toggleEventType(type)}
                      style={{ cursor: 'pointer', opacity: isSelected ? 1 : 0.6 }}
                    >
                      {getEventLabel(type)}
                    </Badge>
                  )
                })}
                {selectedEventTypes.size > 0 && (
                  <Button
                    leftSection={<X size={14} />}
                    size="xs"
                    variant="light"
                    color="gray"
                    onClick={() => setSelectedEventTypes(new Set())}
                  >
                    Clear
                  </Button>
                )}
              </Group>
            </Stack>
          )}

          {/* Quick nav */}
          {filteredEvents.length > 0 && (
            <Stack gap="xs">
              <Divider color="rgba(255,255,255,0.08)" />
              <Text size="sm" c="dimmed">Quick Navigation</Text>
              {timelineSections.length > 1 && (
                <Stack gap={4}>
                  <Text size="xs" c="dimmed">Jump to Arc</Text>
                  <Group gap={6} wrap="wrap">
                    {timelineSections.slice(0, 5).map((s) => (
                      <Badge
                        key={s.arc.id}
                        variant="outline"
                        style={{ color: getEntityThemeColor(theme, 'gamble'), cursor: 'pointer' }}
                        radius="sm"
                        onClick={() => scrollToArc(s.arc.id)}
                      >
                        {s.arc.name}
                      </Badge>
                    ))}
                  </Group>
                </Stack>
              )}
              {uniqueChapters.length > 0 && (
                <Stack gap={4}>
                  <Text size="xs" c="dimmed">Jump to Chapter</Text>
                  <Group gap={6} wrap="wrap">
                    {uniqueChapters.map((ch) => (
                      <Badge
                        key={ch}
                        variant="outline"
                        style={{ color: getEntityThemeColor(theme, 'media'), cursor: 'pointer' }}
                        radius="sm"
                        onClick={() => scrollToChapter(ch)}
                      >
                        Ch. {ch}
                      </Badge>
                    ))}
                  </Group>
                </Stack>
              )}
            </Stack>
          )}

          <Divider color="rgba(255,255,255,0.08)" />

          {/* Empty state */}
          {filteredEvents.length === 0 && (
            <Box style={{ textAlign: 'center', paddingBlock: rem(24) }}>
              <Text size="sm" c="dimmed">
                No events found{selectedEventTypes.size > 0 ? ' matching your filters' : ''}.
              </Text>
            </Box>
          )}

          {/* Show all / show less */}
          {timelineSections.length > 3 && (
            <Box style={{ textAlign: 'center' }}>
              <Button
                leftSection={showAllEvents ? <EyeOff size={14} /> : <Eye size={14} />}
                size="xs"
                variant="light"
                color="gray"
                onClick={() => setShowAllEvents((v) => !v)}
              >
                {showAllEvents ? 'Show Less' : `Show All ${timelineSections.length} Arcs`}
              </Button>
            </Box>
          )}

          {/* Sections */}
          {visibleSections.length > 0 && (
            <Stack gap="xl">
              {visibleSections.map((section, i) => (
                <Box key={section.arc.id} id={`timeline-arc-${section.arc.id}`}>
                  {i > 0 && <Divider color="rgba(255,255,255,0.08)" variant="dashed" mb="xl" />}
                  <TimelineSection
                    label={section.arc.name}
                    subtitle={`Chapters ${section.arc.startChapter}${section.arc.endChapter && section.arc.endChapter !== section.arc.startChapter ? `–${section.arc.endChapter}` : ''}`}
                    accentColor={getEntityThemeColor(theme, 'event')}
                    events={section.events}
                  />
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
      </Card>
    )
  })

  export default CharacterTimeline
  export type { TimelineEvent, TimelineArc }
  ```

- [ ] **Step 2: Build to verify**

  ```bash
  cd client && yarn build 2>&1 | grep "CharacterTimeline" | head -10
  ```

  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  cd client
  git add src/components/CharacterTimeline.tsx
  git commit -m "refactor(timeline): revamp CharacterTimeline — use shared components, remove DOM injection"
  ```

---

## Task 17: Refactor ArcTimeline

**Files:**
- Modify: `client/src/components/ArcTimeline.tsx`

- [ ] **Step 1: Replace `ArcTimeline.tsx`**

  ```tsx
  'use client'

  import React, { useMemo, useState, useCallback } from 'react'
  import {
    Badge,
    Box,
    Button,
    Card,
    Divider,
    Group,
    Stack,
    Text,
    rem,
    useMantineTheme,
  } from '@mantine/core'
  import { getEntityThemeColor } from '../lib/mantine-theme'
  import { getEventColorKey, getEventIcon, getEventLabel } from '../lib/timeline-constants'
  import { BookOpen, X } from 'lucide-react'
  import { TimelineSection } from './timeline'
  import type { TimelineEvent } from './timeline'

  interface ArcTimelineProps {
    events: TimelineEvent[]
    arcName: string
    startChapter: number
    endChapter: number
    accentColor?: string
  }

  const ArcTimeline = React.memo(function ArcTimeline({
    events,
    arcName,
    startChapter,
    endChapter,
    accentColor,
  }: ArcTimelineProps) {
    const theme = useMantineTheme()
    const sectionColor = accentColor ?? getEntityThemeColor(theme, 'arc')

    const [selectedEventTypes, setSelectedEventTypes] = useState<Set<string>>(new Set())

    const uniqueEventTypes = useMemo(() => {
      const types = new Set<string>()
      events.forEach((e) => { if (e.type) types.add(e.type) })
      return Array.from(types)
    }, [events])

    const filteredEvents = useMemo(() => {
      const sorted = [...events].sort((a, b) =>
        a.chapterNumber !== b.chapterNumber
          ? a.chapterNumber - b.chapterNumber
          : (a.pageNumber ?? 0) - (b.pageNumber ?? 0)
      )
      if (selectedEventTypes.size === 0) return sorted
      return sorted.filter((e) => e.type && selectedEventTypes.has(e.type))
    }, [events, selectedEventTypes])

    const toggleEventType = useCallback((type: string) => {
      setSelectedEventTypes((prev) => {
        const next = new Set(prev)
        next.has(type) ? next.delete(type) : next.add(type)
        return next
      })
    }, [])

    return (
      <Card className="gambling-card" withBorder radius="md" shadow="lg" p="xl">
        <Stack gap="lg">
          {/* Header */}
          <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
            <Group gap="sm" align="center">
              <BookOpen size={20} />
              <Text fw={600}>{arcName} — Events</Text>
            </Group>
            <Badge
              variant="outline"
              style={{ color: sectionColor, borderColor: `${sectionColor}40` }}
            >
              Chapters {startChapter}{endChapter && endChapter !== startChapter ? `–${endChapter}` : ''}
            </Badge>
          </Group>

          {/* Type filter */}
          {uniqueEventTypes.length > 0 && (
            <Group gap={8} wrap="wrap">
              <Text size="sm" c="dimmed" style={{ marginRight: rem(4) }}>Filter:</Text>
              {uniqueEventTypes.map((type) => {
                const isSelected = selectedEventTypes.has(type)
                const EventIcon = getEventIcon(type)
                return (
                  <Badge
                    key={type}
                    color={getEventColorKey(type)}
                    variant={isSelected ? 'filled' : 'outline'}
                    radius="sm"
                    leftSection={<EventIcon size={12} />}
                    onClick={() => toggleEventType(type)}
                    style={{ cursor: 'pointer', opacity: isSelected ? 1 : 0.6 }}
                  >
                    {getEventLabel(type)}
                  </Badge>
                )
              })}
              {selectedEventTypes.size > 0 && (
                <Button
                  leftSection={<X size={14} />}
                  size="xs"
                  variant="light"
                  color="gray"
                  onClick={() => setSelectedEventTypes(new Set())}
                >
                  Clear
                </Button>
              )}
            </Group>
          )}

          <Divider color="rgba(255,255,255,0.08)" />

          {filteredEvents.length === 0 ? (
            <Box style={{ textAlign: 'center', paddingBlock: rem(24) }}>
              <Text size="sm" c="dimmed">
                No events found{selectedEventTypes.size > 0 ? ' matching your filters' : ''}.
              </Text>
            </Box>
          ) : (
            <TimelineSection
              label={arcName}
              subtitle="All events in this arc · sorted by chapter"
              accentColor={sectionColor}
              events={filteredEvents}
            />
          )}
        </Stack>
      </Card>
    )
  })

  export default ArcTimeline
  ```

- [ ] **Step 2: Build to verify**

  ```bash
  cd client && yarn build 2>&1 | grep "ArcTimeline" | head -10
  ```

  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  cd client
  git add src/components/ArcTimeline.tsx
  git commit -m "refactor(timeline): revamp ArcTimeline — use shared components, remove hover modal and DOM injection"
  ```

---

## Task 18: Refactor GambleTimeline

**Files:**
- Modify: `client/src/components/GambleTimeline.tsx`

- [ ] **Step 1: Replace `GambleTimeline.tsx`**

  ```tsx
  'use client'

  import React, { useCallback, useMemo, useState } from 'react'
  import {
    Badge,
    Box,
    Button,
    Card,
    Divider,
    Group,
    Stack,
    Text,
    rem,
    useMantineTheme,
  } from '@mantine/core'
  import { Eye, EyeOff, X } from 'lucide-react'
  import { getEntityThemeColor } from '../lib/mantine-theme'
  import {
    getEventColorKey,
    getEventIcon,
    getEventLabel,
    getPhaseColor,
  } from '../lib/timeline-constants'
  import { TimelineSection } from './timeline'
  import type { TimelineEvent, TimelineArc } from './timeline'

  interface GambleTimelineProps {
    events: TimelineEvent[]
    arcs: TimelineArc[]
    gambleName: string
    gambleChapter: number
  }

  interface Phase {
    key: string
    title: string
    description: string
    events: TimelineEvent[]
  }

  export default React.memo(function GambleTimeline({
    events,
    arcs: _arcs,
    gambleName,
    gambleChapter,
  }: GambleTimelineProps) {
    const theme = useMantineTheme()
    const [selectedEventTypes, setSelectedEventTypes] = useState<Set<string>>(new Set())
    const [showAll, setShowAll] = useState(false)

    const uniqueEventTypes = useMemo(() => {
      const types = new Set<string>()
      events.forEach((e) => { if (e.type) types.add(e.type) })
      return Array.from(types)
    }, [events])

    const filteredEvents = useMemo(() => {
      const sorted = [...events].sort((a, b) =>
        a.chapterNumber !== b.chapterNumber
          ? a.chapterNumber - b.chapterNumber
          : (a.pageNumber ?? 0) - (b.pageNumber ?? 0)
      )
      if (selectedEventTypes.size === 0) return sorted
      return sorted.filter((e) => e.type && selectedEventTypes.has(e.type))
    }, [events, selectedEventTypes])

    const phases = useMemo((): Phase[] => {
      const result: Phase[] = []

      const pre = filteredEvents.filter((e) => e.chapterNumber < gambleChapter)
      if (pre.length > 0) {
        result.push({ key: 'setup', title: 'Setup & Lead-up', description: 'Events leading to the gamble', events: pre })
      }

      const main = filteredEvents.find((e) => e.type === 'gamble' && e.chapterNumber === gambleChapter)
      if (main) {
        result.push({ key: 'gamble', title: 'The Gamble', description: gambleName, events: [main] })
      }

      const post = filteredEvents.filter((e) => e.chapterNumber > gambleChapter)
      if (post.length > 0) {
        const reveals = post.filter((e) => e.type === 'reveal' || e.type === 'shift')
        const resolutions = post.filter((e) => e.type === 'resolution')
        const others = post.filter((e) => !reveals.includes(e) && !resolutions.includes(e))

        if (reveals.length > 0 || others.length > 0) {
          result.push({
            key: 'reveals',
            title: 'Reveals & Developments',
            description: 'Unfolding consequences and revelations',
            events: [...reveals, ...others].sort((a, b) => a.chapterNumber - b.chapterNumber),
          })
        }
        if (resolutions.length > 0) {
          result.push({ key: 'resolution', title: 'Resolution', description: 'Final outcome and conclusions', events: resolutions })
        }
      }

      return result
    }, [filteredEvents, gambleName, gambleChapter])

    const visiblePhases = useMemo(
      () => (showAll ? phases : phases.slice(0, 3)),
      [phases, showAll]
    )

    const toggleEventType = useCallback((type: string) => {
      setSelectedEventTypes((prev) => {
        const next = new Set(prev)
        next.has(type) ? next.delete(type) : next.add(type)
        return next
      })
    }, [])

    return (
      <Card className="gambling-card" withBorder radius="md" shadow="lg" p="xl">
        <Stack gap="lg">
          {/* Header */}
          <Group justify="space-between" align="flex-start" gap="md">
            <Text fw={600}>Gamble Timeline</Text>
          </Group>

          {/* Type filter */}
          {uniqueEventTypes.length > 0 && (
            <Group gap={8} wrap="wrap">
              <Text size="sm" c="dimmed" style={{ marginRight: rem(4) }}>Filter:</Text>
              {uniqueEventTypes.map((type) => {
                const isSelected = selectedEventTypes.has(type)
                const EventIcon = getEventIcon(type)
                return (
                  <Badge
                    key={type}
                    color={getEventColorKey(type)}
                    variant={isSelected ? 'filled' : 'outline'}
                    radius="sm"
                    leftSection={<EventIcon size={12} />}
                    onClick={() => toggleEventType(type)}
                    style={{ cursor: 'pointer', opacity: isSelected ? 1 : 0.6 }}
                  >
                    {getEventLabel(type)}
                  </Badge>
                )
              })}
              {selectedEventTypes.size > 0 && (
                <Button
                  leftSection={<X size={14} />}
                  size="xs"
                  variant="light"
                  color="gray"
                  onClick={() => setSelectedEventTypes(new Set())}
                >
                  Clear
                </Button>
              )}
            </Group>
          )}

          <Divider color="rgba(255,255,255,0.08)" />

          {visiblePhases.length === 0 ? (
            <Box style={{ textAlign: 'center', paddingBlock: rem(24) }}>
              <Text c="dimmed">No timeline events found for this gamble.</Text>
            </Box>
          ) : (
            <Stack gap="xl">
              {visiblePhases.map((phase, i) => (
                <Box key={phase.key}>
                  {i > 0 && <Divider color="rgba(255,255,255,0.06)" variant="dashed" mb="xl" />}
                  <TimelineSection
                    label={phase.title}
                    subtitle={phase.description}
                    accentColor={getPhaseColor(theme, phase.key)}
                    events={phase.events}
                  />
                </Box>
              ))}
            </Stack>
          )}

          {phases.length > visiblePhases.length && (
            <Box style={{ textAlign: 'center' }}>
              <Button
                leftSection={showAll ? <EyeOff size={14} /> : <Eye size={14} />}
                variant="light"
                color="gray"
                size="xs"
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll ? 'Show Less' : `Show All (${phases.length} phases)`}
              </Button>
            </Box>
          )}
        </Stack>
      </Card>
    )
  })
  ```

- [ ] **Step 2: Build to verify**

  ```bash
  cd client && yarn build 2>&1 | grep "GambleTimeline" | head -10
  ```

  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  cd client
  git add src/components/GambleTimeline.tsx
  git commit -m "refactor(timeline): revamp GambleTimeline — use shared components, keep phase grouping"
  ```

---

## Task 19: Final Build and Lint Verification

- [ ] **Step 1: Full server build and lint**

  ```bash
  cd server && yarn build && yarn lint
  ```

  Expected: zero TypeScript errors, zero ESLint errors.

- [ ] **Step 2: Full client build and lint**

  ```bash
  cd client && yarn build && yarn lint
  ```

  Expected: zero TypeScript errors, zero ESLint errors. If there are remaining references to `EventStatus` or removed API methods that were missed in Tasks 8–12, fix them now.

- [ ] **Step 3: Run server test suite one final time**

  ```bash
  cd server && yarn test
  ```

  Expected: all tests pass.

- [ ] **Step 4: Commit any lint/type fixes**

  ```bash
  git add -p   # stage only the fix files
  git commit -m "fix: resolve remaining type errors and lint warnings from events simplification"
  ```

- [ ] **Step 5: Confirm the old `TimelineSpoilerWrapper.tsx` component in `client/src/components/` is still present (it's used by the events detail page)**

  The file at `client/src/components/TimelineSpoilerWrapper.tsx` is **separate** from the new `client/src/components/timeline/TimelineSpoilerWrapper.tsx`. Check whether it's still used outside of the three timeline components:

  ```bash
  grep -r "from.*components/TimelineSpoilerWrapper" client/src --include="*.tsx" --include="*.ts"
  ```

  If it's only used by files you've already refactored (CharacterTimeline, ArcTimeline, GambleTimeline), it can be deleted. If it's still used elsewhere (e.g., `EventPageClient.tsx`), leave it in place.
