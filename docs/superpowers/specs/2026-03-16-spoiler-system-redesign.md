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
TimelineSpoilerWrapper    ← logic wrapper; renders SpoilerOverlay
MediaSpoilerWrapper       ← media-specific logic wrapper; renders SpoilerOverlay
Page-level filters        ← GamblesPageContent, CharactersPageContent (already calling spoiler-utils directly)
EventSpoilerWrapper       ← DELETED; EventsPageContent uses TimelineSpoilerWrapper instead

SpoilerOverlay            ← NEW pure visual component, no logic
useSpoilerSettings hook   ← exports settings, updateChapterTolerance, toggleShowAllSpoilers only
                             (shouldHideSpoiler removed — it was unused externally)
```

### New Component: `SpoilerOverlay`

**File:** `client/src/components/SpoilerOverlay.tsx`

Props:
```ts
interface SpoilerOverlayProps {
  chapterNumber?: number       // undefined → label shows "Spoiler" (no chapter number)
  effectiveProgress?: number   // undefined or 0 → tooltip omits "you're at Chapter X"
  onReveal: () => void
}
```

Visual spec:
- **Background:** `rgba(8, 8, 20, 0.72)` + `backdrop-filter: blur(10px) saturate(0.8)`
- **Border:** `1px solid rgba(255, 255, 255, 0.08)`
- **Hover:** background deepens to `rgba(12, 12, 28, 0.86)` via CSS transition (180ms ease)
- **Icon:** `AlertTriangle` from lucide-react inside a ghost circle (`rgba(255,255,255,0.06)` fill, `rgba(255,255,255,0.18)` border)
- **Label:** `"Chapter {N} Spoiler"` when `chapterNumber` is set, `"Spoiler"` otherwise — white, 700 weight, uppercase, 0.6px letter-spacing
- **Subtitle:** `"Click to reveal"` — `rgba(255,255,255,0.38)`, small
- **Tooltip:** `"Chapter {N} spoiler – you're at Chapter {progress}. Click to reveal."` when both are set; `"Spoiler content. Click to reveal."` otherwise
- **No entity color** — same look on every page regardless of entity type

The component renders nothing about logic — it is always shown when mounted. The parent decides whether to mount it.

### Updated: `TimelineSpoilerWrapper`

Updated props interface:
```ts
interface TimelineSpoilerWrapperProps {
  chapterNumber?: number
  onReveal?: () => void           // ← NEW: called when user clicks to reveal
  style?: React.CSSProperties     // ← NEW: applied to the outer Box, enables height passthrough
  children: React.ReactNode
}
```

Changes:
- Adds `onReveal?: () => void` — called when the user clicks to reveal. `EventsPageContent` passes this to update its `revealedEvents` state (which suppresses hover modals on unrevealed spoiler cards).
- Removes its inline `shouldHideSpoiler` function; calls `shouldHideSpoiler` from `spoiler-utils.ts` directly.
- Removes its inline hover state and overlay JSX; renders `<SpoilerOverlay>` instead, passing `chapterNumber`, `effectiveProgress`, and `onReveal`.
- Removes the entity-colored `accentColor` / `overlayBase` / `overlayHover` logic.
- Computes `effectiveProgress` internally (`chapterTolerance > 0 ? chapterTolerance : userProgress`) and passes it to `SpoilerOverlay`.

### Updated: `MediaSpoilerWrapper` (inside `MediaThumbnail.tsx`)

- Removes its inline hover handlers and overlay JSX; renders `<SpoilerOverlay>` instead.
- Removes hardcoded `theme.colors.red[6]` color.
- Keeps its gate logic **inline** (not delegated to `spoiler-utils`) because it has media-specific branching that `shouldHideSpoiler` does not support:
  1. Prioritises `media.chapterNumber` over `spoilerChapter`
  2. Falls back to `media.isSpoiler ?? false` when no chapter number is available
- Computes `effectiveProgress` internally (same formula: `chapterTolerance > 0 ? chapterTolerance : userProgress`) and passes it to `SpoilerOverlay`. When the `isSpoiler` fallback path triggers (no chapter number), `effectiveProgress` may be 0 — this is valid since `SpoilerOverlay.effectiveProgress` is optional; the overlay renders with a generic "Spoiler" label and no chapter context in the tooltip.

### Deleted: `EventSpoilerWrapper` (local in `EventsPageContent.tsx`)

- The local component (lines 62–136) is removed entirely.
- **Deleting `EventSpoilerWrapper` is required** — it contains its own unguarded inline spoiler gate. Simply not rendering it is not enough; the component definition must be removed so the unguarded gate cannot be accidentally reused.
- Its two card usages are replaced with:
  ```tsx
  <TimelineSpoilerWrapper
    chapterNumber={event.spoilerChapter || event.chapterNumber}
    onReveal={() => {
      revealedEventsRef.current = new Set(revealedEventsRef.current).add(event.id)
      setRevealedEvents(new Set(revealedEventsRef.current))
    }}
    style={{ height: '100%' }}
  >
  ```
  `style={{ height: '100%' }}` is required — the event card is fixed-height and the overlay must fill it completely. Without this the overlay collapses to content height and fails to cover the card.
  Both the ref and the state copy must be updated (the ref is used by `handleEventMouseEnter` synchronously; the state copy drives re-renders).
- The separate page-level gate `shouldHideEventSpoiler` (line 175) is **also updated** to add the zero-progress guard:
  ```ts
  const shouldHideEventSpoiler = (event: Event) => {
    if (settings.showAllSpoilers) return false
    const chapterNumber = event.spoilerChapter || event.chapterNumber
    if (!chapterNumber) return false
    const effectiveProgress = settings.chapterTolerance > 0 ? settings.chapterTolerance : userProgress
    if (effectiveProgress === 0) return false
    return chapterNumber > effectiveProgress
  }
  ```

### Logic Centralization

`spoiler-utils.ts` is updated to fix its handling of `chapterTolerance === 0`:

**Correct behavior:** When both `chapterTolerance` and `userProgress` are 0 (user hasn't configured spoiler protection), nothing should be hidden. The `effectiveProgress` of 0 would otherwise cause `chapterNumber > 0` to be true for virtually all content, incorrectly hiding everything.

**Fix:** If `effectiveProgress` resolves to 0, return `false` (show content).

```ts
export function shouldHideSpoiler(
  chapterNumber: number | undefined,
  userProgress: number,
  spoilerSettings: { showAllSpoilers: boolean; chapterTolerance: number }
): boolean {
  if (spoilerSettings.showAllSpoilers) return false
  const effectiveProgress = spoilerSettings.chapterTolerance > 0
    ? spoilerSettings.chapterTolerance
    : userProgress
  if (effectiveProgress === 0) return false  // ← added: not configured, show everything
  if (chapterNumber) return chapterNumber > effectiveProgress
  return false
}
```

`useSpoilerSettings.ts` changes:
- The `spoilerType` branch (`'minor'` / `'major'` / `'outcome'`) is confirmed unused — `shouldHideSpoiler` from this hook is never destructured or called anywhere outside the hook. It is removed.
- The hook does not import `useProgress`, so it cannot supply `userProgress` to the utils function. The hook's exported `shouldHideSpoiler` is simply removed (it is unused).
- The hook continues to export: `settings`, `isLoaded`, `updateChapterTolerance`, `toggleShowAllSpoilers`. (`isLoaded` is retained — it guards against SSR/hydration flicker and must not be dropped.)
- Components that need gate logic call `shouldHideSpoiler` from `spoiler-utils.ts` directly with their own `userProgress` from `useProgress()`.

**Invariant note:** For `TimelineSpoilerWrapper`, `SpoilerOverlay` is only mounted when `shouldHideSpoiler` returned `true`. Because `shouldHideSpoiler` returns `false` when `effectiveProgress === 0`, `effectiveProgress` is guaranteed to be > 0 in that path. For `MediaSpoilerWrapper`, the `isSpoiler` fallback may produce `effectiveProgress === 0` — this is handled by `SpoilerOverlay.effectiveProgress` being optional.

### Inline Zero-Progress Fix: `ArcTimeline`, `CharacterTimeline`, `GambleTimeline`

All three timeline components have an inline `shouldHide` check:
```ts
const shouldHide = !settings.showAllSpoilers && spoilerChapter > effectiveProgress
```
When `effectiveProgress === 0`, this hides all tagged content for unconfigured users. Each component gets the same guard:
```ts
const shouldHide = !settings.showAllSpoilers && effectiveProgress > 0 && spoilerChapter > effectiveProgress
```
These components already render their own spoiler overlay UI (they do not use `TimelineSpoilerWrapper`). Their visual styling is **not changed** in this spec — only the gate logic is fixed.

### Bug Fix: Quotes Default Chapter

**File:** `client/src/app/quotes/QuotesPageContent.tsx`

Change:
```tsx
// Before (buggy — hides all untagged quotes from ch 1+ readers)
<TimelineSpoilerWrapper chapterNumber={quote.chapter ?? 1}>

