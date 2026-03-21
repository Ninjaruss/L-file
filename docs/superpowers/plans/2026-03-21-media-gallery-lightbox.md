# Media Gallery Lightbox Unification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the two separate lightbox implementations into one consistent full-screen `MediaLightbox`, fix click-to-close UX, add a visible X button, show entity names in metadata, and improve no-thumbnail card states.

**Architecture:** Create a shared `MediaItem` type in `client/src/types/media.ts`, then update `MediaLightbox.tsx` (fix close UX, add X button, entity name), migrate `MediaGallery.tsx` and `MediaPageContent.tsx` to use the shared type, remove `MediaPageContent`'s inline modal, and wire it to the unified `MediaLightbox`.

**Tech Stack:** Next.js 15, React 19, TypeScript (strict), Mantine UI v7, Lucide React icons. Package manager: `yarn` (never `npm`). All commands run from `client/`.

**Spec:** `docs/superpowers/specs/2026-03-21-media-gallery-lightbox-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `client/src/types/media.ts` | **Create** | Single source of truth for `MediaItem` type used across gallery components |
| `client/src/components/MediaLightbox.tsx` | **Modify** | Unified full-screen lightbox: fix close UX, add X button, entity name, use shared type |
| `client/src/components/MediaGallery.tsx` | **Modify** | Remove local `MediaItem`, use shared type, improve no-thumbnail card |
| `client/src/app/media/MediaPageContent.tsx` | **Modify** | Remove local `MediaItem` + inline modal + dead code; use shared type + `MediaLightbox` |

**Do NOT touch:**
- `client/src/components/MediaThumbnail.tsx` — entity display thumbnail, separate concern
- `client/src/components/admin/EntityDisplayMediaSection.tsx` — admin component with its own `MediaItem { id: string }` type, completely separate
- Any server/ files

---

## Task 1: Create shared MediaItem type

**Files:**
- Create: `client/src/types/media.ts`

- [ ] **Step 1: Create the file**

```typescript
// client/src/types/media.ts

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
  // Entity relations — populated by the media list page API response
  character?: { id: number; name: string }
  arc?: { id: number; name: string }
  event?: { id: number; title: string }
  gamble?: { id: number; name: string }
  organization?: { id: number; name: string }
}
```

- [ ] **Step 2: Verify TypeScript is happy**

```bash
cd client && yarn tsc --noEmit 2>&1 | head -20
```

Expected: no errors (the file is just a type export, nothing consuming it yet).

- [ ] **Step 3: Commit**

```bash
git add client/src/types/media.ts
git commit -m "feat: add shared MediaItem type to types/media.ts"
```

---

## Task 2: Fix MediaLightbox

**Files:**
- Modify: `client/src/components/MediaLightbox.tsx`

**What changes:**
1. Import `MediaItem` from shared type (remove import from `./MediaGallery`)
2. Fix backdrop click-to-close: remove `onClick` from the inner flex wrapper; add `onClick={(e) => e.stopPropagation()}` directly on `<img>`, `<iframe>`, and `<video>` elements
3. Add visible X close button (circular, frosted glass, top-right alongside external-link button)
4. Add `getEntityName` helper and show entity name as a Badge in the bottom bar

- [ ] **Step 1: Update imports**

In `MediaLightbox.tsx`, change:
```typescript
// FROM:
import {
  ChevronLeft,
  ChevronRight,
  Play,
  ExternalLink,
  Image as ImageIcon
} from 'lucide-react'
import { MediaItem } from './MediaGallery'
```
to:
```typescript
// TO:
import {
  ChevronLeft,
  ChevronRight,
  Play,
  ExternalLink,
  Image as ImageIcon,
  X
} from 'lucide-react'
import { MediaItem } from '../types/media'
```

- [ ] **Step 2: Fix backdrop click — remove stopPropagation from inner wrapper**

Find the inner content `Box` (the flex container, around line 116–119):
```tsx
// FROM — this blocks ALL clicks from reaching the backdrop:
<Box
  style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  onClick={(e) => e.stopPropagation()}
