# Favorites Section Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make character images more prominent and better utilize horizontal card width in `FavoriteCharactersSection` and `FavoritesSection`.

**Architecture:** Two self-contained UI changes — no API, no new files, no new dependencies. `FavoriteCharactersSection` gets a side-by-side portrait grid inside each category card. `FavoritesSection`'s three content cards get a featured #1 hero row plus compact #2/#3 rows beneath.

**Tech Stack:** React 19, Next.js 15 App Router, Mantine UI, Tailwind CSS 4, TypeScript, Lucide icons, motion/react

---

## File Map

| File | Change |
|------|--------|
| `client/src/components/FavoriteCharactersSection.tsx` | Replace winner/runner-up stacked rows with side-by-side portrait tile grid |
| `client/src/components/FavoritesSection.tsx` | Replace uniform list rows with featured #1 hero row + compact #2/#3 rows for all 3 content cards |

---

## Task 1: FavoriteCharactersSection — side-by-side portrait tiles

**Files:**
- Modify: `client/src/components/FavoriteCharactersSection.tsx`

Context: The `renderCategory` function currently renders a winner row (44px image) stacked above a runner-up row (30px image). We replace this with a 2-column CSS grid of portrait tiles — #1 at 64px with accent background, #2 at 48px dimmed with no background.

- [ ] **Step 1: Replace the winner/runner-up block inside `renderCategory`**

Open `client/src/components/FavoriteCharactersSection.tsx`.

Find the block that starts with `{items.length > 0 ? (` and replace the entire `motion.div` content (winner row + runner-up row) with the side-by-side portrait grid. The final `renderCategory` function body should look like this:

