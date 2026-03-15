# Detail Page Redesign — Design Spec

**Date:** 2026-03-15
**Scope:** All detail pages — exactly these 8 files:
- `client/src/app/characters/[id]/CharacterPageClient.tsx`
- `client/src/app/gambles/[id]/GamblePageClient.tsx`
- `client/src/app/arcs/[id]/ArcPageClient.tsx`
- `client/src/app/volumes/[id]/VolumePageClient.tsx`
- `client/src/app/chapters/[id]/ChapterPageClient.tsx`
- `client/src/app/guides/[id]/GuidePageClient.tsx`
- `client/src/app/organizations/[id]/OrganizationPageClient.tsx`
- `client/src/app/events/[id]/EventPageClient.tsx`

**Explicitly excluded:** `profile/ProfilePageClient.tsx` (different use case, not a content entity page)

**Goal:** Premium dark editorial aesthetic — denser, more distinctive, magazine-quality

---

## Problem Statement

The current detail pages feel like profile cards rather than feature pages. Issues:
- Centered, small portrait in a generic header with badges below
- Information density is too low — content feels padded and undifferentiated
- Text is too small to be comfortably readable
- Pages lack a strong visual identity beyond the entity color

---

## Design Direction

**Dark editorial** — think AniList meets a premium manga database. Dense but scannable, confident typography, every entity type feels distinct yet the site is visually coherent.

---

## Section 1: Hero / Header

### Layout
- Full-width hero, ~280px tall, dark atmospheric background (`#080c14`)
- Portrait anchored bottom-right, fills `42%` of the hero width, bottom-aligned, fades into the background via left-edge gradient overlay
- Content (eyebrow, name, stats, tags) sits in the left 65%, z-indexed above the portrait fade
- 3px entity-color strip along the left edge of the hero

### Typography
- **Eyebrow:** 10px, uppercase, letter-spaced (`3px`), entity color, preceded by an 18px × 2px horizontal rule in the same color
- **Entity name:** 44–46px, serif (`var(--font-opti-goudy-text)`), weight 900, tracking `-1px`, white, `text-shadow: 0 2px 24px rgba(0,0,0,0.9)`
- **Stats row:** 3 numbers at 20px weight-800 in entity color; 9px uppercase label (`#555`) below each; separated by `1px solid #222` dividers, `padding: 0 20px`
- **Tags:** 10px chips, `border-radius: 3px`, `padding: 3px 9px`; entity-color variant (`rgba(<color>, 0.12)` bg, `rgba(<color>, 0.22)` border) for primary; neutral (`rgba(255,255,255,0.05)` bg, `#666` text) for secondary

### Portrait fade
The portrait area uses two gradient overlays (both `position: absolute`, `z-index: 2`):
1. **Left fade:** `width: 55%`, `background: linear-gradient(90deg, #080c14 0%, rgba(8,12,20,0.6) 50%, transparent 100%)`
2. **Bottom fade:** `height: 60px`, `background: linear-gradient(0deg, #080c14, transparent)`

### No-image fallback
When no portrait exists, the right 42% of the hero shows:
`background: linear-gradient(160deg, <entity-color>18 0%, transparent 70%)` — a subtle entity-colored glow, no blank void.

### Stats by entity type — with data field mapping
Stats omit when the underlying field is null; the remaining stats expand to fill the row.

| Entity | Stat 1 | Data field | Stat 2 | Data field | Stat 3 | Data field |
|--------|--------|------------|--------|------------|--------|------------|
| Character | Gamble count | `character.gambles.length` | Debut chapter | `character.firstAppearanceChapter` (nullable) | Arc count | `character.arcs.length` |
| Gamble | Player count | `gamble.participants.length` | Start chapter | `gamble.startChapter` | Arc | `gamble.arc.name` |
| Arc | Gamble count | `arc.gambles.length` | Chapter range | `arc.startChapter`–`arc.endChapter` | Sub-arc count | `arc.subArcs?.length` (nullable) |
| Organization | Member count | `org.members.length` | Debut chapter | `org.firstAppearanceChapter` (nullable) | Gamble count | `org.gambles.length` |
| Volume | Chapter count | `volume.chapters.length` | Chapter range | `volume.startChapter`–`volume.endChapter` | Arc count | derived from chapters |
| Chapter | Event count | `chapter.events.length` | Volume | `chapter.volume.number` | Arc | `chapter.arc.name` |
| Guide | View count | `guide.viewCount` | Like count | `guide.likeCount` | Post date | `guide.createdAt` (formatted) |
| Event | Gamble count | `event.gambles.length` (may need fetch) | Chapter | `event.chapter.number` | Arc | `event.arc.name` |

