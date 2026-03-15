# Detail Page Redesign — Design Spec

**Date:** 2026-03-15
**Scope:** All detail pages (Character, Gamble, Arc, Volume, Chapter, Guide, Organization, Event)
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
- Full-width hero, ~280px tall, dark atmospheric background
- Portrait anchored bottom-right, fills ~42% of the hero width, fades into the background via left-edge gradient
- Content (eyebrow, name, stats, tags) sits left, z-indexed over the portrait fade zone
- 3px entity-color strip along the left edge of the hero

### Typography
- **Eyebrow:** 10px, uppercase, letter-spaced, entity color, with a short horizontal rule before it
- **Entity name:** 44–46px, serif (`var(--font-opti-goudy-text)`), weight 900, tight tracking, white
- **Stats row:** 3 key numbers at 20px weight-800 in entity color, 9px uppercase label below each, separated by 1px dividers
- **Tags:** small chips (10px, rounded 3px), entity-color variant for primary, neutral for secondary

### Stats by entity type
| Entity | Stat 1 | Stat 2 | Stat 3 |
|--------|--------|--------|--------|
| Character | Gamble count | Debut chapter | Arc count |
| Gamble | Player count | Start chapter | Arc name |
| Arc | Gamble count | Chapter range | Sub-arc count |
| Organization | Member count | Debut chapter | Gamble count |
| Volume | Chapter count | Chapter range | Arc count |
| Chapter | Event count | Volume | Arc |
| Guide | View count | Like count | Post date |
| Event | Gamble count | Chapter | Arc |

### No-image fallback
When no portrait exists, the right side of the hero shows the entity-colored atmospheric gradient (no blank void).

---

## Section 2: Content Area

### Tab Bar
Preserved from current design. Slimmed to 11px uppercase, tighter padding. Tabs: Overview, Timeline, Media, Annotations (varies by entity).

### Editorial Grid (Overview tab)
Two-column grid below the tab bar:
- **Main column** (~65% width): narrative content — Description (with accent left border in entity color), Backstory, Relationships/Members
- **Aside column** (~35% width, ~260px fixed): contextual data — Details key-value list, related Arcs, related Gambles, recent Annotations

### Typography
- Body text: **14–15px**, line-height 1.6
- Section titles (card headers): 9px, uppercase, letter-spaced, `#3a3a3a`, with a `::after` rule extending to a 1px line
- Sidebar key labels: 13px, `#444`
- Sidebar values: 13px, `#999`, weight 600; entity-colored for counts/links
- Related item names: 13px, `#777`
- Annotation preview text: 13px, `#555`

### Card styling
- Main cards: `background: #131313`, `border: 1px solid #1e1e1e`, `border-radius: 8px`, `padding: 16px`
- Description card gets `border-left: 3px solid <entity-color>` accent
- Aside cards: `background: #111`, `border: 1px solid #1a1a1a`

### Aside sidebar content by entity type
| Entity | Aside sections |
|--------|---------------|
| Character | Details (debut, org, role, arc count, gamble count) · Story Arcs · Gambles · Recent Annotations |
| Gamble | Details (start ch., arc, outcome) · Participants · Factions · Recent Annotations |
| Arc | Details (chapter range, sub-arc count) · Gambles · Characters · Sub-arcs |
| Organization | Details (debut, type) · Members (compact list) · Gambles |
| Volume | Details (chapter range) · Chapters list · Arcs |
| Chapter | Details (volume, arc) · Events · Quotes |
| Guide | Author · Tags · Related entities (arc, characters, gambles) |
| Event | Details (chapter, arc) · Related Gambles · Characters involved |

### Related items
- Compact linked list with colored dot (entity color of the target) + name + `›` arrow
- "View all N →" text link when list exceeds 3–4 items (replaces current large button)

---

## Section 3: Entity Color System

No changes to existing color assignments. Applied consistently to:
- Hero left-edge strip
- Eyebrow text
- Stats row numbers
- Description card left border accent
- Related item dots (use the target entity's color, not the current page's color)
- Tag chips

| Entity | Color |
|--------|-------|
| Character | `#4dabf7` (blue) |
| Gamble | `#ff5555` (red) |
| Arc | `#f97316` (orange) |
| Organization | `#20c997` (teal) |
| Volume | `#ff69b4` (pink) |
| Guide | `#51cf66` (green) |
| Event | `#f39c12` (amber) |
| Chapter | `#a855f7` (purple) |

---

## Shared Components Affected

### `DetailPageHeader.tsx`
- Increase hero height from current to ~280px
- Portrait moves from centered to right-anchored, `width: 42%`, bottom-aligned, with left-fade gradient overlay
- Name increases to 44px, left-aligned
- Replace badge cluster with stats row (3 stats, entity-specific)
- Add left-edge color strip
- Add eyebrow label with horizontal rule

### `RelatedContentSection.tsx`
- Replace large preview cards with compact linked list style
- Keep "View All" but as a small text link rather than a button

### All `*PageClient.tsx` files
- Switch main content area from single-column to editorial 2-col grid
- Move contextual data (stats, related entities) into the aside column
- Apply 14–15px body text sizing
- Apply card accent borders

---

## What Does NOT Change

- Tab structure (Overview / Timeline / Media / Annotations) — preserved as-is
- Spoiler protection logic
- Auth-gated actions (EntityQuickActions)
- Server-side data fetching (page.tsx files untouched)
- Animation/motion patterns (framer-motion entrance animations)
- SEO metadata generation
- Mobile responsive behavior — grid collapses to single column below `sm` breakpoint

---

## Success Criteria

1. All 8 entity detail pages use the new hero and editorial grid
2. Portrait fills the hero without visible negative space; degrades gracefully with no image
3. Body text is 14–15px and comfortably readable
4. Stats row shows 3 relevant numbers per entity type (no win rate on character pages)
5. Sidebar holds contextual/relational data; main column holds narrative content
6. `DetailPageHeader` and `RelatedContentSection` are updated as shared components (not per-page duplicated)
7. Mobile layout collapses gracefully (single column)
