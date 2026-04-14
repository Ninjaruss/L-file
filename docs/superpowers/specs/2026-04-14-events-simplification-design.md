# Events Module Simplification — Design Spec

**Date:** 2026-04-14  
**Status:** Approved  
**Scope:** Events module only. All other approval workflows (guides, media, annotations) are untouched.

---

## Overview

Simplify the events module from an over-engineered approval-workflow system into a lightweight, timeline-friendly feature. Remove approval logic, tighten permissions to editorial roles, consolidate three divergent timeline UI components into one shared design system.

---

## 1. Database

### Migration (one TypeORM migration, no data loss)

| Operation | Column | Notes |
|---|---|---|
| DROP COLUMN | `status` | enum `pending/approved/rejected` |
| DROP COLUMN | `rejection_reason` | varchar(500), nullable |
| ADD COLUMN | `page_number` | `INTEGER NULL` |
| ADD INDEX | `(chapter_number, page_number)` | composite, for timeline sort |

Existing events with any `status` value become unconditionally visible — no migration of status data required (the public list endpoint never filtered by status by default anyway).

### Entity (`event.entity.ts`)

**Remove:**
- `EventStatus` enum
- `status` column
- `rejectionReason` column

**Add:**
- `pageNumber: number | null` — `@Column({ nullable: true })`, used for sub-chapter ordering

**Unchanged:** `id`, `title`, `description`, `type` (EventType enum), `chapterNumber`, `spoilerChapter`, `arcId`/`arc`, `gambleId`/`gamble`, `characters` (M2M), `createdBy`, `tags`, `createdAt`, `updatedAt`

**Default sort order:** `chapterNumber ASC, pageNumber ASC NULLS LAST`

---

## 2. Backend

### Permissions

| Endpoint | Required Role |
|---|---|
| `GET /events` | Public |
| `GET /events/grouped/by-arc` | Public |
| `GET /events/:id` | Public |
| `POST /events` | `editor`, `moderator`, `admin` |
| `PATCH /events/:id` | `editor`, `moderator`, `admin` |
| `DELETE /events/:id` | `admin` |

Regular `user` role cannot create or edit events.

### Endpoints Removed

- `PUT /events/:id/own` — owner-submission update
- `PUT /events/:id/approve`
- `PUT /events/:id/reject`
- `GET /events/by-arc/:arcId`
- `GET /events/by-gamble/:gambleId`
- `GET /events/by-chapter/:chapterNumber`

### Endpoints Kept / Changed

- `GET /events` — filters updated: replace name-string `arc`/`character` params with integer ID params (`arcId`, `gambleId`, `chapterId`, `characterId`); keep `search` (title+description ILIKE), `type`, `page`, `limit`, `sort` (`chapterNumber`|`createdAt`), `order`; remove `status` filter
- `GET /events/grouped/by-arc` — kept unchanged (frontend browse page depends on it); remove `status` filter param
- `GET /events/:id` — unchanged
- `POST /events` — `status` removed from accepted payload
- `PUT /events/:id` → **`PATCH /events/:id`** — partial update; `status`/`rejectionReason` removed

### DTOs

**`CreateEventDto`:**
- Remove `status` field
- Add optional `pageNumber?: number` (`@IsNumber()`, `@IsOptional()`, `@Min(1)`)

**`UpdateEventDto`:** `PartialType(CreateEventDto)` — inherits automatically

**`FilterEventsDto`** (new, replaces inline query params on controller):
- `type?: EventType`
- `arcId?: number`
- `gambleId?: number`
- `chapterNumber?: number`
- `characterId?: number`
- `search?: string`
- `page?: number` (default 1)
- `limit?: number` (default 20)
- `sort?: 'chapterNumber' | 'createdAt'` (default `chapterNumber`)
- `order?: 'ASC' | 'DESC'` (default `ASC`)

### Service Methods Removed

`findByArc`, `findByGamble`, `findByChapter`, `findViewableEvents`, `canViewEvent`, `findByType`, `getEventsByChapter`, `searchEvents`, `updateOwnSubmission`

### Service Methods Kept

`findAll`, `findOne`, `findGroupedByArc`, `create`, `update`, `remove`

`findAll` updated: replace string-name filters with ID filters; remove status filter; default sort becomes `chapterNumber ASC, pageNumber ASC NULLS LAST`.

---

## 3. Frontend — Types & API Client

### `client/src/types/index.ts`

**Remove from `Event` interface:** `status`, `rejectionReason`  
**Remove:** `EventStatus` enum  
**Add to `Event` interface:** `pageNumber?: number | null`

### `client/src/lib/api.ts`

