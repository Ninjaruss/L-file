# Profile Picture Modal Redesign

**Date:** 2026-03-20
**Status:** Approved
**Scope:** Replace the inline `ProfilePictureSelector` card with a Mantine Modal featuring a tabbed, three-column layout with live preview.

---

## Background

The existing profile picture selector is an inline card that expands within the profile page. It has two problems:

1. **Type selection UX** — The three options (Fluxer / Character Media / Exclusive) are plain clickable rows with no visual weight. There's no preview of the current selection.
2. **Character browser UX** — When "Character Media" is selected, all characters expand in a flat grid below the options, creating a long scroll, no clear spatial hierarchy, and no instant feedback on what the selected image will look like in context.

---

## Goals

- Move selector into a Mantine `Modal` (triggered by clicking the avatar in `ProfileHeader`)
- Tab-switch between Fluxer / Character Media / Exclusive Artwork
- Two-panel character browser: character list on the left, image grid on the right
- Live profile header preview panel that updates on every image click
- Confirm to save; no change until confirmed

---

## Non-Goals

- No changes to the backend API or data model
- No new profile picture types
- No changes to `UserProfileImage` (display component) or `ProfileHeader` layout
- No changes to spoiler logic (re-use existing `TimelineSpoilerWrapper`)

---

## Design

### Modal Trigger

`ProfileHeader` already calls `onOpenProfilePictureSelector()` when the avatar is clicked. The parent (`ProfilePageClient`) currently renders `ProfilePictureSelector` conditionally. This prop/handler stays unchanged — only the component rendered changes.

### Modal Structure

```
┌──────────────────────────────────────────────────────────┐
│  Profile Picture                                    [✕]  │
│  ┌────────────┬──────────────┬────────────────────────┐  │
│  │ Characters │ Fluxer       │ ✦ Exclusive [SUPPORTER]│  │
│  └────────────┴──────────────┴────────────────────────┘  │
│  ┌───────────┬──────────────────────┬──────────────────┐ │
│  │ [Search]  │ Image Grid (3-col)   │ Live Preview     │ │
│  │ Char list │                      │  ┌─────────────┐ │ │
│  │  ● Bak M  │  [img] [img] [img]   │  │mini-profile │ │ │
│  │  ○ Eiji K │  [img] [spoiler]     │  └─────────────┘ │ │
│  │  ○ Kaji   │                      │  Selection info  │ │
│  └───────────┴──────────────────────┴──────────────────┘ │
│  Click an image to preview · Confirm to save   [Cancel] [Confirm] │
└──────────────────────────────────────────────────────────┘
```

**Modal size:** `size="xl"` (Mantine), `padding={0}`, `radius="md"`.
**Modal height:** Fixed `520px` body height with internal scroll on the character list and image grid panels.

---

### Tab: Characters

Three-column layout inside the modal body:

#### Column 1 — Character List (180px fixed width)

- Search `TextInput` at top (`placeholder="Search characters…"`)
- Scrollable list of all characters that have at least one `entity_display` media
- Each row: 28×28 thumbnail (first image for that character) + character name + image count badge
- Clicking a character updates the center column; does **not** save anything
- Active character highlighted with a left border in `#e11d48` and `background: rgba(225,29,72,0.08)`
- Characters sorted alphabetically
- Search filters by character name (client-side, no new API call)

#### Column 2 — Image Grid (flex: 1)

- Header: character name + image count (`"3 images"`)
- 3-column CSS grid, `aspect-ratio: 3/4` per card
- Each card:
  - Wraps content in `TimelineSpoilerWrapper` (existing component) using `chapterNumber || character.firstAppearanceChapter`
  - Spoiler images show a `⚠ Ch.XXX+ Spoiler` placeholder instead of a blurred image
  - Chapter badge (top-right): `Ch.N` in `#e11d48`, only shown when `chapterNumber` is set
  - On click: sets local `pendingSelection` state `{ type: 'character_media', mediaId }` — does **not** call `onSelect` yet
  - Selected card: 2px `#e11d48` border + semi-transparent rose overlay + centered checkmark

