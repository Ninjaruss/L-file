# Admin Panel Fixes — Batches A + B Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Fix the critical breakage (Batch A) and security/data-safety issues (Batch B) from the admin-panel audit (`docs/superpowers/audits/2026-07-20-admin-panel-audit.md`), realigning the admin frontend + data provider with the backend contract and closing backend gaps.

**Architecture:** Monorepo — `client/` (Next.js + React Admin, `AdminDataProvider.ts` + `components/admin/*`) and `server/` (NestJS modules). Most Batch-A fixes are small frontend/data-provider changes; Batch-B fixes are backend changes that must preserve existing behavior (esp. public guide browsing).

**Tech Stack:** React Admin, TypeScript; NestJS, TypeORM, class-validator, Postgres.

**Verification per task:** client changes → `cd client && npx tsc --noEmit` (ignore ~25 pre-existing unrelated errors) + `yarn lint` on touched files; server changes → `cd server && npx tsc --noEmit` + `yarn lint` + `yarn build`. Where an endpoint/behavior is fixed, verify with a `curl` against the running backend (`:3001`) when feasible. Do NOT run `yarn build` in `client/` while the dev server is live (corrupts `.next`).

**Branch:** `fix/admin-panel-critical` (off `main`; audit doc already committed).
**Commits:** git signing via 1Password is unavailable — every commit MUST use `--no-gpg-sign`.

---

## Task 1 — Data-provider verb & whitelist fixes (C1, C3)

**Files:** Modify `client/src/components/admin/AdminDataProvider.ts`

- [ ] **C1 — Events use PATCH.** In BOTH `update` and `updateMany`, the line `const usePatch = ['quotes', 'guides', 'media', 'annotations'].includes(resource)` → add `'events'`: `['quotes', 'guides', 'media', 'annotations', 'events']`. (Backend `events.controller.ts` only has `@Patch(':id')`.)
- [ ] **C3 — Annotations update whitelist.** In `cleanUpdateData`, add a branch `if (resource === 'annotations')` that keeps only `['title','content','sourceUrl','chapterReference','isSpoiler','spoilerChapter']` (matching `UpdateAnnotationDto`), mirroring the existing per-resource `allowedFields` pattern used for quotes/guides/etc.
- [ ] **Verify:** `npx tsc --noEmit` clean for this file; `yarn lint` clean. If backend is reachable, confirm `PATCH /api/annotations/:id` with only those fields succeeds and `PUT /api/events/:id`→ now `PATCH` path is used.
- [ ] **Commit:** `git commit --no-gpg-sign -m "fix(admin): events use PATCH, annotations update whitelist (C1,C3)"`

## Task 2 — Media create + status filter (C5, C7)

**Files:** `client/src/components/admin/AdminDataProvider.ts`, `client/src/components/admin/Media.tsx`

- [ ] **C5 — Drop `status` from media create.** In `cleanUpdateData`'s `media` branch (used by create), remove `status` from the allowed fields **for the create path** — `CreateMediaDto` has no `status`. Safest: in the `create` method, strip `status` from the media payload before POST (keep it for update if update supports it — verify against `UpdateMediaDto` once Task 8 adds it; for now media create must not send `status`).
- [ ] **C7 — "All" filter sends `status=all`.** In `Media.tsx` `handleStatusFilter`, when the chip is `'all'`, set the filter to `status: 'all'` instead of deleting the key (backend `media.service.ts` has an explicit `status=all` bypass; omitting the key defaults to approved-only).
- [ ] **Verify:** tsc/lint clean; if reachable, `POST /api/media` (video url + ownerType/ownerId, no status) succeeds; `GET /api/media?status=all` returns pending+approved+rejected.
- [ ] **Commit:** `fix(admin): media create omits status, All filter shows all statuses (C5,C7)`

## Task 3 — Guide create + Event search filters (C6, C8)

**Files:** `client/src/components/admin/Guides.tsx`, `client/src/components/admin/Events.tsx` (or the events filter mapping in `AdminDataProvider.ts`)

- [ ] **C6 — Remove unsupported Create-guide inputs.** In `GuideCreate`, remove the `authorId` (Author `ReferenceInput`) and `rejectionReason` inputs — `CreateGuideDto` has neither and `forbidNonWhitelisted` 400s the save. (The server always sets author to the current user on create; author reassignment stays an Edit-only, admin-only feature.)
- [ ] **C8 — Map Event search keys.** The Events list filter sends `title`/`description`/`arc` which `FilterEventsDto` rejects. Change the Events filter inputs (or remap in `AdminDataProvider.getList` for `events`) so the title/description boxes feed the DTO's existing `search` param, and remove or remap the `arc`-name box (use `arcId` reference, or drop it). Net: typing in Events search must not 400 the list.
- [ ] **Verify:** tsc/lint clean; if reachable, `GET /api/events?search=foo` returns 200 (not 400); guide create with title/description/content (no author) succeeds.
- [ ] **Commit:** `fix(admin): guide-create drops unsupported fields, event search uses DTO param (C6,C8)`

