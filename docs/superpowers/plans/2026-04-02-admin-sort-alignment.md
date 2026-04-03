# Admin Sort Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix sorting (and search) across all admin dashboard resources by aligning query parameter names and implementing missing backend sort support.

**Architecture:** Each task fixes one resource end-to-end (backend controller + service → frontend callers). All resources converge on the `sort`/`order` convention already used by the majority. No new files are created; every change is a targeted edit.

**Tech Stack:** NestJS (backend), TypeORM (query builder), React Admin + custom DataProvider (frontend), TypeScript (both)

---

## File Map

| File | Change |
|---|---|
| `server/src/modules/gambles/gambles.controller.ts` | Rename `gambleName`→`name`, `sortBy`→`sort`, `sortOrder`→`order` in params + Swagger |
| `server/src/modules/gambles/gambles.service.ts` | Rename search interface fields; fix sort logic to apply direction for all fields |
| `client/src/lib/api.ts` | Rename `gambleName`→`name` in `getGambles()` signature |
| `client/src/app/gambles/GamblesPageContent.tsx` | Rename `params.gambleName`→`params.name`, `params.sortBy`→`params.sort`, `params.sortOrder`→`params.order` |
| `client/src/app/gambles/page.tsx` | Rename `gambleName`→`name` |
| `client/src/components/RichMarkdownEditor/InsertEntityModal.tsx` | Rename `gambleName`→`name` |
| `server/src/modules/quotes/quotes.controller.ts` | Add `@Query('sort')` and `@Query('order')` params |
| `server/src/modules/quotes/quotes.service.ts` | Add `sort`/`order` to `findAll` options; apply dynamic `orderBy` |
| `server/src/modules/character-organizations/character-organizations.controller.ts` | Add `@Query('sort')` and `@Query('order')` params |
| `server/src/modules/character-organizations/character-organizations.service.ts` | Add `sort`/`order` to `findAll` filters; apply dynamic `orderBy` |
| `server/src/modules/annotations/dto/annotation-query.dto.ts` | Add `sort` field |
| `server/src/modules/annotations/annotations.service.ts` | Apply `sort` field in `findAll` |
| `client/src/components/admin/AdminDataProvider.ts` | Add `character-relationships`, `character-organizations`, `annotations` to sort list |
| `client/src/components/admin/Badges.tsx` | Remove misleading `sortable` props (backend already returns `displayOrder ASC`) |

---

## Task 1: Fix gambles controller param names

**Files:**
- Modify: `server/src/modules/gambles/gambles.controller.ts`

- [ ] **Step 1: Rename `@ApiQuery` decorator for gambleName**

  Find:
  ```typescript
  @ApiQuery({
    name: 'gambleName',
    required: false,
    description: 'Filter by gamble name (case-insensitive partial match)',
    example: 'protoporos',
  })
  ```
  Replace with:
  ```typescript
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Filter by gamble name (case-insensitive partial match)',
    example: 'protoporos',
  })
  ```

- [ ] **Step 2: Rename `@ApiQuery` decorators for sortBy and sortOrder**

  Find:
  ```typescript
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Field to sort by (name or chapterId)',
    example: 'name',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order (ASC or DESC)',
    example: 'ASC',
  })
  ```
  Replace with:
  ```typescript
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Field to sort by (name, chapterId, or createdAt)',
    example: 'chapterId',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    description: 'Sort order (ASC or DESC)',
    example: 'DESC',
  })
  ```

- [ ] **Step 3: Rename `findAll` method query params**

  Find:
  ```typescript
  async findAll(
    @Query('gambleName') gambleName?: string,
    @Query('participantName') participantName?: string,
    @Query('teamName') teamName?: string,
    @Query('chapterId', new ParseIntPipe({ optional: true }))
    chapterId?: number,
    @Query('characterId', new ParseIntPipe({ optional: true }))
    characterId?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('page') page = '1',
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    const pageNum = parseInt(page) || 1;

    // If any filters or sort are provided, use the search functionality
    if (
      gambleName ||
      participantName ||
      teamName ||
      chapterId ||
      characterId ||
      limit ||
      sortBy
    ) {
      return this.gamblesService.search({
        gambleName,
        participantName,
        teamName,
        chapterId,
        characterId,
        limit: limit || 12, // Default limit for client
        page: pageNum,
        sortBy,
        sortOrder,
      });
    }
  ```
  Replace with:
  ```typescript
  async findAll(
    @Query('name') name?: string,
    @Query('participantName') participantName?: string,
    @Query('teamName') teamName?: string,
    @Query('chapterId', new ParseIntPipe({ optional: true }))
    chapterId?: number,
    @Query('characterId', new ParseIntPipe({ optional: true }))
    characterId?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('page') page = '1',
    @Query('sort') sort?: string,
    @Query('order') order?: 'ASC' | 'DESC',
  ) {
    const pageNum = parseInt(page) || 1;

    // If any filters or sort are provided, use the search functionality
    if (
      name ||
      participantName ||
      teamName ||
      chapterId ||
      characterId ||
      limit ||
      sort
    ) {
      return this.gamblesService.search({
        name,
        participantName,
        teamName,
        chapterId,
        characterId,
        limit: limit || 12, // Default limit for client
        page: pageNum,
        sort,
        order,
      });
    }
  ```