**Remove methods:** `approveEvent`, `rejectEvent`, `updateOwnEvent`, `getMyEventSubmission`, `getEventsByArc`, `getEventsByGamble`, `getEventsByChapter`

**Update `updateEvent`:** change from `this.put(...)` to `this.patch(...)` to match the endpoint change from `PUT` to `PATCH`.

---

## 4. Frontend — Existing Event Pages

### `EventsPageContent.tsx` (browse/list page)
- Remove `eventStatusOptions` and status `<Select>` filter
- Remove `EventStatus` import
- Remove status badge from hover modal card
- Fetch logic unchanged (still calls `getEventsGroupedByArc` for browsing, `getEvents` for search)

### `EventPageClient.tsx` (detail page)
- Remove `canEdit` check based on `status`/`createdBy` — replace with role check: `['editor', 'moderator', 'admin'].includes(user?.role)`
- Remove rejection reason banner
- Remove status badge display

### `EventFormCard.tsx` + `SubmitEventPageContent.tsx` (submit form)
- Add `pageNumber?: number | ''` to `EventFormData`
- Add optional `NumberInput` for Page Number below Chapter Number
- Remove `status` from submit payload

### `client/src/app/events/[id]/edit/EditEventPageContent.tsx` (edit form)
- Same form changes as submit form (add `pageNumber`, remove `status`)
- Update edit permission check to role-based

### Admin panel (`client/src/components/admin/Events.tsx`)
- Remove approve/reject action buttons and their `api.*` calls
- Remove `SelectInput` for `status` from create/edit forms
- Remove `rejectionReason` field
- Add `pageNumber` `NumberInput` (optional)
- Remove status column from `<Datagrid>` list view
- Remove status filter from `<Filter>` component

---

## 5. Frontend — Shared Timeline Components

### New folder: `client/src/components/timeline/`

#### `timeline/types.ts`
Single shared `TimelineEvent` interface:
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
```

#### `timeline/TimelineSpoilerWrapper.tsx`
Single shared implementation replacing the three inline copies in `CharacterTimeline`, `GambleTimeline`, and `ArcTimeline`. Same reveal-on-click behavior with blur/overlay.

#### `timeline/TimelineEventCard.tsx`
Unified card component used by all three timeline pages:
- Horizontal layout: left = colored icon circle (type color + icon from `timeline-constants`); right = title (bold), badge row (Ch. X, optional `p. Y` when `pageNumber` present, type badge), description (2-line clamp, dimmed)
- Rail dot above the card, dot color matches event type
- Card links to `/events/:id`
- Wrapped by `TimelineSpoilerWrapper`

#### `timeline/TimelineSection.tsx`
Section wrapper with labeled header:
- Left accent bar (3px, colored per section type/arc)
- Section title + subtitle
- Event count badge
- Vertical left-rail connector line (2px, colored, opacity 0.2) running through stacked event entries below

### Visual design (approved via mockup)
- Dark background (`#1a1a1a` surface, `#161616` card)
- Vertical layout for all three contexts
- Left-rail connector between events
- Section headers distinguish arc names (Character/Arc) from phase names (Gamble)
- Spoiler overlay: blurred card + red overlay, click to reveal
- Type filter: compact badge row at top, toggle active/inactive

---

## 6. Frontend — Revamped Timeline Components

### `CharacterTimeline.tsx`
- Remove inline `TimelineSpoilerWrapper` and `globalStyles` DOM injection
- Use `<TimelineSection>` per arc, label = arc name, subtitle = chapter range
- Use `<TimelineEventCard>` for each event
- Keep: type filter badges, quick nav (jump to arc / jump to chapter), show all / show less toggle, `scrollToChapter` highlight behavior (via CSS class on shared card, not inline style injection)

### `ArcTimeline.tsx`
- Remove inline `TimelineSpoilerWrapper`, DOM style injection, hover modal portal
- Single `<TimelineSection>` for the arc itself
- Use `<TimelineEventCard>` for each event
- Keep: type filter badges
- Remove: character filter, hover modal

### `GambleTimeline.tsx`
- Remove inline `TimelineSpoilerWrapper`
- Four `<TimelineSection>` sections: Setup & Lead-up, The Gamble, Reveals & Developments, Resolution — same phase logic as current, section label colors use `getPhaseColor` from `timeline-constants`
- Use `<TimelineEventCard>` for each event
- Keep: type filter badges, show all / show less toggle

---

## 7. Out of Scope

- Organization relationship on events (not added)
- `occurredAt` string field (not added)
- Client-side grouping migration (grouped/by-arc endpoint stays on server)
- Character filter on ArcTimeline (not added back)
- Any changes to guides, media, annotations approval workflows
