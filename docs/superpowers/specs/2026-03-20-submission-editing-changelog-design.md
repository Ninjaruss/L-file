# Submission Editing, Changelog & Activity Feed — Design Spec

**Date:** 2026-03-20
**Status:** Approved

---

## Problem

Three related gaps exist in the current submission system:

1. **Annotations have no edit UI on the submissions/profile context.** An inline modal exists on entity pages (via `AnnotationSection.tsx`), but there is no dedicated edit page at `/submit-annotation?edit=id` for the profile/submissions flow.
2. **Submission edits are not logged.** `EditLogService` has full logging methods but they are never called from guides, media, or annotations services. As a result, the changelog shows nothing when a user edits their submission.
3. **Changelog and activity feed don't reflect submission edits.** The changelog "Wiki Edits" tab is a dead concept (nothing is written there from submissions), and the activity feed only tracks status changes — not user-initiated edits.

---

## Goals

- Add a dedicated edit page for annotations matching the guide/media `?edit=id` pattern (profile/submissions flow)
- Log all submission edits (guides, media, annotations) to EditLog
- Show submission edits in the unified changelog feed with correct action labels
- Show submission edits in the user profile activity feed
- Simplify the changelog filter by removing the "Wiki Edits" tab

---

## Approach

Extend the existing `EditLog` entity with `GUIDE`, `MEDIA`, `ANNOTATION` entity types. This keeps one source of truth for all edit activity and requires minimal new infrastructure. The changelog and activity feed already query EditLog — they just need to handle the new types.

---

## Backend Changes

### 1. EditLog entity type extension

Add `GUIDE`, `MEDIA`, `ANNOTATION` to the `EditLogEntityType` enum in `server/src/entities/edit-log.entity.ts`.

Update `getEditCountByUserGrouped()` in `edit-log.service.ts` to initialize and return counts for these three new entity types. Its return type is `Record<EditLogEntityType, number>` — adding new enum values changes this shape. The only known caller is `contributions.service.ts`, which aggregates all counts into `editsTotal` via `Object.values(...).reduce(...)`. This means guide/media/annotation edit counts will silently be added to `editsTotal` and `totalContributions`. This is the desired behavior — no explicit handling needed — but verify the contributions response shape is still correct after the change.

### 2. `priorStatus` encoding convention

The prior status is encoded as a string element in the `changedFields` string array using the exact prefix `priorStatus:` followed by the uppercase status value before the save. Examples: `"priorStatus:REJECTED"`, `"priorStatus:PENDING"`, `"priorStatus:APPROVED"`. Both the frontend changelog and activity feed parse this by filtering for an element starting with `"priorStatus:"` and extracting the value after the colon. This convention applies consistently across all three services.

### 3. Module wiring

`EditLogModule` is not `@Global()` and is not currently imported by `GuidesModule`, `MediaModule`, or `AnnotationsModule`. Add `EditLogModule` to the `imports` array of each of those three feature modules (`guides.module.ts`, `media.module.ts`, `annotations.module.ts`).

### 4. Submission service logging — guides

In `guides.service.ts`, inject `EditLogService` and call `logUpdate()` at the end of the user-facing `update()` method. Capture the guide's status **before** the save as `priorStatus`:

```ts
await this.editLogService.logUpdate(
  EditLogEntityType.GUIDE,
  guide.id,
  userId,
  [...changedFieldNames, `priorStatus:${priorStatus}`]
);
```

### 5. Submission service logging — media

In `media.service.ts`, inject `EditLogService` and call `logUpdate()` at the end of `updateOwnSubmission()` (the user-facing method at line ~512, **not** the admin `update()` method at line ~625).

Also fix the status reset behavior in `updateOwnSubmission()`: currently it resets status to `PENDING` unconditionally regardless of prior status. Change it to only reset to `PENDING` when the prior status was `REJECTED`, matching the guide behavior. Capture the prior status before saving:

```ts
await this.editLogService.logUpdate(
  EditLogEntityType.MEDIA,
  media.id,
  userId,
  [...changedFieldNames, `priorStatus:${priorStatus}`]
);
```

### 6. Submission service logging — annotations

In `annotations.service.ts`, inject `EditLogService` and call `logUpdate()` at the end of the `update()` method. The existing status-reset logic (REJECTED → PENDING) is already present. Capture the prior status before the save:

```ts
await this.editLogService.logUpdate(
  EditLogEntityType.ANNOTATION,
  annotation.id,
  userId,
  [...changedFieldNames, `priorStatus:${priorStatus}`]
);
```

### 7. EditLog entity name enrichment

