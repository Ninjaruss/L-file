# Submission Edit Pages Redesign

**Date:** 2026-03-21
**Status:** Approved
**Scope:** User-facing submission edit pages (guide, media, annotation, event) + updated submit page visual treatment

---

## Problem

The current submission edit pages (`/submit-guide?edit=<id>`, `/submit-media?edit=<id>`, etc.) have three core pain points:

1. **Unclear edit-mode identity (A)** — A small "Editing" badge in the header is the only signal that distinguishes editing from creating. Users can't tell which submission they're editing or what its current status is.
2. **Clunky form UX (B)** — No back navigation, no discard action, rejection reasons buried below the form, pre-populated fields indistinguishable from empty ones.
3. **Generic visual design (C)** — Both submit and edit pages look nearly identical; no visual hierarchy separates the two contexts.

---

## Solution

**Approach B — Full Edit Page Redesign with Dedicated Routes.**

Create dedicated edit routes for all four submission types. Submit (create) pages get an updated visual treatment. Edit pages get a structurally distinct layout with an amber edit-mode signal layered on top of the entity color.

---

## Visual Design System

### Entity Color

The guide entity color is already `#16a34a` (Forest Green) in `entityColors.ts` — **no color change needed**. All four submission types use their respective entity colors from `ENTITY_COLORS`:

| Type | Entity Color |
|---|---|
| Guide | `#16a34a` Forest Green |
| Media | `#db2777` Hot Pink |
| Annotation | `#9333ea` Bright Purple |
| Event | `#ca8a04` Ochre |

### Color Logic

| Signal | Color | Usage |
|---|---|---|
| Entity color | e.g. `#16a34a` for guides | Borders, icons, section headers, progress dots, card accents — same on both submit and edit pages |
| Edit mode | Amber `#f59e0b` | Edit header top-bar gradient, left stripe, "✎ Editing" badge, "Save & Resubmit" button — edit pages only |
| Rejection | Red `#ef4444` | Rejection reason callout — edit pages only when `status === 'rejected'` |
| Submission status badges | Contextual (amber = pending, red = rejected, green = approved) | Edit header only |

### Submit Page Treatment (updated)

Both submit and edit pages share the same card/section structure. The submit page uses the entity color subtly: soft borders, faint glow, top accent gradient on the header. Empty fields use placeholder styling. No amber appears on submit pages.

### Edit Page Treatment (new)

The edit header has a **dual-signal top-bar gradient** (amber → entity color → transparent) and a **left stripe** (amber fading to entity color) that marks it as "edit mode." The "Save & Resubmit" primary button is amber to reinforce the mode signal.

---

## Routes

### New Dedicated Edit Routes

| Type | New Route | Old Pattern (deprecated) |
|---|---|---|
| Guide | `/guides/[id]/edit` | `/submit-guide?edit=<id>` |
| Media | `/media/[id]/edit` | `/submit-media?edit=<id>` |
| Annotation | `/annotations/[id]/edit` | `/submit-annotation?edit=<id>` |
| Event | `/events/[id]/edit` | `/submit-event?edit=<id>` |

**Note:** The `client/src/app/annotations/` directory does not currently exist. Creating the annotation edit route requires creating the full directory tree `annotations/[id]/edit/`.

---

## Page Anatomy

### Submit Page (Create) — Updated

```
[Header]
  ├─ Top accent gradient (entity color → transparent)
  ├─ Icon box (entity color)
  ├─ Eyebrow label: "[Type] Submission"
  ├─ Title: "Write a Guide" / "Submit Media" / etc.
  └─ Description

[Submission Guidelines] (entity color accent)

[Form Progress Indicator] (entity color dots)

[Form Card]
  ├─ Top accent bar (entity color gradient)
  └─ Form Sections (1, 2, 3...)
       ├─ Step number badge (entity color)
       ├─ Section title + icon (entity color)
       ├─ Empty input fields (soft entity color border)
       └─ Children

[Action Bar]
  ├─ "[Submit/Write] [Type]" button (entity color, disabled until valid)
  └─ "Reviewed before publishing" note
```

### Edit Page — New

