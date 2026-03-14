# List & Detail Page Design Polish

**Date:** 2026-03-13
**Approach:** Component-Level Redesign (Approach 2)
**Scope:** All 10 list pages + 8 detail pages via shared component upgrades

---

## Overview

A comprehensive visual overhaul of all list and detail pages through targeted redesigns of 6 shared components and CSS. No data logic, routing, or prop APIs change. Every improvement is self-contained within component internals or global CSS.

**Design direction approved by user:**
- **Cards:** Dark & Dramatic (deep blacks, entity-color glows, heavy shadows)
- **Detail headers:** Cinematic (centered portrait, atmospheric background, name overlaid)
- **Tabs:** Glowing Pill (gradient fill + ambient glow on active tab)

---

## Files To Change

| File | Nature of change |
|------|-----------------|
| `client/src/components/cards/PlayingCard.tsx` | Visual — border, gradients, scan-line texture, name box |
| `client/src/components/layouts/DetailPageHeader.tsx` | Layout + visual — two-column → cinematic centered |
| `client/src/components/layouts/ListPageHero.tsx` | Visual — deeper bg, stronger icon glow, scan-line overlay |
| `client/src/components/layouts/SearchToolbar.tsx` | Visual — sticky state: darker bg, stronger border glow |
| `client/src/components/layouts/PaginationBar.tsx` | Visual — active page gets gradient glow to match tabs |
| `client/src/components/HoverModal.tsx` | Visual — top accent stripe, eyebrow label, separator rule |
| `client/src/app/globals.css` | CSS — tab glowing pill styles, card hover intensification |

---

## Section 1 — PlayingCard

**File:** `client/src/components/cards/PlayingCard.tsx`

### Changes

**Card border & outer glow**
- Border: `accentColor` at **35% alpha** (up from 18%)
- Box-shadow: add outer ambient glow `0 0 20px ${accentColor}40` alongside existing shadow
- Increase base box-shadow depth: `0 4px 20px rgba(0,0,0,0.6)` (up from `0 2px 10px`)

**Image area**
- Bottom gradient: increase height from 55% to **70%**; deepen bottom stop to `rgba(0,0,0,0.85)`; add a second accent-tinted overlay at the very bottom (`${accentColor}15`, 30% height) stacked above the black fade
- Add horizontal scan-line texture via `repeating-linear-gradient` (`rgba(0,0,0,0.18)` every 4px) — same as DetailPageHeader treatment
- Add subtle radial glow at top-center of image: `radial-gradient(ellipse at 50% 30%, ${accentColor}07, transparent 65%)`

**Suit watermark**
- Opacity: `0.18` → `0.32`
- Add `filter: drop-shadow(0 0 4px ${accentColor}50)` to the SVG

**Eyebrow label**
- Background alpha: `${accentColor}20` → `${accentColor}18` (keep subtle but add text-shadow: `0 0 8px ${accentColor}60`)

**Name box**
- Border alpha: `55%` → `65%`
- Box-shadow: add `0 0 14px ${accentColor}28` (glow) to existing shadow
- Inset highlight: `inset 0 1px 0 rgba(255,255,255,0.07)` added to shadow stack
- Background: deepen to `linear-gradient(180deg, rgba(4,2,2,0.92), rgba(8,5,5,0.97))`

---

## Section 2 — DetailPageHeader (Cinematic)

**File:** `client/src/components/layouts/DetailPageHeader.tsx`

### Layout Change

Remove the two-column `Group` layout. Replace with a single centered `Stack`:

```
[atmospheric background area]
  ├── eyebrow entity-type label (centered, top)
  ├── portrait image (centered, floating with glow)
  ├── entity name (overlaid at bottom with text-shadow)
  └── heavy bottom gradient fade into page bg
[children area — centered flex row]
  └── badges, stats, quick actions
```

### Atmospheric Background Layer

- Background: `linear-gradient(180deg, ${accentColor}10 0%, ${accentColor}02 100%)` over dark base
- Radial accent bloom centered top: `radial-gradient(ellipse at 50% 0%, ${accentColor}20, transparent 65%)`
- Halftone dot pattern (existing `mangaPatterns.halftoneBackground` — keep)
- Speed lines (existing `SpeedLines` — keep)
- Suit watermark (existing `EntitySuitWatermark` — keep, increase size to 200px, opacity 0.09)
- Horizontal scan-line texture: `repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.14) 3px, rgba(0,0,0,0.14) 4px)`
- Heavy bottom gradient fade: `linear-gradient(transparent, ${pageBackground})` over bottom 40% — creates seamless blend into page

### Portrait Image

