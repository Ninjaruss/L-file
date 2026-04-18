# Quotes List Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the broken character→quotes filter navigation, show full quote text in cards, remove duplicate chapter info, update the hover modal to show full context instead of the quote text, and sync `characterName` on client-side navigation.

**Architecture:** All changes are contained in two client-side files. `CharacterPageClient.tsx` fixes two broken link hrefs. `QuotesPageContent.tsx` fixes the stale state bug, removes card height/lineClamp constraints, removes the duplicate chapter badge, and restructures the hover modal content.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Mantine UI

---

## File Map

| File | Change |
|------|--------|
| `client/src/app/characters/[id]/CharacterPageClient.tsx` | Fix `viewAllHref` param name; fix `getHref` to point to character-filtered list |
| `client/src/app/quotes/QuotesPageContent.tsx` | Fix stale `characterName`; remove fixed card height + `lineClamp`; remove duplicate chapter badge; restructure modal |

---

### Task 1: Fix character page quote links

**Files:**
- Modify: `client/src/app/characters/[id]/CharacterPageClient.tsx` (lines ~335–348)

- [ ] **Step 1: Open the file and locate the Quotes `RelatedContentSection`**

Find this block (around line 334):
```tsx
{quotes && quotes.length > 0 && (
  <RelatedContentSection
    entityType="quote"
    title="Quotes"
    items={quotes}
    previewCount={4}
    viewAllHref={`/quotes?character=${character.id}`}
    getKey={(q) => q.id}
    variant="compact"
    getLabel={(q) => q.text?.slice(0, 60) ?? '(quote)'}
    getHref={(q) => `/quotes/${q.id}`}
    itemDotColor={entityColors.quote}
  />
)}
```

- [ ] **Step 2: Fix both hrefs**

Replace the block above with:
```tsx
{quotes && quotes.length > 0 && (
  <RelatedContentSection
    entityType="quote"
    title="Quotes"
    items={quotes}
    previewCount={4}
    viewAllHref={`/quotes?characterId=${character.id}`}
    getKey={(q) => q.id}
    variant="compact"
    getLabel={(q) => q.text?.slice(0, 60) ?? '(quote)'}
    getHref={(q) => `/quotes?characterId=${character.id}`}
    itemDotColor={entityColors.quote}
  />
)}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd client && yarn build 2>&1 | grep -E "error|Error" | head -20
```
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/app/characters/[id]/CharacterPageClient.tsx
git commit -m "fix(quotes): correct character→quotes filter param and link hrefs"
```

---

### Task 2: Fix stale `characterName` on client navigation

**Files:**
- Modify: `client/src/app/quotes/QuotesPageContent.tsx`

The problem: `useState(initialCharacterName)` only uses the prop on first mount. When `router.push()` triggers a server re-render with a new `initialCharacterName`, the client state stays stale, so the filter badge shows a blank name.

- [ ] **Step 1: Add a sync effect after the existing `characterName` state declaration**

Find this block (around line 88):
```tsx
const [characterName, setCharacterName] = useState<string | null>(initialCharacterName)
const [characterId, setCharacterId] = useState<string | undefined>(initialCharacterId)
```

Add one `useEffect` immediately after those two lines:
```tsx
const [characterName, setCharacterName] = useState<string | null>(initialCharacterName)
const [characterId, setCharacterId] = useState<string | undefined>(initialCharacterId)

// Sync characterName when server re-renders with new initialCharacterName (client navigation)
useEffect(() => {
  setCharacterName(initialCharacterName ?? null)
}, [initialCharacterName])
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd client && yarn build 2>&1 | grep -E "error|Error" | head -20
```
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/app/quotes/QuotesPageContent.tsx
git commit -m "fix(quotes): sync characterName state when initialCharacterName prop updates"
```

---

### Task 3: Show full quote text in cards & remove duplicate chapter info

**Files:**
- Modify: `client/src/app/quotes/QuotesPageContent.tsx`

Currently cards have a fixed `height: '240px'`, `lineClamp={4}` on the quote text, and a chapter badge in the header that duplicates the vol/chapter footer. All three need fixing.

- [ ] **Step 1: Fix the Card container — remove fixed height, add minHeight**

Find the `<Card` component in `renderQuoteCard` (around line 235):
```tsx
<Card
  withBorder
  radius="lg"
  shadow="sm"
  padding="md"
  className="hoverable-card hoverable-card-quote"
  style={{
    height: '240px',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: cardBgColor,
  }}
```

Change the style to:
```tsx
  style={{
    minHeight: '200px',
    cursor: 'pointer',
    position: 'relative',
    backgroundColor: cardBgColor,
  }}
```

- [ ] **Step 2: Remove lineClamp from the quote text**

Find this block inside `renderQuoteCard` (around line 277):
```tsx
<Text
  size="lg"
  lineClamp={4}
  ta="center"
  fw={600}
  style={{
    fontStyle: 'italic',
    lineHeight: 1.3,
    fontSize: rem(17),
    color: textColors.primary
  }}
>
  &quot;{quote.text}&quot;
</Text>
```

Remove the `lineClamp={4}` prop:
```tsx
<Text
  size="lg"
  ta="center"
  fw={600}
  style={{
    fontStyle: 'italic',
    lineHeight: 1.3,
    fontSize: rem(17),
    color: textColors.primary
  }}
>
  &quot;{quote.text}&quot;
</Text>
```