- [ ] **Step 4: Verify server builds**

  ```bash
  cd server && yarn build
  ```
  Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 5: Commit**

  ```bash
  cd server && git add src/modules/gambles/gambles.controller.ts
  git commit -m "fix: standardize gambles controller to sort/order/name query params"
  ```

---

## Task 2: Fix gambles service sort logic

**Files:**
- Modify: `server/src/modules/gambles/gambles.service.ts`

- [ ] **Step 1: Rename search interface fields and fix gambleName filter**

  Find:
  ```typescript
  async search(filters: {
    gambleName?: string;
    participantName?: string;
    teamName?: string;
    chapterId?: number;
    characterId?: number;
    limit?: number;
    page?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  })
  ```
  Replace with:
  ```typescript
  async search(filters: {
    name?: string;
    participantName?: string;
    teamName?: string;
    chapterId?: number;
    characterId?: number;
    limit?: number;
    page?: number;
    sort?: string;
    order?: 'ASC' | 'DESC';
  })
  ```

- [ ] **Step 2: Update the name filter inside search()**

  Find:
  ```typescript
    if (filters.gambleName) {
      query.andWhere('LOWER(gamble.name) LIKE LOWER(:gambleName)', {
        gambleName: `%${filters.gambleName}%`,
      });
    }
  ```
  Replace with:
  ```typescript
    if (filters.name) {
      query.andWhere('LOWER(gamble.name) LIKE LOWER(:name)', {
        name: `%${filters.name}%`,
      });
    }
  ```

- [ ] **Step 3: Fix sort logic to respect direction for all fields**

  Find:
  ```typescript
    // Apply sorting
    const sortOrder = filters.sortOrder === 'DESC' ? 'DESC' : 'ASC';
    if (filters.sortBy === 'name') {
      query.orderBy('gamble.name', sortOrder).addOrderBy('gamble.id', 'ASC');
    } else {
      query.orderBy('gamble.chapterId', 'ASC').addOrderBy('gamble.id', 'ASC');
    }
  ```
  Replace with:
  ```typescript
    // Apply sorting
    const sortDir: 'ASC' | 'DESC' = filters.order === 'ASC' ? 'ASC' : 'DESC';
    if (filters.sort === 'name') {
      query.orderBy('gamble.name', sortDir).addOrderBy('gamble.id', 'ASC');
    } else if (filters.sort === 'createdAt') {
      query.orderBy('gamble.createdAt', sortDir).addOrderBy('gamble.id', 'ASC');
    } else {
      // Default: sort by chapterId (respects requested direction)
      query.orderBy('gamble.chapterId', sortDir).addOrderBy('gamble.id', 'ASC');
    }
  ```

- [ ] **Step 4: Verify server builds**

  ```bash
  cd server && yarn build
  ```
  Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 5: Commit**

  ```bash
  cd server && git add src/modules/gambles/gambles.service.ts
  git commit -m "fix: rename gambles search interface to sort/order/name, apply sort direction correctly"
  ```

---

## Task 3: Update gambles frontend callers

**Files:**
- Modify: `client/src/lib/api.ts`
- Modify: `client/src/app/gambles/GamblesPageContent.tsx`
- Modify: `client/src/app/gambles/page.tsx`
- Modify: `client/src/components/RichMarkdownEditor/InsertEntityModal.tsx`

- [ ] **Step 1: Update `api.ts` getGambles signature**

  Find:
  ```typescript
  async getGambles(params?: { page?: number; limit?: number; gambleName?: string }) {
  ```
  Replace with:
  ```typescript
  async getGambles(params?: { page?: number; limit?: number; name?: string }) {
  ```