- Centered horizontally
- Size: `imageWidth` default stays `200px`, `imageHeight` default stays `280px` (user confirmed B = large)
- Border: `2px solid ${accentColor}` at 70% alpha
- Box-shadow: `0 0 40px ${accentColor}45, 0 12px 40px rgba(0,0,0,0.8)`
- Remove the vignette radial-gradient overlay (was `radial-gradient(ellipse, transparent 40%, rgba(0,0,0,0.45) 100%)`) — the atmospheric bg already provides depth

### Entity Label Above Portrait

- Positioned centered above portrait, same eyebrow-label class
- `background: ${accentColor}15`, `border: 1px solid ${accentColor}40`
- `text-shadow: 0 0 8px ${accentColor}60`

### Entity Name Overlay

- Positioned at bottom of the atmospheric area, centered
- `font-size: 2rem`, serif font, `font-weight: 800`
- `text-shadow: 0 2px 20px rgba(0,0,0,0.95), 0 0 40px ${accentColor}20`
- Rendered as a `Title` element (for semantics) with the entity name passed via `entityName` prop — **no new props needed**

### Children Area

- Rendered below the atmospheric section in a centered `Group` with `justify="center"` and `wrap="wrap"`
- `padding: theme.spacing.md theme.spacing.lg`
- `border-top: 1px solid ${accentColor}15`
- `background: rgba(0,0,0,0.2)` tint

### Props

No API changes. All existing props (`entityType`, `entityId`, `entityName`, `children`, `imageWidth`, `imageHeight`, `showImage`) remain identical.

---

## Section 3 — Tabs (globals.css)

**File:** `client/src/app/globals.css`

### Changes

Replace the current solid-fill active tab style with a glowing pill approach. The tab list itself gets a dark pill container.

**Tab list container** — add wrapper styles targeting `.mantine-Tabs-list`:
```css
.character-tabs .mantine-Tabs-list,
.gamble-tabs .mantine-Tabs-list,
.arc-tabs .mantine-Tabs-list,
.guide-tabs .mantine-Tabs-list,
.volume-tabs .mantine-Tabs-list,
.organization-tabs .mantine-Tabs-list,
.chapter-tabs .mantine-Tabs-list {
  background: rgba(0, 0, 0, 0.45);
  border-radius: 10px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  gap: 2px;
}
```

**Active tab** — replace solid `background-color: var(--color-X)` with gradient + glow:
```css
background: linear-gradient(135deg, ${accentColor}45, ${accentColor}20) !important;
border: 1px solid ${accentColor}55 !important;
border-radius: 7px !important;
box-shadow: 0 0 16px ${accentColor}25, inset 0 1px 0 rgba(255,255,255,0.08) !important;
color: #ffffff !important;
```

Apply the same pattern for all entity types: character, gamble, arc, guide, volume, organization, chapter (adding missing entity types that aren't currently in globals.css).

**Hover state** — reduce alpha slightly for consistency with new active style:
- Background: `${accentColor}18` (down from `0.25`) on hover to create clearer gap between hover and active

---

## Section 4 — ListPageHero

**File:** `client/src/components/layouts/ListPageHero.tsx`

### Changes

**Background**
- Deepen hero gradient: strengthen entity-color tint in `getHeroStyles` from `${accentColor}06` to `${accentColor}10` top, fading to `${accentColor}02`
- Add horizontal scan-line overlay (same `repeating-linear-gradient` pattern used elsewhere): `rgba(0,0,0,0.12)` every 4px

**Icon circle**
- `box-shadow`: outer glow from `${accentColor}60` → `${accentColor}70`, spread glow from `${accentColor}20` → `${accentColor}28`
- Add `inset 0 1px 0 rgba(255,255,255,0.2)` to shadow stack

**Diamond rule**
- Increase gradient stop opacity: `${accentColor}30` → `${accentColor}50`
- Diamond `♦` character: `${accentColor}90` → `${accentColor}` (full opacity)

**Count badge**
- Add `text-shadow: 0 0 12px ${accentColor}60` (already present — verify it stays)
- Add `box-shadow: 0 0 16px ${accentColor}12` outer glow

---

## Section 5 — SearchToolbar (sticky state)

**File:** `client/src/components/layouts/SearchToolbar.tsx`

### Changes (sticky/stuck state only)

- Background: `rgba(12,8,8,0.94)` → `rgba(8,8,16,0.97)` (deeper, cooler dark)
- Left border: `${accentColor}80` → `${accentColor}` (full opacity)
- Add outer left glow to box-shadow: `-4px 0 24px ${accentColor}10` (up from `15`)
- Bottom gradient separator: already present — increase accent stop from `${accentColor}40` → `${accentColor}55`

**Input styles (focus state)**
- Focus box-shadow: add `0 0 20px ${accentColor}15` (up from `18`) for stronger focus feedback

---

## Section 6 — PaginationBar

**File:** `client/src/components/layouts/PaginationBar.tsx`

### Changes

**Active page button** — pass updated `styles` to `Pagination`:
```tsx
control: {
  // active state via CSS var
  '&[data-active]': {
    background: `linear-gradient(135deg, ${accentColor}50, ${accentColor}25)`,
    border: `1px solid ${accentColor}70`,
    boxShadow: `0 0 14px ${accentColor}35, inset 0 1px 0 rgba(255,255,255,0.1)`,
    color: '#ffffff',
  }
}
```

**Border radius**: `4px` → `6px` on all buttons for consistency with pill aesthetic

**Count label**: add `textShadow: \`0 0 12px ${accentColor}30\`` to the results info `Text`

---

## Section 7 — HoverModal

**File:** `client/src/components/HoverModal.tsx`

### Changes

**Top accent stripe** — add inside `Paper`, before the scan-line overlay:
```tsx
<Box aria-hidden style={{
  height: 3,
  background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}66 60%, transparent 100%)`,
  borderRadius: `${theme.radius.lg} ${theme.radius.lg} 0 0`,
  marginBottom: 0,
}} />
```

**Eyebrow entity label** — add at top of content Stack (inside `Box style={{ position: 'relative', zIndex: 1 }}`):
```tsx
<Text className="eyebrow-label" style={{ color: accentColor, fontSize: '0.6rem', letterSpacing: '0.22em' }}>
  {/* The parent already knows accentColor — add entityType prop or infer from accentColor */}
