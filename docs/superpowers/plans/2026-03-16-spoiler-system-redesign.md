# Spoiler System Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate three inconsistent spoiler overlay implementations into one shared `SpoilerOverlay` component with a frosted-glass look, and fix the zero-progress bug across all gate sites.

**Architecture:** Create a new pure-visual `SpoilerOverlay` component; update `TimelineSpoilerWrapper` and `MediaSpoilerWrapper` to render it; delete the local `EventSpoilerWrapper`; fix the `effectiveProgress === 0` bug in `spoiler-utils.ts` and all inline gate sites; fix the quotes default-chapter bug.

**Tech Stack:** Next.js 15, React 19, TypeScript, Mantine UI, lucide-react. No test framework — verification via `yarn build` and `yarn lint` from `client/`.

---

## Chunk 1: Foundation — spoiler-utils, useSpoilerSettings, SpoilerOverlay

### Task 1: Fix `spoiler-utils.ts` — add zero-progress guard

**Files:**
- Modify: `client/src/lib/spoiler-utils.ts`

- [ ] **Step 1: Add the `effectiveProgress === 0` early-return guard**

  Open `client/src/lib/spoiler-utils.ts`. The current implementation:

  ```ts
  export function shouldHideSpoiler(
    chapterNumber: number | undefined,
    userProgress: number,
    spoilerSettings: {
      showAllSpoilers: boolean
      chapterTolerance: number
    }
  ): boolean {
    if (spoilerSettings.showAllSpoilers) {
      return false
    }

    const effectiveProgress = spoilerSettings.chapterTolerance > 0
      ? spoilerSettings.chapterTolerance
      : userProgress

    if (chapterNumber) {
      return chapterNumber > effectiveProgress
    }

    return false
  }
  ```

  Replace the entire file with:

  ```ts
  /**
   * Utility functions for determining spoiler status
   */

  /**
   * Determines if content should be hidden as a spoiler based on chapter number and user progress.
   *
   * Returns false (show content) when:
   * - showAllSpoilers is enabled
   * - effectiveProgress is 0 (user has not configured spoiler protection)
   * - no chapterNumber is provided
   * - chapterNumber is within the user's progress
   */
  export function shouldHideSpoiler(
    chapterNumber: number | undefined,
    userProgress: number,
    spoilerSettings: {
      showAllSpoilers: boolean
      chapterTolerance: number
    }
  ): boolean {
    if (spoilerSettings.showAllSpoilers) return false

    const effectiveProgress = spoilerSettings.chapterTolerance > 0
      ? spoilerSettings.chapterTolerance
      : userProgress

    // If neither tolerance nor progress is set, the user has not configured
    // spoiler protection — show all content rather than hiding everything.
    if (effectiveProgress === 0) return false

    if (chapterNumber) return chapterNumber > effectiveProgress

    return false
  }
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  cd client && yarn build 2>&1 | head -40
  ```

  Expected: build succeeds (or any errors are unrelated to `spoiler-utils.ts`).

- [ ] **Step 3: Commit**

  ```bash
  git add client/src/lib/spoiler-utils.ts
  git commit -m "fix: add effectiveProgress zero guard to shouldHideSpoiler"
  ```

---

### Task 2: Clean up `useSpoilerSettings.ts` — remove unused `shouldHideSpoiler` export

**Files:**
- Modify: `client/src/hooks/useSpoilerSettings.ts`

- [ ] **Step 1: Remove the `shouldHideSpoiler` callback and its return**

  The hook currently exports a `shouldHideSpoiler` function that is never called outside the hook itself. Remove it. The updated hook:

  ```ts
  'use client'

  import { useState, useEffect, useCallback } from 'react'

  const SPOILER_STORAGE_KEY = 'usogui-spoiler-tolerance'
  const SHOW_ALL_SPOILERS_KEY = 'usogui-show-all-spoilers'

  export interface SpoilerSettings {
    chapterTolerance: number
    showAllSpoilers: boolean
  }

  export function useSpoilerSettings() {
    const [settings, setSettings] = useState<SpoilerSettings>({
      chapterTolerance: 0,
      showAllSpoilers: false
    })
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
      if (typeof window !== 'undefined') {
        const chapterTolerance = parseInt(localStorage.getItem(SPOILER_STORAGE_KEY) || '0', 10)
        const showAllSpoilers = localStorage.getItem(SHOW_ALL_SPOILERS_KEY) === 'true'
        setSettings({ chapterTolerance, showAllSpoilers })
        setIsLoaded(true)
      }
    }, [])

    const updateChapterTolerance = useCallback((chapter: number) => {
      const validChapter = Math.max(0, Math.min(chapter, 539))
      const newSettings = { ...settings, chapterTolerance: validChapter }
      setSettings(newSettings)
      if (typeof window !== 'undefined') {
        localStorage.setItem(SPOILER_STORAGE_KEY, validChapter.toString())
      }
    }, [settings])

    const toggleShowAllSpoilers = useCallback(() => {
      const newShowAll = !settings.showAllSpoilers
      const newSettings = { ...settings, showAllSpoilers: newShowAll }
      setSettings(newSettings)
      if (typeof window !== 'undefined') {
        localStorage.setItem(SHOW_ALL_SPOILERS_KEY, newShowAll.toString())
      }
    }, [settings])

    return {
      settings,
      isLoaded,
      updateChapterTolerance,
      toggleShowAllSpoilers
    }
  }
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  cd client && yarn build 2>&1 | head -40
  ```

  Expected: build succeeds. If any component was destructuring `shouldHideSpoiler` from `useSpoilerSettings()`, the build will show a TypeScript error pointing to the exact location — fix that caller to use `shouldHideSpoiler` from `../../lib/spoiler-utils` instead.

