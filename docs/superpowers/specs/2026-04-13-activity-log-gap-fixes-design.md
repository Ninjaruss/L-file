# Activity Log Gap Fixes Design

**Date:** 2026-04-13
**Status:** Approved

## Problem

Several submission and editing actions are not being captured by the edit log, meaning they don't appear on the changelog page, the landing page activity section, or user profile activity. Specifically:

- **Quotes** have no logging at all — `QUOTE` is not in the `EditLogEntityType` enum, and `EditLogService` is not injected into `QuotesService`
- **Events** log update and delete but not create
- **Guides, media, and annotations** log updates but not the initial submission becoming "live" (i.e., when approved)
- **`getRecentApprovedSubmissions`** does not include quotes, so they never appear in the landing page/changelog feed regardless of logging

Additionally, update logging for quotes is entirely absent, leaving no record of edits to quotes.

## Goals

1. Add `QUOTE` as a tracked entity type
2. Log quote updates and deletes
3. Log guide/media/annotation/quote approvals as `CREATE` actions attributed to the **submitter** (not the moderator) — this is the moment a submission becomes public
4. Log event creation
5. Include quotes in `getRecentApprovedSubmissions`
6. Group consecutive event-create entries at display time to avoid feed flooding

## Non-Goals

- Replacing `getRecentApprovedSubmissions` with edit log queries (deferred — Option C)
- Logging approve/reject as their own action types — status changes are captured via `logUpdate` with `changedFields` including `priorStatus`
- Logging quote submissions at pending time — only at approval

## Design

### 1. Entity Type Enum (`edit-log.entity.ts`)

Add `QUOTE = 'quote'` to `EditLogEntityType`.

### 2. Database Migration

Generate a migration that extends the `edit_log_entity_type_enum` Postgres enum with the value `'quote'`. This must be done via `yarn db:generate` after updating the entity, then verified with `yarn db:migrate:dry-run`.

### 3. Edit Log Service (`edit-log.service.ts`)

**Inject `Quote` repository** and add a custom name resolver for quotes: fetch the `text` field and truncate to 80 characters (appending `…` if truncated).

**`resolveEntityNames`** — add a `QUOTE` branch using the truncated text as the display name.

**`resolveEntityNamesByType`** — add a `'quote'` case using the same truncation logic.

**`getSubmissionEditsByUser`** — add `EditLogEntityType.QUOTE` to the `entityType: In([...])` array so quote activity appears on user profiles.

**`getRecentApprovedSubmissions`** — add quotes alongside guides/media/annotations:
- Query `QuoteRepository` for `status: QuoteStatus.APPROVED`, with `submittedBy` relation
- Map to the same shape: `{ id, type: 'quote', title: quote.text (truncated 80), createdAt, submittedBy }`
- Include in the combined array before sorting by date

### 4. Edit Log Module (`edit-log.module.ts`)

Add `Quote` to the `TypeOrmModule.forFeature([...])` entity list.

### 5. Quotes Service (`quotes.service.ts`)

Inject `EditLogService`.

**`approve(id)`** — after saving the approved quote (which must be loaded with the `submittedBy` relation), call:
```
editLogService.logCreate(EditLogEntityType.QUOTE, quote.id, quote.submittedBy.id)
```

**`update(id, dto, user)`** — compute `changedFields` using `diffFields(existingQuote, dto)` before applying the update, then call:
```
editLogService.logUpdate(EditLogEntityType.QUOTE, id, user.id, changedFields)
```

**`remove(id, user)`** — after verifying permissions, call:
```
editLogService.logDelete(EditLogEntityType.QUOTE, id, user.id)
```

### 6. Quotes Module (`quotes.module.ts`)

Import `EditLogModule` so `EditLogService` is available.

### 7. Events Service (`events.service.ts`)

**`create(data, userId)`** — after saving the new event, call:
```
editLogService.logCreate(EditLogEntityType.EVENT, event.id, userId)
```

Note: the `create` method signature may need `userId` threaded through from the controller if not already present — check the controller call site.

### 8. Guides Service (`guides.service.ts`)

**`approve(id, moderator)`** — after saving the approved guide (loaded with `author` relation), call:
```
editLogService.logCreate(EditLogEntityType.GUIDE, guide.id, guide.authorId)
```

### 9. Media Service (`media.service.ts`)

**`approveSubmission(id)`** — after saving, load the media with `submittedBy` relation if not already present, then call:
```
editLogService.logCreate(EditLogEntityType.MEDIA, media.id, media.submittedBy.id)
```

### 10. Annotations Service (`annotations.service.ts`)

**`approve(id, moderator)`** — after saving the approved annotation (loaded with `author` relation), call:
```
editLogService.logCreate(EditLogEntityType.ANNOTATION, annotation.id, annotation.author.id)
```

### 11. Frontend — Display-Time Event Consolidation

In the changelog and profile activity feed components, after receiving the paginated edit log data, apply a grouping pass over consecutive entries where:
- `entityType === 'event'`
- `action === 'create'`
- Same `userId`
- `createdAt` within 5 minutes of the adjacent entry

Collapsed entries render as a single row: "created N events" with the user's avatar and a timestamp from the first entry in the group. Individual event names are not shown in the collapsed state (no expand needed for MVP).

This grouping is best-effort within each page of results — a group may be split across pagination boundaries, which is acceptable.

## Data Flow Summary

| Action | Who is logged as actor | Log action |
|---|---|---|
| Guide approved | Submitter (`guide.authorId`) | `CREATE` |
| Media approved | Submitter (`media.submittedBy.id`) | `CREATE` |
| Annotation approved | Submitter (`annotation.author.id`) | `CREATE` |
| Quote approved | Submitter (`quote.submittedBy.id`) | `CREATE` |
| Quote updated | Editor (`user.id`) | `UPDATE` + `changedFields` |
| Quote deleted | Deleter (`user.id`) | `DELETE` |
| Event created | Creator (`userId`) | `CREATE` |
| Event updated | Editor (`userId`) | `UPDATE` + `changedFields` (already works) |

## Testing Checklist

- Approve a guide → appears in changelog and submitter's profile activity
- Approve a media item → same
- Approve an annotation → same
- Submit and approve a quote → appears in changelog, submitter profile, and `getRecentApprovedSubmissions`
- Edit a quote → update log entry with correct `changedFields`
- Delete a quote → delete log entry
- Create an event → appears in changelog
- Create several events quickly → frontend collapses them into "created N events"
- Existing wiki edit logging (characters, arcs, etc.) unaffected