- [ ] **Step 3: Remove the duplicate chapter badge from the card header**

Find the Header section (around line 264):
```tsx
{/* Header */}
<Group justify="space-between" align="flex-start">
  <Group gap="xs" wrap="wrap">
    {quote.chapter && (
      <Badge color="gray" variant={grayBadgeVariant as any} size="md">
        Ch. {quote.chapter}
      </Badge>
    )}
  </Group>
  <Quote size={20} color={accentQuote} />
</Group>
```

Remove the inner chapter badge group, keeping only the icon:
```tsx
{/* Header */}
<Group justify="flex-end" align="flex-start">
  <Quote size={20} color={accentQuote} />
</Group>
```

- [ ] **Step 4: Update skeletonCardHeight**

Find the `ListPageLayout` usage at the bottom of the return (around line 393):
```tsx
skeletonCardWidth={280}
skeletonCardHeight={240}
```

Change to:
```tsx
skeletonCardWidth={280}
skeletonCardHeight={300}
```

- [ ] **Step 5: Remove the touch device hint (no longer needed with dynamic height)**

Find and remove this block (around line 347):
```tsx
{/* Touch device hint */}
{isTouchDevice && hoveredQuote?.id !== quote.id && (
  <Text
    size="xs"
    c="dimmed"
    ta="center"
    style={{ fontSize: rem(10), opacity: 0.7 }}
  >
    Tap to preview
  </Text>
)}
```

- [ ] **Step 6: Verify TypeScript**

```bash
cd client && yarn build 2>&1 | grep -E "error|Error" | head -20
```
Expected: no new errors.

- [ ] **Step 7: Commit**

```bash
git add client/src/app/quotes/QuotesPageContent.tsx
git commit -m "fix(quotes): show full quote text, remove fixed card height, remove duplicate chapter badge"
```

---

### Task 4: Update hover modal — remove quote, show full context

**Files:**
- Modify: `client/src/app/quotes/QuotesPageContent.tsx`

The modal currently shows: speaker → quote text → context → location → tags. Remove the quote text block; show full context (no lineClamp).

- [ ] **Step 1: Remove the decorative quote block from the modal**

Inside the `<HoverModal>` content (around line 440), find and remove this entire `<Box>`:
```tsx
<Box style={{ position: 'relative' }}>
  <Text
    aria-hidden
    style={{
      position: 'absolute',
      top: -8,
      left: -4,
      fontSize: '4rem',
      fontFamily: 'var(--font-opti-goudy-text), serif',
      color: 'rgba(32, 201, 151, 0.12)',
      lineHeight: 1,
      pointerEvents: 'none',
      userSelect: 'none',
    }}
  >&quot;</Text>
  <Text
    size="sm"
    ta="center"
    lineClamp={4}
    fs="italic"
    style={{ lineHeight: 1.4, paddingTop: rem(8), paddingLeft: rem(12), paddingRight: rem(12) }}
  >
    &ldquo;{hoveredQuote.text}&rdquo;
  </Text>
</Box>
```

- [ ] **Step 2: Remove lineClamp from the context block**

Find the context block in the modal (around line 466):
```tsx
{hoveredQuote.context && (
  <Box>
    <Text size="xs" fw={600} style={{ color: theme.colors.gray[6] }} mb={4} ta="center">
      Context
    </Text>
    <Text
      size="sm"
      c={textColors.primary}
      ta="center"
      lineClamp={4}
      style={{ lineHeight: 1.4, fontWeight: 500 }}
    >
      {hoveredQuote.context}
    </Text>
  </Box>
)}
```

Remove `lineClamp={4}`:
```tsx
{hoveredQuote.context && (
  <Box>
    <Text size="xs" fw={600} style={{ color: theme.colors.gray[6] }} mb={4} ta="center">
      Context
    </Text>
    <Text
      size="sm"
      c={textColors.primary}
      ta="center"
      style={{ lineHeight: 1.4, fontWeight: 500 }}
    >
      {hoveredQuote.context}
    </Text>
  </Box>
)}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd client && yarn build 2>&1 | grep -E "error|Error" | head -20
```
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/app/quotes/QuotesPageContent.tsx
git commit -m "fix(quotes): remove quote text from hover modal, show full context"
```

---

### Task 5: Final verification

- [ ] **Step 1: Full build check**

```bash
cd client && yarn build 2>&1 | tail -20
```
Expected: `✓ Compiled successfully` or similar, no TypeScript errors.

- [ ] **Step 2: Lint check**

```bash
cd client && yarn lint 2>&1 | grep -E "error|warning" | head -20
```
Expected: no new errors.

- [ ] **Step 3: Manual smoke test checklist**

With dev server running (`cd client && yarn dev`):

1. Go to `/characters/<id>` for a character with quotes — verify the sidebar quote items and "View all" both link to `/quotes?characterId=<id>` (not `?character=` or `/quotes/<id>`)
2. Click one of those links — verify the quotes list loads filtered by that character with the character name in the filter badge
3. On `/quotes?characterId=<id>`, verify the filter badge shows the character name (not blank)
4. Click "×" on the filter badge — verify it clears and shows all quotes
5. On `/quotes`, verify quote cards show full text (no truncation)
6. Verify no chapter badge in the card header — chapter/volume only appears in the footer
7. Hover a quote card — verify modal shows speaker + context (full, untruncated) + location/tags, but NOT the quote text
8. On a quote with no context, verify modal shows "No additional context available"
