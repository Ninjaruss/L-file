# Wiki Edit Tracking — Changelog & Activity Pages

**Date:** 2026-03-27
**Status:** Approved

## Overview

Track edits to core wiki content pages (characters, arcs, gambles, organizations, events, chapters) in the existing edit log system, then surface those edits in the changelog page and user activity timelines.

Currently only guides, media, and annotations log edits. The `EditLogEntityType` enum already includes CHARACTER, GAMBLE, ARC, ORGANIZATION, EVENT — chapters need to be added. Controllers for these entities do not call `editLogService` at all.

---

## Section 1: Server — Enum & Name Resolution

### Changes to `edit-log.entity.ts`
Add `CHAPTER = 'chapter'` to `EditLogEntityType` enum.

### Changes to `edit-log.service.ts`
- Inject `ChapterRepository` via `@InjectRepository(Chapter)`
- Add a `CHAPTER` branch to `resolveEntityNames`: fetch chapters by ID, display as `"Ch. {number}"` (falling back to `title` if number is null)
- Add a `'chapter'` case to `resolveEntityNamesByType` switch statement

### Changes to `edit-log.module.ts`
Register `TypeOrmModule.forFeature([..., Chapter])` so the repository is available.

---

## Section 2: Server — Wire Edit Logging into 6 Entities

**Entities:** characters, arcs, gambles, organizations, events, chapters

For each entity, follow the same pattern as guides/media/annotations:

### Service changes (per entity)
- Inject `EditLogService` in the constructor
- Update `create(dto)` → `create(dto, userId: number)`: call `editLogService.logCreate(EntityType, result.id, userId)` after saving
- Update `update(id, dto)` → `update(id, dto, userId: number)`: call `editLogService.logUpdate(EntityType, id, userId, Object.keys(dto))` after saving
- Update `remove(id)` → `remove(id, userId: number)`: call `editLogService.logDelete(EntityType, id, userId)` before or after deleting

### Controller changes (per entity)
- Import `CurrentUser` decorator and `User` entity (already imported in characters controller)
- Add `@CurrentUser() user: User` parameter to `@Post`, `@Put`, `@Delete` handlers
- Pass `user.id` to the corresponding service method

### Module changes (per entity)
- Import `EditLogModule` in each feature module so `EditLogService` is available for injection

---

## Section 3: Server — New Public Endpoint

Add to `EditLogController`:

```
GET /edit-log/user/:id
```

- **Auth:** Public (no guard)
- **Params:** `userId` (path), `page` (query, default 1), `limit` (query, default 20, max 50)
- **Behavior:** Returns paginated edit log entries for the given user, filtered to wiki entity types only: `[character, arc, gamble, organization, event, chapter]` — excludes guide/media/annotation (those are already shown as approved submissions)
- **Response shape:** Same as `/edit-log/recent` — `{ data, total, page, totalPages }` with `entityName` enriched

Add corresponding `getWikiEditsByUser(userId, options)` method to `EditLogService`.

---

## Section 4: Client — API Client & Changelog Filter

### `client/src/lib/api.ts`
Add method:
```ts
getWikiEditsByUser(userId: number, params?: { page?: number; limit?: number })
```
Calls `GET /edit-log/user/:userId` with query params.

### `client/src/app/changelog/ChangelogPageContent.tsx`
- Add `'chapter'` to the `EntityFilter` type union
- Add `{ label: 'Chapters', value: 'chapter' }` to `ALL_ENTITY_OPTIONS`
- Add `chapter: '/chapters'` to the `entityLink` map
- Add `chapter: textColors.chapter` (or appropriate fallback) to the `entityColor` map

---

## Section 5: Client — PublicActivityTimeline

### Data fetching
`PublicActivityTimeline` becomes responsible for fetching its own wiki edit data. It receives `userId: number` and `submissions: any[]` as props (replacing the current submissions-only prop). On mount it calls `api.getWikiEditsByUser(userId)` and merges results with submissions, sorted by date descending.

### Rendering wiki edit entries
New entry kind for wiki edits:
- Left border color: entity type color (using `entityColor` from mantine-theme or a local map)
- Badge: action label — "edited", "created", or "deleted"
- Title/link: entity name linking to the entity page (e.g. `/characters/5`)
- Sub-label: entity type (e.g. "Character")
- Timestamp: relative time

### Type expansion
Extend the `PublicEventType` union and add color/label/border maps for: `character`, `arc`, `gamble`, `organization`, `event` (already in map for submission link resolution), `chapter`.

---

## Section 6: Client — Own Profile Page

### `client/src/app/profile/ProfilePageClient.tsx`
- Import and render `PublicActivityTimeline` in the profile layout (alongside or below the existing `ProfileIntelPanel` / `ProfileContentTabs` panels)
- Pass the current user's `id` and their approved submissions (already fetched for `ProfileContentTabs`)

---

## Out of Scope
- Volumes (excluded per user decision)
- Quotes, translations, annotations — not core wiki pages
- Admin-only edit log views (already handled in React Admin if needed)
- Diffing / showing what specifically changed (changedFields captured but not displayed in timeline)
