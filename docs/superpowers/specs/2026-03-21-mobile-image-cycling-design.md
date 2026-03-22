# Mobile Image Cycling Controls — Design Spec

**Date:** 2026-03-21
**Status:** Approved

## Problem

On mobile, the `DetailPageHeader` hero renders the entity portrait in the right 42% of a 280px-tall panel. The existing cycling controls (`MediaThumbnail` with `allowCycling={true}`) place:

- A ‹ arrow at `left: 8px` of the portrait — falls behind the left-side fade gradient and overlaps the text column, making it invisible/confusing on narrow screens.
- A › arrow at `right: 8px` — usable but small (`size="sm"`, 28px).
- Dot indicators at `bottom: 10px` inside a frosted pill — invisible against the bottom gradient fade.

Result: on mobile, users cannot clearly see or operate the image cycling controls.

## Goal

Make the cycling controls clear and tappable on mobile without changing the desktop layout.

## Scope

**One file changes:** `client/src/components/MediaThumbnail.tsx`

No changes to `DetailPageHeader`, page components, or any other callers. No new props.

## Design

### Mobile layout (`max-width: 768px`, when `showControls` is true)

| Element | Spec |
|---------|------|
| **Next arrow** | ChevronRight, `size="md"` (36px), positioned `right: 8px, top: 50%, translateY(-50%)`, `zIndex: 30`, backdrop `rgba(0,0,0,0.58)`, border `1px solid rgba(255,255,255,0.15)`. Must call `e.stopPropagation()` in onClick (consistent with existing desktop arrow handlers) to prevent triggering the container's expand-modal click. |
| **Previous arrow** | Hidden. **Mobile cycling is forward-only and intentional.** Users advance with › and it wraps back to image 1 after the last image via the existing `handleNext` wrap logic. No `handlePrev` is exposed on mobile. |
| **Dot strip** | Full-width band pinned `bottom: 0` of the portrait container. Background `rgba(0,0,0,0.72)`. Height ~18px. Dots centered horizontally with `gap: 5px`. `zIndex: 30`. `pointerEvents: none` — the strip is a position indicator only and does not intercept touches. Taps in the dot area fall through to the container; when `canExpand` is true this will open the fullscreen modal. This is an accepted side effect. |
| **Active dot (mobile only)** | 6×6px white circle. Inactive: 5×5px `rgba(255,255,255,0.35)`. Desktop dot sizes remain unchanged: active 8×8px, inactive 5×5px. |

**zIndex layering note:** The › arrow is centered vertically (`top: 50%`) and the dot strip is pinned to the bottom (`bottom: 0`, height ~18px). In the hero (280px tall), the arrow center sits at ~140px from top and the dot strip spans the bottom 18px — they do not overlap. The `showControls` guard (`numericMaxHeight > 64`) ensures the portrait is always tall enough to maintain this separation.

### Desktop layout (unchanged)

Both ‹ and › arrows at `left: 8px` / `right: 8px`, `size="sm"`, `top: 50%`. Frosted-pill dot indicator at `bottom: 10px, left: 50%` — exactly as today.

### Implementation approach

Use Mantine's `useMediaQuery('(max-width: 768px)')` (same hook already used in `MediaGallery`) inside `MediaThumbnail`. Split the existing `showControls` render block into mobile and desktop branches inline.

```tsx
const isMobile = useMediaQuery('(max-width: 768px)')

{showControls && (
  isMobile ? /* mobile branch */ : /* desktop branch */
)}
```

### Edge cases

| Case | Behaviour |
|------|-----------|
| 1 image | `showControls` is `false` (`allEntityMedia.length > 1` guard) — no controls rendered |
| Spoiler overlay | Spoiler wraps `mediaContent`; controls are siblings outside it — no interaction |
| Forward-only wrap | `handleNext` wraps index 0 after last. Single arrow is sufficient. Intentional. |
| SSR / hydration | `useMediaQuery` returns `false` on server → desktop layout (both ‹ › arrows + frosted pill) renders on first paint on mobile devices. After hydration, the layout swaps to mobile (› only + dot strip). The ‹ arrow appearing briefly on mobile before hydration is an **accepted regression** — identical behaviour to `MediaGallery`. Not a bug to file. |
| Expand (fullscreen) | No positioned expand button exists. Expand is triggered by clicking anywhere on the portrait container when `canExpand` is true. The mobile › arrow calls `e.stopPropagation()` to avoid triggering the modal on arrow taps. Tapping the dot strip area falls through (`pointerEvents: none`) and may open the modal — accepted side effect. |

## Out of scope

- Layout changes to `DetailPageHeader` (stacking, thumbnail strips)
- Changes to any entity page components
- Swipe gesture support
- Desktop arrow/dot changes
