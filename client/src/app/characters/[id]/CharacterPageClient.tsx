'use client'

import React, { useEffect, useState } from 'react'
import {
  Badge,
  Box,
  Button,
  Card,
  Grid,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Tabs,
  Text,
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { User, Crown, Calendar, BookOpen, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { usePageView } from '../../../hooks/usePageView'
import MediaGallery from '../../../components/MediaGallery'
import CharacterTimeline from '../../../components/CharacterTimeline'
import { useProgress } from '../../../providers/ProgressProvider'
import { useSpoilerSettings } from '../../../hooks/useSpoilerSettings'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import EnhancedSpoilerMarkdown from '../../../components/EnhancedSpoilerMarkdown'
import { textColors, headerColors, mantineTextColors } from '../../../lib/mantine-theme'
import type { Arc, Event, Gamble, Guide, Quote } from '../../../types'

interface Character {
  id: number
  name: string
  alternateNames: string[] | null
  description: string | null
  firstAppearanceChapter: number | null
  imageFileName?: string | null
  imageDisplayName?: string | null
  organizations?: Array<{
    id: number
    name: string
    description?: string
  }>
  arcs?: Array<{
    id: number
    name: string
    order: number
  }>
}

interface CharacterPageClientProps {
  character: Character
  gambles: Gamble[]
  events: Event[]
  guides: Guide[]
  quotes: Quote[]
  arcs: Arc[]
}

export default function CharacterPageClient({
  character,
  gambles,
  events,
  guides,
  quotes,
  arcs
}: CharacterPageClientProps) {
  const theme = useMantineTheme()
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  usePageView('character', character.id.toString(), true)

  if (!isClient) {
    return <Box py="md">Loading...</Box>
  }

  // Use consistent theme colors for better readability
  const accentWarning = textColors.warning
  const accentSecondary = textColors.media
  const accentSuccess = textColors.success

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card withBorder radius="md" className="gambling-card" shadow="md">
        <Tabs value={activeTab} onChange={(value) => value && setActiveTab(value)} keepMounted={false}>
          <Tabs.List>
            <Tabs.Tab value="overview" leftSection={<User size={16} />}>Overview</Tabs.Tab>
            <Tabs.Tab value="timeline" leftSection={<Calendar size={16} />} disabled={events.length === 0}>
              Timeline
            </Tabs.Tab>
            <Tabs.Tab value="media" leftSection={<BookOpen size={16} />}>Media</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" pt="md">
            <Grid gutter="xl">
              <Grid.Col span={{ base: 12, lg: 8 }}>
                <Card withBorder radius="md" shadow="sm" style={{ marginBottom: rem(24) }}>
                  <Stack gap="md" p="lg">
                    <Group gap="sm" align="center">
                      <User size={24} color={theme.colors.red?.[5]} />
                      <Title order={3} style={{ color: headerColors.h3 }}>About</Title>
                    </Group>
                    {character.description ? (
                      <TimelineSpoilerWrapper chapterNumber={character.firstAppearanceChapter ?? undefined}>
                        <EnhancedSpoilerMarkdown content={character.description} enableEntityEmbeds compactEntityCards={false} />
                      </TimelineSpoilerWrapper>
                    ) : (
                      <Text size="sm" c="dimmed">
                        No description available for this character yet.
                      </Text>
                    )}
                  </Stack>
                </Card>

                <Grid gutter="lg">
                  {quotes.length > 0 && (
                    <Grid.Col span={{ base: 12, lg: 6 }}>
                      <Card withBorder radius="md" shadow="sm">
                        <Stack gap="sm" p="lg">
                          <Group justify="space-between" align="center">
                            <Group gap="sm">
                              <BookOpen size={20} color={accentWarning} />
                              <Title order={4} style={{ color: textColors.quote }}>
                                Memorable Quotes
                              </Title>
                            </Group>
                            <Button
                              component={Link}
                              href={`/quotes?characterId=${character.id}`}
                              variant="outline"
                              color="yellow"
                              size="xs"
                              radius="xl"
                            >
                              View All
                            </Button>
                          </Group>

                          <ScrollArea h={300} offsetScrollbars>
                            <Stack gap="md">
                              {quotes.slice(0, 3).map((quote) => (
                                <Paper key={quote.id} withBorder radius="md" p="md" shadow="xs">
                                  <TimelineSpoilerWrapper chapterNumber={quote.chapter?.number ?? undefined}>
                                    <Stack gap={4}>
                                      <Text size="sm" style={{ fontStyle: 'italic' }}>
                                        “{quote.text}”
                                      </Text>
                                      <Badge color="yellow" variant="light" radius="sm" maw={120}>
                                        Ch. {quote.chapter?.number ?? '?'}
                                      </Badge>
                                    </Stack>
                                  </TimelineSpoilerWrapper>
                                </Paper>
                              ))}
                            </Stack>
                          </ScrollArea>
                        </Stack>
                      </Card>
                    </Grid.Col>
                  )}

                  {gambles.length > 0 && (
                    <Grid.Col span={{ base: 12, lg: quotes.length > 0 ? 6 : 12 }}>
                      <Card withBorder radius="md" shadow="sm">
                        <Stack gap="sm" p="lg">
                          <Group justify="space-between" align="center">
                            <Group gap="sm">
                              <Crown size={20} color={accentSecondary} />
                              <Title order={4} style={{ color: textColors.gamble }}>
                                Gambles
                              </Title>
                            </Group>
                            <Button
                              component={Link}
                              href={`/gambles?character=${character.name}`}
                              variant="outline"
                              color="violet"
                              size="xs"
                              radius="xl"
                            >
                              View All
                            </Button>
                          </Group>

                          <ScrollArea h={300} offsetScrollbars>
                            <Stack gap="md">
                              {gambles.slice(0, 4).map((gamble) => (
                                <Paper key={gamble.id} withBorder radius="md" p="md" shadow="xs">
                                  <GambleSpoilerWrapper gamble={gamble}>
                                    <Stack gap={6}>
                                      <Text
                                        component={Link}
                                        href={`/gambles/${gamble.id}`}
                                        fw={600}
                                        size="sm"
                                        style={{ color: textColors.gamble, textDecoration: 'none' }}
                                      >
                                        {gamble.name}
                                      </Text>
                                      <Group gap="xs" align="center">
                                        <Calendar size={14} color={theme.colors.gray?.[5]} />
                                        <Badge radius="sm" variant="light" color="violet">
                                          Ch. {gamble.chapterId ?? 'Unknown'}
                                        </Badge>
                                      </Group>
                                    </Stack>
                                  </GambleSpoilerWrapper>
                                </Paper>
                              ))}
                            </Stack>
                          </ScrollArea>
                        </Stack>
                      </Card>
                    </Grid.Col>
                  )}
                </Grid>
              </Grid.Col>

              <Grid.Col span={{ base: 12, lg: 4 }}>
                {guides.length > 0 && (
                  <Card withBorder radius="md" shadow="sm" style={{ position: 'sticky', top: rem(24) }}>
                    <Stack gap="sm" p="lg">
                      <Group justify="space-between" align="center">
                        <Group gap="sm">
                          <BookOpen size={20} color={accentSuccess} />
                          <Title order={4} style={{ color: textColors.guide }}>
                            Guides
                          </Title>
                        </Group>
                        <Button
                          component={Link}
                          href={`/guides?character=${character.name}`}
                          variant="outline"
                          color="green"
                          size="xs"
                          radius="xl"
                        >
                          View All
                        </Button>
                      </Group>

                      <Stack gap="md">
                        {guides.slice(0, 3).map((guide) => (
                          <Paper key={guide.id} withBorder radius="md" p="md" shadow="xs">
                            <Stack gap={4}>
                              <Text
                                component={Link}
                                href={`/guides/${guide.id}`}
                                fw={600}
                                size="sm"
                                style={{ color: textColors.guide, textDecoration: 'none' }}
                              >
                                {guide.title}
                              </Text>
                              <Group gap="xs" align="center">
                                <User size={14} color={theme.colors.gray?.[5]} />
                                <Text size="xs" c="dimmed">
                                  By {guide.author?.username ?? 'Unknown'}
                                </Text>
                              </Group>
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    </Stack>
                  </Card>
                )}
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          <Tabs.Panel value="timeline" pt="md">
            <CharacterTimeline
              events={events as any}
              arcs={arcs}
              characterName={character.name}
              firstAppearanceChapter={character.firstAppearanceChapter ?? 0}
            />
          </Tabs.Panel>

          <Tabs.Panel value="media" pt="md">
            <Box pos="relative">
              <MediaGallery
                characterId={character.id}
                limit={12}
                showTitle={false}
                compactMode={false}
              />
            </Box>
          </Tabs.Panel>
        </Tabs>
      </Card>
    </motion.div>
  )
}

function GambleSpoilerWrapper({ gamble, children }: { gamble: Gamble; children: React.ReactNode }) {
  const [isRevealed, setIsRevealed] = useState(false)
  const { userProgress } = useProgress()
  const { settings } = useSpoilerSettings()
  const theme = useMantineTheme()

  const chapterNumber = gamble.chapterId ?? undefined

  const effectiveProgress = settings.chapterTolerance > 0 ? settings.chapterTolerance : userProgress
  const shouldHideSpoiler = (() => {
    if (settings.showAllSpoilers) {
      return false
    }
    if (chapterNumber) {
      return chapterNumber > effectiveProgress
    }
    return effectiveProgress <= 5
  })()

  if (!shouldHideSpoiler || isRevealed) {
    return <>{children}</>
  }

  return (
    <Box pos="relative">
      <Box style={{ opacity: 0.3, filter: 'blur(2px)', pointerEvents: 'none' }}>{children}</Box>
      <Box
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setIsRevealed(true)
        }}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(225, 29, 72, 0.85)',
          borderRadius: theme.radius.md,
          cursor: 'pointer'
        }}
      >
        <Stack gap={4} align="center">
          <Group gap={6} align="center" c="white" fw={700}>
            <AlertTriangle size={14} />
            Chapter {chapterNumber ?? 'Unknown'} Spoiler
          </Group>
          <Text size="xs" c="rgba(255,255,255,0.8)">
            Click to reveal
          </Text>
        </Stack>
      </Box>
    </Box>
  )
}
