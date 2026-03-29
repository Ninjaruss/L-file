# Detail Page Cinematic Dark Design — Spec

**Date:** 2026-03-29
**Scope:** Public detail pages — Overview tab sub-sections, Media tab, Annotations tab
**Pages affected:** CharacterPageClient, GamblePageClient, ArcPageClient, ChapterPageClient, OrganizationPageClient, EventPageClient, VolumePageClient

---

## Design Direction

**Cinematic Dark** — warm-tinted section cards with entity-color gradient border accents and atmospheric dark backgrounds. Matches Usogui's noir/thriller tone.

Entity colors used are the canonical values from `client/src/lib/entityColors.ts`.

---

## Overview Tab Sub-sections

### Section Cards (Description, Backstory, Organizations)

**Current:** 3px top accent bar + icon box + uppercase label + horizontal divider line inside card.

**New:**
- Card background: `linear-gradient(135deg, {entityColor}0d, #0d0d0d 55%, #0a0a0a)` — subtle warm tint toward top-left
- Card border: `1px solid {entityColor}22`
- Top accent: 1px full-width line via `::before` pseudo-element, `linear-gradient(90deg, {entityColor}, {entityColor}60 40%, transparent 80%)`
- Remove the icon box from section headers
- Section label becomes a pill badge: small background fill + border at low opacity, uppercase, tight letter-spacing
- Horizontal divider after pill stays but uses the entity color at even lower opacity

### Details Sidebar Card

**Current:** Plain row list with mini icon boxes.

**New:**
- Same cinematic card treatment (gradient bg, 1px top line, entity-color border)
- Remove mini icon boxes; replace with a 5px colored dot per row
- Row dividers use entity-color at very low opacity (`#1a1200` style) instead of flat `#161616`
- Key text: darker muted tone (`#6a5030` range for character, adjusted per entity)
- Value text: entity color for numeric/chapter values; linked entity color for cross-entity values (e.g. Organization name uses `organization` color `#0284c7`)

### Related Content Sidebar Cards (Story Arcs, Gambles, Quotes)

**Current:** Plain list with colored dot + plain text item.

**New:**
- Each card gets its own entity-color cinematic treatment (arc = `#ff6b35`, gamble = `#e63946`, quote = `#0d9488`)
- Item text color: lighter tint of entity color (readable, not full saturation)
- Arrow `→` at end of each row item (right-aligned), darker tint of entity color
- "More" text: darker tint of entity color, slightly smaller font
- Row dividers: entity-color at near-zero opacity

---

## Media Tab

**Current:** Plain dark grid of thumbnails inside a basic card with a title + View All button.

**New:**
- Outer card: cinematic dark with `media` color (`#ec4899`) — `linear-gradient(135deg, #1a0520, #0d0d0d 55%, #0a0a0a)`, border `#ec489922`, 1px top gradient line
- Header area: section pill label (`MEDIA GALLERY`) + item count + View All link — no separate Title component
- Thumbnail cells:
  - Image thumbs: `linear-gradient(135deg, #1a0520, #0d0d0d)` bg, border `#ec489920`
  - Video thumbs: `linear-gradient(135deg, #1a0800, #0d0d0d)` bg, border `#ff660020`
  - Type badge overlay (top-right corner): `IMG` in media pink, `VID` in orange — semi-transparent dark bg
- Bottom gradient fade on each thumb via `::after` pseudo-element

---

## Annotations Tab

### AnnotationSection wrapper card

**New:**
- Cinematic dark card: `linear-gradient(135deg, #150520, #0d0d0d 55%, #0a0a0a)`, border `#d946ef25`
- Header uses annotation pill label (`#d946ef`) instead of Title component + MessageSquare icon combo
- "Add" button uses annotation color `#d946ef`

### AnnotationCard

**Current:** `border-left: 3px solid violet` on flat dark card.

**New:**
- Card bg: `linear-gradient(135deg, #150520, #0d0d0d 55%, #0a0a0a)`, border `#d946ef25`
- Top 1px gradient accent line: `linear-gradient(90deg, #d946ef, #d946ef60 40%, transparent 80%)`
- Left 2px accent line: `linear-gradient(180deg, #d946ef, #d946ef40)` via `::after`
- Title text: light fuchsia tint (`#e8c0f8`)
- Preview/content text: muted purple-grey (`#9070b0`)
- Meta row (author · date): darker purple-grey (`#6040a0`)
- Spoiler badge: event/ochre color `#ca8a04` (existing spoiler semantic color)
- Expanded content box: same card-within-card treatment at slightly darker bg

---

## Implementation Notes

- The cinematic card pattern (gradient bg + ::before top line + entity-color border) is repeated across every section. Extract a **shared utility** — either a CSS class or a helper `getCinematicCardStyles(entityColor)` in `mantine-theme.ts` — to avoid duplicating the same inline style object in 10+ places.
- All entity color values come from `entityColors.ts` via `getEntityThemeColor()` — do not hardcode hex values in components.
- These changes apply to **all** entity detail pages, not just Character. The cinematic treatment is driven by each page's `entityColors` map, so the same code changes ripple correctly to Gamble, Arc, Chapter, etc.
- Responsive: the `detail-editorial-grid` already handles mobile collapse via the `className`. No grid layout changes needed.
- `AnnotationCard` is a standalone component used in the Annotations tab — update it in isolation; changes propagate to all pages automatically.
- `MediaGallery` renders its own grid internally. The cinematic wrapper card is applied in the page-level `Tabs.Panel` for media, not inside `MediaGallery` itself.

---

## Out of Scope

- Timeline tab (separate component, not requested)
- Admin panel
- List/index pages
- New features or data changes
