# Event Submit Flow — Remove Approval Messaging

**Date:** 2026-04-18  
**Status:** Approved

## Background

The events module no longer has an approval workflow (status/approved/rejected columns were dropped in the April 14 simplification). Events are published immediately on creation and edit. However, the submit and edit event pages still show approval-workflow messaging inherited from the shared `SubmissionSuccess` and `EditPageShell` components, which are also used by guides and media (which still require approval).

## Goal

Remove approval messaging from the event submit and edit flows without breaking guides, media, or annotations.

## Design

### `requiresApproval` prop

Add `requiresApproval?: boolean` (default `true`) to `SubmissionSuccess` and `EditPageShell`. Passing `false` opts out of approval messaging. All existing callers (guides, media, annotations) are unaffected since they don't pass the prop.

---

### `SubmissionSuccess.tsx`

**Prop change:** `requiresApproval?: boolean` (default `true`)

**When `requiresApproval={false}`:**
- Replace the 3-item "what happens next" review list with a single line: "Your event is now live and publicly visible."
- Remove the "View My Submissions" button (no pending status to check).
- Keep the "Submit Another Event" button.

**When `requiresApproval={true}` (unchanged):** existing list + both buttons.

---

### `EditPageShell.tsx`

**Prop change:** `status` becomes optional; add `requiresApproval?: boolean` (default `true`)

**When `requiresApproval={false}`:**
- Hide the status badge entirely.
- Hide the "This submission is approved and live. Editing will send it back for moderator re-review." alert.
- All other shell UI (header, metadata, children) renders normally.

**When `requiresApproval={true}` (unchanged):** existing status badge and alert logic.

---

### `SubmitEventPageContent.tsx`

- Pass `requiresApproval={false}` to `<SubmissionSuccess>`.
- Delete the `<Text size="xs" c="dimmed">Reviewed before publishing</Text>` line next to the submit button.

---

### `EditEventPageContent.tsx`

- Remove the `status="approved"` prop from `<EditPageShell>` (or pass `requiresApproval={false}`).
- Delete the `<Text size="xs" c="dimmed">Sent back to moderators for review</Text>` line next to the save button.

---

## Files Changed

| File | Change |
|------|--------|
| `client/src/components/SubmissionSuccess.tsx` | Add `requiresApproval` prop, branch messaging |
| `client/src/components/EditPageShell.tsx` | Make `status` optional, add `requiresApproval` prop, hide approval UI when false |
| `client/src/app/submit-event/SubmitEventPageContent.tsx` | Pass `requiresApproval={false}`, remove "Reviewed before publishing" |
| `client/src/app/events/[id]/edit/EditEventPageContent.tsx` | Remove `status="approved"`, pass `requiresApproval={false}`, remove "Sent back to moderators for review" |

## Not Changed

- `SubmissionGuidelines.tsx` — event tips contain no approval references, no change needed.
- `EventFormCard.tsx`, `EventsPageContent.tsx`, `EventPageClient.tsx`, `admin/Events.tsx` — already updated.
- All guide, media, annotation submit/edit flows — unaffected; they don't pass `requiresApproval`.
