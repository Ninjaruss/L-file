# Detail Page Hero Header — Image Integration Fix

**Date:** 2026-03-22
**Scope:** `MediaThumbnail.tsx`, `DetailPageHeader.tsx`

---

## Problem

Entity detail page headers display a full-bleed portrait image as a background via `MediaThumbnail`. Three issues cause misaligned, poorly-fitted images across all entity types:

1. **Wrong object-position** — `objectPosition: 'center center'` center-crops portrait images inside the landscape header, cutting off faces and key subjects at the top.
2. **Border-radius leak** — `MediaThumbnail` always applies `borderRadius: rem(8)` and a gray `backgroundColor` to its container via inline `containerStyles`. In full-bleed hero use these create a visible inner rounding gap and opaque background that fights the outer header's clipping.
3. **Cycling controls mispositioned** — Desktop left arrow sits at `left: 8px`, hidden behind the dark content overlay covering the left 65% of the header. The desktop dot indicator is centered on the full header width, overlapping the title text.

---

## Approach

Extend `MediaThumbnail` with two new props. `DetailPageHeader` passes both when rendering the hero portrait. No new CSS files, no hook extraction, no restructuring of `DetailPageHeader`'s layout.

---

## Changes

### 1. `MediaThumbnail.tsx` — `objectPosition` prop

Add `objectPosition?: string` prop (default: `'center center'`).

Pass this value to the `object-position` CSS property on every image render path that contains an `<img>` element:

- **Direct images** — `ImageWithRetry` with `fill`. External `<img>` path: add to inline style object. `Next/Image` path: add to `style` prop.
- **YouTube thumbnail** — `ImageWithRetry` with `fill`. Same as above.
- **Unknown-type image fallback** (the `ImageWithRetry` at the bottom of the `isDirectImage === false` branch, ~line 764) — add to style prop.

The **platform-placeholder path** (DeviantArt, Twitter, etc. that render as a `<Box>` with icon/text, no `<img>` element) does not receive `objectPosition` — it is irrelevant there.

No existing call sites are affected (default preserves current behaviour).

**Note on `top center` for non-portrait images:** Using `top center` in the hero context means landscape or square images will show their top half rather than their center. This is an intentional product tradeoff — the majority of entity display images are portrait-oriented and benefit most from top-anchoring.

### 2. `MediaThumbnail.tsx` — Hero container styles via `controlsPosition`

In the `containerStyles` `useMemo`, when `controlsPosition === 'right'`:
- Set `borderRadius: 0` (instead of `rem(8)`)
- Set `backgroundColor: 'transparent'` (instead of the gray fallback)

Using `controlsPosition === 'right'` as the signal is reliable — it is an explicit opt-in from the call site, with no risk of accidentally matching non-hero uses.

### 3. `MediaThumbnail.tsx` — `controlsPosition` prop

Add `controlsPosition?: 'center' | 'right'` prop (default: `'center'`).

**`'center'` (default):** Current behaviour unchanged — left arrow at `left: rem(8)`, right arrow at `right: rem(8)`, dot indicator at `bottom: rem(10), left: 50%, transform: translateX(-50%)`.

**`'right'`:** Controls shift into the visible portrait zone (right portion of the container):

- **Left arrow:** Remove `left: rem(8)`. Set `right: rem(52)` so it sits to the left of the right arrow. Both arrows now appear in the right portion of the container.
- **Right arrow:** `right: rem(8)` — unchanged.
- **Dot indicator:** `bottom: rem(10), right: rem(8)` — right-aligned. Remove `left: 50%` and `transform: translateX(-50%)`.
- **Mobile:** No change — the right-edge arrow and bottom dot strip already sit in the portrait zone.

### 4. `DetailPageHeader.tsx` — Pass new props

Pass to `MediaThumbnail`:
```tsx
objectPosition="top center"
controlsPosition="right"
```

No other changes to `DetailPageHeader`.

---

## Non-goals

- No changes to entity pages (character, arc, gamble, etc.) — all use `DetailPageHeader`
- No changes to non-hero uses of `MediaThumbnail` (cards, sidebars, galleries)
- No CSS file changes
- No hook extraction or API changes

---

## Files Changed

| File | Change |
|------|--------|
| `client/src/components/MediaThumbnail.tsx` | Add `objectPosition`, `controlsPosition` props; strip hero container styles when `controlsPosition === 'right'` |
| `client/src/components/layouts/DetailPageHeader.tsx` | Pass `objectPosition="top center"` and `controlsPosition="right"` |
