# Admin Panel Fixes — Batch C/D

Continues `docs/superpowers/audits/2026-07-20-admin-panel-audit.md`. Batches A+B (all CRITICAL + security/integrity HIGH + M3) already shipped on `fix/admin-audit-log`. This batch clears the remaining HIGH (H1,H4,H7,H8), MEDIUM (M1,M2,M4,M5,M6,M7,M8), and LOW (L1–L8) findings.

**Decisions (applies "yes to all recommendations"):**
- H7 dead filters/sorts → **implement backend support** (keep the useful admin controls), not remove.
- H8 required fields → **mark `required`** in the form (+ sensible default where apt, e.g. arc `order` default 0) and surface inline validation.
- H1 guide type filter → **server-side**: fix `total` and paginate correctly (map `guideType` to the backend's existing entity-presence filters, or add a real `guideType` param) — never compute `total` from one already-paginated page.
- M1 → standardize on `EditToolbar`→`DeleteButtonWithConfirmation` (+ `mutationMode="pessimistic"` bulk).
- M2 → gate controls with `usePermissions()`; add `canAccess` in `AdminAuthProvider` for admin-only resources.
- L6/L7/L8 (UNCERTAIN) → verify in code first; add the guard only if genuinely missing, else note.

**Execution:** disjoint-file clusters (below) run in parallel and only **edit + verify** (`npx tsc --noEmit`, `yarn lint` — never `yarn build` while a dev server is up); the controller commits each cluster. `--no-gpg-sign` on all commits (1Password signing unavailable). M6 runs last (cross-cuts many services).

## Clusters

- **CD-A — Characters + Arcs** (`Characters.tsx`, `Arcs.tsx`, `characters.controller/service`, `arcs.controller/service`): H7 (chars `organizationId` + `firstAppearanceChapter_gte/_lte`; arcs `startChapter/endChapter` range filter + add both to `allowedSort`), H8 (arc `order` required/default 0), M5 (arcs.service.update cycle guard), L7-arcs (sibling range-overlap check — verify then add if missing).
- **CD-B — Volumes + Chapters** (`Volumes.tsx`, `Chapters.tsx`, `volumes.service`, `chapters.controller/service`): M4 (exclude self from `pairedVolumeId` picker + server reject `pairedVolumeId===id`), H8 (chapter `title` required, drop "(optional)" helper), L7-volumes (range-overlap — verify/add).
- **CD-C — Gambles + Tags + Quotes** (`Gambles.tsx`, `Tags.tsx`, `Quotes.tsx`, respective controllers/services): H8 (gamble `chapterId`+`rules` required on Create), L3 (gamble "Also known as" `nicknames`→`alternateNames`, joined), H7 (tags `name` filter server-side; quotes one-sided chapter range), L1 (remove/compute tags "Usage Count"), L8 (faction `memberIds` existence check — verify/add).
- **CD-D — Relationships + Orgs** (`CharacterRelationships.tsx`, `CharacterOrganizations.tsx`, `character-organizations.service`): H8 (`startChapter`, org `role` required), M1 (EditToolbar+confirm on both Edits), L5 (bulk `mutationMode="pessimistic"`), L6 (duplicate char↔org membership guard — verify/add).
- **CD-E — Guides + data provider** (`Guides.tsx`, `AdminDataProvider.ts`, `guides.controller/service`): H1 (guideType server-side + correct total), M2 (gate Approve/Reject to admin/moderator, author field to admin, via `usePermissions`), M8 (guide `content` min-length validate), L4 (drop dead `status`/`rejectionReason` from the `events` allow-list in `cleanUpdateData`).
- **CD-F — Media** (`Media.tsx`, `EntityDisplayMediaSection.tsx`, `media.controller/service`): H4 (refetch incl. pending after editor add/upload; surface, don't swallow, the 403), M2 (gate Media Approve/Reject via `usePermissions`), L2 (remove dead `MediaApprovalQueue`/`MediaDraftManager`/`media-approval`/`PolymorphicInfoChip`).
- **CD-G — Users + Events + shell** (`Users.tsx`, `Events.tsx`, `AdminMenu.tsx`, `EditLog.tsx`, `AdminAuthProvider.ts`): M1 (User/Event Edit → EditToolbar+confirm), M2 (hide/disable User Save/Delete for non-admin; `canAccess`), M7 (add Edit Log nav link; source `EditLog.tsx` filter choices from `EditLogEntityType` — drop `volume`… wait it IS logged now; include user/volume/badge + annotation/tag/relationship/organization; drop any not in the enum).
- **M6 (sequential, last)** — orphaned media cleanup: add `MediaService.deleteForOwner(ownerType, ownerId)` and call it from `remove()` in characters/arcs/gambles/events/organizations services (delete or reassign media whose `ownerType/ownerId` matches the deleted entity).

## Verify (final, by controller)
`cd server && yarn build` and `cd client && yarn build` both clean; `yarn lint` clean both sides. Then commit remaining, push branch.
