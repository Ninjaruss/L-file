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
import { getEntityThemeColor, textColors, headerColors } from '../../../lib/mantine-theme'
import { User, Crown, Calendar, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { usePageView } from '../../../hooks/usePageView'
import MediaGallery from '../../../components/MediaGallery'
import CharacterTimeline, { TimelineEvent } from '../../../components/CharacterTimeline'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import EnhancedSpoilerMarkdown from '../../../components/EnhancedSpoilerMarkdown'
import type { Arc, Gamble, Guide, Quote } from '../../../types'
import MediaThumbnail from '../../../components/MediaThumbnail'

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
  events: TimelineEvent[]
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
  const entityColors = {
    character: getEntityThemeColor(theme, 'character'),
    arc: getEntityThemeColor(theme, 'arc'),
    gamble: getEntityThemeColor(theme, 'gamble'),
    guide: getEntityThemeColor(theme, 'guide'),
    quote: getEntityThemeColor(theme, 'quote'),
    media: getEntityThemeColor(theme, 'media')
  }

  return (
    <Stack gap="md">
      {/* Enhanced Character Header */}
      <Card
        withBorder
        radius="lg"
        shadow="lg"
        p={0}
        style={{
          background: `linear-gradient(135deg, ${theme.colors.dark?.[6] ?? theme.colors.gray?.[1]} 0%, ${theme.colors.dark?.[7] ?? theme.colors.gray?.[0]} 100%)`,
          border: `1px solid ${entityColors.character}`,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle Pattern Overlay */}
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0),
              radial-gradient(circle at 20px 20px, rgba(255,255,255,0.03) 1px, transparent 0)
            `,
            backgroundSize: '40px 40px, 80px 80px',
            backgroundPosition: '0 0, 20px 20px',
            pointerEvents: 'none'
          }}
        />

        {/* Content */}
        <Box p="lg" style={{ position: 'relative', zIndex: 1 }}>
          <Group gap="lg" align="stretch" wrap="nowrap">
            <Box style={{ flexShrink: 0 }}>
              <Box
                style={{
                  borderRadius: theme.radius.md,
                  overflow: 'hidden',
                  border: `2px solid ${entityColors.character}`,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                }}
              >
                <MediaThumbnail
                  entityType="character"
                  entityId={character.id}
                  entityName={character.name}
                  allowCycling={false}
                  maxWidth="200px"
                  maxHeight="280px"
                />
              </Box>
            </Box>

            <Stack gap="md" style={{ flex: 1, minWidth: 0, height: '100%' }} justify="space-between">
              <Stack gap="sm">
                <Title
                  order={1}
                  size="2.5rem"
                  fw={700}
                  c={theme.white}
                  style={{
                    lineHeight: 1.1
                  }}
                >
                  {character.name}
                </Title>
                {character.alternateNames && character.alternateNames.length > 0 && (
                  <Group gap="xs" wrap="wrap">
                    {character.alternateNames.map((name, index) => (
                      <Badge
                        key={index}
                        variant="light"
                        size="md"
                        radius="md"
                        style={{
                          background: `${theme.colors.dark?.[5] ?? theme.colors.gray?.[2]}40`,
                          border: `1px solid ${theme.colors.dark?.[5] ?? theme.colors.gray?.[2]}60`
                        }}
                        c={textColors.secondary}
                      >
                        {name}
                      </Badge>
                    ))}
                  </Group>
                )}
              </Stack>

              <Stack gap="md" style={{ flex: 1, justifyContent: 'center' }}>
                <Group gap="md" wrap="wrap" align="center">
                  {character.firstAppearanceChapter && (
                    <Badge
                      variant="filled"
                      size="lg"
                      radius="md"
                      style={{
                        background: `linear-gradient(135deg, ${entityColors.character} 0%, ${entityColors.character}dd 100%)`,
                        border: `1px solid ${entityColors.character}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        fontSize: '0.9rem',
                        color: 'white'
                      }}
                    >
                      First appears in Chapter {character.firstAppearanceChapter}
                    </Badge>
                  )}
                </Group>

                {character.organizations && character.organizations.length > 0 && (
                  <Group gap="sm" wrap="wrap">
                    {character.organizations.map((org) => (
                      <Badge
                        key={org.id}
                        variant="light"
                        size="lg"
                        radius="md"
                        style={{
                          background: `${entityColors.character}20`,
                          border: `1px solid ${entityColors.character}`,
                          color: textColors.character,
                          fontSize: '0.85rem',
                          padding: '8px 16px'
                        }}
                      >
                        {org.name}
                      </Badge>
                    ))}
                  </Group>
                )}

                {/* Content Stats */}
                <Group gap="md" wrap="wrap" mt="sm">
                  <Badge size="md" variant="light" c={textColors.arc} style={{ fontSize: '0.8rem' }}>
                    {arcs.length} Story Arcs
                  </Badge>
                  <Badge size="md" variant="light" c={textColors.gamble} style={{ fontSize: '0.8rem' }}>
                    {gambles.length} Gambles
                  </Badge>
                  <Badge size="md" variant="light" c={textColors.character} style={{ fontSize: '0.8rem' }}>
                    {events.length} Events
                  </Badge>
                  <Badge size="md" variant="light" c={textColors.quote} style={{ fontSize: '0.8rem' }}>
                    {quotes.length} Quotes
                  </Badge>
                  <Badge size="md" variant="light" c={textColors.guide} style={{ fontSize: '0.8rem' }}>
                    {guides.length} Guides
                  </Badge>
                </Group>
              </Stack>
            </Stack>
          </Group>
        </Box>
      </Card>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card withBorder radius="md" className="gambling-card" shadow="md">
        <Tabs
          value={activeTab}
          onChange={(value) => value && setActiveTab(value)}
          keepMounted={false}
          variant="pills"
          className="character-tabs"
          styles={{
            tab: {
              color: textColors.secondary,
              backgroundColor: 'transparent',
              '&:hover': {
                backgroundColor: `${getEntityThemeColor(theme, 'character')}20`,
                color: textColors.primary
              }
            }
          }}
        >
          <Tabs.List>
            <Tabs.Tab value="overview" leftSection={<User size={16} />}>Overview</Tabs.Tab>
            <Tabs.Tab value="timeline" leftSection={<Calendar size={16} />} disabled={events.length === 0}>
              Timeline
            </Tabs.Tab>
            <Tabs.Tab value="media" leftSection={<BookOpen size={16} />}>Media</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" pt="md">
            <Stack gap="lg">
              {/* Character Description Section */}
              <Card withBorder radius="md" shadow="sm">
                <Stack gap="md" p="lg">
                  <Group gap="sm" align="center">
                    <User size={24} color={entityColors.character} />
                    <Title order={3} c={headerColors.h3}>About {character.name}</Title>
                  </Group>
                  {character.description ? (
                    <TimelineSpoilerWrapper chapterNumber={character.firstAppearanceChapter ?? undefined}>
                      <Box style={{ lineHeight: 1.6 }}>
                        <EnhancedSpoilerMarkdown content={character.description} enableEntityEmbeds compactEntityCards={false} />
                      </Box>
                    </TimelineSpoilerWrapper>
                  ) : (
                    <Text size="sm" c="dimmed" style={{ fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
                      No description available for this character yet. Check back later for updates!
                    </Text>
                  )}
                </Stack>
              </Card>

              {/* Related Story Arcs */}
              {arcs.length > 0 && (
                <Card withBorder radius="md" shadow="sm">
                  <Stack gap="md" p="md">
                    <Group justify="space-between" align="center">
                      <Group gap="sm">
                        <BookOpen size={20} color={entityColors.arc} />
                        <Title order={4} c={textColors.arc}>Related Story Arcs</Title>
                      </Group>
                      <Button
                        component={Link}
                        href={`/arcs?character=${character.name}`}
                        variant="outline"
                        c={entityColors.arc}
                        size="xs"
                        radius="xl"
                      >
                        View All ({arcs.length})
                      </Button>
                    </Group>
                    <Stack gap="sm">
                      {arcs.slice(0, 4).map((arc) => (
                        <Paper key={arc.id} withBorder radius="md" p="sm" shadow="xs">
                          <Group justify="space-between" align="flex-start">
                            <Box style={{ flex: 1 }}>
                              <Text
                                component={Link}
                                href={`/arcs/${arc.id}`}
                                fw={600}
                                size="sm"
                                c={textColors.arc}
                                style={{ textDecoration: 'none' }}
                              >
                                {arc.name}
                              </Text>
                              {arc.description && (
                                <Text size="xs" c="dimmed" lineClamp={2} mt={4}>
                                  {arc.description}
                                </Text>
                              )}
                            </Box>
                            <Badge c={entityColors.arc} variant="outline" size="xs">
                              Arc {arc.order ?? "N/A"}
                            </Badge>
                          </Group>
                        </Paper>
                      ))}
                    </Stack>
                  </Stack>
                </Card>
              )}

              {/* Related Gambles */}
              {gambles.length > 0 && (
                <Card withBorder radius="md" shadow="sm">
                  <Stack gap="md" p="md">
                    <Group justify="space-between" align="center">
                      <Group gap="sm">
                        <Crown size={20} color={entityColors.gamble} />
                        <Title order={4} c={textColors.gamble}>Related Gambles</Title>
                      </Group>
                      <Button
                        component={Link}
                        href={`/gambles?character=${character.name}`}
                        variant="outline"
                        c={entityColors.gamble}
                        size="xs"
                        radius="xl"
                      >
                        View All ({gambles.length})
                      </Button>
                    </Group>
                    <Stack gap="sm">
                      {gambles.slice(0, 4).map((gamble) => (
                        <Paper key={gamble.id} withBorder radius="md" p="sm" shadow="xs">
                          <TimelineSpoilerWrapper chapterNumber={gamble.chapterId ?? undefined}>
                            <Group justify="space-between" align="flex-start">
                              <Box style={{ flex: 1 }}>
                                <Text
                                  component={Link}
                                  href={`/gambles/${gamble.id}`}
                                  fw={600}
                                  size="sm"
                                  c={textColors.gamble}
                                  style={{ textDecoration: 'none' }}
                                >
                                  {gamble.name}
                                </Text>
                                {gamble.description && (
                                  <Text size="xs" c="dimmed" lineClamp={2} mt={4}>
                                    {gamble.description}
                                  </Text>
                                )}
                              </Box>
                              {gamble.chapterId && (
                                <Badge c={entityColors.gamble} variant="outline" size="xs">
                                  Ch. {gamble.chapterId}
                                </Badge>
                              )}
                            </Group>
                          </TimelineSpoilerWrapper>
                        </Paper>
                      ))}
                    </Stack>
                  </Stack>
                </Card>
              )}

              {/* Memorable Quotes */}
              {quotes.length > 0 && (
                <Card withBorder radius="md" shadow="sm">
                  <Stack gap="md" p="md">
                    <Group justify="space-between" align="center">
                      <Group gap="sm">
                        <BookOpen size={20} color={entityColors.quote} />
                        <Title order={4} c={textColors.quote}>Memorable Quotes</Title>
                      </Group>
                      <Button
                        component={Link}
                        href={`/quotes?characterId=${character.id}`}
                        variant="outline"
                        c={entityColors.quote}
                        size="xs"
                        radius="xl"
                      >
                        View All ({quotes.length})
                      </Button>
                    </Group>

                    <Stack gap="sm">
                      {quotes.slice(0, 3).map((quote) => (
                        <Paper key={quote.id} withBorder radius="md" p="md" shadow="xs">
                          <TimelineSpoilerWrapper chapterNumber={quote.chapter?.number ?? undefined}>
                            <Stack gap="sm">
                              <Text size="sm" style={{ fontStyle: 'italic', lineHeight: 1.5 }}>
                                &ldquo;{quote.text}&rdquo;
                              </Text>
                              <Badge c={entityColors.quote} variant="light" radius="sm" size="xs" style={{ alignSelf: 'flex-start' }}>
                                Chapter {quote.chapter?.number ?? '?'}
                              </Badge>
                            </Stack>
                          </TimelineSpoilerWrapper>
                        </Paper>
                      ))}
                    </Stack>
                  </Stack>
                </Card>
              )}

              {/* Community Guides */}
              {guides.length > 0 && (
                <Card withBorder radius="md" shadow="sm">
                  <Stack gap="md" p="md">
                    <Group justify="space-between" align="center">
                      <Group gap="sm">
                        <BookOpen size={20} color={entityColors.guide} />
                        <Title order={4} c={textColors.guide}>Community Guides</Title>
                      </Group>
                      <Button
                        component={Link}
                        href={`/guides?character=${character.name}`}
                        variant="outline"
                        c={entityColors.guide}
                        size="xs"
                        radius="xl"
                      >
                        View All ({guides.length})
                      </Button>
                    </Group>

                    <Stack gap="sm">
                      {guides.slice(0, 4).map((guide) => (
                        <Paper key={guide.id} withBorder radius="md" p="sm" shadow="xs">
                          <Stack gap={6}>
                            <Text
                              component={Link}
                              href={`/guides/${guide.id}`}
                              fw={600}
                              size="sm"
                              c={textColors.guide}
                              style={{ textDecoration: 'none' }}
                              lineClamp={2}
                            >
                              {guide.title}
                            </Text>
                            <Group gap="xs" align="center">
                              <User size={12} color={textColors.tertiary} />
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
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="timeline" pt="md">
            <CharacterTimeline
              events={events}
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
    </Stack>
  )
}