- [ ] **Step 2: Update GamblesPageContent.tsx sort and search params**

  Find:
  ```typescript
    const params: any = { page, limit: 12 }
    if (searchQuery) params.gambleName = searchQuery
    if (sortBy === 'name') { params.sortBy = 'name'; params.sortOrder = 'ASC' }
    else if (sortBy === 'chapter') { params.sortBy = 'chapterId'; params.sortOrder = 'ASC' }
  ```
  Replace with:
  ```typescript
    const params: any = { page, limit: 12 }
    if (searchQuery) params.name = searchQuery
    if (sortBy === 'name') { params.sort = 'name'; params.order = 'ASC' }
    else if (sortBy === 'chapter') { params.sort = 'chapterId'; params.order = 'ASC' }
  ```

- [ ] **Step 3: Update gambles/page.tsx search param**

  Find:
  ```typescript
      const params: { page: number; limit: number; gambleName?: string } = { page, limit: 12 }
      if (search) params.gambleName = search
  ```
  Replace with:
  ```typescript
      const params: { page: number; limit: number; name?: string } = { page, limit: 12 }
      if (search) params.name = search
  ```

- [ ] **Step 4: Update InsertEntityModal.tsx**

  Find:
  ```typescript
        const res = await api.getGambles({ gambleName: query, limit: 10 })
  ```
  Replace with:
  ```typescript
        const res = await api.getGambles({ name: query, limit: 10 })
  ```

- [ ] **Step 5: Verify client builds**

  ```bash
  cd client && yarn build
  ```
  Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 6: Commit**

  ```bash
  cd client && git add src/lib/api.ts src/app/gambles/GamblesPageContent.tsx src/app/gambles/page.tsx src/components/RichMarkdownEditor/InsertEntityModal.tsx
  git commit -m "fix: update gambles callers from gambleName/sortBy/sortOrder to name/sort/order"
  ```

---

## Task 4: Add sort support to quotes

**Files:**
- Modify: `server/src/modules/quotes/quotes.controller.ts`
- Modify: `server/src/modules/quotes/quotes.service.ts`

- [ ] **Step 1: Add sort/order params to quotes controller findAll**

  In `quotes.controller.ts`, in the `findAll` method, add two new `@Query` params after the existing ones (before `@CurrentUser()`):

  Find:
  ```typescript
    @Query('status') status?: string,
    @CurrentUser() user?: User,
  ```
  Replace with:
  ```typescript
    @Query('status') status?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: 'ASC' | 'DESC',
    @CurrentUser() user?: User,
  ```

- [ ] **Step 2: Pass sort/order to the service in quotes controller**

  Find:
  ```typescript
      return this.quotesService.findAll({
        characterId,
        chapterNumber,
        chapterRange,
        search,
        submittedById,
        page,
        limit,
        status: status as QuoteStatus | undefined,
  ```
  Replace with:
  ```typescript
      return this.quotesService.findAll({
        characterId,
        chapterNumber,
        chapterRange,
        search,
        submittedById,
        page,
        limit,
        sort,
        order,
        status: status as QuoteStatus | undefined,
  ```

- [ ] **Step 3: Add sort/order to quotes service findAll options interface**

  Find:
  ```typescript
  async findAll(options?: {
    characterId?: number;
    chapterNumber?: number;
    chapterRange?: { start: number; end: number };
    search?: string;
    submittedById?: number;
    page?: number;
    limit?: number;
    includeAll?: boolean;
    status?: QuoteStatus;
  })
  ```
  Replace with:
  ```typescript
  async findAll(options?: {
    characterId?: number;
    chapterNumber?: number;
    chapterRange?: { start: number; end: number };
    search?: string;
    submittedById?: number;
    page?: number;
    limit?: number;
    includeAll?: boolean;
    status?: QuoteStatus;
    sort?: string;
    order?: 'ASC' | 'DESC';
  })
  ```

- [ ] **Step 4: Apply dynamic sort in quotes service**

  Find:
  ```typescript
      const queryBuilder = this.quotesRepository
        .createQueryBuilder('quote')
        .leftJoinAndSelect('quote.character', 'character')
        .leftJoinAndSelect('quote.submittedBy', 'submittedBy')
        .orderBy('quote.createdAt', 'DESC');
  ```
  Replace with:
  ```typescript
      const QUOTE_SORT_FIELDS: Record<string, string> = {
        id: 'quote.id',
        chapterNumber: 'quote.chapterNumber',
        createdAt: 'quote.createdAt',
      };
      const sortField = QUOTE_SORT_FIELDS[options?.sort ?? ''] ?? 'quote.chapterNumber';
      const sortDir: 'ASC' | 'DESC' = options?.order === 'ASC' ? 'ASC' : 'DESC';

      const queryBuilder = this.quotesRepository
        .createQueryBuilder('quote')
        .leftJoinAndSelect('quote.character', 'character')
        .leftJoinAndSelect('quote.submittedBy', 'submittedBy')
        .orderBy(sortField, sortDir);
  ```

