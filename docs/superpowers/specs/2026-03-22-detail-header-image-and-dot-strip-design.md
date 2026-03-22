# Detail Header: Blurred Background Layer + Dot Strip Improvements

**Date:** 2026-03-22
**Status:** Approved

## Problem

Two issues on entity detail page headers (`DetailPageHeader`):

1. **Image blending** — `objectFit: contain` with `objectPosition: right top` creates empty dark bars when rectangular artwork doesn't match the 280px container aspect ratio. The image looks pasted-in rather than integrated.
2. **Dot strip** — Navigation dots (7–10px) are too small to see clearly and too small to select reliably, especially on touch. The pill background lacks sufficient contrast.

## Solution

### 1. Blurred Background Layer (`MediaThumbnail.tsx` + `DetailPageHeader.tsx`)

**New prop:** `showBlurredBackground?: boolean` on `MediaThumbnail`

When `true`, a second image layer is rendered underneath the main image using the same current `MediaItem`. This layer:
- `objectFit: cover` — fills the entire container
- `filter: blur(20px) brightness(0.3) saturate(0.6)` — heavily blurred and darkened so it reads as texture/atmosphere, not a second image
- `transform: scale(1.08)` — slight scale prevents the blur from leaving a bright fringe at container edges
- `pointerEvents: none`, `aria-hidden: true` — purely decorative, no interaction
- Updates in sync with the current cycling index (same `currentThumbnail` state)

The main image layer is unchanged in rendering but:
- `objectPosition` changes from `"right top"` → `"center top"` in `DetailPageHeader` (blurred bg now handles the right-side fill; centering horizontally works better for varied image compositions)

**`DetailPageHeader.tsx` changes:**
- Pass `showBlurredBackground={true}` to `MediaThumbnail`
- Change `objectPosition="right top"` → `objectPosition="center top"`
- Narrow the left-edge fade overlay from `width: '70%'` to `width: '60%'` (the blurred bg covers any remaining gap)

### 2. Dot Strip — Hero Mode (`MediaThumbnail.tsx`)

Applies only to the `controlsPosition === 'right'` branch (lines ~1167–1201).

| Property | Before | After |
|---|---|---|
| Pill background | `rgba(0,0,0,0.55)` | `rgba(0,0,0,0.72)` |
| Pill border | none | `1px solid rgba(255,255,255,0.08)` |
| Pill padding (block) | `rem(5)` | `rem(7)` |
| Pill padding (inline) | `rem(8)` | `rem(10)` |
| Active dot size | `rem(10)` | `rem(14)` |
| Active dot shadow | none | `0 0 0 3px rgba(255,255,255,0.15)` |
| Inactive dot size | `rem(7)` | `rem(9)` |
| Inactive dot opacity | `0.35` | `0.45` |
| Count text size | `rem(9)` | `rem(11)` |
| Count text opacity | `0.5` | `0.65` |
| Dot hit target | dot element itself | each dot wrapped in `Box` with `padding: rem(4)` |

The `padding: rem(4)` wrapper keeps the visual dot size the same while expanding the clickable area to ~22px for inactive dots and ~22px+ for active — significantly more tappable.

## Files Changed

| File | Change |
|---|---|
| `client/src/components/MediaThumbnail.tsx` | Add `showBlurredBackground` prop; render blurred layer when true; update hero dot strip sizing and hit targets |
| `client/src/components/layouts/DetailPageHeader.tsx` | Pass `showBlurredBackground={true}`, change `objectPosition`, narrow fade overlay |

## Non-Goals

- No changes to mobile dot strip (center-mode, lines ~1226–1255) — separate layout
- No changes to desktop center-mode arrows/dots
- No changes to any other entity detail page components
- No new API calls — blurred layer reuses the same `currentThumbnail` already in state