```
[Breadcrumb] ← My Submissions / Edit [Type]   (links to /profile)

[Edit Identity Header]
  ├─ Top gradient bar: amber → entity color → transparent
  ├─ Left stripe: amber (top) → entity color → transparent (fading down)
  ├─ Icon box (entity color)
  ├─ Eyebrow: "[Type] Submission"
  ├─ Badge row: [✎ Editing] [Status badge: Pending / Rejected / Approved]
  ├─ Submission title (the actual saved title of the submission being edited)
  └─ Metadata: submitted date · last updated · ID

[Status Context Panel — conditional, renders in this slot based on status]
  ├─ status === 'rejected': Rejection reason callout (red left border, moderator feedback text)
  ├─ status === 'approved': Informational banner ("This submission is live. Editing will send it back for re-review.")
  └─ status === 'pending': (nothing — no callout needed)

[Form Progress Indicator] (entity color dots, pre-filled steps check against current values)

[Form Card]
  ├─ Top accent bar (entity color gradient)
  └─ Form Sections (same structure as submit)
       ├─ Pre-populated fields: brighter entity color border to signal existing data
       └─ "edited" diff chip on labels of fields the user has modified
            (implementation: store initial values in a ref on mount; compare on change)

[Action Bar]
  ├─ "Save & Resubmit" button (amber)
  ├─ "Discard Changes" ghost button (calls router.back())
  └─ "Sent back to moderators for review" note
```

---

## Annotation Edit — Special Case

The annotation form has `ownerType` (Character / Gamble / Arc) and `ownerId` fields that are editable during creation but **must be locked (read-only) during edit**. Render these as static display values (e.g. `Text` component with the entity name), not as editable `Select` inputs.

---

## Media Edit — Special Case

The media edit form is architecturally different from the other three:

- Uses `MediaUploadForm` component which manages file upload state and Backblaze B2 storage
- The update API call uses `api.updateOwnMedia(id, data)` which sends `PATCH` with `FormData` (not JSON)
- The edit page must handle the existing media URL/file display alongside the option to replace it

The media edit form should show the current media (image preview or video link) at the top of the upload section, with an option to replace it. The replace flow goes through the same `MediaUploadForm` component used in submission.

---

## Data Flow

### Auth + Data Fetching

Data fetching remains **client-side** in the content component (not server-side in `page.tsx`). This matches the existing submit page pattern and avoids the problem of server components having no access to the in-memory JWT token stored by `AuthProvider`.

The `page.tsx` for each edit route is a minimal server component that simply renders the content client component. Auth checking and data loading happen inside the client component using the same `useAuth()` hook and `api.*` call patterns as the existing submit pages.

```typescript
// guides/[id]/edit/page.tsx — numeric ID types (guide, annotation, event)
import { EditGuidePageContent } from './EditGuidePageContent'

export default function EditGuidePage({ params }: { params: { id: string } }) {
  return <EditGuidePageContent id={Number(params.id)} />
}

// media/[id]/edit/page.tsx — string ID (UUID), do NOT cast to Number
import { EditMediaPageContent } from './EditMediaPageContent'

export default function EditMediaPage({ params }: { params: { id: string } }) {
  return <EditMediaPageContent id={params.id} />
}
```

### API Methods Used

| Type | Fetch existing | Update |
|---|---|---|
| Guide | `api.getMyGuideSubmission(id: number)` | `api.updateGuide(id, data)` |
| Media | `api.getMyMediaSubmission(id: string)` — **ID is a string (UUID), not a number** | `api.updateOwnMedia(id, data)` |
| Annotation | `api.getMyAnnotationSubmission(id: number)` | `api.updateAnnotation(id, data)` |
| Event | `api.getMyEventSubmission(id: number)` *(new — must be added)* | `api.updateOwnEvent(id, data)` |

**`getMyEventSubmission` must be added to `api.ts`** using `GET /events/:id` — the same pattern as `getMyGuideSubmission` (no new backend endpoint needed; the `GET /events/:id` route is already public). Ownership is enforced at the update step via `PUT /events/:id/own` which returns 403 if not the owner.

**Media IDs are UUIDs (strings), not numbers.** The media `page.tsx` must NOT cast `params.id` to `Number`. All other types use numeric IDs.

---

## Redirect Handling (Backward Compatibility)

When `?edit=<id>` is detected on the old submit pages, redirect to the new dedicated route. This ships **in the same PR** as the new edit routes. The redirect handles any bookmarked or cached old-format URLs.