// After
<TimelineSpoilerWrapper chapterNumber={quote.chapter}>
```

When `chapterNumber` is `undefined`, `shouldHideSpoiler` returns `false` — content is always visible.

## Files Changed

| File | Change |
|---|---|
| `client/src/components/SpoilerOverlay.tsx` | **NEW** — frosted glass visual component |
| `client/src/components/TimelineSpoilerWrapper.tsx` | Use `SpoilerOverlay`; delegate logic to `spoiler-utils` |
| `client/src/components/MediaThumbnail.tsx` | `MediaSpoilerWrapper` uses `SpoilerOverlay`; remove hardcoded red |
| `client/src/app/events/EventsPageContent.tsx` | Delete local `EventSpoilerWrapper`; use `TimelineSpoilerWrapper` |
| `client/src/app/quotes/QuotesPageContent.tsx` | Fix `quote.chapter ?? 1` → `quote.chapter` |
| `client/src/hooks/useSpoilerSettings.ts` | Remove unused `shouldHideSpoiler` export (including `spoilerType` branch) |
| `client/src/lib/spoiler-utils.ts` | Add `effectiveProgress === 0` early-return guard |
| `client/src/components/ArcTimeline.tsx` | Add `effectiveProgress > 0` guard to inline `shouldHide` |
| `client/src/components/CharacterTimeline.tsx` | Add `effectiveProgress > 0` guard to inline `shouldHide` |
| `client/src/components/GambleTimeline.tsx` | Add `effectiveProgress > 0` guard to inline `shouldHide` |

## Out of Scope

- Changing how spoiler settings are stored (localStorage).
- Adding server-side spoiler enforcement.
- Changing the `SpoilerSettings` UI component.
- Adding per-entity spoiler granularity beyond chapter numbers.
