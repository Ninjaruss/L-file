# Profile Page Redesign — Design Spec

**Date:** 2026-03-15
**Status:** Approved

---

## Overview

Redesign the `/profile` page from a generic dark UI into a dossier/case-file aesthetic that fits the Usogui manga setting. Simultaneously introduce new features (richer favorites, activity feed, arc milestone progress) and break the ~1,890-line monolithic `ProfilePageClient.tsx` into focused subcomponents.

Priority order: visual design → features → layout → code organization.

---

## Visual Direction

**Dossier / Case File aesthetic.** Dark monospace feel with classified-document details:

- Near-black backgrounds (`#080808`, `#0d0d0d`)
- Red accent (`#e11d48`) for primary identity elements (role badge, active stat, progress bar start)
- Gradient accent bar at the top of the header (`#e11d48` → purple → transparent)
- Section labels: bright, readable (`#d4d4d4`), followed by near-invisible dossier flavor text (`#1e1e1e`) — e.g. **"Favorites** `· intel`"
- Ambient metadata (case ref number, member-since date) rendered at `#1e1e1e` — present but ghosted
- Status/type tags use very low-opacity tinted backgrounds — readable, not loud
- Typography: `var(--font-opti-goudy-text)` for username and quote display (consistent with existing codebase); monospace/system font for all metadata labels

---

## Layout — Cinematic Header + Section Grid

### Header (full width)

- Top gradient accent bar (2px)
- Ghost micro-label: `usogui database · classified` at `#1e1e1e`
- Avatar (clickable, with persistent edit badge bottom-right) + username in large serif + inline pencil edit icon
- Role badge (outlined, red), custom role text, badges row
- Dossier metadata block (right-aligned, ghosted at `#1e1e1e`): case ref = user ID zero-padded to 4 digits (e.g. `#0041`), active status, member-since date
- **Inline stat strip** below the name block (separated by a top border):
  - Guides | Media | Annotations | Read% — each as a number + label column
  - Events is intentionally omitted from the stat strip (lower-frequency content type)
  - Settings gear icon (`⚙`) on the far right (no label) — clicking it switches to the Settings tab

### Section Grid (below header, `padding: 16px`, `grid-template-columns: 1fr 1fr`, collapses to 1-col on mobile)

Four sections:

1. **Favorites** (left column) — `· intel` flavor
2. **Activity** (right column) — `· field log` flavor
3. **Reading Progress** (full width) — `· chapter log` flavor
4. **My Content** (full width) — `· case files` flavor

---

## Sections

### Favorites

Three subsections, each with a small dim sub-label (`Characters`, `Quote`, `Gamble` at `#444`):

- **Characters** — uses the existing `CharacterFavoritesManager` component unchanged. It manages its own internal state, API calls, and display. It is exempt from the top-down prop-passing rule. Wrap it in the section card with the correct label styling.
- **Quote** — left-bordered card (`#7c3aed`) with italic `var(--font-opti-goudy-text)` quote text. Attribution line ("— Character · Ch. X") at `#2d2d2d`. Click anywhere on the card to open `QuoteSelectionPopup`.
- **Gamble** — single row with red dot indicator, gamble name, ghosted chapter range. Show `startChapter`–`endChapter` only if `endChapter` is non-null (`endChapter` is `number | null` in the type). Click to open `GambleSelectionPopup`.

### Activity Feed

Derived from existing data — no new backend endpoint. Constructed client-side from props passed by the orchestrator.

**Event types and display:**

| Type | Tag | Action title | Subtitle/detail |
|------|-----|-------------|-----------------|
| `guide` (status: pending) | guide | Guide submitted | guide title |
| `guide` (status: approved) | guide | Guide approved | guide title |
| `guide` (status: rejected) | guide | Guide rejected | guide title |
| `media` (status: pending) | media | Media submitted | media title |
| `media` (status: approved) | media | Media approved | media title |
| `annotation` | annotation | Annotation added | annotation title (the annotations list API does not return a resolved owner name; always use title) |
| `event` | event | Event submitted | event title |
| `progress` | progress | Reading progress | Chapter X reached |

**Progress entry:** Use the user's current `userProgress` value. For the timestamp, use `user.updatedAt` — note that `updatedAt` is present on the `User` type in `types/index.ts` but absent from the `AuthProvider` `User` interface; add it as `updatedAt?: string` to `AuthProvider.tsx` as part of this work. If `userProgress` is 0, omit this entry.

