# Media Lightbox Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current split lightbox (image capped at 70vh + Paper metadata panel) with a full-screen immersive modal where the image fills all available height and metadata is a gradient overlay at the bottom, extracted into its own `MediaLightbox.tsx` component.

**Architecture:** `MediaGallery.tsx` owns data fetching, filtering, grid rendering, and lightbox open/close state. A new `MediaLightbox.tsx` owns all lightbox UI, keyboard/touch navigation, and video embed logic. `MediaItem` type is exported from `MediaGallery.tsx` and imported by `MediaLightbox.tsx`.

**Tech Stack:** Next.js 15, React 19, TypeScript, Mantine 8, Lucide React icons. No test runner exists for the client — verification is TypeScript compilation (`yarn build`) and visual browser check.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `client/src/components/MediaGallery.tsx` | Modify | Export `MediaItem` type; remove inline modal JSX (~lines 693–903); render `<MediaLightbox>` |
| `client/src/components/MediaLightbox.tsx` | Create | Full-screen modal, image/video rendering, overlay bar, controls, keyboard/touch handlers |

---

### Task 1: Export `MediaItem` from `MediaGallery.tsx`

**Files:**
- Modify: `client/src/components/MediaGallery.tsx` (line 52 — the `interface MediaItem` declaration)

The `MediaItem` interface is currently private to `MediaGallery.tsx`. Export it so `MediaLightbox.tsx` can import it.

- [ ] **Step 1: Add `export` to the `MediaItem` interface**

Open `client/src/components/MediaGallery.tsx`. On line 52, change:

```ts
interface MediaItem {
```

to:

```ts
export interface MediaItem {
```

- [ ] **Step 2: Verify TypeScript still compiles**

```bash
cd client && yarn build
```

Expected: build succeeds with no new errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/MediaGallery.tsx
git commit -m "refactor: export MediaItem type from MediaGallery"
```

---

### Task 2: Create `MediaLightbox.tsx`

**Files:**
- Create: `client/src/components/MediaLightbox.tsx`

This component owns all lightbox UI. It receives open state, the media array, the current index, and navigation callbacks from `MediaGallery`.

- [ ] **Step 1: Create the file with the full implementation**

Create `client/src/components/MediaLightbox.tsx` with the following content:

```tsx
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Modal,
  Text,
  rem,
  useMantineTheme,
  rgba
} from '@mantine/core'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  ExternalLink,
  Image as ImageIcon
} from 'lucide-react'
import {
  canEmbedVideo,
  extractYouTubeVideoId,
  extractVimeoVideoId,
  getYouTubeEmbedUrlEnhanced,
  getVimeoEmbedUrlEnhanced
} from '../lib/video-utils'
import { MediaItem } from './MediaGallery'

interface MediaLightboxProps {
  opened: boolean
  media: MediaItem[]
  currentIndex: number
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
}

function getEmbedUrl(url: string): string | null {
  const youtubeId = extractYouTubeVideoId(url)
  if (youtubeId) return getYouTubeEmbedUrlEnhanced(youtubeId)
  const vimeoId = extractVimeoVideoId(url)
  if (vimeoId) return getVimeoEmbedUrlEnhanced(vimeoId)
  return null
}