`edit-log.service.ts` `getRecent()` currently enriches entity names for characters, gambles, arcs, etc. via lookup queries. Extend this to resolve entity names for:
- `GUIDE` → guide title
- `MEDIA` → media title
- `ANNOTATION` → format as `"{annotatedEntityType}: {annotatedEntityName}"` (e.g. `"Character: Baku Madarame"`)

### 8. New backend route: user submission edits

Add a route `GET /edit-log/my-submissions` to `edit-log.controller.ts`. This route requires authentication via `@UseGuards(JwtAuthGuard)`. The user ID comes from the JWT principal via `@CurrentUser()` — **not** from a query parameter. The route calls a new service method `getSubmissionEditsByUser(userId)` which returns the authenticated user's own EditLog rows filtered to `entityType IN (GUIDE, MEDIA, ANNOTATION)`.

```ts
@Get('my-submissions')
@UseGuards(JwtAuthGuard)
getMySubmissions(@CurrentUser() user: User) {
  return this.editLogService.getSubmissionEditsByUser(user.id);
}
```

Add `api.getMySubmissionEdits()` to `client/src/lib/api.ts` calling `GET /edit-log/my-submissions`.

### 9. Annotation single-record endpoint

Add `GET /annotations/my/:id` to `annotations.controller.ts` — fetches a single annotation owned by the authenticated user (requires `@UseGuards(JwtAuthGuard)`, user ID from `@CurrentUser()`). Add the corresponding `findMyOne(id, userId)` method to `annotations.service.ts`. Add `api.getMyAnnotationSubmission(id)` to `client/src/lib/api.ts` calling this route.

---

## Frontend Changes

### 9. Annotation edit page (`?edit=id`)

Extend `client/src/app/submit-annotation/SubmitAnnotationPageContent.tsx` with `?edit=id` query param support, matching the guide and media edit patterns:

- On mount, if `searchParams.get('edit')` is present, enter edit mode: call `api.getMyAnnotationSubmission(id)` and pre-populate all form fields from the fetched annotation.
- **In edit mode, bypass the `?type` and `?id` pre-population logic** (currently lines 52–53 read `searchParams.get('type')` and `searchParams.get('id')` to set `ownerType`/`ownerId`). In edit mode, these values come from the fetched annotation, not from query params — do not set initial state from query params when `?edit` is present.
- Show a rejection reason alert (same as guides) when the fetched annotation status is `REJECTED`.
- Show an "Editing" badge in the page header to distinguish edit mode from create mode.
- On submit in edit mode, call `api.updateAnnotation(id, data)` (PATCH) — this method already exists in `api.ts`.

**Relationship to existing inline modal:** The existing `AnnotationSection.tsx` inline modal edit path (used on entity pages like character pages) is **not changed**. The new `?edit=id` page is the edit entry point for the profile/submissions context only. Both paths coexist and call the same backend `PATCH /annotations/:id` endpoint.

### 10. Annotation edit entry point in SubmissionCard

In `client/src/components/SubmissionCard.tsx`, the `getEditLink()` function currently navigates annotation submissions to the entity page (`/{entityType}/{ownerId}`) and is gated behind a guard that requires `submission.ownerType && submission.ownerId`. Change the annotation branch to:

```ts
case 'annotation':
  return `/submit-annotation?edit=${submission.id}`;
```

Remove the `ownerType`/`ownerId` guard for this branch — the `/submit-annotation?edit=id` route only requires the annotation ID, not the owner type or owner ID.

### 11. Submission type colors

Add an `annotation` key to `textColors` in `client/src/lib/mantine-theme.ts` (or equivalent theme file) with a distinct color that does not conflict with existing values. Current colors in use: guide = green (`#51cf66`), media = purple (`#a855f7`), organization = purple (`#a855f7`). Use **orange** (e.g. `#ff922b`) for annotation to ensure visual distinction.

The existing `ChangelogPageContent.tsx` `entityColor()` function maps `annotation` to `textColors.secondary` (off-white). Update this mapping to use `textColors.annotation` (the new orange value). Also extend the entityType → label mapping for `GUIDE`, `MEDIA`, `ANNOTATION` in the changelog renderer.

### 12. Changelog filter simplification

In `client/src/app/changelog/ChangelogPageContent.tsx`:

- **Remove** the "Wiki Edits" type filter tab.
- **Keep** "All Activity" (unified default) and "Submissions" filter tabs.
- When `filterType === 'submissions'`: show the entity filter row with **only** Guide/Media/Annotation options.
- When `filterType === 'all'`: show the entity filter row with all entity types including Guide/Media/Annotation.
- Extend the entityType → color/label mapping for `GUIDE` (green), `MEDIA` (purple), `ANNOTATION` (orange).