#### Column 3 — Live Preview (200px fixed width)

- Label: "Live Preview" (uppercase, muted)
- Mini profile header mockup:
  - Accent bar (same gradient as real header)
  - 40×40 avatar showing the `pendingSelection` image (or current saved selection if no pending)
  - Username and role from the current user object
  - 3-stat strip: Guides / Media / Read%
- Selection info card below: character name + `Ch.N · Character Media`
- Updates immediately on every image click

---

### Tab: Fluxer

- Simple centered layout
- Shows current Fluxer avatar at 80×80
- Text: "Using your Fluxer account avatar"
- Clicking this tab sets `pendingSelection = { type: 'fluxer' }`; the preview panel updates immediately
- If no Fluxer account linked: show an alert with a link to settings

---

### Tab: Exclusive Artwork

- If user has an active `supporter`, `active_supporter`, or `sponsor` badge:
  - Grid of exclusive artwork images (same `entity_display` media query filtered by `purpose: 'exclusive_artwork'`)
  - Same selection/preview UX as Characters tab
- If not a supporter:
  - Locked state: full-tab overlay showing "Supporters only" message and Ko-fi link
  - Tab label shows `[SUPPORTER]` badge

---

### Footer

```
[hint text: "Click an image to preview · Confirm to save"]   [Cancel]  [Confirm Selection]
```

- **Cancel**: closes modal, discards `pendingSelection`
- **Confirm Selection**: calls `onSelect(pendingSelection.type, pendingSelection.mediaId)` then closes modal
- **Confirm** is disabled if `pendingSelection` is null (nothing newly selected)

---

## Component Changes

### New/Modified Files

| File | Change |
|------|--------|
| `client/src/components/ProfilePictureSelector.tsx` | Full rewrite — becomes a modal |
| `client/src/app/profile/ProfilePageClient.tsx` | Minor: wrap selector open state in modal open/close instead of conditional render |

### Preserved Behaviour

- `onSelect(type, mediaId?)` callback signature unchanged — `ProfilePageClient` handler unchanged
- `TimelineSpoilerWrapper` used as-is
- Badge gating logic (`hasActiveBadge`) unchanged
- `fetchCharacterMedia` call lazy (only on first open of Characters tab)

---

## Data Flow

```
ProfileHeader (click avatar)
  → onOpenProfilePictureSelector()
    → ProfilePageClient sets modal open = true

ProfilePictureSelector (Modal)
  → mounts, fetches badges + character media (lazy on tab open)
  → user clicks character → local state: selectedCharacter
  → user clicks image → local state: pendingSelection { type, mediaId }
    → preview panel re-renders
  → user clicks Confirm
    → calls onSelect(type, mediaId)
    → modal closes
  → user clicks Cancel / X
    → modal closes, pendingSelection discarded
```

---

## State

All new state is local to `ProfilePictureSelector`:

| State | Type | Purpose |
|-------|------|---------|
| `activeTab` | `'character_media' \| 'fluxer' \| 'exclusive_artwork'` | Active tab |
| `selectedCharacter` | `string \| null` | Character name currently shown in image grid |
| `pendingSelection` | `{ type: string; mediaId?: number } \| null` | Uncommitted selection for preview |
| `characterFilter` | `string` | Search input value |
| `characterMedia` | `any[]` | Fetched media list |
| `mediaLoading` | `boolean` | Loading state for media fetch |
| `userBadges` | `UserBadge[]` | For feature gating |

---

## Styling

Follows existing project conventions:

- Background: `#111` modal, `#0d0d0d` panels
- Border: `1px solid #1e1e1e` dividers, `1px solid #2a2a2a` cards
- Accent: `#e11d48` (rose-red) for active states, selected borders, confirm button
- Typography: existing Mantine `Text` / `Title` sizes
- Mantine `Modal` with `overlayProps={{ backgroundOpacity: 0.75, blur: 4 }}`

---

## Out of Scope / Future

- Drag-to-reorder exclusive artwork (future)
- Profile banner/cover image (separate feature)
- Pagination for very large character lists (current limit 1000, sufficient)