export default function MediaLightbox({
  opened,
  media,
  currentIndex,
  onClose,
  onPrevious,
  onNext
}: MediaLightboxProps) {
  const theme = useMantineTheme()
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  // Kept for future zoom feature — not wired to UI yet
  const [imageZoomed, setImageZoomed] = useState(false)

  const selectedMedia = media[currentIndex] ?? null

  const palette = useMemo(() => {
    const accent = theme.other?.usogui?.red ?? theme.colors.red?.[5] ?? '#e11d48'
    const secondaryAccent = theme.other?.usogui?.purple ?? theme.colors.violet?.[6] ?? '#7c3aed'
    return { accent, secondaryAccent }
  }, [theme])

  // Reset video state when switching items
  useEffect(() => {
    setShouldLoadVideo(false)
  }, [currentIndex])

  // Keyboard navigation
  useEffect(() => {
    if (!opened) return
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft': onPrevious(); break
        case 'ArrowRight': onNext(); break
        case 'Escape': onClose(); break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [opened, onPrevious, onNext, onClose])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const diff = touchStart - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      diff > 0 ? onNext() : onPrevious()
    }
    setTouchStart(null)
  }

  if (!selectedMedia) return null

  // Inline styles for the frosted-glass control buttons (close, nav arrows, counter)
  const controlStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,0.65)',
    border: '1px solid rgba(255,255,255,0.12)',
    backdropFilter: 'blur(4px)',
    color: 'rgba(255,255,255,0.9)'
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      fullScreen
      withCloseButton={false}
      padding={0}
      overlayProps={{ opacity: 1, color: '#000' }}
      styles={{
        content: { background: '#000' },
        body: { height: '100%', padding: 0 }
      }}
    >
      <Box
        style={{ position: 'relative', width: '100%', height: '100dvh', background: '#000', overflow: 'hidden' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* ── Media content ── */}
        <Box style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {selectedMedia.type === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selectedMedia.url}
              alt={selectedMedia.description || 'Media preview'}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
            />
          ) : selectedMedia.type === 'video' ? (
            // YouTube: immediate embed (same as original behavior), using getEmbedUrl for proper URL handling
            (selectedMedia.url.includes('youtube.com') || selectedMedia.url.includes('youtu.be')) ? (
              <iframe
                src={getEmbedUrl(selectedMedia.url) ?? selectedMedia.url.replace('watch?v=', 'embed/')}
                title={selectedMedia.description}
                allowFullScreen
                style={{ width: '100%', height: '80dvh', border: 'none' }}
              />
            // Vimeo + other embeddable: lazy-load gate
            ) : canEmbedVideo(selectedMedia.url) ? (
              !shouldLoadVideo ? (
                <Button
                  size="md"
                  leftSection={<Play size={18} />}
                  onClick={() => setShouldLoadVideo(true)}
                >
                  Load Video
                </Button>
              ) : (
                <iframe
                  src={getEmbedUrl(selectedMedia.url)!}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  title={selectedMedia.description}
                  style={{ width: '100%', height: '80dvh', border: 'none' }}
                />
              )
            ) : (
              <video controls style={{ maxWidth: '100%', maxHeight: '100dvh' }}>
                <source src={selectedMedia.url} />
                Your browser does not support the video tag.
              </video>
            )
          ) : (
            <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: rem(12), color: 'rgba(255,255,255,0.5)' }}>
              <ImageIcon size={40} />
              <Text size="sm">Media type not supported for preview</Text>
            </Box>
          )}
        </Box>

        {/* ── Close button ── */}
        <ActionIcon
          variant="transparent"
          size="lg"
          onClick={onClose}
          style={{ position: 'absolute', top: rem(14), right: rem(14), zIndex: 10, borderRadius: '50%', ...controlStyle }}
          aria-label="Close viewer"
        >
          <X size={18} />
        </ActionIcon>

        {/* ── Counter pill ── */}
        <Box
          style={{
            position: 'absolute', top: rem(14), left: rem(14), zIndex: 10,
            ...controlStyle,
            borderRadius: rem(12), padding: `${rem(3)} ${rem(10)}`,
            fontSize: rem(11), color: 'rgba(255,255,255,0.65)'
          }}
        >
          {currentIndex + 1} / {media.length}
        </Box>

        {/* ── Previous arrow ── */}
        {currentIndex > 0 && (
          <ActionIcon
            variant="transparent"
            size="lg"
            onClick={onPrevious}
            style={{
              position: 'absolute', top: '50%', left: rem(14),
              transform: 'translateY(-50%)', zIndex: 10, borderRadius: '50%', ...controlStyle
            }}
            aria-label="Previous"
          >
            <ChevronLeft size={22} />
          </ActionIcon>
        )}

        {/* ── Next arrow ── */}
        {currentIndex < media.length - 1 && (
          <ActionIcon
            variant="transparent"
            size="lg"
            onClick={onNext}
            style={{
              position: 'absolute', top: '50%', right: rem(14),
              transform: 'translateY(-50%)', zIndex: 10, borderRadius: '50%', ...controlStyle
            }}
            aria-label="Next"
          >
            <ChevronRight size={22} />
          </ActionIcon>
        )}

        {/* ── Bottom overlay bar ── */}
        <Box
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.92) 100%)',
            padding: `${rem(48)} ${rem(18)} ${rem(16)}`
          }}
        >
          {/* Description */}
          {selectedMedia.description && (
            <Text
              size="sm"
              fw={500}
              lineClamp={2}
              mb={10}
              style={{ color: 'rgba(255,255,255,0.92)', lineHeight: 1.4 }}
            >
              {selectedMedia.description}
            </Text>
          )}

          {/* Badges + submitter row */}
          <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: rem(8) }}>
            <Box style={{ display: 'flex', gap: rem(6), alignItems: 'center', flexWrap: 'wrap', minWidth: 0 }}>
              <Badge
                variant="filled"
                size="sm"
                style={{ backgroundColor: palette.accent, color: '#fff', textTransform: 'capitalize' }}
              >
                {selectedMedia.ownerType}
              </Badge>
              <Badge
                variant="outline"
                size="sm"
                style={{ borderColor: palette.accent, color: palette.accent, textTransform: 'capitalize' }}
              >
                {selectedMedia.type}
              </Badge>
              {selectedMedia.chapterNumber && (
                <Badge
                  variant="outline"
                  size="sm"
                  style={{ borderColor: palette.secondaryAccent, color: palette.secondaryAccent }}
                >
                  Ch. {selectedMedia.chapterNumber}
                </Badge>
              )}
              <Text size="xs" style={{ color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>
                by{' '}
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>{selectedMedia.submittedBy.username}</span>
                {selectedMedia.createdAt && (
                  <> · {new Date(selectedMedia.createdAt).toLocaleDateString()}</>
                )}
              </Text>
            </Box>

            {/* External link */}
            <ActionIcon
              variant="transparent"
              component="a"
              href={selectedMedia.url}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              style={{
                ...controlStyle,
                borderRadius: rem(6),
                flexShrink: 0
              }}
              aria-label="Open original"
            >
              <ExternalLink size={14} />
            </ActionIcon>
          </Box>
        </Box>
      </Box>
    </Modal>
  )
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd client && yarn build
```

Expected: build succeeds. If type errors appear with `theme.other?.usogui`, that's fine — same pattern exists in `MediaGallery.tsx` and the build tolerates it.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/MediaLightbox.tsx
git commit -m "feat: add MediaLightbox component with full-screen immersive design"
```

---

### Task 3: Wire `MediaLightbox` into `MediaGallery.tsx`

**Files:**
- Modify: `client/src/components/MediaGallery.tsx`

Replace the inline `<Modal>` block (lines 693–903) with `<MediaLightbox>` and clean up now-unused imports.

- [ ] **Step 1: Add import for `MediaLightbox` at the top of `MediaGallery.tsx`**

After the existing imports, add:

```tsx
import MediaLightbox from './MediaLightbox'
```

- [ ] **Step 2: Replace the inline `<Modal>` block with `<MediaLightbox>`**

Find the `<Modal` block starting at line 693 and ending at `</Modal>` on line 903. Replace the entire block with:

```tsx
      <MediaLightbox
        opened={dialogOpen}
        media={filteredMedia}
        currentIndex={currentImageIndex}
        onClose={handleCloseDialog}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />
```

- [ ] **Step 3: Remove imports that are now only used in the deleted modal JSX**

The following imports are no longer used in `MediaGallery.tsx` after the modal is removed. Remove them from the import block:

- `Modal` (from `@mantine/core`)
- `Paper` (from `@mantine/core`)
- `Stack` (from `@mantine/core` — check if still used in the empty-state and filter sections; if so, keep it)
- `Button` (from `@mantine/core` — check if still used elsewhere; if not, remove)
- `X`, `ZoomIn`, `Maximize2`, `ChevronLeft`, `ChevronRight` (from `lucide-react`)

> **Note:** Check each import carefully before removing — `Stack` is used in the empty-state render and `Button` may not be used elsewhere in the grid. Only remove the ones that are truly orphaned.

- [ ] **Step 4: Remove handler functions that moved to `MediaLightbox`**

The following state and handlers are now owned by `MediaLightbox`. Remove them from `MediaGallery.tsx`:

- `imageZoomed` state and `setImageZoomed`
- `shouldLoadVideo` state and `setShouldLoadVideo`
- `touchStart` state, `handleTouchStart`, `handleTouchEnd`
- `handleImageZoom`
- `handleLoadVideo`
- The keyboard `useEffect` that was scoped to `dialogOpen`
- `getEmbedUrl` local function
- The `canEmbedVideo` local alias (`const canEmbedVideo = canEmbedVideoUtil`)

> **Note:** `handlePrevious` and `handleNext` still belong in `MediaGallery.tsx` — they update `currentImageIndex` and `selectedMedia` which the gallery owns. Keep them.

Also remove now-unused video-utils imports if `getEmbedUrl` was the only consumer — check if anything in the grid uses them:
- `extractYouTubeVideoId`, `extractVimeoVideoId`, `getYouTubeEmbedUrlEnhanced`, `getVimeoEmbedUrlEnhanced`, `isDirectVideoUrl`, `canEmbedVideo as canEmbedVideoUtil`

`isYouTubeUrl` and `getYouTubeThumbnail` are still used in `getMediaThumbnail` — keep those.

- [ ] **Step 5: Verify TypeScript compilation**

```bash
cd client && yarn build
```

Expected: clean build. Fix any "X is declared but never read" or unused import errors until it passes.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/MediaGallery.tsx
git commit -m "refactor: extract lightbox modal into MediaLightbox component"
```

---

### Task 4: Visual verification

- [ ] **Step 1: Start the dev server**

```bash
cd client && yarn dev
```

- [ ] **Step 2: Open the media gallery page**

Navigate to `http://localhost:3000/media` in the browser.

- [ ] **Step 3: Verify the lightbox**

Click any media item. Confirm:
- Modal opens full-screen with black background
- Image fills the available height (`object-fit: contain`, no 70vh crop)
- Bottom gradient overlay is visible with description (if present), badges, submitter, and date
- Counter pill shows top-left (e.g., "1 / 12")
- Close button is top-right
- Left/right arrows navigate correctly (arrow keys and swipe also work)
- Clicking external link icon opens the original URL in a new tab
- Clicking a video item shows the embed / Load Video button as expected

- [ ] **Step 4: Final commit if any small fixes were needed**

```bash
git add -p
git commit -m "fix: lightbox visual tweaks"
```