- [ ] **Step 3: Commit**

  ```bash
  git add client/src/hooks/useSpoilerSettings.ts
  git commit -m "refactor: remove unused shouldHideSpoiler from useSpoilerSettings hook"
  ```

---

### Task 3: Create `SpoilerOverlay.tsx` — pure frosted-glass visual component

**Files:**
- Create: `client/src/components/SpoilerOverlay.tsx`

- [ ] **Step 1: Create the component**

  Create `client/src/components/SpoilerOverlay.tsx`:

  ```tsx
  'use client'

  import React, { useState } from 'react'
  import { Box, Text, Tooltip } from '@mantine/core'
  import { AlertTriangle } from 'lucide-react'

  interface SpoilerOverlayProps {
    /** Chapter number for the label. If absent, shows generic "Spoiler" label. */
    chapterNumber?: number
    /** User's effective reading progress. If absent or 0, tooltip omits chapter context. */
    effectiveProgress?: number
    /** Called when the user clicks to reveal. */
    onReveal: () => void
  }

  /**
   * Pure visual spoiler overlay — frosted glass style.
   * Contains no gate logic. The parent decides whether to render this component.
   * Always covers its parent's dimensions (parent must be position: relative).
   */
  export default function SpoilerOverlay({
    chapterNumber,
    effectiveProgress,
    onReveal
  }: SpoilerOverlayProps) {
    const [isHovered, setIsHovered] = useState(false)

    const label = chapterNumber ? `Chapter ${chapterNumber} Spoiler` : 'Spoiler'

    const tooltipLabel = chapterNumber && effectiveProgress
      ? `Chapter ${chapterNumber} spoiler – you're at Chapter ${effectiveProgress}. Click to reveal.`
      : 'Spoiler content. Click to reveal.'

    const handleReveal = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onReveal()
    }

    return (
      <Box
        onClick={handleReveal}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: isHovered
            ? 'rgba(12, 12, 28, 0.86)'
            : 'rgba(8, 8, 20, 0.72)',
          backdropFilter: 'blur(10px) saturate(0.8)',
          WebkitBackdropFilter: 'blur(10px) saturate(0.8)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 'inherit',
          cursor: 'pointer',
          gap: 8,
          transition: 'background 180ms ease',
          zIndex: 100,
        }}
      >
        <Tooltip label={tooltipLabel} position="top" withArrow>
          <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Box
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={15} color="rgba(255, 255, 255, 0.85)" />
            </Box>

            <Text
              size="xs"
              fw={700}
              style={{
                color: 'rgba(255, 255, 255, 0.92)',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
              }}
            >
              {label}
            </Text>

            <Text
              size="xs"
              style={{
                color: 'rgba(255, 255, 255, 0.38)',
                letterSpacing: '0.3px',
              }}
            >
              Click to reveal
            </Text>
          </Box>
        </Tooltip>
      </Box>
    )
  }
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  cd client && yarn build 2>&1 | head -40
  ```

  Expected: build succeeds with no errors in `SpoilerOverlay.tsx`.

- [ ] **Step 3: Commit**

  ```bash
  git add client/src/components/SpoilerOverlay.tsx
  git commit -m "feat: add SpoilerOverlay frosted-glass visual component"
  ```

---

## Chunk 2: Update `TimelineSpoilerWrapper`

### Task 4: Rewrite `TimelineSpoilerWrapper` to use `SpoilerOverlay`

**Files:**
- Modify: `client/src/components/TimelineSpoilerWrapper.tsx`

- [ ] **Step 1: Replace the entire file**

  ```tsx
  'use client'

  import React, { useState } from 'react'
  import { Box } from '@mantine/core'
  import { useProgress } from '../providers/ProgressProvider'
  import { useSpoilerSettings } from '../hooks/useSpoilerSettings'
  import { shouldHideSpoiler } from '../lib/spoiler-utils'
  import SpoilerOverlay from './SpoilerOverlay'

  interface TimelineSpoilerWrapperProps {
    chapterNumber?: number
    /** Called when the user clicks to reveal. Use to update parent state (e.g. revealedEvents). */
    onReveal?: () => void
    /** Applied to the outer Box. Use style={{ height: '100%' }} inside fixed-height card grids. */
    style?: React.CSSProperties
    children: React.ReactNode
  }

  /**
   * Spoiler wrapper for timeline items, event cards, quotes, and inline markdown spoilers.
   * Renders a frosted-glass overlay when the chapter is beyond the user's reading progress.
   * Click the overlay to reveal the content.
   */
  export default function TimelineSpoilerWrapper({
    chapterNumber,
    onReveal,
    style,
    children
  }: TimelineSpoilerWrapperProps) {
    const [isRevealed, setIsRevealed] = useState(false)
    const { userProgress } = useProgress()
    const { settings } = useSpoilerSettings()

    const effectiveProgress = settings.chapterTolerance > 0
      ? settings.chapterTolerance
      : userProgress

    const hidden = shouldHideSpoiler(chapterNumber, userProgress, settings)

    if (!hidden || isRevealed) {
      return <>{children}</>
    }

    const handleReveal = () => {
      setIsRevealed(true)
      onReveal?.()
    }

    return (
      <Box style={{ position: 'relative', ...style }}>
        <Box style={{ opacity: 0.3, filter: 'blur(2px)', pointerEvents: 'none', height: '100%' }}>
          {children}
        </Box>
        <SpoilerOverlay
          chapterNumber={chapterNumber}
          effectiveProgress={effectiveProgress}
          onReveal={handleReveal}
        />
      </Box>
    )
  }
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  cd client && yarn build 2>&1 | head -60
  ```

  Expected: build succeeds. All existing consumers of `TimelineSpoilerWrapper` (`EnhancedSpoilerMarkdown`, `QuotesPageContent`, `ArcTimeline`, `CharacterTimeline`, `GambleTimeline`) only pass `chapterNumber` and `children` — no breaking changes to their call sites.

- [ ] **Step 3: Commit**

  ```bash
  git add client/src/components/TimelineSpoilerWrapper.tsx
  git commit -m "refactor: update TimelineSpoilerWrapper to use SpoilerOverlay"
  ```

---

## Chunk 3: Update `MediaSpoilerWrapper` in `MediaThumbnail.tsx`

### Task 5: Update `MediaSpoilerWrapper` to use `SpoilerOverlay`

**Files:**
- Modify: `client/src/components/MediaThumbnail.tsx` (function `MediaSpoilerWrapper`, approx. lines 1108–1221)

- [ ] **Step 1: Replace the `MediaSpoilerWrapper` function**

  Locate `function MediaSpoilerWrapper` (around line 1108). Replace only that function (keep everything above and below it untouched). `SpoilerOverlay` handles `e.preventDefault` and `e.stopPropagation` internally, so pass a simple `onReveal` callback. Replacement:

  ```tsx
  function MediaSpoilerWrapper({
    media,
    userProgress,
    spoilerChapter,
    onRevealed,
    children
  }: {
    media: MediaItem
    userProgress: number
    spoilerChapter?: number
    onRevealed?: () => void
    children: React.ReactNode
  }) {
    const [isRevealed, setIsRevealed] = useState(false)
    const { settings } = useSpoilerSettings()

    const chapterNumber = media.chapterNumber ?? spoilerChapter

    const effectiveProgress = settings.chapterTolerance > 0
      ? settings.chapterTolerance
      : userProgress

    const shouldHide = (() => {
      if (settings.showAllSpoilers) return false
      if (chapterNumber) return chapterNumber > effectiveProgress
      return media.isSpoiler ?? false
    })()

    if (!shouldHide || isRevealed) {
      return <>{children}</>
    }

    return (
      <Box style={{ position: 'relative', width: '100%', height: '100%' }}>
        <Box style={{ opacity: 0.3, filter: 'blur(2px)', width: '100%', height: '100%', pointerEvents: 'none' }}>
          {children}
        </Box>
        <SpoilerOverlay
          chapterNumber={chapterNumber}
          effectiveProgress={effectiveProgress > 0 ? effectiveProgress : undefined}
          onReveal={() => {
            setIsRevealed(true)
            onRevealed?.()
          }}
        />
      </Box>
    )
  }
  ```

- [ ] **Step 2: Add the `SpoilerOverlay` import to `MediaThumbnail.tsx`**

  At the top of `MediaThumbnail.tsx`, add the import alongside the other local imports:

  ```ts
  import SpoilerOverlay from './SpoilerOverlay'
  ```

- [ ] **Step 3: Remove unused imports from `MediaThumbnail.tsx`**

  The old `MediaSpoilerWrapper` used `rgba`, `Tooltip`, and `AlertTriangle` exclusively in its overlay block. All three are now unused — remove them:
  - `rgba` — remove from the Mantine import line.
  - `Tooltip` — remove from the Mantine import line (confirmed unused elsewhere in this file).
  - `AlertTriangle` — remove from the lucide-react import line.

  Run:
  ```bash
  cd client && yarn lint 2>&1 | grep MediaThumbnail
  ```
  ESLint will flag any unused imports.

- [ ] **Step 4: Verify TypeScript compiles**

  ```bash
  cd client && yarn build 2>&1 | head -60
  ```

  Expected: build succeeds with no errors in `MediaThumbnail.tsx`.

- [ ] **Step 5: Commit**

  ```bash
  git add client/src/components/MediaThumbnail.tsx
  git commit -m "refactor: MediaSpoilerWrapper uses SpoilerOverlay, remove hardcoded red"
  ```

---

## Chunk 4: Update `EventsPageContent.tsx`

### Task 6: Delete `EventSpoilerWrapper`, use `TimelineSpoilerWrapper`, fix `shouldHideEventSpoiler`

**Files:**
- Modify: `client/src/app/events/EventsPageContent.tsx`

- [ ] **Step 1: Add import for `TimelineSpoilerWrapper`**

  At the top of `EventsPageContent.tsx`, add:

  ```ts
  import TimelineSpoilerWrapper from '../../components/TimelineSpoilerWrapper'
  ```

- [ ] **Step 2: Delete the `EventSpoilerWrapper` component**

  Remove lines 62–136 in their entirety — the local `EventSpoilerWrapper` function definition and its associated imports (`AlertCircle` from lucide-react if it's only used there). The function starts with:
  ```ts
  function EventSpoilerWrapper({
  ```
  and ends before `export default function EventsPageContent`.

- [ ] **Step 3: Fix `shouldHideEventSpoiler` (page-level gate)**

  Search for `const shouldHideEventSpoiler` in the file (line numbers shift after Step 2's deletion — use search). Replace its entire body with the zero-progress-guarded version:

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

- [ ] **Step 4: Replace the `EventSpoilerWrapper` usage**

  There is one `<EventSpoilerWrapper>` usage in the file. Search for `<EventSpoilerWrapper event={event}` to locate the opening tag (line numbers shift after Step 2's deletion). Replace the opening tag and its props, and the closing tag.

  The current opening tag looks like:
  ```tsx
  <EventSpoilerWrapper event={event} onSpoilerRevealed={() => {
    revealedEventsRef.current = new Set(revealedEventsRef.current).add(event.id)
    setRevealedEvents(new Set(revealedEventsRef.current))
  }}>
  ```

  Replace it with:
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

  Replace the closing `</EventSpoilerWrapper>` with `</TimelineSpoilerWrapper>`.

  `style={{ height: '100%' }}` is required — event cards are fixed-height and the overlay must fill the card completely.

- [ ] **Step 5: Remove unused imports**

  After deleting `EventSpoilerWrapper`, check whether `AlertCircle` (lucide-react) is still used elsewhere in the file. If not, remove it from the import.

  Run:
  ```bash
  cd client && yarn lint 2>&1 | grep EventsPageContent
  ```

- [ ] **Step 6: Verify TypeScript compiles**

  ```bash
  cd client && yarn build 2>&1 | head -60
  ```

  Expected: build succeeds with no errors in `EventsPageContent.tsx`.

- [ ] **Step 7: Commit**

  ```bash
  git add client/src/app/events/EventsPageContent.tsx
  git commit -m "refactor: replace EventSpoilerWrapper with TimelineSpoilerWrapper on events page"
  ```

---

## Chunk 5: Quick Fixes — Quotes, Timelines, Final Build

### Task 7: Fix `QuotesPageContent.tsx` — remove default chapter 1

**Files:**
- Modify: `client/src/app/quotes/QuotesPageContent.tsx`

- [ ] **Step 1: Fix the default chapter bug**

  Search for `quote.chapter ?? 1` in `client/src/app/quotes/QuotesPageContent.tsx`. Change it to just `quote.chapter`:

  ```tsx
  // Before (buggy — hides all untagged quotes from readers at ch 1+)
  <TimelineSpoilerWrapper chapterNumber={quote.chapter ?? 1}>

  // After
  <TimelineSpoilerWrapper chapterNumber={quote.chapter}>
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  cd client && yarn build 2>&1 | grep -i quotes
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add client/src/app/quotes/QuotesPageContent.tsx
  git commit -m "fix: quotes without chapter number are always visible"
  ```

---

### Task 8: Fix zero-progress bug in `ArcTimeline`, `CharacterTimeline`, `GambleTimeline`

All three files have the same pattern. Fix each one.

**Files:**
- Modify: `client/src/components/ArcTimeline.tsx` (inline `shouldHide` at line ~912)
- Modify: `client/src/components/CharacterTimeline.tsx` (inline `shouldHide` at line ~567)
- Modify: `client/src/components/GambleTimeline.tsx` (inline `shouldHide` at line ~364)

The current pattern in all three is:
```ts
const shouldHide = !settings.showAllSpoilers && spoilerChapter > effectiveProgress
```

- [ ] **Step 1: Fix `ArcTimeline.tsx`**

  Find the `shouldHide` line in `ArcTimeline.tsx` and change it to:

  ```ts
  const shouldHide = !settings.showAllSpoilers && effectiveProgress > 0 && spoilerChapter > effectiveProgress
  ```

- [ ] **Step 2: Fix `CharacterTimeline.tsx`**

  Same change in `CharacterTimeline.tsx`:

  ```ts
  const shouldHide = !settings.showAllSpoilers && effectiveProgress > 0 && spoilerChapter > effectiveProgress
  ```

- [ ] **Step 3: Fix `GambleTimeline.tsx`**

  Same change in `GambleTimeline.tsx`:

  ```ts
  const shouldHide = !settings.showAllSpoilers && effectiveProgress > 0 && spoilerChapter > effectiveProgress
  ```

- [ ] **Step 4: Verify TypeScript compiles**

  ```bash
  cd client && yarn build 2>&1 | head -40
  ```

  Expected: clean build.

- [ ] **Step 5: Commit**

  ```bash
  git add client/src/components/ArcTimeline.tsx client/src/components/CharacterTimeline.tsx client/src/components/GambleTimeline.tsx
  git commit -m "fix: add zero-progress guard to ArcTimeline, CharacterTimeline, GambleTimeline"
  ```

---

### Task 9: Final verification

- [ ] **Step 1: Full build**

  ```bash
  cd client && yarn build 2>&1
  ```

  Expected: `✓ Compiled successfully` with no TypeScript errors.

- [ ] **Step 2: Lint**

  ```bash
  cd client && yarn lint 2>&1
  ```

  Expected: no errors (warnings about existing code are acceptable).

- [ ] **Step 3: Smoke test the spoiler overlay visually**

  Start the dev server (`cd client && yarn dev`) and verify:
  1. Set spoiler tolerance to chapter 50 on the settings page.
  2. Visit `/characters` — character cards first appearing after ch 50 show the frosted overlay (dark glass, white "Chapter X Spoiler" label, "Click to reveal"). Click one to reveal.
  3. Visit `/events` — events after ch 50 show the same frosted overlay with `height: 100%` filling the card. Click to reveal.
  4. Visit `/quotes` — quotes without a chapter number are always visible (no overlay).
  5. Set tolerance to 0 — all spoiler overlays disappear (zero-progress fix).
  6. Visit a character page with timeline items — timeline spoilers use the same frosted glass look.

- [ ] **Step 4: Final commit (if any unstaged changes remain)**

  If all prior tasks were committed individually, this step is a no-op. Otherwise, stage only the files touched by this plan:

  ```bash
  git add \
    client/src/lib/spoiler-utils.ts \
    client/src/hooks/useSpoilerSettings.ts \
    client/src/components/SpoilerOverlay.tsx \
    client/src/components/TimelineSpoilerWrapper.tsx \
    client/src/components/MediaThumbnail.tsx \
    client/src/app/events/EventsPageContent.tsx \
    client/src/app/quotes/QuotesPageContent.tsx \
    client/src/components/ArcTimeline.tsx \
    client/src/components/CharacterTimeline.tsx \
    client/src/components/GambleTimeline.tsx
  git commit -m "chore: spoiler system consolidation complete"
  ```
