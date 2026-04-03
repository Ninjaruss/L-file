# Community Favorites Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the Community Favorites section height by ~40–50% by replacing large stacked avatar layouts with horizontal podium rows and replacing nested sub-cards with slim list items.

**Architecture:** Two component files change independently. `FavoriteCharactersSection` gets a new horizontal "winner + runner-up" row layout inside `renderCategory`. `FavoritesSection` gets slim `div`-based list items instead of nested `<Card>` components for the three content columns, plus tighter grid/spacing.

**Tech Stack:** React 19, TypeScript, Mantine UI v7, `motion/react`, Tailwind CSS 4, Next.js 15 App Router.

---

## File Map

| File | Change |
|---|---|
| `client/src/components/FavoriteCharactersSection.tsx` | Replace stacked winner/runner-up with horizontal podium row layout; remove full sub-heading; add quiet subsection label |
| `client/src/components/FavoritesSection.tsx` | Replace nested `<Card>` sub-items with slim list items; change grid gutter; add subsection divider; adjust spacing |

---

### Task 1: Redesign FavoriteCharactersSection

**Files:**
- Modify: `client/src/components/FavoriteCharactersSection.tsx`

- [ ] **Step 1: Replace `renderCategory` with horizontal podium layout**

Open `client/src/components/FavoriteCharactersSection.tsx` and replace the entire `renderCategory` function and the `return` block with the following. The key changes are:
  - Remove the full "Fan Favorite Characters" section heading (Title + Heart icon + description) from the `return` block — it will be replaced by a quiet label in `FavoritesSection`
  - `renderCategory` now produces a horizontal winner row (44px image left, name/stat center, `#1` badge right) plus a slim runner-up row below at 55% opacity

Replace the full file content with:

