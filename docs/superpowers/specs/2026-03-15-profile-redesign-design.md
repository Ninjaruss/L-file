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
- Ambient metadata (case ref number, member-since date) rendered at `#1e1e1e` — present but ghosted, consistent with the case ref treatment
- Status/type tags use very low-opacity tinted backgrounds — readable, not loud
- Typography: serif (`Georgia`) for the username and quote display; monospace for all metadata

---

## Layout — Cinematic Header + Section Grid

### Header (full width)

- Top gradient accent bar (2px)
- Ghost micro-label: `usogui database · classified` at `#1e1e1e`
- Avatar (clickable, with persistent edit badge bottom-right) + username in large serif + inline pencil edit icon
- Role badge (outlined, red), custom role text, badges row
- Dossier metadata block (right-aligned, ghosted): case ref `#XXXX`, active/inactive status, member-since date
- **Inline stat strip** below the name block (separated by a top border):
  - Guides | Media | Annotations | Read% — each as a number + label column
  - Settings gear icon on the far right (no label)

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

- **Characters** — horizontal row of portrait cards (image + name). Max 3 shown, `+` add slot after. Click a portrait to remove/change.
- **Quote** — left-bordered card (`#7c3aed`) with italic serif quote text. Attribution line at `#2d2d2d`. Click to open `QuoteSelectionPopup`.
- **Gamble** — single row with red dot indicator, gamble name, ghosted chapter range. Click to open `GambleSelectionPopup`.

### Activity Feed

Derived from existing data — no new backend endpoint required. Constructed from:
- User's guides (submitted, approved, rejected events from `createdAt`/`updatedAt`)
- User's submissions (media, events, annotations)
- Reading progress changes (stored on user record)

Each row: `[age]` · `[action title]` · `[subtitle/detail]` · `[type tag]`

Type tags: `guide`, `media`, `progress`, `note`, `annotation` — each with a distinct low-opacity tint.

Show 5 most recent entries. No pagination needed.

### Reading Progress

- Chapter X of MAX_CHAPTER with percentage
- Gradient progress bar (`#e11d48` → `#7c3aed`)
- Arc milestone markers: vertical tick lines at arc boundaries, labeled with arc name at `#1e1e1e`–`#222` (completed arcs ghosted, current arc slightly brighter)
- "you" marker at current position in muted red

Arc boundary data: hardcoded constants derived from the manga's actual arc chapter ranges.

### My Content

Replaces the current standalone `My Content` card. Unchanged in functionality, restyled:

- Header row: **My Content** `· case files` label + `+ new` button (red outline)
- Inner tabs: Guides | Media | Events | Annotations (with count badges)
- Filter bar per tab: search input + status segmented control
- Submission rows: left-colored border by status (green=approved, amber=pending, red=rejected), title, ghosted timestamp, status tag
- Rejection reason shown in muted dark red below title when status is rejected

---

## Settings Tab

Accessible via the gear icon in the stat strip. Slide into a settings view or stay as a tab — implementation choice. Contains:
- Linked Accounts (Fluxer link/unlink)
- Custom Role editor (supporter-only gate)
- Account Security (change email, change/set password)

No visual redesign changes to Settings beyond applying the base dark card styling.

---

## Component Architecture

The current `ProfilePageClient.tsx` (~1,890 lines) is split into:

| File | Responsibility |
|------|----------------|
| `ProfilePageClient.tsx` | Orchestrator: data fetching, state, renders subcomponents. Target ~200 lines. |
| `ProfileHeader.tsx` | Cinematic header: avatar, username, role, badges, stat strip |
| `ProfileIntelPanel.tsx` | Favorites section: characters, quote, gamble |
| `ProfileFieldLog.tsx` | Activity feed: derives events from submissions + progress |
| `ProfileProgressReport.tsx` | Reading progress bar with arc milestone markers |
| `ProfileContentTabs.tsx` | My Content: tabs for guides/media/events/annotations with filter + submission cards |
| `ProfileSettingsPanel.tsx` | Settings tab: linked accounts, custom role, account security |

All subcomponents live in `client/src/app/profile/` alongside `ProfilePageClient.tsx`.

### Data flow

`ProfilePageClient.tsx` fetches all data (profile, guides, submissions, badges, quotes, gambles) and passes it down as props. No subcomponent fetches its own data. This keeps the loading/error state centralized.

### Activity feed derivation

`ProfileFieldLog` receives `guides`, `submissions`, and `user` (for progress) as props. It constructs a unified timeline sorted by date, limited to 5 entries. No new API call.

---

## Constraints

- Keep all existing functionality (nothing removed)
- Maintain existing modal components (`QuoteSelectionPopup`, `GambleSelectionPopup`, `ProfilePictureSelector`, `CharacterFavoritesManager`)
- Use existing Mantine components, `getEntityThemeColor`, `outlineStyles`, `textColors` from the theme system
- Activity feed uses only data already fetched — no new backend endpoints
- Arc milestone boundaries hardcoded as constants (can be updated later)
- Mobile: section grid collapses to single column; header stat strip wraps gracefully