```tsx
const renderCategory = (
  items: Array<{ character: { id: number; name: string; entityImageUrl?: string | null }; [key: string]: any }>,
  getLabel: (item: any) => string,
  title: string,
  icon: React.ReactNode,
  delay: number,
) => (
  <Grid.Col span={{ base: 12, sm: 4 }}>
    <Box
      style={{
        backgroundColor: softSurface,
        border: `1px solid ${borderColor}`,
        borderRadius: '0.625rem',
        padding: '0.875rem 0.75rem 0.625rem',
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
      }}
    >
      {/* Top accent bar */}
      <Box aria-hidden style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: withAlpha(characterColor, 0.45, 'rgba(59,130,246,0.45)'),
        borderRadius: '0.625rem 0.625rem 0 0',
      }} />

      {/* Category heading */}
      <Group justify="center" gap={5} style={{ marginBottom: '0.625rem' }}>
        {icon}
        <Text style={{
          fontSize: '0.625rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: subtleText,
        }}>
          {title}
        </Text>
      </Group>

      {items.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay }}
        >
          <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {/* #1 portrait tile */}
            <Link
              href={`/characters/${items[0].character.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Box style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.3125rem',
                padding: '0.5rem 0.375rem 0.625rem',
                background: withAlpha(characterColor, 0.06, 'rgba(59,130,246,0.06)'),
                border: `1px solid ${withAlpha(characterColor, 0.12, 'rgba(59,130,246,0.12)')}`,
                borderRadius: '0.5rem',
                textAlign: 'center',
                cursor: 'pointer',
              }}>
                <Text style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.08em', color: characterColor }}>#1</Text>
                {renderCharacterImage(items[0].character.entityImageUrl, items[0].character.name, 64)}
                <Text fw={700} style={{ fontSize: '0.625rem', color: '#fff', lineHeight: 1.2, marginTop: '0.25rem' }}>
                  {items[0].character.name}
                </Text>
                <Text style={{ fontSize: '0.5625rem', color: subtleText }}>
                  {getLabel(items[0])}
                </Text>
              </Box>
            </Link>

            {/* #2 portrait tile */}
            {items[1] ? (
              <Link
                href={`/characters/${items[1].character.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Box style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.3125rem',
                  padding: '0.5rem 0.375rem 0.625rem',
                  opacity: 0.45,
                  textAlign: 'center',
                  cursor: 'pointer',
                }}>
                  <Text style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.28)' }}>#2</Text>
                  <Box style={{ marginTop: '0.5rem' }}>
                    {renderCharacterImage(items[1].character.entityImageUrl, items[1].character.name, 48)}
                  </Box>
                  <Text style={{ fontSize: '0.625rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)', lineHeight: 1.2, marginTop: '0.5rem' }}>
                    {items[1].character.name}
                  </Text>
                  <Text style={{ fontSize: '0.5625rem', color: subtleText }}>
                    {getLabel(items[1])}
                  </Text>
                </Box>
              </Link>
            ) : (
              <Box style={{ opacity: 0.2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text size="xs" style={{ color: subtleText }}>—</Text>
              </Box>
            )}
          </Box>
        </motion.div>
      ) : (
        <Text size="sm" style={{ color: subtleText, textAlign: 'center', padding: '0.5rem 0' }}>
          Not enough data yet
        </Text>
      )}
    </Box>
  </Grid.Col>
)
```

- [ ] **Step 2: Verify build passes**

```bash
cd client && yarn build 2>&1 | tail -20
```

Expected: No TypeScript errors. Build may warn about other things but must not error on `FavoriteCharactersSection.tsx`.

- [ ] **Step 3: Verify lint passes**

```bash
cd client && yarn lint 2>&1 | grep -E "FavoriteCharactersSection|error" | head -20
```

Expected: No lint errors on `FavoriteCharactersSection.tsx`.

- [ ] **Step 4: Commit**

```bash
cd client && git add src/components/FavoriteCharactersSection.tsx
git commit -m "feat: side-by-side portrait tiles in FavoriteCharactersSection

Replace stacked winner/runner-up rows with a 2-column portrait grid.
#1 tile: 64px image with accent background. #2 tile: 48px image, dimmed.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 2: FavoritesSection — featured #1 hero row + compact sub-rows

**Files:**
- Modify: `client/src/components/FavoritesSection.tsx`

Context: The three content cards (Popular Profile Pics, Top Quotes, Top Gambles) each render their items with a uniform `.map()` loop with opacity fade by index. We replace each loop with an explicit featured #1 block followed by compact rows for items at index 1 and 2.

### 2a — Popular Profile Pics card

- [ ] **Step 5: Replace the Profile Pics item map**

In `FavoritesSection.tsx`, find the `{/* Popular Profile Pics */}` card. Inside the `Card`, replace the entire `{favoriteCharacterMedia.map(...)` block with:

```tsx
{/* Featured #1 */}
{favoriteCharacterMedia[0] && (
  <motion.div
    initial={{ opacity: 0, x: -12 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.25, delay: 0 }}
  >
    <Link href={`/characters/${favoriteCharacterMedia[0].media.character.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <Box style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '0.5rem',
        background: withAlpha(theme.other?.usogui?.character || theme.colors.blue?.[6] || accent, 0.06, 'rgba(59,130,246,0.06)'),
        border: `1px solid ${withAlpha(theme.other?.usogui?.character || theme.colors.blue?.[6] || accent, 0.15, 'rgba(59,130,246,0.15)')}`,
        borderRadius: '0.4375rem',
        marginBottom: '0.5rem',
      }}>
        <Avatar
          src={favoriteCharacterMedia[0].media.url}
          alt={favoriteCharacterMedia[0].media.character.name}
          size={52}
          radius="xl"
          style={{ border: `1px solid ${withAlpha(theme.other?.usogui?.character || theme.colors.blue?.[6] || accent, 0.3, 'rgba(59,130,246,0.3)')}`, flexShrink: 0 }}
        />
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text fw={700} style={{ fontSize: '0.6875rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {favoriteCharacterMedia[0].media.character.name}
          </Text>
          <Text style={{ fontSize: '0.625rem', color: subtleText }}>
            Ch. {favoriteCharacterMedia[0].media.chapterNumber || 'N/A'}
          </Text>
        </Box>
        <Box style={{ textAlign: 'right', flexShrink: 0 }}>
          <Text style={{ fontSize: '0.5625rem', color: subtleText, marginBottom: 2 }}>
            {favoriteCharacterMedia[0].userCount} user{favoriteCharacterMedia[0].userCount !== 1 ? 's' : ''}
          </Text>
          <Text style={{ fontSize: '0.5625rem', color: theme.other?.usogui?.character || theme.colors.blue?.[6] || accent, fontWeight: 700, background: withAlpha(theme.other?.usogui?.character || theme.colors.blue?.[6] || accent, 0.12, 'rgba(59,130,246,0.12)'), border: `1px solid ${withAlpha(theme.other?.usogui?.character || theme.colors.blue?.[6] || accent, 0.25, 'rgba(59,130,246,0.25)')}`, borderRadius: '0.25rem', padding: '1px 5px' }}>
            #1
          </Text>
        </Box>
      </Box>
    </Link>
  </motion.div>
)}

{/* Compact #2 and #3 */}
{favoriteCharacterMedia.slice(1).map((item, idx) => (
  <motion.div
    key={item.media.id}
    initial={{ opacity: 0, x: -12 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.25, delay: (idx + 1) * 0.06 }}
  >
    <Box style={{
      borderBottom: idx === favoriteCharacterMedia.slice(1).length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
      padding: '0.25rem 0.125rem',
      opacity: idx === 0 ? 0.45 : 0.22,
    }}>
      <Link href={`/characters/${item.media.character.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <Group gap={7} wrap="nowrap">
          <Avatar
            src={item.media.url}
            alt={item.media.character.name}
            size={idx === 0 ? 28 : 22}
            radius="xl"
            style={{ border: `1px solid ${withAlpha(theme.other?.usogui?.character || theme.colors.blue?.[6] || accent, 0.3, 'rgba(59,130,246,0.3)')}`, flexShrink: 0 }}
          />
          <Text style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.65)', fontWeight: 500, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.media.character.name}
          </Text>
          <Text style={{ fontSize: '0.5625rem', color: subtleText, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {item.userCount}
          </Text>
        </Group>
      </Link>
    </Box>
  </motion.div>
))}
```

### 2b — Top Quotes card

- [ ] **Step 6: Replace the Top Quotes item map**

Find the `{/* Top Quotes */}` card. Replace the entire `{favoriteQuotes.map(...)` block with:

```tsx
{/* Featured #1 */}
{favoriteQuotes[0] && (
  <motion.div
    initial={{ opacity: 0, x: -12 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.25, delay: 0 }}
  >
    <Box style={{
      padding: '0.5625rem 0.625rem',
      background: withAlpha(theme.other?.usogui?.quote || theme.colors.green?.[5] || '#4ade80', 0.06, 'rgba(81,207,102,0.06)'),
      border: `1px solid ${withAlpha(theme.other?.usogui?.quote || theme.colors.green?.[5] || '#4ade80', 0.15, 'rgba(81,207,102,0.15)')}`,
      borderRadius: '0.4375rem',
      marginBottom: '0.5rem',
    }}>
      <Link href={`/characters/${favoriteQuotes[0].quote.character.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <Text
          style={{
            fontStyle: 'italic',
            fontSize: '0.6875rem',
            color: 'rgba(255,255,255,0.88)',
            lineHeight: 1.55,
            marginBottom: '0.375rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            fontFamily: 'var(--font-opti-goudy-text)',
          }}
        >
          "{favoriteQuotes[0].quote.text}"
        </Text>
        <Group justify="space-between" align="center">
          <Text style={{ fontSize: '0.625rem', color: subtleText }}>
            — {favoriteQuotes[0].quote.character.name}
          </Text>
          <Text style={{ fontSize: '0.5625rem', color: subtleText }}>
            {favoriteQuotes[0].userCount} user{favoriteQuotes[0].userCount !== 1 ? 's' : ''}
          </Text>
        </Group>
      </Link>
    </Box>
  </motion.div>
)}

{/* Compact #2 and #3 */}
{favoriteQuotes.slice(1).map((item, idx) => (
  <motion.div
    key={item.quote.id}
    initial={{ opacity: 0, x: -12 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.25, delay: (idx + 1) * 0.06 }}
  >
    <Box style={{
      borderBottom: idx === favoriteQuotes.slice(1).length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
      padding: '0.25rem 0.125rem',
      opacity: idx === 0 ? 0.45 : 0.22,
    }}>
      <Link href={`/characters/${item.quote.character.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <Group justify="space-between" align="center" gap={4} wrap="nowrap">
          <Text
            style={{
              fontStyle: 'italic',
              fontSize: '0.625rem',
              color: 'rgba(255,255,255,0.7)',
              flex: 1,
              minWidth: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            "{item.quote.text}"
          </Text>
          <Text style={{ fontSize: '0.5625rem', color: subtleText, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {item.userCount}
          </Text>
        </Group>
      </Link>
    </Box>
  </motion.div>
))}
```

### 2c — Top Gambles card

- [ ] **Step 7: Replace the Top Gambles item map**

Find the `{/* Top Gambles */}` card. Replace the entire `{favoriteGambles.map(...)` block with:

```tsx
{/* Featured #1 */}
{favoriteGambles[0] && (
  <motion.div
    initial={{ opacity: 0, x: -12 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.25, delay: 0 }}
  >
    <Link href={`/gambles/${favoriteGambles[0].gamble.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <Box style={{
        padding: '0.5625rem 0.625rem',
        background: withAlpha(theme.other?.usogui?.gamble || accent, 0.05, 'rgba(225,29,72,0.05)'),
        border: `1px solid ${withAlpha(theme.other?.usogui?.gamble || accent, 0.14, 'rgba(225,29,72,0.14)')}`,
        borderRadius: '0.4375rem',
        marginBottom: '0.5rem',
      }}>
        <Text fw={700} style={{
          fontSize: '0.6875rem',
          color: '#fff',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: 2,
        }}>
          <span aria-hidden style={{ color: 'rgba(225,29,72,0.5)', marginRight: '0.25em' }}>♠</span>
          {favoriteGambles[0].gamble.name}
        </Text>
        {favoriteGambles[0].gamble.rules && (
          <Text style={{
            fontSize: '0.625rem',
            color: subtleText,
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            marginBottom: '0.3125rem',
          }}>
            {favoriteGambles[0].gamble.rules}
          </Text>
        )}
        <Text style={{ fontSize: '0.5625rem', color: subtleText }}>
          {favoriteGambles[0].userCount} user{favoriteGambles[0].userCount !== 1 ? 's' : ''}
        </Text>
      </Box>
    </Link>
  </motion.div>
)}

{/* Compact #2 and #3 */}
{favoriteGambles.slice(1).map((item, idx) => (
  <motion.div
    key={item.gamble.id}
    initial={{ opacity: 0, x: -12 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.25, delay: (idx + 1) * 0.06 }}
  >
    <Box style={{
      borderBottom: idx === favoriteGambles.slice(1).length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
      padding: '0.25rem 0.125rem',
      opacity: idx === 0 ? 0.45 : 0.22,
    }}>
      <Link href={`/gambles/${item.gamble.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <Group justify="space-between" align="center" gap={6} wrap="nowrap">
          <Text style={{
            fontSize: '0.625rem',
            color: 'rgba(255,255,255,0.65)',
            fontWeight: 500,
            flex: 1,
            minWidth: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            <span aria-hidden style={{ color: 'rgba(225,29,72,0.4)', marginRight: '0.2em' }}>♠</span>
            {item.gamble.name}
          </Text>
          <Text style={{ fontSize: '0.5625rem', color: subtleText, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {item.userCount}
          </Text>
        </Group>
      </Link>
    </Box>
  </motion.div>
))}
```

- [ ] **Step 8: Verify build passes**

```bash
cd client && yarn build 2>&1 | tail -20
```

Expected: No TypeScript errors on `FavoritesSection.tsx`.

- [ ] **Step 9: Verify lint passes**

```bash
cd client && yarn lint 2>&1 | grep -E "FavoritesSection|error" | head -20
```

Expected: No lint errors on `FavoritesSection.tsx`.

- [ ] **Step 10: Commit**

```bash
git add client/src/components/FavoritesSection.tsx
git commit -m "feat: featured #1 hero row + compact sub-rows in FavoritesSection

Profile Pics: 52px featured avatar for #1. Quotes: 3-line clamp hero block.
Gambles: name+rules+count hero block. #2/#3 become slim compact rows with
opacity 0.45/0.22 respectively.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Visual Verification Checklist

After both tasks, run `cd client && yarn dev` and open `http://localhost:3000`. Check:

- [ ] Fan Favorite Characters: each category card shows two portrait tiles side by side, not stacked rows
- [ ] #1 tile has accent background, 64px image, `#1` label in blue
- [ ] #2 tile has no background, 48px image, dimmed (~45% opacity)
- [ ] Popular Profile Pics: #1 has a 52px round avatar in a highlighted box; #2/#3 are compact rows
- [ ] Top Quotes: #1 quote shows up to 3 lines in an accent box; #2/#3 are truncated single-line rows
- [ ] Top Gambles: #1 gamble shows name + rules + count in an accent box; #2/#3 are truncated name-only rows
- [ ] All items are still clickable links
- [ ] No layout overflow or text clipping on a 1280px viewport
- [ ] Section still renders correctly on mobile (each card stacks to full width)
