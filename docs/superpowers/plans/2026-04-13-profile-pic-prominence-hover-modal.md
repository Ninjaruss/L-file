# Profile Pic Prominence & Hover-Expand Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make landing page profile pic avatars larger and add a hover-to-expand floating image modal on user profile pictures across the users list, user detail, and profile pages.

**Architecture:** Create a new `ExpandableProfileImage` wrapper component that delegates rendering to `UserProfileImage` while adding hover/tap-to-expand behavior via the existing `useHoverModal` hook. The expanded image renders via `ReactDOM.createPortal` to `document.body` to avoid clipping from ancestor `overflow: hidden` containers. Landing page avatar size bumps are a simple prop change in `FavoritesSection`.

**Tech Stack:** Next.js 15, React 19, TypeScript, Mantine UI, motion/react (framer-motion), existing `useHoverModal` hook

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `client/src/components/ExpandableProfileImage.tsx` | Wrapper around `UserProfileImage` with hover-expand modal via portal |
| Modify | `client/src/components/FavoritesSection.tsx` | Bump avatar sizes in "Popular Profile Pics" card |
| Modify | `client/src/app/users/UsersPageContent.tsx` | Replace `UserProfileImage` with `ExpandableProfileImage` |
| Modify | `client/src/app/users/[id]/UserProfileClient.tsx` | Replace `UserProfileImage` with `ExpandableProfileImage` |
| Modify | `client/src/app/profile/ProfileHeader.tsx` | Replace `UserProfileImage` with `ExpandableProfileImage` |

---

### Task 1: Create ExpandableProfileImage component

**Files:**
- Create: `client/src/components/ExpandableProfileImage.tsx`