- [ ] **Step 5: Verify server builds**

  ```bash
  cd server && yarn build
  ```
  Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 6: Commit**

  ```bash
  cd server && git add src/modules/quotes/quotes.controller.ts src/modules/quotes/quotes.service.ts
  git commit -m "feat: add sort/order support to quotes controller and service"
  ```

---

## Task 5: Add sort support to character-organizations

**Files:**
- Modify: `server/src/modules/character-organizations/character-organizations.controller.ts`
- Modify: `server/src/modules/character-organizations/character-organizations.service.ts`

- [ ] **Step 1: Add sort/order params to controller findAll**

  Find:
  ```typescript
  async findAll(
    @Query('characterId') characterId?: string,
    @Query('organizationId') organizationId?: string,
    @Query('userProgress') userProgress?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll({
      characterId: characterId ? parseInt(characterId, 10) : undefined,
      organizationId: organizationId ? parseInt(organizationId, 10) : undefined,
      userProgress: userProgress ? parseInt(userProgress, 10) : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
    });
  }
  ```
  Replace with:
  ```typescript
  async findAll(
    @Query('characterId') characterId?: string,
    @Query('organizationId') organizationId?: string,
    @Query('userProgress') userProgress?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: 'ASC' | 'DESC',
  ) {
    return this.service.findAll({
      characterId: characterId ? parseInt(characterId, 10) : undefined,
      organizationId: organizationId ? parseInt(organizationId, 10) : undefined,
      userProgress: userProgress ? parseInt(userProgress, 10) : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
      sort,
      order,
    });
  }
  ```

- [ ] **Step 2: Add sort/order to service findAll filters interface**

  Find:
  ```typescript
  async findAll(filters: {
    characterId?: number;
    organizationId?: number;
    userProgress?: number;
    page?: number;
    limit?: number;
  })
  ```
  Replace with:
  ```typescript
  async findAll(filters: {
    characterId?: number;
    organizationId?: number;
    userProgress?: number;
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'ASC' | 'DESC';
  })
  ```

- [ ] **Step 3: Apply dynamic sort in service findAll**

  Find:
  ```typescript
    const {
      characterId,
      organizationId,
      userProgress,
      page = 1,
      limit = 25,
    } = filters;

    const query = this.repo
      .createQueryBuilder('co')
      .leftJoinAndSelect('co.character', 'character')
      .leftJoinAndSelect('co.organization', 'organization')
      .orderBy('co.startChapter', 'ASC');
  ```
  Replace with:
  ```typescript
    const {
      characterId,
      organizationId,
      userProgress,
      page = 1,
      limit = 25,
      sort,
      order,
    } = filters;

    const CO_SORT_FIELDS: Record<string, string> = {
      id: 'co.id',
      createdAt: 'co.createdAt',
      startChapter: 'co.startChapter',
    };
    const sortField = CO_SORT_FIELDS[sort ?? ''] ?? 'co.id';
    const sortDir: 'ASC' | 'DESC' = order === 'ASC' ? 'ASC' : 'DESC';

    const query = this.repo
      .createQueryBuilder('co')
      .leftJoinAndSelect('co.character', 'character')
      .leftJoinAndSelect('co.organization', 'organization')
      .orderBy(sortField, sortDir);
  ```

- [ ] **Step 4: Verify server builds**

  ```bash
  cd server && yarn build
  ```
  Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 5: Commit**

  ```bash
  cd server && git add src/modules/character-organizations/character-organizations.controller.ts src/modules/character-organizations/character-organizations.service.ts
  git commit -m "feat: add sort/order support to character-organizations"
  ```

---

## Task 6: Add sort field to annotations

**Files:**
- Modify: `server/src/modules/annotations/dto/annotation-query.dto.ts`
- Modify: `server/src/modules/annotations/annotations.service.ts`

- [ ] **Step 1: Add `sort` field to AnnotationQueryDto**

  Find (at the end of the class, before the closing `}`):
  ```typescript
    @IsOptional()
    @IsIn(['ASC', 'DESC'])
    sortOrder?: 'ASC' | 'DESC' = 'DESC';
  }
  ```
  Replace with:
  ```typescript
    @IsOptional()
    @IsIn(['ASC', 'DESC'])
    sortOrder?: 'ASC' | 'DESC' = 'DESC';

    @ApiPropertyOptional({
      description: 'Field to sort by',
      enum: ['id', 'title', 'createdAt'],
      default: 'createdAt',
    })
    @IsOptional()
    @IsIn(['id', 'title', 'createdAt'])
    sort?: string = 'createdAt';
  }
  ```

