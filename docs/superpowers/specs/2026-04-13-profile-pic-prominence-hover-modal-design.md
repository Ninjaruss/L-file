# Profile Pic Prominence & Hover-Expand Modal

**Date:** 2026-04-13  
**Status:** Approved

## Overview

Two related improvements to profile picture presentation:

1. **Landing page** — larger avatars in the "Popular Profile Pics" card in `FavoritesSection`
2. **Hover-expand modal** — clicking/hovering a profile picture on the users list, user detail, and profile pages shows a floating full-size image

## 1. Landing Page — Larger Avatars

**File:** `client/src/components/FavoritesSection.tsx`

Bump avatar sizes in the "Popular Profile Pics" card:

| Position | Current | New |
|----------|---------|-----|
| #1 featured | 52px | 80px |
| #2 | 28px | 36px |
| #3 | 22px | 28px |

No structural or layout changes — just the `size` prop values on the `Avatar` components.

## 2. Hover-Expand Modal

### New component: `ExpandableProfileImage`

**File:** `client/src/components/ExpandableProfileImage.tsx`

A thin wrapper around `UserProfileImage` that adds hover-expand behavior. Accepts the same `user` prop (and `size`, `showFallback`, `className`) as `UserProfileImage` plus no additional required props.

**Behavior:**
- Desktop: hovering the avatar for 200ms shows the modal; leaving the avatar (or modal) hides it after 150ms
- Touch devices: tap to toggle the modal
- Uses the existing `useHoverModal` hook for all positioning and delay logic

**Modal appearance:**
- Fixed-position floating panel rendered via `ReactDOM.createPortal` to `document.body` (avoids clipping from `overflow: hidden` parents)
- 200×200px image, `object-fit: cover`, `border-radius: 10px`
- Dark background (`#111`), subtle border (`rgba(255,255,255,0.12)`), drop shadow
- 150ms fade-in CSS transition
- Positioned above the avatar (or below if near top of viewport) — handled by `useHoverModal`

**Image URL resolution:**
- `profilePictureType === 'fluxer'` or no type + fluxerAvatar present: `https://fluxerusercontent.com/avatars/{fluxerId}/{fluxerAvatar}.png?size=256`
- `profilePictureType === 'character_media'`: `selectedCharacterMedia.url`
- No image (fallback avatar): don't show modal

**Modal content:** Image only (Option A) — no username or character info overlay.

### Usage sites

| Page | File | Current | Change |
|------|------|---------|--------|
| Users list | `client/src/app/users/UsersPageContent.tsx` | `UserProfileImage size={72}` | Replace with `ExpandableProfileImage size={72}` |
| User detail | `client/src/app/users/[id]/UserProfileClient.tsx` | `UserProfileImage size={72}` | Replace with `ExpandableProfileImage size={72}` |
| Profile (own) | `client/src/app/profile/ProfileHeader.tsx` | `UserProfileImage size={72}` wrapped in click handler | Replace with `ExpandableProfileImage size={72}` — click-to-edit behavior stays on the outer `Box` |

### Out of scope

- `RecentActivityFeed` avatars on the landing page (these are small activity items, not profile pictures)
- `FavoritesSection` avatars (character media thumbnails, not user profile pics)
- `AuthorProfileImage` component

## Component interface

```tsx
interface ExpandableProfileImageProps {
  user: UserProfileImageProps['user']  // same user shape as UserProfileImage
  size?: number
  showFallback?: boolean
  className?: string
}
```

The component resolves the full-size image URL internally (same logic as `UserProfileImage`), shows/hides the modal via `useHoverModal`, and delegates all avatar rendering to `UserProfileImage`.
