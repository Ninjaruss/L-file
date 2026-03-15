'use client'

import React, { useEffect, useState } from 'react'
import {
  Badge,
  Box,
  Card,
  Container,
  Group,
  Paper,
  Stack,
  Tabs,
  Text,
  Tooltip,
  useMantineTheme
} from '@mantine/core'
import {
  getEntityThemeColor,
  textColors,
  getAlphaColor,
  fontSize,
  setTabAccentColors,
  backgroundStyles,
  getCardStyles
} from '../../../lib/mantine-theme'
import { BookOpen, MessageSquareQuote, CalendarSearch, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { pageEnter } from '../../../lib/motion-presets'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import { usePageView } from '../../../hooks/usePageView'
import { BreadcrumbNav, createEntityBreadcrumbs } from '../../../components/Breadcrumb'
import { DetailPageHeader } from '../../../components/layouts/DetailPageHeader'
import { RelatedContentSection } from '../../../components/layouts/RelatedContentSection'
import type { Chapter as ChapterResource } from '../../../types'
import { AnnotationSection } from '../../../components/annotations'
import { EntityQuickActions } from '../../../components/EntityQuickActions'
import { useAuth } from '../../../providers/AuthProvider'
import { AnnotationOwnerType } from '../../../types'

interface Character {
  id: number
  name: string
}

interface Event {
  id: number
  title: string
  description: string
}

interface Quote {
  id: number
  text: string
  pageNumber?: number
  character?: Character
}

type Chapter = ChapterResource & {
  chapterNumber?: number | null
}

interface ArcBase {
  id: number
  name: string
  startChapter: number
  endChapter: number
}

interface ChapterPageClientProps {
  initialChapter: Chapter
  initialEvents?: Event[]
  initialQuotes?: Quote[]
  initialCharacters?: Character[]
  initialArc?: ArcBase | null
}

export default function ChapterPageClient({
  initialChapter,
  initialEvents = [],
  initialQuotes = [],
  initialCharacters = [],
  initialArc
}: ChapterPageClientProps) {
  const theme = useMantineTheme()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<string>('overview')

  usePageView('chapter', initialChapter.id.toString(), true)

  // Set tab accent colors for chapter entity
  useEffect(() => {
    setTabAccentColors('chapter')
  }, [])

  // Use consistent theme colors
  const entityColors = {
    chapter: getEntityThemeColor(theme, 'chapter'),
    character: getEntityThemeColor(theme, 'character'),
    event: getEntityThemeColor(theme, 'event'),
    quote: getEntityThemeColor(theme, 'quote'),
    volume: getEntityThemeColor(theme, 'volume'),
    arc: getEntityThemeColor(theme, 'arc')
  }

  return (
    <Box style={{
      backgroundColor: backgroundStyles.page(theme),
      minHeight: '100vh',
      color: textColors.primary
    }}>
      <Container size="lg" py="md" style={{ backgroundColor: backgroundStyles.container(theme) }}>
        <Stack gap={theme.spacing.md}>
          {/* Breadcrumb Navigation */}
          <BreadcrumbNav
            items={createEntityBreadcrumbs('chapter', initialChapter.title || `Chapter ${initialChapter.number}`)}
            entityType="chapter"
          />

          {/* Enhanced Chapter Header */}
          <DetailPageHeader
            entityType="chapter"
            entityId={initialChapter.id}
            entityName={`Chapter ${initialChapter.number}`}
            stats={[
              { value: initialEvents?.length ?? 0, label: 'Events' },
              ...(initialChapter.volume != null
                ? [{ value: `Vol. ${initialChapter.volume.number}`, label: 'Volume' }]
                : []),
              ...(initialArc != null
                ? [{ value: initialArc.name, label: 'Arc' }]
                : []),
            ].slice(0, 3)}
            spoilerChapter={initialChapter.number}
            showImage={false}
          />

          <motion.div {...pageEnter}>
            <Card withBorder radius="lg" className="gambling-card" shadow="xl" style={getCardStyles(theme)}>
              <Tabs
                value={activeTab}
                onChange={(value) => value && setActiveTab(value)}
                keepMounted={false}
                variant="pills"
                className="chapter-tabs"
              >
                <Tabs.List>
                  <Tabs.Tab value="overview" leftSection={<BookOpen size={16} />}>Overview</Tabs.Tab>
                  <Tooltip
                    label="No events available for this chapter"
                    disabled={Array.isArray(initialEvents) && initialEvents.length > 0}
                    position="bottom"
                    withArrow
                  >
                    <Tabs.Tab
                      value="events"
                      leftSection={<CalendarSearch size={16} />}
                      rightSection={Array.isArray(initialEvents) && initialEvents.length > 0 ? <Badge size="xs" variant="light" c={entityColors.event}>{initialEvents.length}</Badge> : null}
                      disabled={!Array.isArray(initialEvents) || initialEvents.length === 0}
                    >
                      Events
                    </Tabs.Tab>
                  </Tooltip>
                  <Tooltip
                    label="No quotes available for this chapter"
                    disabled={Array.isArray(initialQuotes) && initialQuotes.length > 0}
                    position="bottom"
                    withArrow
                  >
                    <Tabs.Tab
                      value="quotes"
                      leftSection={<MessageSquareQuote size={16} />}
                      rightSection={Array.isArray(initialQuotes) && initialQuotes.length > 0 ? <Badge size="xs" variant="light" c={entityColors.quote}>{initialQuotes.length}</Badge> : null}
                      disabled={!Array.isArray(initialQuotes) || initialQuotes.length === 0}
                    >
                      Quotes
                    </Tabs.Tab>
                  </Tooltip>
                  <Tabs.Tab value="annotations" leftSection={<MessageSquare size={16} />}>Annotations</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="overview" pt={theme.spacing.md}>
                  <Box
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1fr) 260px',
                      gap: 12,
                      alignItems: 'start',
                    }}
                    className="detail-editorial-grid"
                  >
                    {/* Main column */}
                    <Stack gap={theme.spacing.md}>
                      {/* Chapter Summary Section */}
                      <Card
                        withBorder
                        radius="lg"
                        shadow="lg"
                        style={{
                          ...getCardStyles(theme, entityColors.chapter),
                          borderLeft: `3px solid ${entityColors.chapter}`,
                        }}
                      >
                        <Stack gap={theme.spacing.md} p={theme.spacing.lg}>
                          <Group justify="flex-start" gap="sm" style={{ marginBottom: 12, marginTop: 24 }}>
                            <Box style={{ height: 1, width: 40, background: `linear-gradient(to right, transparent, ${entityColors.chapter}40)` }} />
                            <Text className="eyebrow-label" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem' }}>
                              CHAPTER SUMMARY
                            </Text>
                            <Box style={{ height: 1, flex: 1, maxWidth: 120, background: `linear-gradient(to left, transparent, ${entityColors.chapter}20)` }} />
                          </Group>
                          {(initialChapter.description || initialChapter.summary) ? (
                            <TimelineSpoilerWrapper chapterNumber={initialChapter.number}>
                              <Box style={{ lineHeight: 1.6 }}>
                                <Text style={{ fontSize: 14, lineHeight: 1.6 }}>{initialChapter.description || initialChapter.summary}</Text>
                              </Box>
                            </TimelineSpoilerWrapper>
                          ) : (
                            <Text size="sm" c={textColors.tertiary} style={{ fontStyle: 'italic', textAlign: 'center', padding: theme.spacing.xl }}>
                              No summary available for this chapter yet. Check back later for updates!
                            </Text>
                          )}
                        </Stack>
                      </Card>

                      {/* Featured Characters Section */}
                      {initialCharacters.length > 0 && (
                        <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.character)}>
                          <Stack gap={theme.spacing.md} p={theme.spacing.md}>
                            <Group justify="flex-start" gap="sm" style={{ marginBottom: 12, marginTop: 24 }}>
                              <Box style={{ height: 1, width: 40, background: `linear-gradient(to right, transparent, ${entityColors.character}40)` }} />
                              <Text className="eyebrow-label" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem' }}>
                                FEATURED CHARACTERS
                              </Text>
                              <Box style={{ height: 1, flex: 1, maxWidth: 120, background: `linear-gradient(to left, transparent, ${entityColors.character}20)` }} />
                            </Group>
                            <Group gap={theme.spacing.sm} wrap="wrap">
                              {initialCharacters.map((character) => (
                                <Badge
                                  key={character.id}
                                  component={Link}
                                  href={`/characters/${character.id}`}
                                  variant="light"
                                  size="lg"
                                  radius="md"
                                  c={textColors.character}
                                  style={{
                                    background: getAlphaColor(entityColors.character, 0.2),
                                    border: `1px solid ${getAlphaColor(entityColors.character, 0.4)}`,
                                    textDecoration: 'none',
                                    cursor: 'pointer',
                                    transition: `all ${theme.other?.transitions?.durationShort || 200}ms ease`
                                  }}
                                >
                                  {character.name}
                                </Badge>
                              ))}
                            </Group>
                          </Stack>
                        </Card>
                      )}
                    </Stack>

                    {/* Aside column */}
                    <Stack gap={theme.spacing.sm}>
                      {/* Details card */}
                      <Box
                        style={{
                          background: '#0d1117',
                          border: '1px solid #1a1a2e',
                          borderRadius: 8,
                          padding: '16px',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                            color: '#555',
                            marginBottom: 12,
                          }}
                        >
                          Details
                        </Text>
                        <Stack gap={8}>
                          <Group justify="space-between">
                            <Text style={{ fontSize: 12, color: '#555' }}>Chapter</Text>
                            <Text style={{ fontSize: 12, color: '#aaa', fontWeight: 600 }}>#{initialChapter.number}</Text>
                          </Group>
                          {initialChapter.volume != null && (
                            <Group justify="space-between">
                              <Text style={{ fontSize: 12, color: '#555' }}>Volume</Text>
                              <Text
                                component={Link}
                                href={`/volumes/${initialChapter.volume.id}`}
                                style={{ fontSize: 12, color: entityColors.volume, fontWeight: 600, textDecoration: 'none' }}
                              >
                                Vol. {initialChapter.volume.number}
                                {initialChapter.volume.title ? `: ${initialChapter.volume.title}` : ''}
                              </Text>
                            </Group>
                          )}
                          {initialArc != null && (
                            <Group justify="space-between">
                              <Text style={{ fontSize: 12, color: '#555' }}>Arc</Text>
                              <Text
                                component={Link}
                                href={`/arcs/${initialArc.id}`}
                                style={{ fontSize: 12, color: entityColors.arc, fontWeight: 600, textDecoration: 'none' }}
                              >
                                {initialArc.name}
                              </Text>
                            </Group>
                          )}
                          <Group justify="space-between">
                            <Text style={{ fontSize: 12, color: '#555' }}>Events</Text>
                            <Text style={{ fontSize: 12, color: '#aaa', fontWeight: 600 }}>{initialEvents?.length ?? 0}</Text>
                          </Group>
                        </Stack>
                      </Box>

                      {/* Events compact list */}
                      <RelatedContentSection
                        entityType="event"
                        title="Events"
                        items={initialEvents ?? []}
                        previewCount={4}
                        getKey={(e) => e.id}
                        variant="compact"
                        getLabel={(e) => e.title}
                        getHref={(e) => `/events/${e.id}`}
                        itemDotColor={entityColors.event}
                      />

                      {/* Quotes compact list */}
                      <RelatedContentSection
                        entityType="quote"
                        title="Quotes"
                        items={initialQuotes ?? []}
                        previewCount={4}
                        getKey={(q) => q.id}
                        variant="compact"
                        getLabel={(q) => q.text?.slice(0, 60) ?? '(quote)'}
                        getHref={(q) => `/quotes/${q.id}`}
                        itemDotColor={entityColors.quote}
                      />
                    </Stack>
                  </Box>
                </Tabs.Panel>

                <Tabs.Panel value="events" pt={theme.spacing.md}>
                  <Stack gap={theme.spacing.lg}>
                    <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.event)}>
                      <Stack gap={theme.spacing.md} p={theme.spacing.md}>
                        <Group justify="flex-start" gap="sm" style={{ marginBottom: 12, marginTop: 24 }}>
                          <Box style={{ height: 1, width: 40, background: `linear-gradient(to right, transparent, ${entityColors.event}40)` }} />
                          <Text className="eyebrow-label" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem' }}>
                            CHAPTER EVENTS
                          </Text>
                          <Box style={{ height: 1, flex: 1, maxWidth: 120, background: `linear-gradient(to left, transparent, ${entityColors.event}20)` }} />
                        </Group>
                        <Stack gap={theme.spacing.sm}>
                          {Array.isArray(initialEvents) && initialEvents.map((event) => (
                            <Paper
                              key={event.id}
                              withBorder
                              radius="lg"
                              p={theme.spacing.md}
                              shadow="md"
                              style={{
                                border: `1px solid ${getAlphaColor(entityColors.event, 0.3)}`,
                                transition: `all ${theme.other?.transitions?.durationShort || 200}ms ease`
                              }}
                            >
                              <Stack gap={4}>
                                <Text
                                  component={Link}
                                  href={`/events/${event.id}`}
                                  fw={600}
                                  c={textColors.event}
                                  style={{ textDecoration: 'none' }}
                                >
                                  {event.title}
                                </Text>
                                <Text size="sm" c={textColors.tertiary} lineClamp={2}>
                                  {event.description}
                                </Text>
                              </Stack>
                            </Paper>
                          ))}
                        </Stack>
                      </Stack>
                    </Card>
                  </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="quotes" pt={theme.spacing.md}>
                  <Stack gap={theme.spacing.lg}>
                    <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.quote)}>
                      <Stack gap={theme.spacing.md} p={theme.spacing.md}>
                        <Group justify="flex-start" gap="sm" style={{ marginBottom: 12, marginTop: 24 }}>
                          <Box style={{ height: 1, width: 40, background: `linear-gradient(to right, transparent, ${entityColors.quote}40)` }} />
                          <Text className="eyebrow-label" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem' }}>
                            MEMORABLE QUOTES
                          </Text>
                          <Box style={{ height: 1, flex: 1, maxWidth: 120, background: `linear-gradient(to left, transparent, ${entityColors.quote}20)` }} />
                        </Group>
                        <Stack gap={theme.spacing.sm}>
                          {Array.isArray(initialQuotes) && initialQuotes.map((quote) => (
                            <Paper
                              key={quote.id}
                              withBorder
                              radius="lg"
                              p={theme.spacing.md}
                              shadow="md"
                              style={{
                                border: `1px solid ${getAlphaColor(entityColors.quote, 0.3)}`,
                                transition: `all ${theme.other?.transitions?.durationShort || 200}ms ease`
                              }}
                            >
                              <Stack gap={theme.spacing.sm}>
                                <Text size="sm" style={{ fontStyle: 'italic', lineHeight: 1.5 }}>
                                  &ldquo;{quote.text}&rdquo;
                                </Text>
                                <Group gap="xs" align="center">
                                  {quote.character && (
                                    <Badge
                                      component={Link}
                                      href={`/characters/${quote.character.id}`}
                                      c={entityColors.character}
                                      variant="light"
                                      radius="sm"
                                      size="sm"
                                      style={{
                                        textDecoration: 'none',
                                        cursor: 'pointer',
                                        backgroundColor: getAlphaColor(entityColors.character, 0.2),
                                        border: `1px solid ${getAlphaColor(entityColors.character, 0.4)}`
                                      }}
                                    >
                                      — {quote.character.name}
                                    </Badge>
                                  )}
                                  {quote.pageNumber && (
                                    <Badge c={entityColors.quote} variant="outline" radius="sm" size="xs">
                                      p.{quote.pageNumber}
                                    </Badge>
                                  )}
                                </Group>
                              </Stack>
                            </Paper>
                          ))}
                        </Stack>
                      </Stack>
                    </Card>
                  </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="annotations" pt={theme.spacing.md}>
                  <AnnotationSection
                    chapterReference={initialChapter.id}
                    userProgress={user?.userProgress}
                    currentUserId={user?.id}
                    isAuthenticated={!!user}
                  />
                </Tabs.Panel>
              </Tabs>
            </Card>

          </motion.div>
        </Stack>

        {/* Quick Actions for authenticated users */}
        <EntityQuickActions
          entityType="chapter"
          entityId={initialChapter.id}
          isAuthenticated={!!user}
        />
      </Container>
    </Box>
  )
}
