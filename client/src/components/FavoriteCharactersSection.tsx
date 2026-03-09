'use client'

import {
  Box,
  Card,
  Text,
  Grid,
  Badge,
  Stack,
  Group,
  Tooltip,
  useMantineTheme,
  rgba
} from '@mantine/core'
import { getEntityThemeColor } from '../lib/mantine-theme'
import { Heart, Crown, Trophy } from 'lucide-react'
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

  const borderColor = withAlpha(characterColor, 0.22, 'rgba(59, 130, 246, 0.22)')
  const softSurface = withAlpha(surface, 0.92, surface)
  const subtleText = withAlpha('#ffffff', 0.7, 'rgba(255, 255, 255, 0.7)')

  const { mostFavorited, mostPrimary, mostLoyal } = data
  const hasAnyData = mostFavorited.length > 0 || mostPrimary.length > 0 || mostLoyal.length > 0

  const cardStyle = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: softSurface,
    border: `1px solid ${borderColor}`,
  }

  const innerCardStyle = {
    backgroundColor: withAlpha(surface, 0.86, surface),
    border: `1px solid ${borderColor}`,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
  }

  const renderCharacterCard = (
    character: { id: number; name: string },
    label: string,
    index: number,
  ) => (
    <motion.div
      key={character.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card
        withBorder
        padding="sm"
        style={innerCardStyle}
        component={Link}
        href={`/characters/${character.id}`}
      >
        <Group justify="space-between" align="center">
          <Text fw={index === 0 ? 700 : 500} size={index === 0 ? 'md' : 'sm'}>
            {character.name}
          </Text>
          <Badge variant="light" size="sm" style={{ color: getEntityThemeColor(theme, 'character') }}>
            {label}
          </Badge>
        </Group>
      </Card>
    </motion.div>
  )

  const renderEmptyState = () => (
    <Card
      withBorder
      padding="sm"
      style={{ ...innerCardStyle, cursor: 'default' }}
    >
      <Text size="sm" style={{ color: subtleText, textAlign: 'center' }}>
        Not enough data yet
      </Text>
    </Card>
  )

  return (
    <Box style={{ marginBottom: '3rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
      >
        <Box style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Group justify="center" gap="xs" style={{ marginBottom: '0.75rem' }}>
            <Heart className="w-6 h-6" color={characterColor} />
            <Text fw={700} size="xl">
              Fan Favorite Characters
            </Text>
          </Group>
          <Text size="md" style={{ color: subtleText }}>
            Community-voted favorites across three categories
          </Text>
        </Box>

        <Grid gutter="xl">
          {/* Most Favorited */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card style={cardStyle}>
              <Box style={{ flexGrow: 1 }}>
                <Box style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <Group justify="center" gap="xs" style={{ marginBottom: '0.5rem' }}>
                    <Trophy className="w-5 h-5" color={characterColor} />
                    <Text fw={700} size="lg">Most Favorited</Text>
                  </Group>
                  <Text size="xs" style={{ color: subtleText }}>
                    Characters with the most fans
                  </Text>
                </Box>
                <Stack gap="sm">
                  {mostFavorited.length > 0 ? (
                    mostFavorited.map((item, index) =>
                      renderCharacterCard(
                        item.character,
                        `${item.totalCount} fan${item.totalCount !== 1 ? 's' : ''}`,
                        index,
                      )
                    )
                  ) : (
                    renderEmptyState()
                  )}
                </Stack>
              </Box>
            </Card>
          </Grid.Col>

          {/* Most Chosen as Primary */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card style={cardStyle}>
              <Box style={{ flexGrow: 1 }}>
                <Box style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <Group justify="center" gap="xs" style={{ marginBottom: '0.5rem' }}>
                    <Crown className="w-5 h-5" color={characterColor} />
                    <Text fw={700} size="lg">Fan Favorite #1</Text>
                  </Group>
                  <Text size="xs" style={{ color: subtleText }}>
                    Most chosen as someone&apos;s #1
                  </Text>
                </Box>
                <Stack gap="sm">
                  {mostPrimary.length > 0 ? (
                    mostPrimary.map((item, index) =>
                      renderCharacterCard(
                        item.character,
                        `${item.primaryCount} #1 pick${item.primaryCount !== 1 ? 's' : ''}`,
                        index,
                      )
                    )
                  ) : (
                    renderEmptyState()
                  )}
                </Stack>
              </Box>
            </Card>
          </Grid.Col>

          {/* Most Loyal Following */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card style={cardStyle}>
              <Box style={{ flexGrow: 1 }}>
                <Box style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <Group justify="center" gap="xs" style={{ marginBottom: '0.5rem' }}>
                    <Heart className="w-5 h-5" color={characterColor} />
                    <Tooltip
                      label="Percentage of fans who chose this character as their #1. Requires at least 3 fans."
                      multiline
                      w={240}
                    >
                      <Text fw={700} size="lg" style={{ cursor: 'help', textDecoration: 'underline dotted' }}>
                        Most Loyal Following
                      </Text>
                    </Tooltip>
                  </Group>
                  <Text size="xs" style={{ color: subtleText }}>
                    Highest % chosen as #1 (min. 3 fans)
                  </Text>
                </Box>
                <Stack gap="sm">
                  {mostLoyal.length > 0 ? (
                    mostLoyal.map((item, index) =>
                      renderCharacterCard(
                        item.character,
                        `${Math.round(item.loyaltyRatio * 100)}% chose as #1`,
                        index,
                      )
                    )
                  ) : (
                    renderEmptyState()
                  )}
                </Stack>
              </Box>
            </Card>
          </Grid.Col>
        </Grid>

        {!hasAnyData && (
          <Box style={{ textAlign: 'center', padding: '1rem 0' }}>
            <Text size="sm" style={{ color: subtleText }}>
              No character favorites yet. Set your favorites in your profile!
            </Text>
          </Box>
        )}
      </motion.div>
    </Box>
  )
}