- [ ] **Step 2: Apply sort field in annotations service findAll**

  Find:
  ```typescript
    const {
      status,
      ownerType,
      authorId,
      page = 1,
      limit = 20,
      sortOrder = 'DESC',
    } = query;
  ```
  Replace with:
  ```typescript
    const {
      status,
      ownerType,
      authorId,
      page = 1,
      limit = 20,
      sortOrder = 'DESC',
      sort = 'createdAt',
    } = query;
  ```

- [ ] **Step 3: Apply dynamic sort field in the orderBy call**

  Find:
  ```typescript
    queryBuilder.orderBy('annotation.createdAt', sortOrder);
  ```
  Replace with:
  ```typescript
    const ANNOTATION_SORT_FIELDS: Record<string, string> = {
      id: 'annotation.id',
      title: 'annotation.title',
      createdAt: 'annotation.createdAt',
    };
    const sortField = ANNOTATION_SORT_FIELDS[sort] ?? 'annotation.createdAt';
    queryBuilder.orderBy(sortField, sortOrder);
  ```

- [ ] **Step 4: Verify server builds**

  ```bash
  cd server && yarn build
  ```
  Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 5: Commit**

  ```bash
  cd server && git add src/modules/annotations/dto/annotation-query.dto.ts src/modules/annotations/annotations.service.ts
  git commit -m "feat: add sort field to annotations query DTO and service"
  ```

---

## Task 7: Update AdminDataProvider sort list

**Files:**
- Modify: `client/src/components/admin/AdminDataProvider.ts`

- [ ] **Step 1: Add character-relationships, character-organizations, and annotations to the sort list**

  Find:
  ```typescript
    } else if (['characters', 'arcs', 'events', 'gambles', 'organizations', 'tags', 'quotes', 'chapters', 'volumes', 'media'].includes(resource)) {
      query.sort = field
      query.order = order
    }
  ```
  Replace with:
  ```typescript
    } else if (['characters', 'arcs', 'events', 'gambles', 'organizations', 'tags', 'quotes', 'chapters', 'volumes', 'media', 'character-relationships', 'character-organizations', 'annotations'].includes(resource)) {
      query.sort = field
      query.order = order
    }
  ```

- [ ] **Step 2: Verify client builds**

  ```bash
  cd client && yarn build
  ```
  Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

  ```bash
  cd client && git add src/components/admin/AdminDataProvider.ts
  git commit -m "fix: add character-relationships, character-organizations, annotations to admin sort list"
  ```

---

## Task 8: Remove misleading sortable UI from Badges

**Files:**
- Modify: `client/src/components/admin/Badges.tsx`

> **Context:** The badges backend already returns records ordered by `displayOrder ASC, name ASC` (hardcoded in `badges.service.ts`). There is no pagination and no sort param support. Removing `sort`/`sortable` from the admin UI prevents React Admin from sending sort params to a backend that ignores them, and avoids confusing column-header click behavior.

- [ ] **Step 1: Remove sort prop and sortable columns from BadgeList**

  Find:
  ```typescript
  export const BadgeList = () => (
    <List actions={<BadgeActions />} sort={{ field: 'displayOrder', order: 'ASC' }}>
      <Datagrid rowClick="show">
        <FunctionField
  ```
  Replace with:
  ```typescript
  export const BadgeList = () => (
    <List actions={<BadgeActions />}>
      <Datagrid rowClick="show">
        <FunctionField
  ```

- [ ] **Step 2: Remove `sortable` props from each column**

  Find:
  ```typescript
        <TextField source="name" sortable />
        <TextField source="type" sortable />
  ```
  Replace with:
  ```typescript
        <TextField source="name" />
        <TextField source="type" />
  ```

  Find:
  ```typescript
        <NumberField source="displayOrder" sortable label="Order" />
        <BooleanField source="isActive" sortable />
        <BooleanField source="isManuallyAwardable" sortable label="Manual Award" />
        <DateField source="createdAt" sortable showTime={false} />
  ```
  Replace with:
  ```typescript
        <NumberField source="displayOrder" label="Order" />
        <BooleanField source="isActive" />
        <BooleanField source="isManuallyAwardable" label="Manual Award" />
        <DateField source="createdAt" showTime={false} />
  ```

- [ ] **Step 3: Verify client builds**

  ```bash
  cd client && yarn build
  ```
  Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**

  ```bash
  cd client && git add src/components/admin/Badges.tsx
  git commit -m "fix: remove misleading sortable UI from Badges admin list"
  ```
