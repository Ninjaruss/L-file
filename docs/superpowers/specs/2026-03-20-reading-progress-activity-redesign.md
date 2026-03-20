# Reading Progress & Activity Section Redesign

**Date:** 2026-03-20
**Scope:** Frontend only — `client/src/`
**Approach:** Shared visual components, separate data layers per context

---

## Problem

1. **Reading progress is inconsistent** across pages: the profile page uses a custom milestone-tick bar (`ProfileProgressReport`), while the user detail page uses a plain Mantine `Progress` bar. The milestone labels on the profile page are nearly invisible (`#333`/`#1e1e1e` on `#0d0d0d`).

2. **Activity section is missing** from the user detail page (`/users/[id]`). It only exists on the profile page as `ProfileFieldLog`.

3. **Activity section design is unclear**: the type badges are very dark and barely readable; there are no links to content; the 5-item cap has no "show more" option.

---

## Decisions

| Question | Decision |
|---|---|
| Reading progress: unified or distinct per page? | Unified — same component on both pages |
| Reading progress visual style | Design B: progress dot + arc pills |
| Activity on user detail page | Add it — public/approved actions only |
| Activity visual style | Design A: colored left-border timeline cards |
| Activity on own profile | Keep full status visibility (pending/approved/rejected) |

---

## Components

### 1. New: `ReadingProgressBar` (shared)

**File:** `client/src/components/ReadingProgressBar.tsx`

**Purpose:** Purely presentational. Renders reading progress with the new visual design.

**Props:**
```ts
interface ReadingProgressBarProps {
  userProgress: number
  markerLabel?: string // defaults to "you"; can be omitted on public views
}
```

**Visual:**
- Header row: "Chapter X of 539" (left) · "XX%" in rose (right)
- 6px gradient bar (rose → purple) with a glowing rose dot at the user's exact percentage position
- Arc pills row below the bar, derived from `PROFILE_ARC_MILESTONES`:
  - Completed arcs (before user's chapter): rose-tinted background, `✓` suffix
  - Current arc (user is within its range): purple highlight, `← now` suffix
  - Upcoming arcs: dim grey (`#333` text on `#111` bg)
- Below pills: "Currently in: [Arc Name]" in a subtle muted color

**Replaces:**
- `ProfileProgressReport.tsx` — updated to use `ReadingProgressBar` internally (or merged into it)
- Inline reading progress block in `UserProfileClient.tsx` (lines 371–399)

---

### 2. Restyled: `ProfileFieldLog` (profile page activity)

**File:** `client/src/app/profile/ProfileFieldLog.tsx` — restyle only, no data or prop changes.

**Visual changes:**
- Remove dark type badges
- Each event rendered as a left-border card:
  - 2px colored left border (green=guide, blue=media, purple=annotation, amber=event, orange=progress)
  - Subtle card background `#0f0f0f` with `border-radius: 3px`, `padding: 7px 10px`
  - Title (`#e5e5e5`, 13px, semibold) + detail (`#888`, 11px) stacked
  - Timestamp (monospace, `#555`, 10px) right-aligned

**Wording:** Unchanged — full status visibility is correct on your own profile:
- "Guide submitted / approved / rejected"
- "Media submitted / approved / rejected"
- "Annotation added / approved / rejected"
- "Reading progress — Chapter X reached"

**Behaviour changes:**
- Cap raised from 5 → 8 items visible by default
- "Show more" button to reveal remaining events (already in props, no extra fetch)

---

### 3. New: `PublicActivityTimeline` (user detail page)

**File:** `client/src/components/PublicActivityTimeline.tsx`

**Purpose:** Shows a public-facing activity timeline for any user's profile. Approved content only — no pending or rejected statuses surfaced.

**Props:**
```ts
interface PublicActivityTimelineProps {
  submissions: SubmissionItem[]  // from api.getPublicUserSubmissions — already approved-only
  guides: UserGuide[]            // from api.getGuides with status: 'approved', authorId
}
```

**Content mapping:**
| Submission type | Label shown |
|---|---|
| guide | "Guide published" |
| media | "Media contributed" |
| annotation | "Annotation added" |
| event | "Event contributed" |

Detail text: title, filename, or chapter context if available. No reading progress entry (already shown via `ReadingProgressBar`).

**Visual:** Same left-border timeline design as the restyled `ProfileFieldLog`. Identical colors per type.

**Behaviour:**
- Shows 5 items by default
- "Show more" button to load the rest (data already available in props)
- Empty state: "No public contributions yet."

---

## Layout Changes — `UserProfileClient.tsx`

**Current 2-column grid:**
```
[ Favorites ]  [ Reading Progress ]
```

**New 2-column grid:**
```
[ Favorites ]  [ Reading Progress    ]
               [ Activity Timeline   ]
```

The right column becomes a `<Stack gap="md">` containing `ReadingProgressBar` then `PublicActivityTimeline`.

**No changes to:**
- Header block, stat strip, dossier metadata
- Contributions section (filter + list)
- Guides section
- Data fetching logic

---

## File Change Summary

| File | Change |
|---|---|
| `client/src/components/ReadingProgressBar.tsx` | **New** — shared visual component |
| `client/src/components/PublicActivityTimeline.tsx` | **New** — public activity feed |
| `client/src/app/profile/ProfileProgressReport.tsx` | **Update** — use `ReadingProgressBar` internally |
| `client/src/app/profile/ProfileFieldLog.tsx` | **Restyle** — left-border timeline, 8-item cap, show more |
| `client/src/app/users/[id]/UserProfileClient.tsx` | **Update** — use `ReadingProgressBar`, add `PublicActivityTimeline` |

---

## Non-Goals

- No backend changes
- No changes to data fetching logic or API endpoints
- No changes to admin panel
- No changes to the Contributions or Guides sections in `UserProfileClient.tsx`
