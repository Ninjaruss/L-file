# Media Gallery Lightbox Unification — Design Spec

**Date:** 2026-03-21
**Status:** Approved

## Problem

The codebase has two separate lightbox implementations:

1. `MediaLightbox.tsx` — full-screen modal used by `MediaGallery.tsx` (detail pages)
2. Inline `Modal` in `MediaPageContent.tsx` — 90%-width modal used by the media list page

These produce an inconsistent experience and both have UX issues:

- `MediaLightbox` has no visible close button; click-outside only works on the narrow black edges because the image container calls `stopPropagation`
- `MediaPageContent`'s modal has a different visual style (metadata panel below image vs. gradient overlay), no counter, and a naive YouTube URL embed (`string.replace`)
- No-thumbnail cards (audio, non-YouTube video, external page links) lack hover affordance and have no consistent min-height

## Goals

- One unified lightbox component used everywhere
- Full-screen immersive style (black backdrop, image centred, gradient overlay metadata)
- Reliable close: visible X button + backdrop click; image click does nothing
- Entity name shown in lightbox metadata (e.g., "Baku Madarame" alongside the "character" badge)
- Improved no-thumbnail card state: accent-ringed icon, type label, "Click to open" hint

## Architecture

### 1. Shared type — `client/src/types/media.ts`

Export a single `MediaItem` interface that merges both existing definitions. The entity relation fields from `MediaPageContent` become optional:

```ts
export interface MediaItem {
  id: number
  url: string
  type: 'image' | 'video' | 'audio'
  description: string
  fileName?: string
  isUploaded?: boolean
  ownerType: 'character' | 'arc' | 'event' | 'gamble' | 'organization' | 'user'
  ownerId: number
  chapterNumber?: number
  purpose: 'gallery' | 'entity_display'
  submittedBy: { id: number; username: string }
  createdAt: string
  status?: string
  isApproved?: boolean
  // Entity relations (populated when fetching from list page)
  character?: { id: number; name: string }
  arc?: { id: number; name: string }
  event?: { id: number; title: string }
  gamble?: { id: number; name: string }
  organization?: { id: number; name: string }
}
```

Both `MediaGallery.tsx` and `MediaPageContent.tsx` import `MediaItem` from this shared file instead of defining their own.

### 2. Updated `MediaLightbox.tsx`

**Close UX fix:**
- The outer `Box` (`onClick={onClose}`, full viewport) remains the backdrop — clicking anywhere outside the image closes
- The inner content wrapper changes: instead of `onClick={(e) => e.stopPropagation()}`, the image itself gets `onClick={(e) => e.stopPropagation()}` so only the image element blocks propagation, not the whole flex container
- A visible circular X button is added at top-right using the existing frosted-glass `controlStyle`, positioned alongside the existing external-link button

**Layout:**
```
[counter pill]  top-left
[external-link] [close X]  top-right
[‹ prev]  center-left
[› next]  center-right
[gradient overlay bar]  bottom — description + badges + entity name + submitter
```

**Entity name in metadata:**
Add a helper `getEntityName(item: MediaItem)` that reads `item.character?.name ?? item.arc?.name ?? item.event?.title ?? item.gamble?.name ?? item.organization?.name ?? null`. If a name is found, show it as a `Badge` variant="outline" in the bottom bar (between the type badge and the submitter text).

**Video embed:**
Replace the inline YouTube check in `MediaPageContent`'s old modal with `getEnhancedEmbedUrl` (already used in `MediaLightbox`) for correct URL handling.

### 3. `MediaGallery.tsx`

- Remove the local `MediaItem` interface; import from `types/media.ts`
- No other changes (it already uses `MediaLightbox`)

### 4. `MediaPageContent.tsx`

- Remove the local `MediaItem` interface; import from `types/media.ts`
- Remove the inline `Modal` lightbox block (~110 lines, lines 891–1060)
- Add `import MediaLightbox from '../../components/MediaLightbox'`
- Replace the removed modal with:
  ```tsx
  <MediaLightbox
    opened={viewerOpen}
    media={media}
    currentIndex={currentIndex}
    onClose={handleCloseViewer}
    onPrevious={handlePrevious}
    onNext={handleNext}
  />
  ```
- Remove `import { Image, Modal }` from Mantine imports (no longer needed for the lightbox)
- Keep all existing state and handlers (`viewerOpen`, `selectedMedia`, `currentIndex`, `handlePrevious`, `handleNext`, etc.) — they wire directly to the new component

### 5. No-thumbnail card state (both `MediaGallery.tsx` and `MediaPageContent.tsx`)

The fallback `Box` shown when there is no thumbnail or when image load fails gets these changes:

- `minHeight: 120` (consistent across both files, up from 150 / variable)
- On hover (`isHovered`): add a `boxShadow: 0 0 0 1px ${accent}60 inset` ring and slightly increase icon opacity
- Icon wrapped in a circular accent-tinted container (background `${accent}20`, border `${accent}40`, 44×44px, border-radius 50%)
- Two text labels below icon: type name (e.g., "Video") at 11px white/70, and "Click to open" at 10px white/35
- The `failedImageIds` branch ("Image unavailable") keeps its `ImageOff` icon but also gets the consistent min-height and a "Click to view" sub-label

## What Is Not Changing

- Masonry grid layout, filter logic, infinite scroll, search — untouched
- `MediaThumbnail.tsx` (the entity display thumbnail component) — separate concern, untouched
- All existing keyboard navigation and touch swipe in `MediaLightbox` — preserved as-is
- Admin media components — untouched

## Files Changed

| File | Change |
|------|--------|
| `client/src/types/media.ts` | **New** — shared MediaItem type |
| `client/src/components/MediaLightbox.tsx` | Fix close UX, add X button, add entity name, import shared type |
| `client/src/components/MediaGallery.tsx` | Import shared type, improve no-thumbnail card |
| `client/src/app/media/MediaPageContent.tsx` | Import shared type, remove inline modal, wire MediaLightbox, improve no-thumbnail card |
