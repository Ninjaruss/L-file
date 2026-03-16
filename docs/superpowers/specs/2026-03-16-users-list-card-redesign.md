# Users List Page — Card Redesign

**Date:** 2026-03-16
**Status:** Approved
**Scope:** `client/src/app/users/UsersPageContent.tsx` only

---

## Problem

The current user cards are cramped and visually flat. At 5 columns on desktop, cards are ~200px wide with a 56px avatar, minimal breathing room, and no visual personality. Reading progress is displayed as plain text (`Ch. 0`) with no styling. The overall card lacks hierarchy and presence.

## Goal

Redesign the user card to be taller, more spacious, and more visually distinctive — while keeping the same data, components, and page infrastructure intact.

---

## Design Decisions

| Question | Decision |
|---|---|
| Card layout direction | Portrait (centered, stacked vertically) |
| Card decoration | 4px purple gradient strip at top edge |
| Avatar size | 72px (up from 56px) |
| Grid max columns | 4 on `lg`/`xl` (down from 5 on `xl`) |
| Progress display | Styled pill badge: `Ch. 314` — no bar, no fraction |
| Join date | Not shown on card |

---

## Card Structure

The `Card` component retains `...getCardStyles(theme, accentCommunity)` in its `style` prop (provides `background`, `border`, `borderRadius`, `backdropFilter`, `transition`). Add `padding: 0`, `overflow: 'hidden'`, `height: '100%'`, `minHeight: rem(220)`, `position: 'relative'`, `textDecoration: 'none'`, and `cursor: 'pointer'` alongside it. The Mantine `padding` prop on `Card` is not used (set to `padding={0}`).

The card has three direct children in this order:

1. **Accent strip** — `<Box>` with `height: 4px`, `background: 'linear-gradient(90deg, #7c3aed, #a855f7, #c084fc)'`, `width: '100%'`, flush to card top edge.
2. **Role chip** — `<Badge>` absolutely positioned at `top: rem(14)` (accounting for the 4px strip), `right: rem(10)`, `zIndex: 10`. Rendered only when `user.role === 'admin'` or `user.role === 'moderator'`. Admin: `backgroundColor: 'rgba(225,29,72,0.15)'`, `border: '1px solid rgba(225,29,72,0.4)'`, `color: '#e11d48'`, text `"Admin"`. Moderator: `backgroundColor: 'rgba(77,171,247,0.12)'`, `border: '1px solid rgba(77,171,247,0.35)'`, `color: '#4dabf7'`, text `"Mod"`. Not rendered for `user` role.
3. **Inner content `Box`** — `padding="md"`, containing a `Stack` with `gap="xs"`, `align="center"`, `style={{ height: '100%' }}`. Inside the Stack, top-to-bottom:
   - **Avatar** — `UserProfileImage` at `size={72}`, `showFallback`, with `style={{ boxShadow: '0 0 0 3px rgba(168,85,247,0.2)' }}` for the glow ring
   - **Username** — `Text` with `fw={700}`, `c={accentCommunity}`, `size="sm"`, `lineClamp={1}`, `ta="center"`, `title={user.username}` for tooltip on truncation
   - **`UserRoleDisplay`** — unchanged, `userRole={user.role}`, `customRole={user.customRole}`, `size="small"`, `spacing={0.5}`
   - **`UserBadges`** — unchanged, `userId={user.id}`, `size="sm"`, `maxDisplay={3}`
   - **Chapter badge** — `Text` with `mt="auto"`, `ta="center"`. Styled inline: `background: 'rgba(168,85,247,0.1)'`, `border: '1px solid rgba(168,85,247,0.3)'`, `color: accentCommunity`, `borderRadius: rem(20)`, `padding: '3px 12px'`, `fontFamily: 'monospace'`, `fontSize: rem(11)`. Always rendered — when `userProgress` is `0`, `null`, or `undefined` it displays `Ch. 0`. The badge is never hidden.

---

## Grid Change

```tsx
// Before
<SimpleGrid cols={{ base: 1, xs: 2, sm: 2, md: 3, lg: 4, xl: 5 }} spacing={rem(20)}>

// After
<SimpleGrid cols={{ base: 1, xs: 2, sm: 2, md: 3, lg: 4, xl: 4 }} spacing={rem(20)}>
```

Only the `xl` value changes from `5` to `4`.

---

## Skeleton Update

The `CardGridSkeleton` call passes `cardHeight`. Update from `160` to `220` to match the taller portrait cards:

```tsx
// Before
<CardGridSkeleton count={12} cardWidth={280} cardHeight={160} accentColor={accentCommunity} />

// After
<CardGridSkeleton count={12} cardWidth={280} cardHeight={220} accentColor={accentCommunity} />
```

---

## What Does NOT Change

- `ListPageHero`, `SearchToolbar`, `PaginationBar` — untouched
- `UserProfileImage`, `UserBadges`, `UserRoleDisplay` — same components, only avatar `size` prop increases
- All hover/entry motion animations (`y: -3` hover lift, stagger `index * 0.02`, `pageEnter`)
- Cache, pagination, search, sort, URL sync logic
- Backend API — no changes

---

## Implementation

**Single file:** `client/src/app/users/UsersPageContent.tsx`

Changes:
1. Update `SimpleGrid` `cols` prop: `xl: 5 → xl: 4`
2. Update `CardGridSkeleton` `cardHeight`: `160 → 220`
3. Replace the `<Card>` JSX block with the new portrait+strip card layout described above
