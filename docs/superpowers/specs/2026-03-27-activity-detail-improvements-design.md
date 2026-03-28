# Activity Detail Improvements — Design Spec

**Date:** 2026-03-27
**Scope:** Profile page, public user detail page, changelog page

---

## Problem

1. **Duplicate activity on profile page** — `ProfilePageClient.tsx` renders both `ProfileFieldLog` (submission statuses) and `PublicActivityTimeline` (wiki edits + approved submissions), producing two "Activity" boxes.
2. **Missing detail** — Wiki edit entries don't show which fields were changed (`changedFields` is available from the API but never rendered).
3. **Broken links** — Annotation and media submission entries link to `#` instead of their parent entity page.

---

## Approach

Unified activity feed per location, with inline changed-field display and correct links throughout.

---

## Section 1: Profile Page

**File:** `client/src/app/profile/ProfileFieldLog.tsx`
**File:** `client/src/app/profile/ProfilePageClient.tsx`

### Changes

- Remove `PublicActivityTimeline` from `ProfilePageClient.tsx` (lines 333–340) and its import.
- Enhance `ProfileFieldLog` to:
  - Fetch wiki edits via `api.getWikiEditsByUser(user.id, { limit: 50 })` in a `useEffect` (mirrors existing pattern in `PublicActivityTimeline`).
  - Merge wiki edit entries with submission/guide/progress entries, sorted descending by date.
  - Add **filter tabs** at the top of the activity box: `All | Submissions | Edits` — client-side filter on `kind` field of each entry.
- **Wiki edit entry display:**
  - Action badge (created / edited / deleted) in appropriate color.
  - Entity name as a clickable link to `/{entityType-plural}/{entityId}`.
  - Below the title row: changed fields inline as small muted text, e.g. *name, description* — truncated to 4 fields; if more, show "+N more".
- **Link fixes for submissions:**
  - Annotations: link to parent entity using `entityType`+`entityId` (e.g. `/characters/42`), not `#`.
  - Media: same — link to parent entity using `entityType`+`entityId`.
  - Guides: already correct (`/guides/{id}`).
  - Events: already correct (entity href from `entityType`+`entityId`).

---

## Section 2: Public User Detail Page

**File:** `client/src/components/PublicActivityTimeline.tsx`

### Changes

- Add **filter tabs**: `All | Submissions | Edits` — same client-side filter as profile page.
- **Wiki edit entries:** add changed fields inline below the entity link (same truncation/display as profile page).
- **Fix annotation/media links:** use `entityType`+`entityId` instead of falling back to `#`. The submission href function `submissionHref()` already handles this for non-guide types when `entityType`+`entityId` are present — verify the data flow is correct and the fallback `'#'` is removed for annotation/media cases where parent entity data is available.
- No API changes needed — `api.getWikiEditsByUser` already fetches and the data includes `changedFields`.

---

## Section 3: Changelog Page

**File:** `client/src/app/changelog/ChangelogPageContent.tsx`

### Changes

- **Wiki edit entries:** add a second line below the entity type / time row showing changed fields inline (e.g. *fields: name, description*), same truncation at 4 + "+N more". The `changedFields` data is already returned by `api.getRecentEdits` — it just isn't rendered.
- **Fix annotation links:** the `entityLink()` helper maps `annotation` to `'#'`. Edit log entries for annotations have `entityType: "annotation"` and `entityId: {annotationId}` but do NOT carry the annotation's parent entity info. Since annotations don't have standalone pages and the parent entity isn't in the edit log payload, annotation edit links will remain `#` (non-navigable) — this is acceptable. No change needed for annotation wiki edit links in changelog. The fix only applies to **submission** entries where `entityType`+`entityId` refer to the parent entity (character, gamble, etc.).
- No pagination, filter, or layout changes.

---

## Shared Display Rules for Changed Fields

```
changedFields: ["name", "description", "backstory", "affiliation", "status"]
→ display: name, description, backstory, affiliation +1 more
```

- Show as small (11–12px) muted text below the main title row.
- Capitalize first letter of each field name for readability.
- Skip fields starting with `priorStatus:` (internal metadata) from display.
- If `changedFields` is null/empty, show nothing (create/delete actions typically have no fields).

---

## No Server Changes Required

All needed data (`changedFields`, `entityType`, `entityId`, `entityName`) is already returned by existing API endpoints. This is a frontend-only change.

---

## Files to Change

| File | Change |
|---|---|
| `client/src/app/profile/ProfilePageClient.tsx` | Remove `PublicActivityTimeline` render + import |
| `client/src/app/profile/ProfileFieldLog.tsx` | Add wiki edits fetch, merge, filter tabs, changedFields display, fix annotation/media links |
| `client/src/components/PublicActivityTimeline.tsx` | Add filter tabs, changedFields display, fix annotation/media links |
| `client/src/app/changelog/ChangelogPageContent.tsx` | Add changedFields display, fix annotation links |