## Task 4 — Bulk-op safety + badge award payload (H2, H3)

**Files:** `client/src/components/admin/AdminDataProvider.ts`

- [ ] **H2 — Partial-failure handling.** In `updateMany` and `deleteMany`, replace `Promise.all` with `Promise.allSettled`; collect fulfilled ids as `data`, and if any rejected, throw an `HttpError` naming how many/which ids failed (so react-admin reports partial failure rather than a blanket error while some already mutated).
- [ ] **H3 — Badge award sends year/expiresAt top-level.** In the `create` method's `badges/award` branch, forward `year: params.data.year != null ? Number(params.data.year) : undefined` and `expiresAt: params.data.expiresAt || undefined` as top-level fields (currently `year` is nested under `metadata` and `expiresAt` is dropped), matching `AwardBadgeDto`.
- [ ] **Verify:** tsc/lint clean. Logic review: `allSettled` result maps to ids correctly; award payload matches DTO fields.
- [ ] **Commit:** `fix(admin): bulk ops report partial failure, badge award sends year/expiresAt (H2,H3)`

## Task 5 — Backend: annotation search (C4)

**Files:** `server/src/modules/annotations/dto/annotation-query.dto.ts`, `server/src/modules/annotations/annotations.service.ts`

- [ ] Add an optional `search?: string` (`@IsOptional() @IsString()`) to `AnnotationQueryDto`. In `AnnotationsService.findAll`, when `search` is present, add a case-insensitive `ILIKE` filter over `title`/`content` (match the query-building style already used in the service). This both stops the 400 and makes the admin Annotations search actually work.
- [ ] **Verify:** `cd server && npx tsc --noEmit && yarn lint`. If reachable, `GET /api/annotations?search=foo` returns 200 and filters.
- [ ] **Commit:** `fix(annotations): support search query param (C4)`

## Task 6 — Backend: Badge CRUD routes + reconcile types (C2)

**Files:** `server/src/modules/badges/badges.controller.ts`, `server/src/modules/badges/badges.service.ts`, plus a Create/Update DTO under `server/src/modules/badges/dto/`; `client/src/components/admin/Badges.tsx`

- [ ] Add admin-guarded CRUD to the badges controller matching sibling modules: `@Post()` (create), `@Patch(':id')` (update), `@Delete(':id')` (delete), each `@UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN)`. Add corresponding `create`/`update`/`remove` service methods (follow the pattern in e.g. `organizations.service.ts`). Add `CreateBadgeDto`/`UpdateBadgeDto` with validated fields matching the `Badge` entity (name, description, type, color, icon, etc.).
- [ ] **Reconcile badge `type`:** the entity `BadgeType` enum only has `CUSTOM`. Either (a) extend `BadgeType` with `supporter`/`active_supporter`/`sponsor` + a TypeORM migration, or (b) reduce the `Badges.tsx` `type` `SelectInput` choices to the values that actually exist. **Decision: (b)** — reduce the admin `type` choices to the real enum value(s) to avoid a schema migration and match current data; leave a `// TODO` noting the supporter/sponsor concepts live in the award/user-badge flow, not the Badge entity. (Also remove the now-dead supporter/active_supporter branching in `Users.tsx` BadgeAwardModal only if trivially safe; otherwise leave and note.)
- [ ] **Verify:** `cd server && npx tsc --noEmit && yarn lint && yarn build`; client tsc/lint. If reachable: `POST/PATCH/DELETE /api/badges` as admin work; badge create in the admin UI no longer 404s.
- [ ] **Commit:** `feat(badges): add admin CRUD routes; align admin type choices with enum (C2)`

## Task 7 — Backend: scope GET /guides so drafts aren't exposed (SEC1)

**Files:** `server/src/modules/guides/guides.controller.ts`, `server/src/modules/guides/guides.service.ts`

CONTEXT: `GET /guides` (`@Get()`, `JwtAuthGuard` only) is used by BOTH the public guides page and the admin list. Do NOT add a blanket role guard (breaks public browsing). Instead scope results by caller.

