# Quotes List Page Fixes & Polish

**Date:** 2026-04-18

## Summary

Fix the broken character→quotes filter navigation, make quote cards show full text, update the hover modal to show context instead of the quote, and ensure client-side navigation correctly reflects character name in the filter badge.

## Changes

### 1. Fix filter param mismatch (`CharacterPageClient.tsx`)

`viewAllHref` passes `?character=<id>` but the quotes page reads `?characterId=<id>`. Change to `characterId`.

### 2. Fix dead quote links (`CharacterPageClient.tsx`)

`getHref` for individual quotes points to `/quotes/${q.id}` (no detail page). Change to `/quotes?characterId=${character.id}` so clicking any quote in the sidebar navigates to the character-filtered quotes list.

### 3. Fix stale `characterName` on client navigation (`QuotesPageContent.tsx`)

`useState(initialCharacterName)` ignores prop updates after mount. Add:
```tsx
useEffect(() => {
  setCharacterName(initialCharacterName ?? null)
}, [initialCharacterName])
```

### 4. Show full quote text in cards (`QuotesPageContent.tsx`)

- Remove `lineClamp={4}` from the quote text in `renderQuoteCard`
- Remove fixed `height: '240px'` from the Card; use `minHeight: '200px'` instead
- Remove the header `Badge` showing chapter (duplicate of footer); keep the footer vol/chapter line
- Update `skeletonCardHeight` from `240` to `300`

### 5. Modal: remove quote, show full context (`QuotesPageContent.tsx`)

In the `HoverModal`:
- Remove the decorative quote block (the `<Box>` with the `"` watermark and italic quote text)
- Remove `lineClamp={4}` from the context text so it displays in full
- Update fallback "No additional context" text to remain when context is absent

## Files changed

- `client/src/app/characters/[id]/CharacterPageClient.tsx` — items 1 & 2
- `client/src/app/quotes/QuotesPageContent.tsx` — items 3, 4, 5
