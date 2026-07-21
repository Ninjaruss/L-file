# Admin Panel Quality Audit — 2026-07-20

Comprehensive audit of the React-Admin admin panel (18 resources + data provider + shell), cross-checked against the NestJS backend controllers/DTOs/entities. Dimensions: correctness & data functions, data integrity & validation, UX consistency, safety & permissions. Conducted by 8 parallel auditors; findings de-duplicated and ranked below. Verified anchors noted.

## Root cause (the theme behind most findings)

**Frontend ⇄ backend contract drift.** The backend enforces a strict global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` plus per-endpoint allow-lists for filters/sorts and `@Roles()` guards. The admin frontend + `AdminDataProvider` were not kept in sync with those contracts, producing four repeating failure modes:

1. **Form sends a field the DTO doesn't allow → hard 400** (breaks the whole save/list).
2. **Filter/sort key not in the backend allow-list → silent no-op** (looks applied, isn't).
3. **HTTP verb / route mismatch → 404** (feature entirely broken).
4. **Required DTO field not marked `required` in the form → confusing late 400.**

Plus cross-cutting gaps: audit-log coverage, delete confirmations, bulk-op error handling, self-lockout protection, and UI role-gating that doesn't match backend guards.

---

## CRITICAL — feature fully broken, or data exposure

**C1. Every Event edit fails (404).** [VERIFIED] `AdminDataProvider.update` PUTs (`usePatch` list omits `events`) but `events.controller.ts` only defines `@Patch(':id')`. → Add `'events'` to the `usePatch` arrays (update + updateMany).
`AdminDataProvider.ts:930,982`, `server/src/modules/events/events.controller.ts:98`

**C2. Badge create/edit/delete are entirely broken.** [VERIFIED] `badges.controller.ts` has no `POST /badges`, `PUT`/`PATCH /badges/:id`, or `DELETE /badges/:id` — only award/revoke. Every Badge CRUD 404s. Compounding: the Badge `type` choices `supporter`/`active_supporter`/`sponsor` don't exist in the backend `BadgeType` enum (only `CUSTOM`), so even the award/type paths that touch them fail at the DB enum. → Add real badge CRUD routes, or repoint the Badge admin UI at the existing endpoints; reconcile the `type` choices with `BadgeType`.
`Badges.tsx:345-355,494-504`, `server/src/entities/badge.entity.ts:13-15`, `badges.controller.ts`

**C3. Every Annotation edit fails (400).** [mechanism VERIFIED] `cleanUpdateData` has no `annotations` branch, so it sends `ownerType/ownerId/status/rejectionReason/authorId`; `UpdateAnnotationDto` allows only `title/content/sourceUrl/chapterReference/isSpoiler/spoilerChapter` and `forbidNonWhitelisted` rejects the rest. → Add an `annotations` allow-list branch to `cleanUpdateData`.
`AdminDataProvider.ts` (cleanUpdateData), `Annotations.tsx:795-961`

**C4. Annotation list "Search" 400s the whole list.** [mechanism] The search box sends `search`, absent from `AnnotationQueryDto` → `forbidNonWhitelisted` 400s `findAll`; list goes blank. (Also never wired to a real query.) → Add a real `search` filter to the DTO/service, or remove the box.
`Annotations.tsx:480-497`, `server/src/modules/annotations/dto/annotation-query.dto.ts`

**C5. Every Media create fails (400).** [VERIFIED] Create form sends `status`; `CreateMediaDto` has no `status` field. → Strip `status` from the media create payload (or accept+ignore it on the DTO).
`AdminDataProvider.ts:256-287`, `Media.tsx:2851-2860`, `create-media.dto.ts`

**C6. Create-Guide's Author field 400s the whole save.** [VERIFIED] `GuideCreate` sends `authorId` (and `rejectionReason`); `CreateGuideDto` has neither. → Remove those inputs from `GuideCreate`, or add `authorId`/`rejectionReason` to `CreateGuideDto` with the admin-only guard the update path uses.
`Guides.tsx:2572,2580`, `create-guide.dto.ts`

**C7. Media "All" status filter secretly shows Approved-only.** `handleStatusFilter('all')` deletes the `status` key; with no `status` param, `MediaService.findAll` defaults to `approved`. Moderators clicking "All" never see pending/rejected items — a silent moderation blind spot. → Send `status=all` explicitly (backend has a bypass branch for it).
`Media.tsx:609-615`, `media.service.ts:308-315`

**C8. Event list search boxes 400 the whole list.** The title/description/arc-name boxes send `title`/`description`/`arc` (not in `FilterEventsDto`) on every keystroke → `forbidNonWhitelisted` 400s the list. → Map `title`/`description` → the DTO's `search`, remap/drop `arc`.
`Events.tsx:337-381`, `filter-events.dto.ts`

**SEC1. `GET /guides` has no role guard — any logged-in user can read all private drafts.** [security] The endpoint used by the admin list is `@UseGuards(JwtAuthGuard)` only (no `RolesGuard`), and `findAll` applies no status/author scoping. Any authenticated `user` can call `GET /api/guides` and retrieve everyone's `pending`/`rejected` guides — content and `rejectionReason` included. `findOne` correctly 404s private guides for non-owners; `findAll` doesn't. → Add `@Roles(ADMIN,MODERATOR,EDITOR)` to `GET /guides`, or scope non-privileged callers to their own + approved guides.
`server/src/modules/guides/guides.controller.ts:350-466`, `guides.service.ts:133-306`

---

## HIGH — silently wrong data, or confusing failures

**H1. Guides `guideType` filter: broken pagination + bogus total.** [shell+guides] `guideType` is filtered client-side over only the current fetched page, and `total` is set to that page's post-filter length. Filtering by a type shows "1-N of N" and disables paging, hiding all matching guides on later pages. → Send entity filters (`characterIds/arcIds/gambleIds`, already supported) to the backend, or implement true server-side type filtering + count.
`AdminDataProvider.ts:593-681`

**H2. Bulk update/delete has no partial-failure handling.** `updateMany`/`deleteMany` fire N parallel requests via `Promise.all`; one failure rejects the whole thing after others already mutated, with a single generic error and no per-id result. → Use `Promise.allSettled` and report which ids failed.
`AdminDataProvider.ts:976-998,1013-1026`

**H3. `badges/award` drops `year`/`expiresAt`.** The data-provider award branch omits `expiresAt` and nests `year` under `metadata`; backend expects both top-level. Every awarded badge saves with `year=null`, `expiresAt=null` (permanent) regardless of what the modal showed. → Forward `year`/`expiresAt` as top-level fields.
`AdminDataProvider.ts:882-894`, `award-badge.dto.ts`

**H4. Editor-role entity-display media submissions silently vanish.** URL-add creates `pending` then calls approve (403 for editors, swallowed in `catch {}`); uploads stay `pending`; the refetch shows approved-only. Editor sees "success" but the item never appears. → Refetch including pending, and surface (don't swallow) the 403.
`EntityDisplayMediaSection.tsx:107-173`, `media.service.ts:183-187`

**H5. Generic media `update()` skips validation and audit logging.** `update(id, updateData: any)` does `Object.assign` with an `any` param (ValidationPipe skipped) and never logs to edit-log — unlike approve/reject/updateOwn. Lets an edit set `ownerType/ownerId` to a non-existent entity or force `status=approved` outside the approval workflow, unrecorded. → Add a real `UpdateMediaDto` + `editLogService.logUpdate`.
`media.controller.ts:903,973`, `media.service.ts:682-698`

**H6. No self-lockout / last-admin guard.** [safety] `UsersService.update`/`updateRole`/`remove` have no self-action or last-admin check; the sole admin can demote or delete themselves via the panel and leave zero admins. → Server-side reject self-demotion/self-deletion when it would drop admin count to zero; client-side disable the role selector + delete on your own row.
`users.service.ts:486-492,555-556`, `Users.tsx:1008-1203`

**H7. Several list filters/sorts silently no-op.** Backend allow-lists were never updated to match these UI controls:
- Characters list: `organizationId` and `firstAppearanceChapter_gte/_lte` dropped (`Characters.tsx:335-341`).
- Arcs list: `startChapter_gte`/`endChapter_lte` dropped; `startChapter`/`endChapter` columns `sortable` but not in `allowedSort` (`Arcs.tsx:164,248-249`).
- Tags list: "Search tags" (`q→name`) not read by backend (`Tags.tsx:30-31`).
- Quotes list: one-sided chapter range applies no filter (backend needs both ends) (`Quotes.tsx:118-119`).
→ Either implement the params server-side or remove the dead controls.

**H8. Required backend fields not enforced in forms → confusing 400s on save.**
- Arc `order` required, not marked/defaulted (`Arcs.tsx:793-799,981-988`).
- Chapter `title` required but helper text says "(optional)" (`Chapters.tsx:326-330`).
- Gamble `chapterId` and `rules` required, not marked on Create (`Gambles.tsx:800-806,608,813`).
- Relationship/Org `startChapter` (and Org `role`) required, not marked (`CharacterRelationships.tsx`, `CharacterOrganizations.tsx`).
→ Mark these `required` (or default them) and surface inline validation.

---

## MEDIUM — safety/UX/integrity

**M1. Delete-confirmation inconsistency.** `EventEdit`, `UserEdit`, `CharacterRelationshipEdit`, `CharacterOrganizationEdit`, and the Annotations bulk-delete use react-admin's default **undoable** delete (no confirm dialog) instead of the `EditToolbar`→`DeleteButtonWithConfirmation` / `mutationMode="pessimistic"` pattern used by Characters/Gambles/Organizations/Badges/Quotes/Tags. Destructive clicks (incl. deleting a user + "all associated data") fire with only an Undo toast. → Standardize on the confirm-before-delete toolbar.

**M2. UI actions not gated to backend roles → surprise 403s.** Moderators/editors see (enabled) controls the backend rejects: Users edit/save/delete (`@Roles(ADMIN)`), Guide/Media Approve/Reject (editor not allowed), Guide author reassignment (admin-only; a moderator's whole edit rolls back losing other changes). → Gate these controls with `usePermissions()` (and/or implement `canAccess` in `AdminAuthProvider`).

**M3. Audit-log gaps.** No `editLogService` calls in `UsersService`, `VolumesService`, `BadgesService`, or `MediaService.update` — so user **role changes**, volume/badge edits, and direct media edits are never recorded. (Requires adding `USER`/`VOLUME`/`BADGE` to `EditLogEntityType`.) → Log these mutations.

**M4. A volume can be paired with itself.** `pairedVolumeId` picker doesn't exclude the current record, and no server check rejects `pairedVolumeId === id`; the homepage showcase then pairs a volume with itself. → Exclude self from choices + validate server-side.
`Volumes.tsx:484-498`, `volumes.service.ts`

**M5. Arc `parentId` cycles only prevented client-side.** `ArcsService.update` blind-assigns `parentId`; a direct API call can make an arc its own ancestor → infinite loops in recursive traversal. → Add a server-side cycle check.
`arcs.service.ts:125-149`

**M6. Deleting an owning entity orphans its Media.** Polymorphic `ownerType/ownerId` has no FK/cascade/cleanup; deleting a character/arc/etc. leaves dangling media rows forever. → Delete/reassign media on owner removal.
`media.entity.ts:142-150`, `characters.service.ts:227`

**M7. Edit-log is undiscoverable + its filter is wrong.** The registered `edit-log` resource has no `AdminMenu` entry (only reachable by typing the URL); and `EditLog.tsx` filter choices don't match `EditLogEntityType` (offers `volume`, which isn't logged; omits `annotation`/`tag`/`character_relationship`/`character_organization`, which are). → Add a nav link; source filter choices from the enum.

**M8. Guide `content` has no client-side validation.** Backend requires `@MinLength(50)`; the form has no `required`/validate, so short/empty bodies round-trip to a late 400. → Add a validate rule.

---

## LOW — dead code / polish / to verify

- **L1.** Tags "Usage Count" always renders "—" (reads fields the API never returns). `Tags.tsx:239-245`
- **L2.** Media dead code: `MediaApprovalQueue`, `MediaDraftManager` (empty no-op buttons), the `media-approval` pseudo-resource, and `PolymorphicInfoChip` are unregistered/unused. `Media.tsx`
- **L3.** Gamble "Also known as" column uses `source="nicknames"` (entity field is `alternateNames`) → always blank. `Gambles.tsx:452`
- **L4.** `cleanUpdateData` events allow-list includes non-existent `status`/`rejectionReason` (harmless now; a future status UI would 400). `AdminDataProvider.ts:25-28`
- **L5.** Bulk-delete on relationship/org lists lacks `mutationMode="pessimistic"` (inconsistent). `CharacterRelationships.tsx`, `CharacterOrganizations.tsx`
- **L6. [UNCERTAIN]** No duplicate character↔org membership guard (unlike the self-relationship guard on relationships).
- **L7. [UNCERTAIN]** No arc/volume chapter-range overlap validation → non-deterministic range lookups.
- **L8. [UNCERTAIN]** Faction `memberIds` not existence-checked before insert → possible raw 500 on stale id.

---

## Suggested fix batching

- **Batch A — Critical breakage (highest impact, mostly small):** C1, C3, C4, C5, C6, C7, C8 are all frontend/data-provider one-liners or small maps (verb list, allow-list branches, filter key fixes). C2 (badges) needs backend routes. Fixes ~7 completely-broken flows fast.
- **Batch B — Security & data safety:** SEC1 (guide draft exposure), H5 (media update validation/log), H6 (self-lockout), H2 (bulk partial-failure), H3 (badge award data), M3 (audit-log coverage).
- **Batch C — Silent-wrong & confusing:** H1 (guide type pagination), H7 (dead filters/sorts), H8 (required-field marking), H4 (editor media).
- **Batch D — Consistency/UX/polish:** M1, M2, M4, M5, M6, M7, M8, and the LOW items.
