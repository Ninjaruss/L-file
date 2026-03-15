'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Stack,
  Tabs,
  Text,
  Title,
  useMantineTheme
} from '@mantine/core'
import {
  getEntityThemeColor,
  textColors,
  setTabAccentColors,
  backgroundStyles,
  getCardStyles
} from '../../../lib/mantine-theme'
import { User, Calendar, Image as ImageIcon, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { pageEnter } from '../../../lib/motion-presets'
import { usePageView } from '../../../hooks/usePageView'
import MediaGallery from '../../../components/MediaGallery'
import CharacterTimeline, { TimelineEvent } from '../../../components/CharacterTimeline'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import EnhancedSpoilerMarkdown from '../../../components/EnhancedSpoilerMarkdown'
import type { Arc, Gamble, Guide, Quote } from '../../../types'
import CharacterRelationships from '../../../components/CharacterRelationships'
import CharacterOrganizationMemberships from '../../../components/CharacterOrganizationMemberships'
import { BreadcrumbNav, createEntityBreadcrumbs } from '../../../components/Breadcrumb'
import { AnnotationSection } from '../../../components/annotations'
import { EntityQuickActions } from '../../../components/EntityQuickActions'
import { useAuth } from '../../../providers/AuthProvider'
import { AnnotationOwnerType } from '../../../types'
import { DetailPageHeader } from '../../../components/layouts/DetailPageHeader'
import { RelatedContentSection } from '../../../components/layouts/RelatedContentSection'

interface Character {
  id: number
  name: string
  alternateNames: string[] | null
  description: string | null
  backstory?: string | null
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
    order?: number
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
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const mediaId = searchParams.get('mediaId') ?? undefined

  const [activeTab, setActiveTab] = useState<string>('overview')

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (['overview', 'timeline', 'media', 'annotations'].includes(hash)) {
      setActiveTab(hash)
    } else if (hash.startsWith('annotation-')) {
      setActiveTab('annotations')
      // Scroll to the specific annotation after tab renders
      setTimeout(() => {
        const el = document.getElementById(hash)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 600)
    }
  }, [])

  usePageView('character', character.id.toString(), true)

  useEffect(() => {
    setTabAccentColors('character')
  }, [])

  useEffect(() => {
    const newHash = activeTab === 'overview' ? '' : `#${activeTab}`
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search
      window.history.replaceState(null, '', currentPath + newHash)
    }
  }, [activeTab])

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (['overview', 'timeline', 'media', 'annotations'].includes(hash)) {
        setActiveTab(hash)
      } else if (hash.startsWith('annotation-')) {
        setActiveTab('annotations')
        setTimeout(() => {
          const el = document.getElementById(hash)
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 600)
      } else if (!hash) {
        setActiveTab('overview')
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const entityColors = {
    character: getEntityThemeColor(theme, 'character'),
    arc: getEntityThemeColor(theme, 'arc'),
    gamble: getEntityThemeColor(theme, 'gamble'),
    guide: getEntityThemeColor(theme, 'guide'),
    quote: getEntityThemeColor(theme, 'quote'),
    media: getEntityThemeColor(theme, 'media'),
    organization: getEntityThemeColor(theme, 'organization')
  }

  return (
    <Box style={{
      backgroundColor: backgroundStyles.page(theme),
      minHeight: '100vh',
      color: textColors.primary
    }}>
    <Container size="lg" py="md" style={{ backgroundColor: backgroundStyles.container(theme) }}>
    <Stack gap={theme.spacing.md}>
      <BreadcrumbNav
        items={createEntityBreadcrumbs('character', character.name)}
        entityType="character"
      />

      {/* Enhanced Character Header */}
      <DetailPageHeader
        entityType="character"
        entityId={character.id}
        entityName={character.name}
        stats={[
          { value: gambles.length, label: 'Gambles' },
          ...(character.firstAppearanceChapter != null
            ? [{ value: `Ch. ${character.firstAppearanceChapter}`, label: 'Debut' }]
            : []),
          { value: arcs.length, label: 'Arcs' },
        ].slice(0, 3)}
        tags={[
          ...(character.organizations?.map((o) => ({
            label: o.name,
            variant: 'accent' as const,
          })) ?? []),
        ]}
        spoilerChapter={character.firstAppearanceChapter}
      />

      <motion.div {...pageEnter}>
        <Card withBorder radius="lg" className="gambling-card" shadow="xl" style={getCardStyles(theme)}>
        <Tabs
          value={activeTab}
          onChange={(value) => value && setActiveTab(value)}
          keepMounted={false}
          variant="pills"
          className="character-tabs"
        >
          <Tabs.List>
            <Tabs.Tab value="overview" leftSection={<User size={16} />}>Overview</Tabs.Tab>
            {events.length > 0 && (
              <Tabs.Tab
                value="timeline"
                leftSection={<Calendar size={16} />}
                rightSection={<Badge size="xs" variant="light" c={entityColors.character}>{events.length}</Badge>}
              >
                Timeline
              </Tabs.Tab>
            )}
            <Tabs.Tab value="media" leftSection={<ImageIcon size={16} />}>Media</Tabs.Tab>
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
              {/* ── Main column ── */}
              <Stack gap={theme.spacing.md}>
                {/* Description */}
                <Card
                  withBorder
                  radius="lg"
                  shadow="lg"
                  style={{
                    ...getCardStyles(theme, entityColors.character),
                    borderLeft: `3px solid ${entityColors.character}`,
                  }}
                >
                  <Stack gap={theme.spacing.md} p={theme.spacing.lg}>
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        color: '#555',
                      }}
                    >
                      Description
                    </Text>
                    {character.description ? (
                      <TimelineSpoilerWrapper chapterNumber={character.firstAppearanceChapter ?? undefined}>
                        <Box style={{ lineHeight: 1.6, fontSize: 14 }}>
                          <EnhancedSpoilerMarkdown
                            content={character.description}
                            enableEntityEmbeds
                            compactEntityCards={false}
                          />
                        </Box>
                      </TimelineSpoilerWrapper>
                    ) : (
                      <Text size="sm" c={textColors.tertiary} style={{ fontStyle: 'italic' }}>
                        No description available yet.
                      </Text>
                    )}
                  </Stack>
                </Card>

                {/* Backstory */}
                {character.backstory && (
                  <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.character)}>
                    <Stack gap={theme.spacing.md} p={theme.spacing.lg}>
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '2px',
                          color: '#555',
                        }}
                      >
                        Backstory
                      </Text>
                      <TimelineSpoilerWrapper chapterNumber={character.firstAppearanceChapter ?? undefined}>
                        <Box style={{ lineHeight: 1.6, fontSize: 14 }}>
                          <EnhancedSpoilerMarkdown
                            content={character.backstory}
                            enableEntityEmbeds
                            compactEntityCards={false}
                          />
                        </Box>
                      </TimelineSpoilerWrapper>
                    </Stack>
                  </Card>
                )}

                {/* Relationships */}
                <CharacterRelationships characterId={character.id} characterName={character.name} />

                {/* Organization memberships */}
                {character.organizations && character.organizations.length > 0 && (
                  <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.organization)}>
                    <Stack gap={theme.spacing.md} p={theme.spacing.md}>
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '2px',
                          color: '#555',
                        }}
                      >
                        Organizations
                      </Text>
                      <CharacterOrganizationMemberships
                        characterId={character.id}
                        characterName={character.name}
                      />
                    </Stack>
                  </Card>
                )}
              </Stack>

              {/* ── Aside column ── */}
              <Stack gap={theme.spacing.sm}>
                {/* Details card */}
                <Card
                  withBorder
                  radius="lg"
                  shadow="md"
                  style={{ background: '#111', border: '1px solid #1a1a1a' }}
                  p="md"
                >
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '2px',
                      color: '#555',
                      marginBottom: 10,
                    }}
                  >
                    Details
                  </Text>
                  <Stack gap={0}>
                    {character.firstAppearanceChapter != null && (
                      <Group
                        justify="space-between"
                        style={{ padding: '7px 0', borderBottom: '1px solid #191919' }}
                      >
                        <Text style={{ fontSize: 13, color: '#444' }}>Debut</Text>
                        <Text style={{ fontSize: 13, color: entityColors.character, fontWeight: 600 }}>
                          Ch. {character.firstAppearanceChapter}
                        </Text>
                      </Group>
                    )}
                    {character.organizations && character.organizations.length > 0 && (
                      <Group
                        justify="space-between"
                        style={{ padding: '7px 0', borderBottom: '1px solid #191919' }}
                      >
                        <Text style={{ fontSize: 13, color: '#444' }}>Organization</Text>
                        <Text style={{ fontSize: 13, color: '#999', fontWeight: 600 }}>
                          {character.organizations[0].name}
                        </Text>
                      </Group>
                    )}
                    <Group
                      justify="space-between"
                      style={{ padding: '7px 0', borderBottom: '1px solid #191919' }}
                    >
                      <Text style={{ fontSize: 13, color: '#444' }}>Gambles</Text>
                      <Text style={{ fontSize: 13, color: entityColors.character, fontWeight: 600 }}>
                        {gambles.length}
                      </Text>
                    </Group>
                    <Group justify="space-between" style={{ padding: '7px 0' }}>
                      <Text style={{ fontSize: 13, color: '#444' }}>Arcs</Text>
                      <Text style={{ fontSize: 13, color: entityColors.character, fontWeight: 600 }}>
                        {arcs.length}
                      </Text>
                    </Group>
                  </Stack>
                </Card>

                {/* Story Arcs compact */}
                {arcs.length > 0 && (
                  <Card
                    withBorder
                    radius="lg"
                    shadow="md"
                    style={{ background: '#111', border: '1px solid #1a1a1a' }}
                    p="md"
                  >
                    <RelatedContentSection
                      entityType="arc"
                      title="Story Arcs"
                      items={arcs}
                      previewCount={4}
                      viewAllHref={`/arcs?character=${character.name}`}
                      getKey={(arc) => arc.id}
                      variant="compact"
                      getLabel={(arc) => arc.name}
                      getHref={(arc) => `/arcs/${arc.id}`}
                      itemDotColor={entityColors.arc}
                    />
                  </Card>
                )}

                {/* Gambles compact */}
                {gambles.length > 0 && (
                  <Card
                    withBorder
                    radius="lg"
                    shadow="md"
                    style={{ background: '#111', border: '1px solid #1a1a1a' }}
                    p="md"
                  >
                    <RelatedContentSection
                      entityType="gamble"
                      title="Gambles"
                      items={gambles}
                      previewCount={4}
                      viewAllHref={`/gambles?character=${character.name}`}
                      getKey={(g) => g.id}
                      variant="compact"
                      getLabel={(g) => g.name}
                      getHref={(g) => `/gambles/${g.id}`}
                      itemDotColor={entityColors.gamble}
                    />
                  </Card>
                )}

                {/* Quotes compact */}
                {quotes && quotes.length > 0 && (
                  <Card
                    withBorder
                    radius="lg"
                    shadow="md"
                    style={{ background: '#111', border: '1px solid #1a1a1a' }}
                    p="md"
                  >
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
                  </Card>
                )}
              </Stack>
            </Box>
          </Tabs.Panel>

          <Tabs.Panel value="timeline" pt={theme.spacing.md}>
            <CharacterTimeline
              events={events}
              arcs={arcs}
              characterName={character.name}
              firstAppearanceChapter={character.firstAppearanceChapter ?? 0}
            />
          </Tabs.Panel>

          <Tabs.Panel value="media" pt={theme.spacing.md}>
            <Stack gap="md">
              <Card withBorder radius="lg" shadow="lg" style={getCardStyles(theme, entityColors.media)}>
                <Stack gap="md" p="md">
                  <Group justify="space-between" align="center">
                    <Group gap="sm">
                      <ImageIcon size={20} color={entityColors.media} />
                      <Title order={4} c={textColors.media}>Media Gallery</Title>
                    </Group>
                    <Button
                      component={Link}
                      href={`/media?ownerType=character&ownerId=${character.id}`}
                      variant="outline"
                      c={entityColors.media}
                      size="sm"
                      radius="xl"
                    >
                      View All
                    </Button>
                  </Group>
                  <MediaGallery
                    ownerType="character"
                    ownerId={character.id}
                    purpose="gallery"
                    limit={8}
                    showTitle={false}
                    compactMode
                    showFilters={false}
                    initialMediaId={mediaId}
                  />
                </Stack>
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="annotations" pt={theme.spacing.md}>
            <AnnotationSection
              ownerType={AnnotationOwnerType.CHARACTER}
              ownerId={character.id}
              userProgress={user?.userProgress}
              currentUserId={user?.id}
              isAuthenticated={!!user}
            />
          </Tabs.Panel>
        </Tabs>
      </Card>
      </motion.div>
    </Stack>

    <EntityQuickActions
      entityType="character"
      entityId={character.id}
      isAuthenticated={!!user}
    />
    </Container>
    </Box>
  )
}