Implement in the server `page.tsx` using Next.js `searchParams` (plain object prop, not `URLSearchParams`):

**Note: In Next.js 15, `searchParams` is a `Promise` and must be awaited.**

```typescript
// submit-guide/page.tsx
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import SubmitGuidePageContent from './SubmitGuidePageContent'

export default async function SubmitGuidePage({
  searchParams
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  const { edit } = await searchParams
  if (edit) {
    redirect(`/guides/${edit}/edit`)
  }
  return (
    <Suspense>
      <SubmitGuidePageContent />
    </Suspense>
  )
}
```

The same pattern applies to `submit-media`, `submit-annotation`, and `submit-event` pages. Preserve any existing `<Suspense>` wrapper that may already be present in the current `page.tsx` files.

After adding the redirect, **remove all `?edit=<id>` form logic from the four submit page content components** — they revert to create-only.

---

## Component Changes

### New Files

| File | Purpose |
|---|---|
| `client/src/components/EditPageShell.tsx` | Shared wrapper for all four edit content components |
| `client/src/app/guides/[id]/edit/page.tsx` | Guide edit route (server component) |
| `client/src/app/guides/[id]/edit/EditGuidePageContent.tsx` | Guide edit form (client component) |
| `client/src/app/media/[id]/edit/page.tsx` | Media edit route |
| `client/src/app/media/[id]/edit/EditMediaPageContent.tsx` | Media edit form |
| `client/src/app/annotations/[id]/edit/page.tsx` | Annotation edit route |
| `client/src/app/annotations/[id]/edit/EditAnnotationPageContent.tsx` | Annotation edit form |
| `client/src/app/events/[id]/edit/page.tsx` | Event edit route |
| `client/src/app/events/[id]/edit/EditEventPageContent.tsx` | Event edit form |

### Modified Files

| File | Change |
|---|---|
| `client/src/lib/api.ts` | Add `getMyEventSubmission(id)` method |
| `client/src/components/SubmitPageHeader.tsx` | Updated visual treatment (no amber) |
| `client/src/components/FormSection.tsx` | Support pre-populated visual state (brighter border when `hasValue` prop is true) |
| `client/src/app/submit-guide/page.tsx` | Add `?edit` redirect |
| `client/src/app/submit-guide/SubmitGuidePageContent.tsx` | Remove edit-mode logic entirely |
| `client/src/app/submit-media/page.tsx` | Add `?edit` redirect |
| `client/src/app/submit-media/SubmitMediaPageContent.tsx` | Remove edit-mode logic entirely |
| `client/src/app/submit-annotation/page.tsx` | Add `?edit` redirect |
| `client/src/app/submit-annotation/SubmitAnnotationPageContent.tsx` | Remove edit-mode logic entirely |
| `client/src/app/submit-event/page.tsx` | Add `?edit` redirect |
| `client/src/app/submit-event/SubmitEventPageContent.tsx` | Remove edit-mode logic entirely |
| `client/src/app/profile/ProfileContentTabs.tsx` | Update edit links to new dedicated routes |
| `client/src/components/SubmissionCard.tsx` | Update `getEditLink` unconditionally to new route patterns |

---

## `EditPageShell` Component Interface

```typescript
interface EditPageShellProps {
  type: 'guide' | 'media' | 'annotation' | 'event'
  accentColor: string
  submissionTitle: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string        // ISO date string
  updatedAt?: string         // ISO date string, optional
  submissionId: number
  rejectionReason?: string | null   // shown when status === 'rejected'
  children: React.ReactNode
}
```

Renders: breadcrumb → edit identity header → status context panel → children.

The breadcrumb "← My Submissions" links to `/profile`.

---

## Error States

| State | Handling |
|---|---|
| Submission not found / not owner | Show error message with link back to `/profile`; no redirect (auth may be loading) |
| Failed save | Inline error alert above action bar (existing `Alert` pattern) |
| Loading | Spinner centered in container (existing pattern from submit pages) |
| Not logged in | Same unauthenticated gate as submit pages — prompt to log in |

---

## Out of Scope

- Draft auto-saving
- Field-level change diff/history
- Admin-side edit pages (handled separately via React Admin)
- Creating new submissions (submit pages remain at `/submit-*` for creation)
- Adding `annotations/[id]/page.tsx` (list/detail pages for annotations not in scope)
