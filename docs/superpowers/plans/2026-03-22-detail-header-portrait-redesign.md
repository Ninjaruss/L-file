# Detail Header Portrait Zone Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the detail page header's full-bleed portrait area with a bounded portrait zone (right 58% of header) that uses `objectFit: cover` + `objectPosition: center 15%`, scopes the lightbox click target to the portrait image bounds, and shows prev/next chevrons on hover within the zone.

**Architecture:** `DetailPageHeader` lifts media state, cycling logic, and the lightbox modal out of `MediaThumbnail`. Two `MediaThumbnail` instances are used in hero mode: one full-bleed for the blurred atmospheric background only, and one scoped to the portrait zone for image rendering (with spoiler handling). All cycling controls and the click-to-lightbox handler live in `DetailPageHeader`.

**Tech Stack:** Next.js 15, React 19, TypeScript, Mantine UI (`Box`, `Modal`, `ActionIcon`, `Text`, `rem`), Lucide React (`ChevronLeft`, `ChevronRight`, `X`), Framer Motion (`motion`, `AnimatePresence`), Next.js `Image`

---

## File Map

| File | Change |
|---|---|
| `client/src/lib/media-utils.ts` | Export `isExternalUrl` helper (moved from `MediaThumbnail`) |
| `client/src/components/MediaThumbnail.tsx` | Import `isExternalUrl` from `media-utils`; add TODO on hero controls path |
| `client/src/components/layouts/DetailPageHeader.tsx` | Major rewrite: add media state/fetching, portrait zone, lightbox modal |

No changes to the 8 page-level callers of `DetailPageHeader` — media is fetched internally.

---

## Task 1: Export `isExternalUrl` from `media-utils.ts`

**Files:**
- Modify: `client/src/lib/media-utils.ts`
- Modify: `client/src/components/MediaThumbnail.tsx`

`isExternalUrl` is currently a private function in `MediaThumbnail.tsx`. `DetailPageHeader` needs it for the lightbox image renderer. Move it to the shared `media-utils.ts` module.

- [ ] **Step 1: Add `isExternalUrl` export to `media-utils.ts`**

Open `client/src/lib/media-utils.ts` and add this function at the end of the file:

```typescript
/**
 * Returns true if the URL is hosted on an external domain not served via
 * Next.js image optimisation (i.e. not localhost, Backblaze B2, or l-file.com).
 */
export function isExternalUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return !['localhost', 'backblazeb2.com', 'l-file.com'].some(d => hostname.includes(d))
  } catch {
    return false
  }
}
```

- [ ] **Step 2: Update `MediaThumbnail.tsx` to import from `media-utils`**

In `client/src/components/MediaThumbnail.tsx`:

Remove the existing private `isExternalUrl` function (lines ~71–89):
```typescript
// DELETE this entire function:
function isExternalUrl(url: string): boolean {
  ...
}
```

Update the import on line ~23:
```typescript
// Before:
import { analyzeMediaUrl, analyzeMediaUrlAsync, getPlaceholderInfo } from '../lib/media-utils'

// After:
import { analyzeMediaUrl, analyzeMediaUrlAsync, getPlaceholderInfo, isExternalUrl } from '../lib/media-utils'
```

- [ ] **Step 3: Verify build**

```bash
cd client && yarn build 2>&1 | tail -20
```

Expected: no TypeScript errors. `isExternalUrl` usage in `MediaThumbnail` still compiles correctly.

- [ ] **Step 4: Commit**

```bash
git add client/src/lib/media-utils.ts client/src/components/MediaThumbnail.tsx
git commit -m "refactor: export isExternalUrl from media-utils"
```

---

## Task 2: Add media state and fetching to `DetailPageHeader`

**Files:**
- Modify: `client/src/components/layouts/DetailPageHeader.tsx`

Add all imports, props, and state needed before touching the JSX. This makes the next task purely visual.

- [ ] **Step 1: Add new imports**

At the top of `client/src/components/layouts/DetailPageHeader.tsx`, replace the existing imports section with:

```typescript
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Box, Title, Text, Modal, ActionIcon, Loader, rem, useMantineTheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import Image from 'next/image'
import {
  getEntityThemeColor,
  type EntityAccentKey,
} from '../../lib/mantine-theme'
import { analyzeMediaUrl, isExternalUrl } from '../../lib/media-utils'
import { api } from '../../lib/api'
import { useProgress } from '../../providers/ProgressProvider'
import MediaThumbnail, { type MediaItem } from '../MediaThumbnail'
```

- [ ] **Step 2: Add `initialMedia` prop to `DetailPageHeaderProps`**

```typescript
interface DetailPageHeaderProps {
  entityType: EntityAccentKey
  entityId: number
  entityName: string
  stats?: StatItem[]
  tags?: TagItem[]
  showImage?: boolean
  spoilerChapter?: number | null
  onSpoilerRevealed?: () => void
  children?: React.ReactNode
  /** Optional pre-fetched media list; skips the internal API call if provided. */
  initialMedia?: MediaItem[]
}
```

- [ ] **Step 3: Add state and media fetching inside the component**

Inside `DetailPageHeader`, after the existing `const accentColor = ...` line, add:

```typescript
const { userProgress } = useProgress()
const isMobile = useMediaQuery('(max-width: 768px)')

const [allMedia, setAllMedia]           = useState<MediaItem[]>(initialMedia ?? [])
const [currentIndex, setCurrentIndex]   = useState(0)
const [isPortraitHovered, setIsPortraitHovered] = useState(false)
const [isModalOpen, setIsModalOpen]     = useState(false)

const loadMedia = useCallback(async () => {
  // Skip API call if caller provided pre-fetched media
  if (initialMedia && initialMedia.length > 0) {
    setAllMedia(initialMedia)
    return
  }
  try {
    const response = await api.getEntityDisplayMediaForCycling(
      entityType as any,
      entityId,
      userProgress
    )
    const mediaArray: MediaItem[] = response?.data ?? []
    setAllMedia(mediaArray)
    if (mediaArray.length > 0) {
      const available = mediaArray.filter(
        m => !m.chapterNumber || m.chapterNumber <= userProgress
      )
      const selected =
        available.length > 0
          ? available.reduce((best, curr) =>
              (curr.chapterNumber ?? 0) > (best.chapterNumber ?? 0) ? curr : best
            )
          : mediaArray[0]
      setCurrentIndex(mediaArray.indexOf(selected))
    }
  } catch {
    // Silently fail — header renders without portrait
  }
}, [entityType, entityId, userProgress, initialMedia])

useEffect(() => {
  if (showImage !== false) loadMedia()
}, [loadMedia, showImage])

const currentMedia = allMedia[currentIndex] ?? null

const handlePrev = useCallback(() => {
  setCurrentIndex(i => (i > 0 ? i - 1 : allMedia.length - 1))
}, [allMedia.length])

const handleNext = useCallback(() => {
  setCurrentIndex(i => (i < allMedia.length - 1 ? i + 1 : 0))
}, [allMedia.length])
```

- [ ] **Step 4: Add the lightbox image renderer helper**

Add this helper function inside the component (after the state declarations):

```typescript
const renderLightboxImage = (media: MediaItem) => {
  const mediaInfo = analyzeMediaUrl(media.url)
  if (media.type === 'image' && mediaInfo.isDirectImage) {
    const url = mediaInfo.directImageUrl || media.url
    if (isExternalUrl(url)) {
      // eslint-disable-next-line @next/next/no-img-element
      return (
        <img
          src={url}
          alt={media.description || entityName}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
        />
      )
    }
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <Image
          src={url}
          alt={media.description || entityName}
          fill
          style={{ objectFit: 'contain' }}
          sizes="90vw"
          priority
        />
      </div>
    )
  }
  return <Text c="dimmed" size="sm">{media.description || 'Media'}</Text>
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no new TypeScript errors. The JSX hasn't changed yet so the render output is identical.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/layouts/DetailPageHeader.tsx
git commit -m "feat(DetailPageHeader): add media state, fetching, and lightbox image renderer"
```

---

## Task 3: Implement the portrait zone in `DetailPageHeader`

**Files:**
- Modify: `client/src/components/layouts/DetailPageHeader.tsx`

