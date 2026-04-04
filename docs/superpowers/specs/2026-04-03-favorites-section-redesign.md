# Favorites Section Redesign

**Date:** 2026-04-03
**Status:** Approved
**Scope:** `FavoriteCharactersSection.tsx`, `FavoritesSection.tsx`

## Problem

Both sections use a 3-column grid where card content (character images, avatars) is too small relative to the card width. The wide cards feel hollow. Specifically:

- `FavoriteCharactersSection`: winner image is 44px, runner-up is 30px — tiny in a ~380px wide card
- `FavoritesSection` profile pic avatars: 34/28/24px for ranks 1/2/3 — same problem
- The overall visual hierarchy doesn't clearly communicate "this is #1, this is #2"

## Goals

1. Make character images more prominent — they should be the visual anchor of each card
2. Use the horizontal card width effectively
3. Maintain clear rank hierarchy (#1 stands out, #2 is secondary)
4. Keep the layout compact and readable — no extra vertical height

## Design Decisions

### FavoriteCharactersSection — Side-by-side portraits

Each of the 3 category cards (Most Favorited, Fan Favorite #1, Most Loyal) gets a 2-column inner grid showing #1 and #2 as portrait tiles side-by-side.

**#1 tile:**
- Image: 64px (up from 44px), square with `radius="sm"`
- Rank label: `#1` in `characterColor` above the image
- Name: 10px, `fw={700}`, white
- Stat: 9px, `subtleText`
- Background: `rgba(characterColor, 0.06)` with border `rgba(characterColor, 0.12)`, border-radius 8px

**#2 tile:**
- Image: 48px (up from 30px)
- Rank label: `#2` in `rgba(255,255,255,0.28)` above the image
- Name: 10px, `fw={500}`, `rgba(255,255,255,0.6)`
- Stat: 9px, `subtleText`
- `opacity: 0.45` on the whole tile, no background/border

**Removed:** The existing horizontal `Group` layout with winner row + runner-up row below.

### FavoritesSection Popular Content — Featured #1 + compact list

Each of the 3 content cards (Profile Pics, Quotes, Gambles) gets a featured #1 hero row, followed by slim compact rows for #2 and #3.

**#1 hero row (Profile Pics):**
- Avatar: 52px round (up from 34px), with `characterColor` border
- Name: 11px, `fw={700}`
- Sub-info: chapter number, 9px `subtleText`
- User count + `#1` badge aligned right
- Background: `rgba(card accent color, 0.06)` with matching border, `borderRadius: 7px`
- `marginBottom: 8px`

**#1 hero row (Quotes):**
- Quote text: 3-line clamp (up from 2), italic, `rgba(255,255,255,0.85)`
- Attribution + user count below the quote text
- Same accent background/border as other cards

**#1 hero row (Gambles):**
- Gamble name + rules (1-line clamp) + user count stacked vertically
- Same accent background/border

**#2 and #3 compact rows (all cards):**
- `padding: 4px 2px`, `borderBottom: 1px solid rgba(255,255,255,0.04)`
- Profile Pics: 28px avatar (#2), 22px avatar (#3)
- Quotes: truncated quote text (single line, no italics block)
- Gambles: truncated name, no rules shown
- Opacity: `0.45` for #2, `0.22` for #3
- User count right-aligned, 9px `subtleText`

## Files to Change

| File | Change |
|------|--------|
| `client/src/components/FavoriteCharactersSection.tsx` | Replace winner/runner-up stacked layout with side-by-side portrait pair grid |
| `client/src/components/FavoritesSection.tsx` | Replace uniform list rows with featured #1 hero row + compact #2/#3 rows for all 3 content cards |

## What Stays the Same

- 3-column grid structure for both sections (`Grid.Col span={{ base: 12, sm: 4 }}`)
- Top accent bar on character cards
- Category labels, icons, and card colors
- Motion animation on list items
- Link wrapping on all items
- Skeleton loading state structure
- Error and empty states