**No `note` type.** Remove from implementation.

**Timeline construction:** Merge all entries, sort by date descending, show 5 most recent. Use `updatedAt` for guides (reflects latest status change), `createdAt` for all other submission types.

**Tag colors:** guide = green tint, media = blue tint, annotation = purple tint, event = amber tint, progress = orange tint. All at ~8% opacity background with matching low-saturation text.

Show 5 entries. No "show more."

### Reading Progress

- Chapter X of MAX_CHAPTER with percentage (right-aligned in red)
- Gradient progress bar (`#e11d48` → `#7c3aed`), height 4px
- Arc milestone markers: vertical tick lines at arc start chapter boundaries, labeled with arc name
  - Completed arc labels: `#1e1e1e` (near-invisible)
  - Current arc label: `#333` (slightly brighter)
  - "you" marker at current position: muted red (`rgba(225,29,72,0.5)`)
  - Label collision: if two arc labels would overlap (< 5% apart), omit the earlier one's label but keep the tick

Arc boundaries hardcoded in a new constant `PROFILE_ARC_MILESTONES` in `client/src/lib/constants.ts`. Format: `Array<{ name: string; startChapter: number }>`. This is acknowledged technical debt — arc data exists in the DB but is hardcoded here for simplicity.

### My Content

Unchanged in functionality, restyled:

- Header row: **My Content** `· case files` label + `+ new` dropdown menu button (red outline)
- Inner tabs: Guides | Media | Events | Annotations (with count badges) — Events remains here
- Filter bar per tab: search input + status segmented control
- Submission rows: left-colored border by status (green=approved, amber=pending, red=rejected), title, ghosted timestamp (`#2a2a2a`), status tag (low-opacity tinted)
- Rejection reason shown in muted dark red (`#5a2a2a`) below title when status is rejected

---

## Settings Tab

Accessed via the gear icon in the stat strip, which sets `profileTab = 'settings'` — the existing tab switcher pattern is preserved. Top-level tabs remain `General` and `Settings`.

No visual redesign changes to Settings content beyond applying the base dark card styling (`background: #0d0d0d`, `border: 1px solid #1a1a1a`).

---

## Component Architecture

The current `ProfilePageClient.tsx` (~1,890 lines) is split into:

| File | Responsibility |
|------|----------------|
| `ProfilePageClient.tsx` | Orchestrator: data fetching, state, tab switching, renders subcomponents. Target ~250 lines. |
| `ProfileHeader.tsx` | Cinematic header: avatar, username, role, badges, stat strip, gear → settings tab handler |
| `ProfileIntelPanel.tsx` | Favorites section: wraps `CharacterFavoritesManager`, quote card, gamble row |
| `ProfileFieldLog.tsx` | Activity feed: derives and renders timeline from `guides`, `submissions`, `user` props |
| `ProfileProgressReport.tsx` | Reading progress bar with arc milestone markers |
| `ProfileContentTabs.tsx` | My Content: tabs for guides/media/events/annotations with filter + submission cards |
| `ProfileSettingsPanel.tsx` | Settings tab: linked accounts, custom role, account security |

All subcomponents live in `client/src/app/profile/` alongside `ProfilePageClient.tsx`.

### Data flow

`ProfilePageClient.tsx` fetches all data (profile, guides, submissions, badges, quotes, gambles) and passes it down as props. Exception: `CharacterFavoritesManager` manages its own data internally and is not refactored.

### Loading skeleton

`ProfileSkeleton` (defined inline at the top of `ProfilePageClient.tsx`) is updated to match the new cinematic header + 2-col grid layout: a header-shaped block + two side-by-side skeleton cards + two full-width skeleton cards.

---

## Constraints

- Keep all existing functionality (nothing removed)
- Maintain existing modal components (`QuoteSelectionPopup`, `GambleSelectionPopup`, `ProfilePictureSelector`, `CharacterFavoritesManager`)
- Use existing Mantine components, `getEntityThemeColor`, `outlineStyles`, `textColors` from the theme system
- Activity feed uses only data already fetched — no new backend endpoints
- Arc milestone boundaries hardcoded as `PROFILE_ARC_MILESTONES` constant
- Mobile: section grid collapses to single column; header stat strip wraps gracefully
- `CharacterFavoritesManager` is not refactored — it remains self-contained