**Action label logic** — when rendering an EditLog entry for a submission:
- Parse `changedFields` for an element starting with `"priorStatus:"`. Extract the value after the colon.
- If prior status was `REJECTED` → action label: **"resubmitted"**
- Otherwise → action label: **"edited"**
- Approved/rejected status change entries from `getRecentApprovedSubmissions` retain their existing "approved" / "rejected" labels.

### 13. Activity feed (ProfileFieldLog)

`ProfileFieldLog.tsx` is a pure presentational component that receives data via props. **Do not add API fetching inside this component.** Instead, fetch edit log data in the **parent profile page component** (the page that renders `ProfileFieldLog`) and pass it as a new prop `submissionEdits: EditLogEntry[]`.

In the parent profile page:
- Call `api.getMySubmissionEdits()` alongside existing data fetches.
- Pass the result to `ProfileFieldLog` as `submissionEdits`.

In `ProfileFieldLog.tsx`:
- Accept the new `submissionEdits` prop.
- Interleave edit log entries with existing status-change entries.
- Apply label logic: `priorStatus:REJECTED` in changedFields → **"resubmitted"**, otherwise **"edited"**.
- Keep the existing 5-item cap and sort-by-date behavior.
- Badge colors: green for guide edits, purple for media edits, orange for annotation edits.

---

## Data Flow Summary

```
User edits a REJECTED annotation → PATCH /annotations/:id
  → annotations.service.ts update()
    → priorStatus = annotation.status  // "REJECTED"
    → annotation.status = PENDING
    → Save entity
    → EditLogService.logUpdate(ANNOTATION, id, userId, [...fields, "priorStatus:REJECTED"])

Changelog fetch → edit-log.service.ts getRecent()
  → Returns EditLog rows including GUIDE/MEDIA/ANNOTATION types
  → Enriched with entity name lookups
  → ChangelogPageContent parses "priorStatus:REJECTED" → label: "resubmitted"

Profile activity fetch → GET /edit-log/my-submissions (JWT required)
  → Returns EditLog rows for authenticated user (GUIDE/MEDIA/ANNOTATION only)
  → Passed as submissionEdits prop to ProfileFieldLog
  → ProfileFieldLog parses "priorStatus:REJECTED" → label: "resubmitted"
```

---

## Out of Scope

- Edit history / diff view (what changed between versions)
- Moderation-side view of submission edit history
- Quotes or Events submission editing
- Pagination fix for combined changelog feed (separate concern)

---

## Files Changed

| File | Change |
|------|--------|
| `server/src/entities/edit-log.entity.ts` | Add GUIDE, MEDIA, ANNOTATION to enum |
| `server/src/modules/edit-log/edit-log.service.ts` | Enrich names for new types; add `getSubmissionEditsByUser()`; update `getEditCountByUserGrouped()` |
| `server/src/modules/edit-log/edit-log.controller.ts` | Add `GET /edit-log/my-submissions` route (JWT-guarded) |
| `server/src/modules/guides/guides.service.ts` | Inject EditLogService, call logUpdate on edit |
| `server/src/modules/guides/guides.module.ts` | Import EditLogModule |
| `server/src/modules/media/media.service.ts` | Inject EditLogService, call logUpdate in `updateOwnSubmission()`, fix unconditional status reset |
| `server/src/modules/media/media.module.ts` | Import EditLogModule |
| `server/src/modules/annotations/annotations.service.ts` | Inject EditLogService, call logUpdate on edit |
| `server/src/modules/annotations/annotations.module.ts` | Import EditLogModule |
| `server/src/modules/contributions/contributions.service.ts` | Verify editsTotal aggregation is correct after new enum values are included |
| `server/src/modules/annotations/annotations.controller.ts` | Add `GET /annotations/my/:id` route (JWT-guarded) |
| `client/src/lib/api.ts` | Add `getMyAnnotationSubmission`, `getMySubmissionEdits` |
| `client/src/lib/mantine-theme.ts` | Add `annotation` key to `textColors` (orange) |
| `client/src/app/submit-annotation/SubmitAnnotationPageContent.tsx` | Add edit mode with `?edit=id`; bypass `?type`/`?id` in edit mode |
| `client/src/components/SubmissionCard.tsx` | Fix annotation edit link in `getEditLink()`; remove ownerType/ownerId guard |
| `client/src/app/changelog/ChangelogPageContent.tsx` | Remove Wiki Edits tab, extend entity types and filter behavior |
| `client/src/app/profile/[username]/page.tsx` (or equivalent) | Fetch `getMySubmissionEdits`, pass as prop to ProfileFieldLog |
| `client/src/app/profile/ProfileFieldLog.tsx` | Accept `submissionEdits` prop, add edit log entries to activity feed |