</Text>
```
> Note: `HoverModal` currently doesn't receive `entityType` as a named label. Add an optional `entityLabel?: string` prop. All call sites can pass the entity type string. This is a minor additive prop — no breaking change.

**Separator rule** — add a 1px gradient line between the eyebrow/title area and body content (rendered by children, not HoverModal itself — document this as a convention for hover modal content).

**Outer glow** — strengthen `boxShadow`:
- `0 24px 48px rgba(0,0,0,0.7)` → `0 24px 48px rgba(0,0,0,0.8)`
- `0 0 0 1px ${accentColor}30` → `0 0 0 1px ${accentColor}20` (keep subtle ring)
- Add: `0 0 32px ${accentColor}08` (ambient glow)

**Background**: `backgroundStyles.modal` → `rgba(6,6,14,0.97)` (slightly cooler, deeper)

---

## Implementation Notes

### Prop API Compatibility
- `PlayingCard`: no prop changes
- `DetailPageHeader`: no prop changes
- `ListPageHero`: no prop changes
- `SearchToolbar`: no prop changes
- `PaginationBar`: no prop changes
- `HoverModal`: add optional `entityLabel?: string` prop (additive, non-breaking)

### Missing Entity Types in globals.css
Current tab styles only cover `character`, `gamble`, `arc`, `guide`. Add the same patterns for `volume`, `organization`, `chapter`, `event` to ensure full coverage across all detail pages.

### Consistency Pattern
Every glow/shadow across all components follows the same formula:
- **Ambient glow**: `0 0 Xpx ${accentColor}YY` where YY = 25–45%
- **Depth shadow**: `0 Npx Mpx rgba(0,0,0,0.7–0.85)`
- **Inset highlight**: `inset 0 1px 0 rgba(255,255,255,0.06–0.10)`

This creates visual cohesion across cards, header, modal, pagination, and tabs.

### CSS Variable Approach
The `setTabAccentColors` function in `mantine-theme.ts` already sets `--tab-active-bg`, `--tab-active-outline` etc. on `document.documentElement`. The new glowing pill styles in globals.css should reference these variables where possible to stay in sync with the existing system.

---

## Out of Scope

- Data fetching, routing, or state management changes
- New pages or page structure changes
- Admin panel, auth pages, submit pages
- Mobile layout restructuring (responsive behavior preserved as-is)
- Accessibility beyond what already exists

---

## Success Criteria

1. All 10 list pages render with enhanced PlayingCards and more dramatic ListPageHero
2. All 8 detail pages render with cinematic centered header (portrait + name overlay + badges below)
3. Tabs on all detail pages display the glowing pill style with entity accent color
4. HoverModal shows top accent stripe and eyebrow label
5. PaginationBar active page matches tab glow treatment
6. SearchToolbar sticky state is visually darker and more defined
7. No TypeScript errors (`yarn build` passes in client/)
8. No prop API breakage — all existing detail page files unchanged