>
```
Change to (remove the onClick entirely):
```tsx
// TO:
<Box
  style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
>
```

- [ ] **Step 3: Add stopPropagation to the media elements themselves**

Inside the same inner box, find the image, iframe, and video elements and add `onClick={(e) => e.stopPropagation()}` to each so clicking the actual content doesn't close the lightbox:

```tsx
// image element:
<img
  src={selectedMedia.url}
  alt={selectedMedia.description || 'Media preview'}
  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
  onClick={(e) => e.stopPropagation()}
/>

// iframe element:
<iframe
  src={embedUrl}
  title={selectedMedia.description || 'Video'}
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
  allowFullScreen
  style={{ width: '100%', height: '80dvh', border: 'none' }}
  onClick={(e) => e.stopPropagation()}
/>

// video element:
<video
  controls
  style={{ maxWidth: '100%', maxHeight: '100dvh' }}
  onClick={(e) => e.stopPropagation()}
>
  <source src={selectedMedia.url} />
  Your browser does not support the video tag.
</video>
```

- [ ] **Step 4: Add the X close button**

After the existing external-link `ActionIcon` block (which is at `top: rem(14), right: rem(14)`), add a new close button at `right: rem(54)`:

```tsx
{/* ── Close button (top-right, left of external link) ── */}
<ActionIcon
  variant="transparent"
  size="lg"
  onClick={(e) => { e.stopPropagation(); onClose() }}
  style={{
    position: 'absolute',
    top: rem(14),
    right: rem(54),
    zIndex: 10,
    borderRadius: '50%',
    ...controlStyle
  }}
  aria-label="Close"
>
  <X size={16} />
</ActionIcon>
```

- [ ] **Step 5: Add entity name helper and badge**

Add the helper function inside the component (before the return statement):

```typescript
const getEntityName = (item: MediaItem): string | null => {
  if (item.character) return item.character.name
  if (item.arc) return item.arc.name
  if (item.event) return item.event.title
  if (item.gamble) return item.gamble.name
  if (item.organization) return item.organization.name
  // user-owned items: no entity badge — submitter username is already shown below
  return null
}
```

In the bottom overlay bar, after the existing type/ownerType badges and before the submitter text, add:

```tsx
{getEntityName(selectedMedia) && (
  <Badge
    variant="outline"
    size="sm"
    style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.7)' }}
  >
    {getEntityName(selectedMedia)}
  </Badge>
)}
```

The full badges row in the bottom bar should look like:
```tsx
<Box style={{ display: 'flex', gap: rem(6), alignItems: 'center', flexWrap: 'wrap' }}>
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
  {getEntityName(selectedMedia) && (
    <Badge
      variant="outline"
      size="sm"
      style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.7)' }}
    >
      {getEntityName(selectedMedia)}
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
```

- [ ] **Step 6: Verify TypeScript**

```bash
cd client && yarn tsc --noEmit 2>&1 | head -30
```

Expected: no errors. If you see `Property 'X' does not exist`, double-check the lucide-react import.

- [ ] **Step 7: Commit**

```bash
git add client/src/components/MediaLightbox.tsx
git commit -m "feat: fix MediaLightbox close UX, add X button, entity name badge"
```

---

## Task 3: Update MediaGallery

**Files:**
- Modify: `client/src/components/MediaGallery.tsx`

**What changes:**
1. Remove the local `export interface MediaItem` — consumers will import from `../types/media` instead
2. Add import from shared type
3. Improve no-thumbnail card state (consistent min-height, accent-ringed icon, labels)

- [ ] **Step 1: Replace local MediaItem with shared type**

In `MediaGallery.tsx`, remove the entire `export interface MediaItem { ... }` block (lines 36–54).

Add to the top imports:
```typescript
import { MediaItem } from '../types/media'
```

Note: `MediaLightbox.tsx` previously imported `MediaItem` from `./MediaGallery`. That import was already updated in Task 2. No other files import `MediaItem` from `MediaGallery` — you can verify with:
```bash
cd client && grep -r "from.*MediaGallery" src/ --include="*.tsx" --include="*.ts"
```
Expected: zero results (Task 2 already moved the import).

- [ ] **Step 2: Improve the no-thumbnail fallback card**

In `MediaGallery.tsx`, find the fallback `Box` in the card render (the `else` arm of the `displayUrl && !failedImageIds.has(mediaItem.id)` ternary, around line 530–560). Replace the entire fallback block with:

```tsx
<Box
  style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: rem(120),
    flexDirection: 'column',
    gap: rem(8),
    transition: 'background 0.2s ease',
    background: isHovered
      ? `linear-gradient(135deg, ${rgba(palette.accent, 0.12)}, ${theme.colors.dark[6]})`
      : theme.colors.dark[6],
  }}