Replace the existing portrait area block with the new portrait zone structure.

- [ ] **Step 1: Replace the portrait area JSX**

In the return JSX, find the existing portrait area block (currently starting with `{showImage ? (`). Replace it entirely with the following:

```tsx
{/* ── Full-bleed blurred atmospheric background ── */}
{showImage && currentMedia && (
  <Box
    aria-hidden
    style={{
      position: 'absolute',
      inset: 0,
      zIndex: 1,
      pointerEvents: 'none',
      overflow: 'hidden',
    }}
  >
    <MediaThumbnail
      entityType={entityType}
      entityId={entityId}
      initialMedia={[currentMedia]}
      allowFullView={false}
      allowCycling={false}
      showBlurredBackground={true}
      objectFit="cover"
      objectPosition="center 15%"
      maxWidth="100%"
      maxHeight="100%"
      priority
    />
  </Box>
)}

{/* ── Portrait zone — right 58%, click opens lightbox ── */}
{showImage && currentMedia && (
  <Box
    style={{
      position: 'absolute',
      left: '42%',
      right: 0,
      top: 0,
      bottom: 0,
      zIndex: 2,
      overflow: 'hidden',
      cursor: 'zoom-in',
    }}
    onMouseEnter={() => setIsPortraitHovered(true)}
    onMouseLeave={() => setIsPortraitHovered(false)}
    onClick={() => setIsModalOpen(true)}
  >
    {/* Main image */}
    <MediaThumbnail
      entityType={entityType}
      entityId={entityId}
      initialMedia={[currentMedia]}
      allowFullView={false}
      allowCycling={false}
      showBlurredBackground={false}
      objectFit="cover"
      objectPosition="center 15%"
      maxWidth="100%"
      maxHeight="100%"
      spoilerChapter={spoilerChapter ?? undefined}
      onSpoilerRevealed={onSpoilerRevealed}
      priority
    />

    {/* Prev / next half-zones — visible on hover (always on mobile) */}
    {allMedia.length > 1 && (
      <>
        {/* Prev: left half */}
        <Box
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: rem(44),
            width: '50%',
            zIndex: 10,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: rem(10),
            opacity: isMobile || isPortraitHovered ? 1 : 0,
            transition: 'opacity 0.18s ease',
          }}
          onClick={(e) => { e.stopPropagation(); handlePrev() }}
        >
          <Box
            style={{
              width: rem(32),
              height: rem(32),
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.58)',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              flexShrink: 0,
            }}
          >
            <ChevronLeft size={16} />
          </Box>
        </Box>

        {/* Next: right half */}
        <Box
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: rem(44),
            width: '50%',
            zIndex: 10,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: rem(10),
            opacity: isMobile || isPortraitHovered ? 1 : 0,
            transition: 'opacity 0.18s ease',
          }}
          onClick={(e) => { e.stopPropagation(); handleNext() }}
        >
          <Box
            style={{
              width: rem(32),
              height: rem(32),
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.58)',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              flexShrink: 0,
            }}
          >
            <ChevronRight size={16} />
          </Box>
        </Box>
      </>
    )}

    {/* Dot strip — centred at bottom of portrait zone */}
    {allMedia.length > 1 && (
      <Box
        style={{
          position: 'absolute',
          bottom: rem(10),
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          zIndex: 15,
        }}
      >
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.70)',
            borderRadius: rem(20),
            border: '1px solid rgba(255,255,255,0.08)',
            padding: `${rem(5)} ${rem(10)}`,
          }}
        >
          {allMedia.map((_, idx) => (
            <Box
              key={idx}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentIndex(idx)
              }}
              style={{
                padding: rem(5),
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box
                style={{
                  width: idx === currentIndex ? rem(13) : rem(8),
                  height: idx === currentIndex ? rem(13) : rem(8),
                  borderRadius: '50%',
                  background: idx === currentIndex ? '#fff' : 'rgba(255,255,255,0.38)',
                  boxShadow: idx === currentIndex ? '0 0 0 3px rgba(255,255,255,0.12)' : 'none',
                  transition: 'all 0.22s ease',
                  flexShrink: 0,
                }}
              />
            </Box>
          ))}
          <Box
            style={{
              width: 1,
              height: rem(13),
              background: 'rgba(255,255,255,0.12)',
              margin: `0 ${rem(4)}`,
              flexShrink: 0,
            }}
          />
          <Text
            style={{
              fontSize: rem(10),
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}
          >
            {currentIndex + 1} / {allMedia.length}
          </Text>
        </Box>
      </Box>
    )}
  </Box>
)}

{/* No-image fallback: entity-tinted glow on right side */}
{(!showImage || allMedia.length === 0) && (
  <Box
    aria-hidden
    style={{
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      width: '42%',
      background: `linear-gradient(160deg, ${accentColor}18 0%, transparent 70%)`,
    }}
  />
)}
```

