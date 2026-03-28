# Role & Approval System Design

**Date:** 2026-03-27
**Status:** Approved

## Overview

This spec defines a consistent, well-reasoned role hierarchy and approval system for the Usogui fansite. It separates content creation (editors), quality verification (moderators), and platform administration (admins) into clear, non-overlapping responsibilities while preserving a smooth community submission workflow for regular users.

---

## Role Hierarchy & Capabilities

| Capability | User | Editor | Moderator | Admin |
|---|---|---|---|---|
| Read all public content | ✓ | ✓ | ✓ | ✓ |
| Submit community content | ✓ | ✓ | ✓ | ✓ |
| Delete own submissions | ✓ | ✓ | ✓ | ✓ |
| Create/edit editorial content | | ✓ | ✓ | ✓ |
| Mark edit as minor | | ✓ | ✓ | ✓ |
| Verify editorial content | | | ✓ | ✓ |
| Approve/reject community submissions | | | ✓ | ✓ |
| Manage volumes | | | | ✓ |
| Manage users | | | | ✓ |
| Manage badges | | | | ✓ |
| Delete any content | | | | ✓ |

### Content Categories

**Editorial content** (editor/moderator/admin managed):
- Characters, Arcs, Gambles, Chapters, Organizations, Tags, Character Relationships, Character-Organization Memberships

**Admin-only editorial content:**
- Volumes

**Community submissions** (user-submitted, moderator/admin approved):
- Guides, Media, Annotations, Events, Quotes

---

## Editorial Content: Verification Workflow

### How it works

Editorial content goes live immediately when an editor or moderator saves a change. There is no pending state — changes are always visible. The verification layer is async: moderators review and verify content after the fact.

When saving an edit, the author chooses whether the edit is **minor** (a checkbox, unchecked by default):

- **Major edit** (default): `isVerified` resets to `false`. The record enters the moderator's unverified queue.
- **Minor edit** (checked): `isVerified` is unchanged. The edit is recorded in the log but does not require re-verification. Used for typo fixes, formatting corrections, adding alt names, etc.

### Self-verification rule

A moderator cannot verify their own most recent major (unverified) edit. Another moderator or admin must verify it. Admins are exempt from this restriction and may verify their own edits.

### Schema changes

All editorial entities gain three new columns:

```
isVerified: boolean       -- default false on creation
verifiedById: FK → User   -- null until first verification
verifiedAt: timestamp     -- null until first verification
```

The edit log gains one new column:

```
isMinorEdit: boolean      -- default false
```

### Verification endpoint

```
POST /:entity/:id/verify
Guards: JwtAuthGuard + RolesGuard([MODERATOR, ADMIN])
```

Sets `isVerified = true`, `verifiedById = currentUser.id`, `verifiedAt = now()`.
Returns 403 if the requesting user is the author of the most recent unverified major edit (and is not an admin).

---

## Community Submissions: Approval Workflow

The existing PENDING → APPROVED / REJECTED flow is preserved for guides, media, annotations, and events.

### Changes from current behavior

1. **Editors lose approval rights.** Only moderators and admins can approve or reject community submissions. The `@Roles(MODERATOR, ADMIN)` guard replaces `@Roles(EDITOR, MODERATOR, ADMIN)` on all approve/reject endpoints.

2. **Quotes gain an approval workflow.** Quotes currently have no status field and appear publicly on creation. They will be brought in line with other community submissions:
   - New `QuoteStatus` enum: `PENDING | APPROVED | REJECTED`
   - New `status` column on the Quote entity (default: `PENDING`)
   - New `rejectionReason` column (nullable string)
   - Public quote endpoints return only `APPROVED` quotes
   - Approve/reject endpoints added, guarded by `[MODERATOR, ADMIN]`

### Deletion rules

| Who | What they can delete |
|---|---|
| Admin | Anything |
| User / Editor / Moderator | Their own community submissions only (any status) |

No other deletion is permitted.

---

## Volumes: Admin-Only Access

Volumes are restricted to admin-only for all write operations. Editors and moderators lose create/update/delete access to volumes.

- `@Roles(ADMIN)` on create, update, delete volume endpoints
- Public read endpoint remains unchanged
- Volumes resource in the admin panel hidden from editor and moderator roles

---

## Contributor & Verifier Display

### On editorial content pages (frontend)

Each editorial content page displays:

- **Contributors:** All unique users who have an edit log entry for that entity (distinct by user, ordered by first contribution). Includes all historical contributors — even if their specific edits were later changed.
- **Verified by:** If `isVerified = true`, show the verifier's display name and `verifiedAt` date. If unverified, no verification badge is shown — the absence of a badge is the signal.

### Data sourcing

Contributors are derived from a query on the edit log:

```sql
SELECT DISTINCT userId FROM edit_log
WHERE entityType = :type AND entityId = :id
ORDER BY createdAt ASC
```

No special handling for overwritten contributions — all contributors who ever edited the page are credited.

---

## Admin Panel Changes

### Unverified content queue

- New sidebar badge showing count of unverified editorial records (alongside existing pending submission counts)
- Filter option on each editorial resource list: "Unverified only"
- `isVerified` status visible in list views (icon or label)
- "Verify" action button on editorial record show/edit views, visible to moderators and admins
- Verify button is disabled if the current user is the author of the most recent unverified major edit (and not admin)

### Quotes resource

- Add `status` field to quote list/show/edit views
- Add approve/reject action buttons (moderator/admin only)
- Add `rejectionReason` field (shown when status is REJECTED)

### Volumes resource

- Hidden entirely from editor and moderator role views
- Visible and fully editable for admin only

### Community submission approval

- Remove approve/reject action buttons from editor role (guides, media, annotations, events)
- Moderator and admin retain full approve/reject access

---

## Summary of Backend Changes

| Area | Change |
|---|---|
| All editorial entities | Add `isVerified`, `verifiedById`, `verifiedAt` columns |
| Edit log | Add `isMinorEdit` column |
| All editorial controllers | Add `POST /:id/verify` endpoint with self-verify guard |
| All editorial services | Reset `isVerified` on major edit save |
| Guide/Media/Annotation/Event controllers | Remove `EDITOR` from approve/reject role guards |
| Volume controller | Restrict create/update/delete to `ADMIN` |
| Quote entity | Add `QuoteStatus` enum, `status`, `rejectionReason` columns |
| Quotes controller | Add approve/reject endpoints, restrict public read to `APPROVED` |
| Database migrations | One migration per entity group for new columns |

---

## Out of Scope

- Field-level contribution tracking (who changed which specific field)
- Granular per-edit verification (verifying individual edit log entries rather than the whole record)
- Moderator notification system for new unverified content (future work)
- Public-facing "unverified" warning UI design (to be decided during implementation)