**Note on Event gamble count:** If `event.gambles` is not currently included in the Event page API response, omit that stat rather than adding a new fetch — the remaining two stats are sufficient.

---

## Section 2: Content Area

### Tab Bar
Preserved from current design. Slimmed: 11px, uppercase, `letter-spacing: 0.5px`, `padding: 10px 16px`. Active tab uses entity color. Tabs vary by entity type (unchanged from current).

### Editorial Grid (Overview tab only)
Two-column CSS grid below the tab bar:
```
grid-template-columns: 1fr 260px;
gap: 12px;
```
The aside is **fixed 260px** with `flex-shrink: 0`; the main column takes all remaining space.

- **Main column**: narrative content — Description (accent left border), Backstory, Relationships/Members
- **Aside column**: contextual data — Details key-value list, related lists, recent Annotations

Non-overview tabs (Timeline, Media, Annotations) remain full-width single column — the grid only applies to the Overview tab content.

### Typography
- Body text (description, backstory prose): **14px**, `line-height: 1.6`, `color: #ccc`
- Section titles (card headers): 9px, uppercase, `letter-spacing: 2px`, `color: #555`, with `::after` pseudo-element `flex: 1; height: 1px; background: #1e1e1e`
- Sidebar key labels: 13px, `color: #444`
- Sidebar values: 13px, `color: #999`, `font-weight: 600`; entity-colored (`<entity-color>`) for numeric counts and chapter links
- Related item names: 13px, `color: #777`
- Annotation preview text: 13px, `color: #555`, `line-height: 1.5`

### Card styling
- **Main cards:** `background: #131313; border: 1px solid #1e1e1e; border-radius: 8px; padding: 16px`
- **Description card only:** add `border-left: 3px solid <entity-color>`
- **Aside cards:** `background: #111; border: 1px solid #1a1a1a; border-radius: 8px; padding: 14px`

### Aside sidebar content by entity type
| Entity | Aside sections |
|--------|---------------|
| Character | Details (debut ch., org, role, arc count, gamble count) · Story Arcs · Gambles · Recent Annotations |
| Gamble | Details (start ch., arc, outcome) · Participants · Factions · Recent Annotations |
| Arc | Details (chapter range, sub-arc count) · Gambles · Characters · Sub-arcs |
| Organization | Details (debut ch., type) · Members (compact list) · Gambles |
| Volume | Details (chapter range) · Chapters list · Arcs |
| Chapter | Details (volume, arc) · Events · Quotes |
| Guide | Author · Tags · Related entities (arc, characters, gambles) |
| Event | Details (chapter, arc) · Related Gambles · Characters involved |

### Related items (compact list style)
Each related item row:
```
[5px colored dot] [entity name — 13px #777] [› arrow — 12px #333]
padding: 6px 0; border-bottom: 1px solid #181818
```
Dot color = target entity's color (e.g., red dots for gamble links, orange for arc links).

"View all N →": `font-size: 12px; color: #444`, text link, shown when list > 4 items. Replaces current large button.

### Mobile layout (below `sm` breakpoint, 768px)
The `1fr 260px` grid collapses to a single column. Stacking order:
1. Main column (description, backstory, relationships) — full width
2. Aside column (details, related lists) — full width below

Hero portrait on mobile: hidden (`display: none` below `sm`). The hero background gradient fills the full width. Name and stats remain left-aligned.