- [ ] Pass the current user (via `@CurrentUser()`, already used elsewhere in this controller) into `findAll`. In `GuidesService.findAll`: if the caller's role is `ADMIN`/`MODERATOR`/`EDITOR`, keep current behavior (honor `status` filter). Otherwise (regular `user` or, if the endpoint is reachable unauthenticated, no user), force results to `status = approved` OR `authorId = caller.id` — never return other users' `pending`/`rejected` guides or their `rejectionReason`. Ensure the public approved-guides listing still returns approved guides.
- [ ] **Verify:** `cd server && npx tsc --noEmit && yarn lint`. Behavior checks (if reachable): as a normal user, `GET /api/guides?status=pending` must NOT return others' pending guides; the public guides page still lists approved guides (spot-check `GET /api/guides?status=approved`). Confirm no regression to `my-guides`/`findOne`.
- [ ] **Commit:** `fix(guides): scope GET /guides so non-privileged callers only see approved/own guides (SEC1)`

## Task 8 — Backend: media update validation + audit log (H5)

**Files:** `server/src/modules/media/dto/update-media.dto.ts` (new), `server/src/modules/media/media.controller.ts`, `server/src/modules/media/media.service.ts`

- [ ] Create `UpdateMediaDto` (validated subset of editable media fields: description, chapterNumber, isSpoiler, ownerType, ownerId, type, purpose — NOT arbitrary `status`; status changes go through approve/reject). Change the controller `update`/`patchUpdate` handlers to type the body as `UpdateMediaDto` (so the global `ValidationPipe` validates it) instead of `any`. In `MediaService.update`, call `editLogService.logUpdate(...)` like sibling mutations do (approve/reject already log). If setting `ownerType/ownerId`, keep existing behavior but validate types via the DTO enums.
- [ ] **Verify:** `cd server && npx tsc --noEmit && yarn lint && yarn build`. If reachable, editing a media item via the admin still works and now writes an edit-log row; sending a bogus `status`/unknown field is rejected.
- [ ] **Commit:** `fix(media): validate update payload and write audit log (H5)`

## Task 9 — Backend: last-admin/self guards + audit-log coverage (H6, M3)

**Files:** `server/src/modules/users/users.service.ts`, `client/src/components/admin/Users.tsx`; audit-log additions in `users.service.ts`, `volumes.service.ts`, `badges.service.ts`, and `server/src/entities/edit-log.entity.ts` (enum) + a migration if `EditLogEntityType` is a DB enum.

- [ ] **H6 — Guards.** In `UsersService.update`/`updateRole`/`remove`, reject the operation when it would (a) change the caller's own role away from admin, (b) delete the caller's own account, or (c) drop the total admin count to zero. Throw `ForbiddenException` with a clear message. In `Users.tsx`, disable the role `SelectInput` and the delete control when `record.id === currentUser.id` (use `useGetIdentity`/auth), so the UI reflects the rule.
- [ ] **M3 — Audit-log coverage.** Add `editLogService.log{Create,Update,Delete}` calls to the mutation paths of `UsersService`, `VolumesService`, and `BadgesService` (esp. user role changes). Add `USER`, `VOLUME`, `BADGE` to `EditLogEntityType`; if that enum is persisted as a Postgres enum, generate a migration (`yarn db:generate`) — otherwise a code-only change suffices. Verify the edit-log records these mutations.
- [ ] **Verify:** `cd server && npx tsc --noEmit && yarn lint && yarn build`; client tsc/lint. Behavior (if reachable): the sole admin cannot demote/delete themselves; a user role change appears in `GET /api/edit-log`.
- [ ] **Commit:** `fix(users): last-admin/self guards; audit-log coverage for users/volumes/badges (H6,M3)`

---

## Self-Review Notes
- **Coverage vs audit Batch A+B:** C1(T1) C3(T1) C4(T5) C5(T2) C6(T3) C7(T2) C8(T3) C2(T6) — Batch A complete. SEC1(T7) H2(T4) H3(T4) H5(T8) H6(T9) M3(T9) — Batch B complete.
- **Ordering:** frontend-only tasks (T1–T4) first (fast, low-risk, independently shippable), then backend (T5–T9). T2's `status` handling should be revisited after T8 defines `UpdateMediaDto` (media create never sends status; media update may send a validated subset — but not arbitrary status).
- **Risk flags:** T7 must not break public guide browsing (verify approved list still returns). T6 decision (b) avoids a schema migration. T9 may require a migration for the edit-log enum — confirm whether `EditLogEntityType` is a Postgres enum before assuming.
- **Not in scope (deferred to Batches C/D):** dead filters/sorts (H7), required-field marking (H8), delete-confirmation consistency (M1), UI role-gating (M2 beyond the Users self-row), volume self-pair (M4), arc cycles (M5), media orphan cleanup (M6), edit-log nav/filter (M7), and all LOW items.
