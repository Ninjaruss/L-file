# Admin Dashboard Sort Alignment — Design Spec

**Date:** 2026-04-02

## Problem

Several admin dashboard resources have broken or no sorting because the frontend and backend use inconsistent query parameter names, and some backends never implemented sort support despite the admin UI exposing sortable columns.

## Complete Audit Findings

| Resource | Issue |
|---|---|
| **gambles** | Controller uses `sortBy`/`sortOrder`/`gambleName`; data provider sends `sort`/`order`/`name`. Sort and search both silently fail. Service also ignores sort direction for chapterId, doesn't handle `createdAt`. |
| **quotes** | Data provider sends `sort`/`order` (quotes is in the sort list), but controller has no sort query params. Sort silently ignored, service has hardcoded order. |
| **character-relationships** | Backend controller already accepts `sort`/`order`, but data provider doesn't include this resource in the sort list. Sort params never sent. |
| **character-organizations** | Admin has `sort={{ field: 'id', order: 'DESC' }}` and `createdAt sortable` column, but backend has no sort params. |
| **annotations** | Admin has sortable `id`, `title`, `createdAt` columns, but data provider doesn't include annotations in the sort list, and backend DTO only has `sortOrder` (no sort field). |
| **badges** | Admin has sortable columns and `sort={{ field: 'displayOrder', order: 'ASC' }}`, but backend returns a flat unsorted list with no pagination or sort params. Badges is a small, rarely-changing list — dynamic sort adds no value. |

Resources fully aligned (no changes needed): characters, arcs, events, organizations, tags, chapters, volumes, media, guides, users.

## Decision

Standardize all resources to use `sort`/`order` query params (matching the existing convention). Fix each backend that's missing support. For badges specifically, hardcode `displayOrder ASC` in the service and remove misleading `sortable` props from the admin component.

## Changes

### Backend

**`gambles.controller.ts`**
- `@Query('gambleName')` → `@Query('name')`
- `@Query('sortBy')` → `@Query('sort')`
- `@Query('sortOrder')` → `@Query('order')`
- Update `@ApiQuery` swagger annotations to match
- Update the `if (... || sortBy)` trigger condition to use `sort`
- Pass renamed params to service `search()`

**`gambles.service.ts`**
- Rename `search()` interface: `gambleName`→`name`, `sortBy`→`sort`, `sortOrder`→`order`
- Fix sort logic: handle `name`, `chapterId`, `createdAt` fields with correct direction (currently `chapterId` always uses ASC regardless of requested order)

**`quotes.controller.ts`**
- Add `@Query('sort') sort?: string` and `@Query('order') order?: 'ASC' | 'DESC'`
- Pass to service `findAll()`

**`quotes.service.ts`**
- Accept `sort` and `order` in `findAll()` options
- Apply dynamic `orderBy` using the requested field/direction (default: `chapterNumber DESC`)

**`character-organizations.controller.ts`**
- Add `@Query('sort') sort?: string` and `@Query('order') order?: 'ASC' | 'DESC'`
- Pass to service `findAll()`

**`character-organizations.service.ts`**
- Accept `sort` and `order` in `findAll()` options and apply dynamic ordering

**`annotation-query.dto.ts`**
- Add `sort?: string` field (allows field-level sort alongside existing `sortOrder`)

**`annotations.service.ts`**
- Use `sort` field in `findAll()` when provided (alongside existing `sortOrder` direction support)

**`badges.service.ts`**
- Add `ORDER BY displayOrder ASC` to `findAllBadges()` so the list is consistently ordered

### Frontend

**`client/src/lib/api.ts`**
- `getGambles({ gambleName? })` → `getGambles({ name? })`

**`client/src/components/admin/AdminDataProvider.ts`**
- Add `'character-relationships'`, `'character-organizations'`, `'annotations'` to the `sort`/`order` resource list (line ~592)
- Badges stays out of the list (no server-side sort)

**`client/src/components/admin/Badges.tsx`**
- Remove `sort={{ field: 'displayOrder', order: 'ASC' }}` from `<BadgeList>`
- Remove `sortable` props from all Datagrid columns

## Out of Scope
- Annotations `title`/`id` sort fields require the backend to handle arbitrary field sorting; only `createdAt` direction sorting is supported. The `sort` DTO field added will enable field-level ordering if the service is extended.
- No changes to guides, characters, arcs, events, organizations, tags, chapters, volumes, or media (all aligned).