---

## Section 3: Entity Color System

No changes to existing color assignments. Applied consistently to:
- Hero left-edge strip
- Eyebrow text and horizontal rule
- Stats row numbers
- Description card left border accent
- Tag chips (primary variant)
- Related item dots use the **target** entity's color, not the current page's color

| Entity | Color |
|--------|-------|
| Character | `#4dabf7` |
| Gamble | `#ff5555` |
| Arc | `#f97316` |
| Organization | `#20c997` |
| Volume | `#ff69b4` |
| Guide | `#51cf66` |
| Event | `#f39c12` |
| Chapter | `#a855f7` |

---

## Shared Components Affected

### `DetailPageHeader.tsx` — new prop interface

Replace the current `children`-based API with structured props. Retain `children` as optional for backward compatibility during migration, but the new fields drive the redesigned layout:

```ts
interface DetailPageHeaderProps {
  entityType: string            // eyebrow label, e.g. "Character"
  entityColor: string           // hex, e.g. "#4dabf7"
  name: string                  // large serif name
  imageUrl?: string             // portrait; if absent, uses fallback gradient
  stats?: Array<{               // up to 3; omit individual items when data is null
    value: string | number
    label: string
  }>
  tags?: Array<{
    label: string
    variant: 'accent' | 'neutral'
  }>
  children?: React.ReactNode    // retained for any per-page additions below the header
}
```

Visual changes:
- Hero height: `280px`
- Portrait: `position: absolute; right: 0; width: 42%; height: 100%; object-fit: cover; object-position: top`
- Left-edge strip: `position: absolute; left: 0; width: 3px; background: linear-gradient(180deg, <entityColor>, transparent)`
- Fallback gradient (no image): `background: linear-gradient(160deg, <entityColor>18 0%, transparent 70%)` on the portrait area

### `RelatedContentSection.tsx` — new `variant` prop

Add `variant?: 'compact' | 'cards'` (default `'cards'` to preserve existing behavior). When `variant="compact"`:
- Renders a flat list of `[dot] [name] [›]` rows instead of preview cards
- Accepts `items: Array<{ id: number | string; label: string; entityColor: string; href: string }>`
- "View All" becomes a small text link

Existing `renderItem` / card-based usage in other contexts is **not broken** — `variant="cards"` (or omitting `variant`) keeps current behavior.

### All 8 `*PageClient.tsx` files
- Wrap Overview tab content in `grid-template-columns: 1fr 260px` layout
- Move contextual data (stats key-value, related entity lists) into the aside column
- Pass `stats`, `tags`, `entityType`, `entityColor` props to `DetailPageHeader`
- Switch related-content sections in aside to `<RelatedContentSection variant="compact" />`
- Apply `font-size: 14px; line-height: 1.6` to prose content areas (description, backstory, rules, etc.)

---

## What Does NOT Change

- Tab structure (Overview / Timeline / Media / Annotations) and tab routing — preserved as-is
- Non-overview tab content (Timeline, Media, Annotations tabs remain full-width)
- Spoiler protection logic (`EnhancedSpoilerMarkdown`, `TimelineSpoilerWrapper`)
- Auth-gated actions (`EntityQuickActions`)
- Server-side data fetching (`page.tsx` files untouched)
- Framer-motion entrance animations
- SEO metadata generation
- Breadcrumb navigation
- `ProfilePageClient.tsx` — excluded from this redesign

---

## Success Criteria

1. All 8 entity detail pages use the new hero and editorial 2-col grid
2. Portrait fills the hero's right 42% without visible negative space; graceful fallback when absent
3. Body text is 14px, line-height 1.6, comfortably readable
4. Stats row shows up to 3 relevant data points per entity type; nulls omit gracefully
5. `DetailPageHeader` exposes the new prop interface; `children` retained for compatibility
6. `RelatedContentSection` gains `variant="compact"` without breaking existing card usage
7. Mobile: grid collapses to single column, portrait hidden below 768px
8. `ProfilePageClient.tsx` is unchanged