Also keep the existing left-edge fade and bottom fade overlays (they are siblings of the portrait zone, at z-index 2–3, and are unchanged).

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors.

- [ ] **Step 3: Visual smoke test**

Run the dev server (`cd client && yarn dev`) and navigate to any character/gamble/arc detail page. Verify:
- Portrait image fills the right ~58% of the header, large and cinematic
- Hovering the portrait area reveals prev/next chevrons
- Clicking a chevron cycles the image (if the entity has multiple images)
- Dots are centred at the bottom of the portrait zone
- `cursor: zoom-in` only appears over the portrait zone, not the text column
- No console errors

- [ ] **Step 4: Commit**

```bash
git add client/src/components/layouts/DetailPageHeader.tsx
git commit -m "feat(DetailPageHeader): implement portrait zone with cover image, hover chevrons, dot strip"
```

---

## Task 4: Implement the lightbox modal in `DetailPageHeader`

**Files:**
- Modify: `client/src/components/layouts/DetailPageHeader.tsx`

Add the lightbox `Modal` to the JSX returned by `DetailPageHeader`. It replaces the lightbox that was previously triggered via `MediaThumbnail`'s `allowFullView` prop.

- [ ] **Step 1: Add the modal JSX**

Inside the `DetailPageHeader` return, after the closing `</Box>` of the main header container, add:

```tsx
{/* Lightbox modal */}
{isModalOpen && currentMedia && (
  <Modal
    opened={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    size="auto"
    centered
    withCloseButton={false}
    padding={0}
    overlayProps={{ blur: 10, backgroundOpacity: 0.94, color: '#000' }}
    styles={{
      content: {
        background: '#080c14',
        borderRadius: rem(12),
        border: '1px solid rgba(255,255,255,0.07)',
        overflow: 'hidden',
        maxWidth: '92vw',
        width: 'auto',
      },
      body: { padding: 0 },
    }}
  >
    {/* Top bar */}
    <Box
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${rem(12)} ${rem(16)}`,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.4)',
      }}
    >
      <Text
        size="xs"
        style={{
          color: 'rgba(255,255,255,0.5)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}
      >
        {entityName || 'Image'}
        {allMedia.length > 1 && (
          <span style={{ marginLeft: rem(10), color: 'rgba(255,255,255,0.28)' }}>
            {currentIndex + 1} of {allMedia.length}
          </span>
        )}
      </Text>
      <ActionIcon
        variant="subtle"
        size="sm"
        onClick={() => setIsModalOpen(false)}
        aria-label="Close"
        style={{ color: 'rgba(255,255,255,0.6)' }}
      >
        <X size={16} />
      </ActionIcon>
    </Box>

    {/* Image area */}
    <Box
      style={{
        position: 'relative',
        width: 'min(88vw, 860px)',
        height: 'min(76vh, 640px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#050810',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMedia.id}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {renderLightboxImage(currentMedia)}
        </motion.div>
      </AnimatePresence>

      {allMedia.length > 1 && (
        <>
          <ActionIcon
            variant="light"
            size="lg"
            radius="xl"
            onClick={handlePrev}
            aria-label="Previous image"
            style={{
              position: 'absolute',
              left: rem(12),
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.6)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              zIndex: 10,
            }}
          >
            <ChevronLeft size={22} />
          </ActionIcon>
          <ActionIcon
            variant="light"
            size="lg"
            radius="xl"
            onClick={handleNext}
            aria-label="Next image"
            style={{
              position: 'absolute',
              right: rem(12),
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.6)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              zIndex: 10,
            }}
          >
            <ChevronRight size={22} />
          </ActionIcon>
        </>
      )}
    </Box>

    {/* Bottom bar: dots + description + chapter */}
    <Box
      style={{
        padding: `${rem(12)} ${rem(20)}`,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: rem(8),
      }}
    >
      {allMedia.length > 1 && (
        <Box style={{ display: 'flex', gap: rem(6), alignItems: 'center' }}>
          {allMedia.map((_, idx) => (
            <Box
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              style={{
                width: idx === currentIndex ? rem(10) : rem(6),
                height: idx === currentIndex ? rem(10) : rem(6),
                borderRadius: '50%',
                background: idx === currentIndex ? '#fff' : 'rgba(255,255,255,0.28)',
                transition: 'all 0.22s ease',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            />
          ))}
        </Box>
      )}
      {currentMedia.description && (
        <Text
          size="xs"
          ta="center"
          style={{ color: 'rgba(255,255,255,0.45)', maxWidth: 520 }}
        >
          {currentMedia.description}
        </Text>
      )}
      {currentMedia.chapterNumber && (
        <Text
          size="xs"
          style={{
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontSize: rem(10),
          }}
        >
          Chapter {currentMedia.chapterNumber}
        </Text>
      )}
    </Box>
  </Modal>
)}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no errors.

- [ ] **Step 3: Visual smoke test**

Navigate to a detail page with images. Verify:
- Clicking the portrait zone opens the lightbox modal
- Clicking the prev/next chevrons does NOT open the lightbox
- In the lightbox: prev/next arrows cycle through images, dots are clickable, close button works, Escape key closes it
- Description and chapter number display when present

- [ ] **Step 4: Commit**

```bash
git add client/src/components/layouts/DetailPageHeader.tsx
git commit -m "feat(DetailPageHeader): add lightbox modal for portrait zone"
```

---

## Task 5: Clean up `MediaThumbnail` hero props and final verification

**Files:**
- Modify: `client/src/components/layouts/DetailPageHeader.tsx`
- Modify: `client/src/components/MediaThumbnail.tsx`

- [ ] **Step 1: Remove now-unused `allowFullView` / `controlsPosition` from `DetailPageHeader`'s `MediaThumbnail` usage**

In `DetailPageHeader.tsx`, confirm neither `allowFullView` nor `controlsPosition` is passed to either `MediaThumbnail` instance. Both were previously used (`allowFullView={true}`, `controlsPosition="right"`). These should not appear in the new code.

- [ ] **Step 2: Add TODO comment on the hero controls path in `MediaThumbnail.tsx`**

In `client/src/components/MediaThumbnail.tsx`, find the `controlsPosition === 'right'` block (around line 1203):

```typescript
{showControls && (
  controlsPosition === 'right' ? (
    /* Hero mode: clickable dot strip + count badge, no arrows */
```

Add a comment above it:

```typescript
{showControls && (
  // TODO: controlsPosition='right' hero path is no longer used by DetailPageHeader
  // (hero controls are now rendered directly in DetailPageHeader).
  // Can be removed once confirmed no other callers use it.
  controlsPosition === 'right' ? (
```

- [ ] **Step 3: Run lint**

```bash
cd client && yarn lint 2>&1 | tail -30
```

Expected: no new lint errors.

- [ ] **Step 4: Full build**

```bash
cd client && yarn build 2>&1 | tail -20
```

Expected: clean build.

- [ ] **Step 5: Cross-entity visual check**

Check 3–4 different entity types (character, gamble, arc, organization). For each:
- Header renders correctly with portrait zone on the right
- Image fills the zone without being a small box
- Hovering portrait shows chevrons (if multiple images)
- Clicking portrait opens lightbox
- Cycling works in both the header and the lightbox
- No-image entities show the tinted glow fallback, no portrait zone

- [ ] **Step 6: Final commit**

```bash
git add client/src/components/layouts/DetailPageHeader.tsx client/src/components/MediaThumbnail.tsx
git commit -m "chore: remove legacy hero portrait props, add TODO on controlsPosition=right path"
```