```tsx
'use client'

import {
  Box,
  Text,
  Grid,
  Badge,
  Group,
  Avatar,
  Image,
  useMantineTheme,
  rgba
} from '@mantine/core'
import { getEntityThemeColor } from '../lib/mantine-theme'
import { Crown, Trophy, Heart, User } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { FavoriteCharacterStats } from '../hooks/useFavoritesData'

interface Props {
  data: FavoriteCharacterStats
}

export function FavoriteCharactersSection({ data }: Props) {
  const theme = useMantineTheme()
  const accent = theme.other?.usogui?.red || theme.colors.red[5]
  const surface = theme.other?.usogui?.black || '#0a0a0a'
  const characterColor = theme.other?.usogui?.character || theme.colors.blue?.[6] || accent

  const withAlpha = (color: string, alpha: number, fallback: string) => {
    try {
      return rgba(color, alpha)
    } catch {
      return fallback
    }
  }

  const borderColor = withAlpha(characterColor, 0.14, 'rgba(59, 130, 246, 0.14)')
  const softSurface = withAlpha(surface, 0.92, surface)
  const subtleText = withAlpha('#ffffff', 0.45, 'rgba(255, 255, 255, 0.45)')

  const { mostFavorited, mostPrimary, mostLoyal } = data
  const hasAnyData = mostFavorited.length > 0 || mostPrimary.length > 0 || mostLoyal.length > 0

  const renderCharacterImage = (
    entityImageUrl: string | null | undefined,
    name: string,
    size: number,
  ) => {
    if (entityImageUrl) {
      return (
        <Image
          src={entityImageUrl}
          alt={name}
          w={size}
          h={size}
          radius="sm"
          fit="cover"
          style={{ border: `1px solid ${borderColor}`, flexShrink: 0 }}
        />
      )
    }
    return (
      <Avatar
        size={size}
        radius="sm"
        color="blue"
        style={{ border: `1px solid ${borderColor}`, flexShrink: 0 }}
      >
        <User size={Math.round(size * 0.4)} />
      </Avatar>
    )
  }

  const renderCategory = (
    items: Array<{ character: { id: number; name: string; entityImageUrl?: string | null }; [key: string]: any }>,
    getLabel: (item: any) => string,
    title: string,
    icon: React.ReactNode,
    delay: number,
  ) => (
    <Grid.Col span={{ base: 12, md: 4 }}>
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
            {/* Winner row */}
            <Link
              href={`/characters/${items[0].character.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Group
                gap={10}
                wrap="nowrap"
                style={{
                  padding: '0.5rem',
                  background: withAlpha(characterColor, 0.06, 'rgba(59,130,246,0.06)'),
                  border: `1px solid ${withAlpha(characterColor, 0.15, 'rgba(59,130,246,0.15)')}`,
                  borderRadius: '0.4375rem',
                  marginBottom: '0.375rem',
                  cursor: 'pointer',
                }}
              >
                {renderCharacterImage(items[0].character.entityImageUrl, items[0].character.name, 44)}
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    fw={700}
                    style={{
                      fontSize: '0.75rem',
                      color: '#fff',
                      lineHeight: 1.2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {items[0].character.name}
                  </Text>
                  <Text style={{ fontSize: '0.625rem', color: subtleText, marginTop: 2 }}>
                    {getLabel(items[0])}
                  </Text>
                </Box>
                <Badge
                  variant="light"
                  size="xs"
                  style={{
                    color: getEntityThemeColor(theme, 'character'),
                    flexShrink: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  #1
                </Badge>
              </Group>
            </Link>

            {/* Runner-up row */}
            {items[1] && (
              <Link
                href={`/characters/${items[1].character.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <Group
                  gap={8}
                  wrap="nowrap"
                  style={{
                    padding: '0.3125rem 0.5rem',
                    borderRadius: '0.375rem',
                    opacity: 0.55,
                    cursor: 'pointer',
                  }}
                >
                  {renderCharacterImage(items[1].character.entityImageUrl, items[1].character.name, 30)}
                  <Text
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.7)',
                      flex: 1,
                      minWidth: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {items[1].character.name}
                  </Text>
                  <Text style={{ fontSize: '0.625rem', color: subtleText, whiteSpace: 'nowrap' }}>
                    {getLabel(items[1])}
                  </Text>
                </Group>
              </Link>
            )}
          </motion.div>
        ) : (
          <Text size="sm" style={{ color: subtleText, textAlign: 'center', padding: '0.5rem 0' }}>
            Not enough data yet
          </Text>
        )}
      </Box>
    </Grid.Col>
  )

  if (!hasAnyData) {
    return (
      <Box style={{ textAlign: 'center', padding: '1rem 0', marginBottom: '1rem' }}>
        <Text size="sm" style={{ color: subtleText }}>
          No character favorites yet. Set your favorites in your profile!
        </Text>
      </Box>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.9 }}
    >
      <Grid gutter="md">
        {renderCategory(
          mostFavorited,
          (item) => `${item.totalCount} fan${item.totalCount !== 1 ? 's' : ''}`,
          'Most Favorited',
          <Trophy size={12} color={characterColor} />,
          0.1,
        )}
        {renderCategory(
          mostPrimary,
          (item) => `${item.primaryCount} #1 pick${item.primaryCount !== 1 ? 's' : ''}`,
          'Fan Favorite #1',
          <Crown size={12} color={characterColor} />,
          0.2,
        )}
        {renderCategory(
          mostLoyal,
          (item) => `${Math.round(item.loyaltyRatio * 100)}% chose as #1`,
          'Most Loyal',
          <Heart size={12} color={characterColor} />,
          0.3,
        )}
      </Grid>
    </motion.div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/ninjaruss/Documents/GitHub/usogui-fansite/client && yarn build 2>&1 | grep -E "error|warning|✓" | head -30
```

Expected: no TypeScript errors in `FavoriteCharactersSection.tsx`. Build may fail on other unrelated issues — focus only on this file.

- [ ] **Step 3: Commit**

```bash
cd /Users/ninjaruss/Documents/GitHub/usogui-fansite
git add client/src/components/FavoriteCharactersSection.tsx
git commit -m "feat: compact horizontal podium layout for FavoriteCharactersSection"
```

---

### Task 2: Redesign FavoritesSection content cards

**Files:**
- Modify: `client/src/components/FavoritesSection.tsx`

- [ ] **Step 1: Update FavoritesSection**

Replace the full file content of `client/src/components/FavoritesSection.tsx` with:

```tsx
'use client'

import React from 'react'
import {
  Box,
  Card,
  Text,
  Grid,
  Avatar,
  Stack,
  Skeleton,
  Alert,
  Group,
  useMantineTheme,
  rgba
} from '@mantine/core'
import { Quote, Dices, User } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { useFavoritesData } from '../hooks/useFavoritesData'
import { FavoriteCharactersSection } from './FavoriteCharactersSection'

export function FavoritesSection() {
  const theme = useMantineTheme()
  const { data: favoritesData, loading, error } = useFavoritesData()

  const accent = theme.other?.usogui?.red || theme.colors.red[5]
  const surface = theme.other?.usogui?.black || '#0a0a0a'

  const withAlpha = (color: string, alpha: number, fallback: string) => {
    try {
      return rgba(color, alpha)
    } catch {
      return fallback
    }
  }

  const borderColor = withAlpha(accent, 0.22, 'rgba(225, 29, 72, 0.22)')
  const softSurface = withAlpha(surface, 0.92, surface)
  const subtleText = withAlpha('#ffffff', 0.45, 'rgba(255, 255, 255, 0.45)')

  if (error) {
    return (
      <Alert variant="light" style={{ color: getEntityThemeColor(theme, 'gamble'), marginBottom: '1.5rem' }}>
        Unable to load favorites data. Please check your connection and try again.
      </Alert>
    )
  }

  if (loading) {
    return (
      <Box>
        <Skeleton height={40} width={300} style={{ marginBottom: '1.5rem' }} />
        <Grid gutter="md">
          {[1, 2, 3].map((i) => (
            <Grid.Col span={{ base: 12, md: 4 }} key={i}>
              <Card style={{ backgroundColor: softSurface, border: `1px solid ${borderColor}` }}>
                <Stack gap="sm">
                  <Skeleton height={24} width="80%" />
                  <Skeleton height={60} />
                  <Skeleton height={24} width="40%" />
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Box>
    )
  }

  if (!favoritesData) {
    return null
  }

  const { favoriteQuotes, favoriteGambles, favoriteCharacterMedia, favoriteCharacters } = favoritesData

  // Shared divider style matching thin line separators in list items
  const listDividerStyle: React.CSSProperties = {
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  }

  return (
    <Box style={{ marginBottom: '2rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        {/* Section heading */}
        <Box style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <Group justify="center" gap="xs" style={{ marginBottom: '0.5rem' }}>
            <span aria-hidden="true" style={{ fontSize: '1.3rem', color: theme.other?.usogui?.purple || accent, opacity: 0.8, lineHeight: 1 }}>♦</span>
            <Text fw={700} style={{ fontFamily: 'var(--font-opti-goudy-text)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', lineHeight: 1.2 }}>
              Community Favorites
            </Text>
          </Group>
          <Text size="sm" style={{ color: subtleText }}>
            The most beloved content from our community
          </Text>
        </Box>

        {/* Fan Favorite Characters sub-label */}
        {favoriteCharacters && (
          <>
            <Text style={{
              fontSize: '0.625rem',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.28)',
              textAlign: 'center',
              marginBottom: '0.75rem',
            }}>
              Fan Favorite Characters
            </Text>
            <FavoriteCharactersSection data={favoriteCharacters} />
          </>
        )}

        {/* Thin divider between character section and content section */}
        {favoriteCharacters && (favoriteQuotes.length > 0 || favoriteGambles.length > 0 || favoriteCharacterMedia.length > 0) && (
          <Box aria-hidden style={{
            height: 1,
            margin: '1.25rem 0 1rem',
            background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)',
          }} />
        )}

        {/* Popular Content sub-label */}
        {(favoriteQuotes.length > 0 || favoriteGambles.length > 0 || favoriteCharacterMedia.length > 0) && (
          <Text style={{
            fontSize: '0.625rem',
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.28)',
            textAlign: 'center',
            marginBottom: '0.75rem',
          }}>
            Popular Content
          </Text>
        )}

        <Grid gutter="md">
          {/* Popular Profile Pics */}
          {favoriteCharacterMedia.length > 0 && (
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card
                className="community-card-elevated"
                style={{
                  height: '100%',
                  backgroundColor: softSurface,
                  border: `1px solid ${borderColor}`,
                  '--card-accent': 'rgba(77,171,247,0.5)',
                  '--card-shadow': 'rgba(77,171,247,0.10)',
                  padding: '0.875rem 0.75rem',
                } as React.CSSProperties}
              >
                <Group gap={6} style={{ marginBottom: '0.75rem' }}>
                  <User size={14} color={theme.other?.usogui?.character || theme.colors.blue?.[6] || accent} />
                  <Text fw={700} size="sm">Popular Profile Pics</Text>
                </Group>

                {favoriteCharacterMedia.map((item, index) => (
                  <motion.div
                    key={item.media.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.06 }}
                  >
                    <Box
                      style={{
                        ...listDividerStyle,
                        paddingTop: index === 0 ? 0 : '0.4375rem',
                        paddingBottom: index === favoriteCharacterMedia.length - 1 ? 0 : '0.4375rem',
                        opacity: index === 0 ? 1 : index === 1 ? 0.55 : 0.3,
                      }}
                    >
                      <Link href={`/characters/${item.media.character.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <Group gap={9} wrap="nowrap">
                          <Avatar
                            src={item.media.url}
                            alt={item.media.character.name}
                            size={index === 0 ? 34 : index === 1 ? 28 : 24}
                            radius="xl"
                            style={{ border: `1px solid ${withAlpha(theme.other?.usogui?.character || theme.colors.blue?.[6] || accent, 0.3, 'rgba(59,130,246,0.3)')}`, flexShrink: 0 }}
                          />
                          <Box style={{ flex: 1, minWidth: 0 }}>
                            <Text fw={600} style={{ fontSize: '0.6875rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.media.character.name}
                            </Text>
                            <Text style={{ fontSize: '0.625rem', color: subtleText }}>
                              Ch. {item.media.chapterNumber || 'N/A'}
                            </Text>
                          </Box>
                          <Text style={{ fontSize: '0.625rem', color: subtleText, whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {item.userCount} user{item.userCount !== 1 ? 's' : ''}
                          </Text>
                        </Group>
                      </Link>
                    </Box>
                  </motion.div>
                ))}
              </Card>
            </Grid.Col>
          )}

          {/* Top Quotes */}
          {favoriteQuotes.length > 0 && (
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card
                className="community-card-elevated"
                style={{
                  height: '100%',
                  backgroundColor: softSurface,
                  border: `1px solid ${borderColor}`,
                  '--card-accent': 'rgba(81,207,102,0.5)',
                  '--card-shadow': 'rgba(81,207,102,0.10)',
                  padding: '0.875rem 0.75rem',
                } as React.CSSProperties}
              >
                <Group gap={6} style={{ marginBottom: '0.75rem' }}>
                  <Quote size={14} color={theme.other?.usogui?.quote || theme.colors.green?.[5] || '#4ade80'} />
                  <Text fw={700} size="sm">Top Quotes</Text>
                </Group>

                {favoriteQuotes.map((item, index) => (
                  <motion.div
                    key={item.quote.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.06 }}
                  >
                    <Box
                      style={{
                        ...listDividerStyle,
                        paddingTop: index === 0 ? 0 : '0.4375rem',
                        paddingBottom: index === favoriteQuotes.length - 1 ? 0 : '0.4375rem',
                        opacity: index === 0 ? 1 : index === 1 ? 0.55 : 0.3,
                      }}
                    >
                      <Text
                        style={{
                          fontStyle: 'italic',
                          fontSize: '0.6875rem',
                          color: 'rgba(255,255,255,0.8)',
                          lineHeight: 1.5,
                          marginBottom: '0.25rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          fontFamily: 'var(--font-opti-goudy-text)',
                        }}
                      >
                        "{item.quote.text}"
                      </Text>
                      <Group justify="space-between" align="center">
                        <Link href={`/characters/${item.quote.character.id}`} style={{ textDecoration: 'none' }}>
                          <Text style={{ fontSize: '0.625rem', color: subtleText, cursor: 'pointer' }}>
                            — {item.quote.character.name}
                          </Text>
                        </Link>
                        <Text style={{ fontSize: '0.625rem', color: subtleText }}>
                          {item.userCount} user{item.userCount !== 1 ? 's' : ''}
                        </Text>
                      </Group>
                    </Box>
                  </motion.div>
                ))}
              </Card>
            </Grid.Col>
          )}

          {/* Top Gambles */}
          {favoriteGambles.length > 0 && (
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card
                className="community-card-elevated"
                style={{
                  height: '100%',
                  backgroundColor: softSurface,
                  border: `1px solid ${borderColor}`,
                  '--card-accent': 'rgba(255,85,85,0.5)',
                  '--card-shadow': 'rgba(255,85,85,0.10)',
                  padding: '0.875rem 0.75rem',
                } as React.CSSProperties}
              >
                <Group gap={6} style={{ marginBottom: '0.75rem' }}>
                  <Dices size={14} color={theme.other?.usogui?.gamble || accent} />
                  <Text fw={700} size="sm">Top Gambles</Text>
                </Group>

                {favoriteGambles.map((item, index) => (
                  <motion.div
                    key={item.gamble.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.06 }}
                  >
                    <Box
                      style={{
                        ...listDividerStyle,
                        paddingTop: index === 0 ? 0 : '0.4375rem',
                        paddingBottom: index === favoriteGambles.length - 1 ? 0 : '0.4375rem',
                        opacity: index === 0 ? 1 : index === 1 ? 0.55 : 0.3,
                      }}
                    >
                      <Group justify="space-between" align="flex-start" gap={6} wrap="nowrap">
                        <Box style={{ minWidth: 0, flex: 1 }}>
                          <Text fw={700} style={{
                            fontSize: '0.6875rem',
                            color: '#fff',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            marginBottom: 2,
                          }}>
                            <span aria-hidden style={{ color: 'rgba(225,29,72,0.45)', marginRight: '0.25em' }}>♠</span>
                            {item.gamble.name}
                          </Text>
                          {item.gamble.rules && (
                            <Text style={{
                              fontSize: '0.625rem',
                              color: subtleText,
                              lineHeight: 1.4,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                            }}>
                              {item.gamble.rules}
                            </Text>
                          )}
                        </Box>
                        <Box style={{ textAlign: 'right', flexShrink: 0 }}>
                          <Link href={`/gambles/${item.gamble.id}`} style={{ textDecoration: 'none' }}>
                            <Text style={{ fontSize: '0.625rem', color: subtleText, whiteSpace: 'nowrap' }}>
                              {item.userCount} user{item.userCount !== 1 ? 's' : ''}
                            </Text>
                          </Link>
                        </Box>
                      </Group>
                    </Box>
                  </motion.div>
                ))}
              </Card>
            </Grid.Col>
          )}
        </Grid>

        {favoriteQuotes.length === 0 && favoriteGambles.length === 0 && favoriteCharacterMedia.length === 0 && !favoriteCharacters && (
          <Box style={{ textAlign: 'center', padding: '2rem 0' }}>
            <Text size="md" style={{ color: subtleText }}>
              No favorites data available yet. Be the first to set your favorites!
            </Text>
          </Box>
        )}
      </motion.div>
    </Box>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/ninjaruss/Documents/GitHub/usogui-fansite/client && yarn build 2>&1 | grep -E "error TS|Type error" | head -20
```

Expected: no TypeScript errors in `FavoritesSection.tsx`.

- [ ] **Step 3: Commit**

```bash
cd /Users/ninjaruss/Documents/GitHub/usogui-fansite
git add client/src/components/FavoritesSection.tsx
git commit -m "feat: compact slim list items for FavoritesSection content cards"
```

---

### Task 3: Lint and final check

**Files:** none new

- [ ] **Step 1: Run ESLint on both changed files**

```bash
cd /Users/ninjaruss/Documents/GitHub/usogui-fansite/client && yarn lint 2>&1 | grep -A2 "FavoritesSection\|FavoriteCharactersSection"
```

Expected: no lint errors for these two files.

- [ ] **Step 2: Visual smoke check**

Start the dev server and open `http://localhost:3000`. Verify:
- The Community Favorites section loads without console errors
- Character podium cards show: top accent bar, winner row (image + name + `#1` badge), runner-up row at lower opacity
- Content cards show slim list items (no nested cards), items fade in opacity as rank decreases
- Overall section is noticeably shorter than before

```bash
cd /Users/ninjaruss/Documents/GitHub/usogui-fansite/client && yarn dev
```

- [ ] **Step 3: Final commit if any lint fixes were needed**

```bash
cd /Users/ninjaruss/Documents/GitHub/usogui-fansite
git add -p
git commit -m "fix: lint cleanup for favorites redesign"
```