>
  <Stack align="center" gap="xs">
    {failedImageIds.has(mediaItem.id) ? (
      <>
        <Box
          style={{
            background: rgba(theme.colors.dark[3], 0.2),
            border: `1px solid ${rgba(theme.colors.dark[3], 0.4)}`,
            borderRadius: '50%',
            width: rem(44),
            height: rem(44),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ImageOff size={22} color={theme.colors.dark[3]} />
        </Box>
        <Text size="xs" c="dimmed">Image unavailable</Text>
        <Text size="xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Click to open</Text>
      </>
    ) : (
      <>
        <Box
          style={{
            background: rgba(palette.accent, 0.15),
            border: `1px solid ${rgba(palette.accent, 0.35)}`,
            borderRadius: '50%',
            width: rem(44),
            height: rem(44),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: palette.accent,
          }}
        >
          {getMediaTypeIcon(mediaItem.type)}
        </Box>
        <Text size="xs" c="white" style={{ opacity: 0.7 }} fw={500} tt="capitalize">
          {mediaItem.type}
        </Text>
        <Text size="xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Click to open</Text>
      </>
    )}
  </Stack>
</Box>
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd client && yarn tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/MediaGallery.tsx
git commit -m "feat: use shared MediaItem type, improve no-thumbnail card in MediaGallery"
```

---

## Task 4: Migrate MediaPageContent to unified lightbox

**Files:**
- Modify: `client/src/app/media/MediaPageContent.tsx`

This is the largest task. Work through it in sub-steps.

### 4a: Update imports

- [ ] **Step 1: Replace local MediaItem with shared type**

Remove the local `interface MediaItem { ... }` block (lines 55–76).

Add at the top of the import section:
```typescript
import { MediaItem } from '../../types/media'
```

Add the MediaLightbox import (with other component imports):
```typescript
import MediaLightbox from '../../components/MediaLightbox'
```

- [ ] **Step 2: Remove unused Mantine imports**

From the Mantine import block, remove `Modal` and `Image` — they were only used by the inline lightbox:

```typescript
// FROM (remove Modal and Image):
import {
  Title,
  Text,
  Group,
  Select,
  Button,
  Card,
  Badge,
  ActionIcon,
  Loader,
  Stack,
  Alert,
  Box,
  Container,
  Paper,
  useMantineTheme,
  rem,
  Modal,     // ← remove
  Image,     // ← remove
  Anchor
} from '@mantine/core'
```

- [ ] **Step 3: Verify TypeScript after import changes**

```bash
cd client && yarn tsc --noEmit 2>&1 | grep "MediaPageContent" | head -20
```

Expected: errors about `Modal` and `Image` not found (because we removed them but haven't removed usage yet — that's fine, we'll fix it in the next steps). If you see unexpected unrelated errors, investigate before proceeding.

### 4b: Remove dead state and handlers

- [ ] **Step 4: Remove dead state declarations**

Find and delete these state declarations (around lines 106–115):

```typescript
// DELETE these lines:
const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
const [imageDimensions, setImageDimensions] = useState<Record<number, { width: number; height: number }>>({})
const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
const [touchStart, setTouchStart] = useState<number | null>(null)
```

Keep all other state (`viewerOpen`, `currentIndex`, `loading`, `error`, `media`, `hasMore`, etc.).

- [ ] **Step 5: Remove dead functions**

Delete these functions entirely:

1. `handleImageLoad` (~lines 304–311) — reads from the removed `imageDimensions` state
2. `getOptimalAspectRatio` (~lines 313–322) — reads `imageDimensions`, never called
3. `handleTouchStart` (~lines 264–266)
4. `handleTouchEnd` (~lines 268–280)

- [ ] **Step 6: Remove the keyboard navigation useEffect**

Delete the `useEffect` that adds keyboard listeners for the viewer (around lines 282–302):

```typescript
// DELETE this entire useEffect:
useEffect(() => {
  if (!viewerOpen) return

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        handlePrevious()
        break
      case 'ArrowRight':
        handleNext()
        break
      case 'Escape':
        handleCloseViewer()
        break
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [viewerOpen, handlePrevious, handleNext, handleCloseViewer])
```

### 4c: Update handlers and click wiring

- [ ] **Step 7: Update handlePrevious and handleNext — remove setSelectedMedia calls**

```typescript
// FROM:
const handlePrevious = useCallback(() => {
  if (currentIndex > 0) {
    const newIndex = currentIndex - 1
    setCurrentIndex(newIndex)
    setSelectedMedia(media[newIndex])   // ← remove this line
  }
}, [currentIndex, media])

const handleNext = useCallback(() => {
  if (currentIndex < media.length - 1) {
    const newIndex = currentIndex + 1
    setCurrentIndex(newIndex)
    setSelectedMedia(media[newIndex])   // ← remove this line
  }
}, [currentIndex, media])
```

```typescript
// TO:
const handlePrevious = useCallback(() => {
  if (currentIndex > 0) {
    setCurrentIndex(currentIndex - 1)
  }
}, [currentIndex])

const handleNext = useCallback(() => {
  if (currentIndex < media.length - 1) {
    setCurrentIndex(currentIndex + 1)
  }
}, [currentIndex, media.length])
```

- [ ] **Step 8: Update handleCloseViewer — remove setSelectedMedia**

```typescript
// FROM:
const handleCloseViewer = useCallback(() => {
  setViewerOpen(false)
  setSelectedMedia(null)
}, [])

// TO:
const handleCloseViewer = useCallback(() => setViewerOpen(false), [])
```

- [ ] **Step 9: Update handleMediaClick — remove setSelectedMedia**

```typescript
// FROM:
const handleMediaClick = (item: MediaItem, index: number) => {
  setSelectedMedia(item)
  setCurrentIndex(index)
  setViewerOpen(true)
}

// TO:
const handleMediaClick = (_item: MediaItem, index: number) => {
  setCurrentIndex(index)
  setViewerOpen(true)
}
```

### 4d: Remove the inline modal

- [ ] **Step 10: Remove the onLoad handler from the card grid img**

In the masonry grid (around line 717), find:
```tsx
<img
  src={thumbnail}
  alt={item.description || 'Media item'}
  loading="lazy"
  style={{ width: '100%', height: 'auto', display: 'block' }}
  onLoad={(e) => handleImageLoad(item.id, e)}   // ← remove this line
  onError={() => { setFailedImages(prev => new Set(prev).add(item.id)) }}
/>
```
Remove the `onLoad` prop.

- [ ] **Step 11: Remove the entire inline Modal lightbox and replace with MediaLightbox**

Find the `<Modal opened={viewerOpen} ...>` block (around line 891) and delete it entirely — it runs to around line 1060. Replace it with:

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

### 4e: Improve no-thumbnail card

- [ ] **Step 12: Improve the no-thumbnail fallback in the masonry grid**

Find the `else` arm of the outer `thumbnail ?` ternary in the masonry grid (around lines 845–858):

```tsx
// FROM — just an icon, no labels, height rem(150):
) : (
  <Box
    style={{
      background: `${accentMedia}10`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: rem(150)
    }}
  >
    {getMediaTypeIcon(item.type)}
  </Box>
)}
```

Replace with:

```tsx
) : (
  <Box
    style={{
      background: isHovered
        ? `linear-gradient(135deg, ${accentMedia}1a, ${theme.colors.dark[6]})`
        : theme.colors.dark[6],
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      minHeight: rem(120),
      flexDirection: 'column',
      gap: rem(8),
      transition: 'background 0.2s ease',
    }}
  >
    <Stack align="center" gap="xs">
      <Box
        style={{
          background: `${accentMedia}26`,
          border: `1px solid ${accentMedia}59`,
          borderRadius: '50%',
          width: rem(44),
          height: rem(44),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accentMedia,
        }}
      >
        {getMediaTypeIcon(item.type)}
      </Box>
      <Text size="xs" c="white" style={{ opacity: 0.7 }} fw={500} tt="capitalize">
        {item.type}
      </Text>
      <Text size="xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Click to open</Text>
    </Stack>
  </Box>
)}
```

### 4f: Verify and commit

- [ ] **Step 13: Verify TypeScript compiles cleanly**

```bash
cd client && yarn tsc --noEmit 2>&1 | head -40
```

Expected: no errors. Common issues to look for:
- `selectedMedia` used somewhere that wasn't caught — search: `grep -n "selectedMedia" src/app/media/MediaPageContent.tsx`
- `handleImageLoad` still referenced — search: `grep -n "handleImageLoad" src/app/media/MediaPageContent.tsx`
- `Modal` or `Image` still in use — TypeScript will report these if you missed removing them

- [ ] **Step 14: Run lint**

```bash
cd client && yarn lint 2>&1 | grep -A2 "MediaPageContent\|MediaLightbox\|MediaGallery" | head -40
```

Expected: no errors. Warnings about `_item` unused param are fine (the underscore prefix suppresses them).

- [ ] **Step 15: Commit**

```bash
git add client/src/app/media/MediaPageContent.tsx
git commit -m "feat: migrate MediaPageContent to unified MediaLightbox, remove dead code"
```

---

## Task 5: Final verification

- [ ] **Step 1: Full TypeScript check across the whole client**

```bash
cd client && yarn tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 2: Full lint check**

