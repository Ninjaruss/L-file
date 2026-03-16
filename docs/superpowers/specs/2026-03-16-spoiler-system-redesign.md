# Spoiler System Redesign

**Date:** 2026-03-16
**Status:** Approved

## Problem

The spoiler system has three independent implementations with inconsistent visuals and duplicated logic:

| Component | Location | Overlay opacity | Icon | "Click to reveal" | Color |
|---|---|---|---|---|---|
| `MediaSpoilerWrapper` | `MediaThumbnail.tsx` | 85% | `AlertTriangle` | Yes | Hardcoded red |
| `TimelineSpoilerWrapper` | `TimelineSpoilerWrapper.tsx` | 78–90% | `AlertTriangle` | Yes | Entity theme color |
| `EventSpoilerWrapper` | `EventsPageContent.tsx` (local) | 15–25% (barely visible) | `AlertCircle` | No | Entity theme color |

Additionally, `QuotesPageContent` defaults `chapterNumber` to `1` when no chapter is present (`quote.chapter ?? 1`), causing all untagged quotes to be hidden from anyone at chapter > 1.

The spoiler gate logic is duplicated in three places: `spoiler-utils.ts`, inline in `useSpoilerSettings`, and inline in each wrapper component.

## Goals

1. One shared visual component for all spoiler overlays.
2. Consistent frosted-glass look across every page.
3. Single source of truth for spoiler gate logic.
4. Fix the quotes default-chapter bug.

## Design

### Component Architecture

```
spoiler-utils.ts          ← canonical shouldHideSpoiler(chapterNumber, userProgress, settings)
      ↑ used by
useSpoilerSettings hook   ← shouldHideSpoiler() delegates to spoiler-utils (removes spoilerType branch)
TimelineSpoilerWrapper    ← logic wrapper; renders SpoilerOverlay
MediaSpoilerWrapper       ← media-specific logic wrapper; renders SpoilerOverlay
EventSpoilerWrapper       ← DELETED; EventsPageContent uses TimelineSpoilerWrapper instead

SpoilerOverlay            ← NEW pure visual component, no logic
```

### New Component: `SpoilerOverlay`

**File:** `client/src/components/SpoilerOverlay.tsx`

Props:
```ts
interface SpoilerOverlayProps {
  chapterNumber?: number
  effectiveProgress: number
  onReveal: () => void
}
```

Visual spec:
- **Background:** `rgba(8, 8, 20, 0.72)` + `backdrop-filter: blur(10px) saturate(0.8)`
- **Border:** `1px solid rgba(255, 255, 255, 0.08)`
- **Hover:** background deepens to `rgba(12, 12, 28, 0.86)` via CSS transition (180ms ease)
- **Icon:** `AlertTriangle` from lucide-react inside a ghost circle (`rgba(255,255,255,0.06)` fill, `rgba(255,255,255,0.18)` border)
- **Label:** `"Chapter {N} Spoiler"` or `"Spoiler"` — white, 700 weight, uppercase, 0.6px letter-spacing
- **Subtitle:** `"Click to reveal"` — `rgba(255,255,255,0.38)`, small
- **No entity color** — same look on every page regardless of entity type
- Includes a `Tooltip` with full context: `"Chapter {N} spoiler – you're at Chapter {progress}. Click to reveal."`

The component renders nothing about logic — it is always shown when mounted. The parent decides whether to mount it.

### Updated: `TimelineSpoilerWrapper`

- Removes its inline `shouldHideSpoiler` function; calls `shouldHideSpoiler` from `spoiler-utils.ts` directly.
- Removes its inline hover state and overlay JSX; renders `<SpoilerOverlay>` instead.
- Removes the entity-colored `accentColor` / `overlayBase` / `overlayHover` logic.

### Updated: `MediaSpoilerWrapper` (inside `MediaThumbnail.tsx`)

- Removes its inline hover handlers and overlay JSX; renders `<SpoilerOverlay>` instead.
- Removes hardcoded `theme.colors.red[6]` color.
- Keeps its media-specific logic: prioritising `media.chapterNumber` over `spoilerChapter`, and the `media.isSpoiler` fallback.

### Deleted: `EventSpoilerWrapper` (local in `EventsPageContent.tsx`)

- The local component is removed entirely.
- Its two usages are replaced with `<TimelineSpoilerWrapper chapterNumber={...}>`.

### Logic Centralization

`spoiler-utils.ts` is unchanged and remains the canonical implementation:

```ts
export function shouldHideSpoiler(
  chapterNumber: number | undefined,
  userProgress: number,
  spoilerSettings: { showAllSpoilers: boolean; chapterTolerance: number }
): boolean
```

`useSpoilerSettings.ts` change: the `spoilerType` branch (`'minor'` / `'major'` / `'outcome'`) is unused in the codebase and is removed. The hook's `shouldHideSpoiler` method delegates directly to the utils function.

### Bug Fix: Quotes Default Chapter

**File:** `client/src/app/quotes/QuotesPageContent.tsx`

Change:
```tsx
// Before (buggy — hides all untagged quotes from ch 1+ readers)
<TimelineSpoilerWrapper chapterNumber={quote.chapter ?? 1}>

// After
<TimelineSpoilerWrapper chapterNumber={quote.chapter ?? undefined}>
```

When `chapterNumber` is `undefined`, `shouldHideSpoiler` returns `false` — content is always visible.

## Files Changed

| File | Change |
|---|---|
| `client/src/components/SpoilerOverlay.tsx` | **NEW** — frosted glass visual component |
| `client/src/components/TimelineSpoilerWrapper.tsx` | Use `SpoilerOverlay`; delegate logic to `spoiler-utils` |
| `client/src/components/MediaThumbnail.tsx` | `MediaSpoilerWrapper` uses `SpoilerOverlay`; remove hardcoded red |
| `client/src/app/events/EventsPageContent.tsx` | Delete local `EventSpoilerWrapper`; use `TimelineSpoilerWrapper` |
| `client/src/app/quotes/QuotesPageContent.tsx` | Fix `?? 1` → `?? undefined` |
| `client/src/hooks/useSpoilerSettings.ts` | Remove `spoilerType` branch; delegate to `spoiler-utils` |
| `client/src/lib/spoiler-utils.ts` | No change |

## Out of Scope

- Changing how spoiler settings are stored (localStorage).
- Adding server-side spoiler enforcement.
- Changing the `SpoilerSettings` UI component.
- Adding per-entity spoiler granularity beyond chapter numbers.