- [ ] **Step 1: Create the component file**

  Create `client/src/components/ExpandableProfileImage.tsx` with the following content:

  ```tsx
  'use client'

  import React, { useEffect, useState } from 'react'
  import { createPortal } from 'react-dom'
  import { motion, AnimatePresence } from 'motion/react'
  import UserProfileImage from './UserProfileImage'
  import { useHoverModal } from '../hooks/useHoverModal'

  interface UserShape {
    id: number
    username: string
    profilePictureType?: 'fluxer' | 'character_media' | 'exclusive_artwork' | null
    selectedCharacterMediaId?: number | null
    selectedCharacterMedia?: {
      id: number
      url: string
      fileName?: string
      description?: string
      ownerType?: string
      ownerId?: number
      chapterNumber?: number
      character?: {
        id: number
        name: string
        firstAppearanceChapter?: number
      }
    } | null
    fluxerId?: string | null
    fluxerAvatar?: string | null
  }

  interface ExpandableProfileImageProps {
    user: UserShape
    size?: number
    showFallback?: boolean
    className?: string
  }

  const MODAL_SIZE = 212 // 200px image + 6px padding each side

  export default function ExpandableProfileImage({
    user,
    size = 60,
    showFallback = true,
    className,
  }: ExpandableProfileImageProps) {
    const [mounted, setMounted] = useState(false)
    useEffect(() => { setMounted(true) }, [])

    const {
      hoveredItem,
      hoverPosition,
      handleMouseEnter,
      handleMouseLeave,
      handleModalMouseEnter,
      handleModalMouseLeave,
      handleTap,
      isTouchDevice,
    } = useHoverModal<string>({
      modalWidth: MODAL_SIZE,
      modalHeight: MODAL_SIZE,
      showDelay: 200,
      hideDelay: 150,
    })

    const getImageUrl = (): string | null => {
      if (user.profilePictureType === 'character_media' && user.selectedCharacterMedia?.url) {
        return user.selectedCharacterMedia.url
      }
      if (
        (user.profilePictureType === 'fluxer' || !user.profilePictureType) &&
        user.fluxerId &&
        user.fluxerAvatar
      ) {
        return user.fluxerAvatar.startsWith('http')
          ? user.fluxerAvatar
          : `https://fluxerusercontent.com/avatars/${user.fluxerId}/${user.fluxerAvatar}.png?size=256`
      }
      return null
    }

    const imageUrl = getImageUrl()

    const triggerHandlers = imageUrl
      ? isTouchDevice
        ? { onClick: (e: React.MouseEvent) => handleTap(imageUrl, e) }
        : {
            onMouseEnter: (e: React.MouseEvent) => handleMouseEnter(imageUrl, e),
            onMouseLeave: handleMouseLeave,
          }
      : {}

    return (
      <>
        <div
          style={{ display: 'inline-block', cursor: imageUrl ? 'pointer' : undefined }}
          {...triggerHandlers}
        >
          <UserProfileImage
            user={user}
            size={size}
            showFallback={showFallback}
            className={className}
          />
        </div>

        {mounted && createPortal(
          <AnimatePresence>
            {hoveredItem && hoverPosition && (
              <motion.div
                key="profile-expand-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onMouseEnter={handleModalMouseEnter}
                onMouseLeave={handleModalMouseLeave}
                style={{
                  position: 'fixed',
                  left: hoverPosition.x,
                  top: hoverPosition.y,
                  transform: 'translateX(-50%)',
                  zIndex: 9999,
                  background: '#111',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
                  padding: 6,
                  pointerEvents: 'auto',
                }}
              >
                <img
                  src={hoveredItem}
                  alt={`${user.username}'s profile picture`}
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 6,
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </>
    )
  }
  ```

- [ ] **Step 2: Verify TypeScript accepts the file**

  Run from `client/`:
  ```bash
  yarn tsc --noEmit --project tsconfig.json 2>&1 | grep ExpandableProfileImage
  ```
  Expected: no output (no errors for this file).

- [ ] **Step 3: Commit**

  ```bash
  cd client
  git add src/components/ExpandableProfileImage.tsx
  git commit -m "feat: add ExpandableProfileImage with hover-expand portal modal"
  ```

---

### Task 2: Bump avatar sizes in FavoritesSection

**Files:**
- Modify: `client/src/components/FavoritesSection.tsx`

The "Popular Profile Pics" card has three `Avatar` components. Currently sizes are 52 (#1), 28 (#2), 22 (#3).

- [ ] **Step 1: Update the #1 featured avatar size**

  In `client/src/components/FavoritesSection.tsx`, find the `Avatar` inside the `{favoriteCharacterMedia[0] && (` block (around line 178–182):

  ```tsx
  <Avatar
    src={favoriteCharacterMedia[0].media.url}
    alt={favoriteCharacterMedia[0].media.character.name}
    size={52}
    radius="xl"
    style={{ border: `1px solid ${withAlpha(...)}`, flexShrink: 0 }}
  />
  ```

  Change `size={52}` to `size={80}`.

- [ ] **Step 2: Update the #2 and #3 avatar sizes**

  In the same file, find the `.slice(1).map(...)` block. There's a single `Avatar` component inside using a ternary: `size={idx === 0 ? 28 : 22}`.

  Change it to `size={idx === 0 ? 36 : 28}`.

- [ ] **Step 3: Verify build**

  ```bash
  cd client
  yarn tsc --noEmit 2>&1 | tail -5
  ```
  Expected: no errors.

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/FavoritesSection.tsx
  git commit -m "feat: larger profile pic avatars in landing page favorites section"
  ```

---

### Task 3: Use ExpandableProfileImage in UsersPageContent

**Files:**
- Modify: `client/src/app/users/UsersPageContent.tsx`

- [ ] **Step 1: Replace the import**

  In `client/src/app/users/UsersPageContent.tsx`, find:
  ```tsx
  import UserProfileImage from '../../components/UserProfileImage'
  ```
  Replace with:
  ```tsx
  import ExpandableProfileImage from '../../components/ExpandableProfileImage'
  ```

- [ ] **Step 2: Replace the component usage**

  In the same file, find the `UserProfileImage` usage inside the user card (around line 352–358):
  ```tsx
  <Box style={{ boxShadow: '0 0 0 3px rgba(168,85,247,0.2)', borderRadius: '50%', overflow: 'hidden' }}>
    <UserProfileImage
      user={user}
      size={72}
      showFallback
      className="user-profile-avatar"
    />
  </Box>
  ```

  Replace with:
  ```tsx
  <Box style={{ boxShadow: '0 0 0 3px rgba(168,85,247,0.2)', borderRadius: '50%', overflow: 'hidden' }}>
    <ExpandableProfileImage
      user={user}
      size={72}
      showFallback
      className="user-profile-avatar"
    />
  </Box>
  ```

- [ ] **Step 3: Verify TypeScript**

  ```bash
  cd client
  yarn tsc --noEmit 2>&1 | tail -5
  ```
  Expected: no errors.

- [ ] **Step 4: Commit**

  ```bash
  git add src/app/users/UsersPageContent.tsx
  git commit -m "feat: hover-expand profile image modal on users list page"
  ```

---

### Task 4: Use ExpandableProfileImage in UserProfileClient

**Files:**
- Modify: `client/src/app/users/[id]/UserProfileClient.tsx`

- [ ] **Step 1: Replace the import**

  In `client/src/app/users/[id]/UserProfileClient.tsx`, find:
  ```tsx
  import UserProfileImage from '../../../components/UserProfileImage'
  ```
  Replace with:
  ```tsx
  import ExpandableProfileImage from '../../../components/ExpandableProfileImage'
  ```

- [ ] **Step 2: Replace the component usage**

  In the same file, find the header avatar block (around line 199–204):
  ```tsx
  <Box style={{ borderRadius: '4px', border: '1px solid #2a2a2a', boxShadow: '0 0 0 2px rgba(225,29,72,0.15)', flexShrink: 0 }}>
    <UserProfileImage user={user} size={72} />
  </Box>
  ```

  Replace with:
  ```tsx
  <Box style={{ borderRadius: '4px', border: '1px solid #2a2a2a', boxShadow: '0 0 0 2px rgba(225,29,72,0.15)', flexShrink: 0 }}>
    <ExpandableProfileImage user={user} size={72} />
  </Box>
  ```

- [ ] **Step 3: Verify TypeScript**

  ```bash
  cd client
  yarn tsc --noEmit 2>&1 | tail -5
  ```
  Expected: no errors.

- [ ] **Step 4: Commit**

  ```bash
  git add src/app/users/[id]/UserProfileClient.tsx
  git commit -m "feat: hover-expand profile image modal on user detail page"
  ```

---

### Task 5: Use ExpandableProfileImage in ProfileHeader

**Files:**
- Modify: `client/src/app/profile/ProfileHeader.tsx`

Note: the profile header has a click handler on the outer `Box` that opens the profile picture selector. The `ExpandableProfileImage` hover modal coexists with this — hover shows the expanded image, click still opens the selector via the outer `Box` onClick.

- [ ] **Step 1: Replace the import**

  In `client/src/app/profile/ProfileHeader.tsx`, find:
  ```tsx
  import UserProfileImage from '../../components/UserProfileImage'
  ```
  Replace with:
  ```tsx
  import ExpandableProfileImage from '../../components/ExpandableProfileImage'
  ```

- [ ] **Step 2: Replace the component usage**

  In the same file, find the avatar section (around line 106–123):
  ```tsx
  <Box
    style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
    onClick={onOpenProfilePictureSelector}
  >
    <UserProfileImage user={user} size={72} style={{ borderRadius: '4px', border: '1px solid #2a2a2a', boxShadow: '0 0 0 2px rgba(225,29,72,0.15)' }} />
    <Box
      style={{
        position: 'absolute', bottom: '-4px', right: '-4px',
        width: '20px', height: '20px',
        background: outlineStyles.accentColor,
        borderRadius: '50%',
        border: '2px solid #0a0a0a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Edit size={10} color="white" />
    </Box>
  </Box>
  ```

  Replace with:
  ```tsx
  <Box
    style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
    onClick={onOpenProfilePictureSelector}
  >
    <ExpandableProfileImage user={user} size={72} />
    <Box
      style={{
        position: 'absolute', bottom: '-4px', right: '-4px',
        width: '20px', height: '20px',
        background: outlineStyles.accentColor,
        borderRadius: '50%',
        border: '2px solid #0a0a0a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Edit size={10} color="white" />
    </Box>
  </Box>
  ```

- [ ] **Step 3: Verify TypeScript**

  ```bash
  cd client
  yarn tsc --noEmit 2>&1 | tail -5
  ```
  Expected: no errors.

- [ ] **Step 4: Commit**

  ```bash
  git add src/app/profile/ProfileHeader.tsx
  git commit -m "feat: hover-expand profile image modal on profile page"
  ```

---

### Task 6: Final build verification

- [ ] **Step 1: Full production build**

  ```bash
  cd client
  yarn build 2>&1 | tail -20
  ```
  Expected: build completes with no TypeScript or compilation errors. There may be warnings about image optimization (using `<img>` instead of Next.js `<Image>`) — these are acceptable for portal-rendered content and can be suppressed or ignored.

- [ ] **Step 2: Smoke-test manually**

  Start the dev server:
  ```bash
  cd client
  yarn dev
  ```

  Check each of the following:
  1. **Landing page** (`/`) → "Popular Profile Pics" card: #1 avatar should be visibly larger (~80px)
  2. **Users list** (`/users`) → hover a user card avatar → floating image panel appears; move away → panel fades out
  3. **User detail** (`/users/[id]`) → hover the avatar in the header → floating panel appears
  4. **Profile page** (`/profile`) → hover the avatar → floating panel appears; click → profile picture selector still opens

  If any hover behavior doesn't appear, confirm the user has a `fluxerAvatar` or `selectedCharacterMedia` set (fallback letter avatars correctly skip the modal).