```bash
cd client && yarn lint
```

Expected: no errors (warnings are acceptable).

- [ ] **Step 3: Manual smoke test — detail page gallery**

Start the dev server (`yarn dev` from client/) with the backend running. Navigate to any character detail page (e.g., `/characters/1`) that has media. Verify:
- Gallery thumbnails render
- Clicking a card opens the full-screen lightbox
- X button is visible in top-right, clicking it closes the lightbox
- Clicking the black backdrop closes the lightbox
- Clicking the image itself does nothing (stays open)
- Keyboard arrow keys navigate between items
- Keyboard Escape closes the lightbox
- For items with entity names (character/arc/etc.), the entity name badge appears in the bottom bar

- [ ] **Step 4: Manual smoke test — media list page**

Navigate to `/media`. Verify:
- Grid renders with thumbnails
- Clicking a card opens the full-screen lightbox (same component as detail pages)
- Same close/navigate behavior as above
- No-thumbnail cards (audio, non-YouTube video) show the accent-ringed icon with type label and "Click to open"
- Clicking a no-thumbnail card opens the lightbox

- [ ] **Step 5: Commit verification checkpoint**

```bash
git log --oneline -6
```

Expected output (4 feature commits + 2 doc commits):
```
<hash> feat: migrate MediaPageContent to unified MediaLightbox, remove dead code
<hash> feat: use shared MediaItem type, improve no-thumbnail card in MediaGallery
<hash> feat: fix MediaLightbox close UX, add X button, entity name badge
<hash> feat: add shared MediaItem type to types/media.ts
<hash> docs: update media gallery lightbox spec with reviewer fixes
<hash> docs: add media gallery lightbox unification design spec
```
