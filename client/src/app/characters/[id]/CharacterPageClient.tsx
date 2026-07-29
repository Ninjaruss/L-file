'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Badge,
  Box,
  Card,
  Container,
  Group,
  Stack,
  Tabs,
  Text,
  useMantineTheme
} from '@mantine/core'
import {
  getEntityThemeColor,
  textColors,
  setTabAccentColors,
  backgroundStyles,
} from '../../../lib/mantine-theme'
import { CinematicCard } from '../../../components/layouts/CinematicCard'
import { User, Calendar, Image as ImageIcon, MessageSquare } from 'lucide-react'
import Link from 'next/link'
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
import { useAuth } from '../../../providers/AuthProvider'
import { AnnotationOwnerType } from '../../../types'
import { DetailPageHeader } from '../../../components/layouts/DetailPageHeader'
import { DocSection } from '../../../components/layouts/DocSection'
import { RecordSheet, RecordBlock, RecordLink } from '../../../components/layouts/RecordSheet'

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
        subtitle={character.alternateNames?.length ? character.alternateNames.join(' · ') : undefined}
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

      <div>
        <Card withBorder radius="lg" className="gambling-card" shadow="xl">
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
                gridTemplateColumns: 'minmax(0, 1fr) 320px',
                gap: 44,
                alignItems: 'start',
              }}
              className="detail-editorial-grid"
            >
              {/* ── Main column: document ── */}
              <Box>
                <DocSection no="01" title="Description" accent={entityColors.character}>
                  {character.description ? (
                    <TimelineSpoilerWrapper chapterNumber={character.firstAppearanceChapter ?? undefined}>
                      <Box style={{ lineHeight: 1.7, fontSize: 16 }}>
                        <EnhancedSpoilerMarkdown
                          content={character.description}
                          enableEntityEmbeds
                          compactEntityCards={false}
                        />
                      </Box>
                    </TimelineSpoilerWrapper>
                  ) : (
                    <Text size="sm" style={{ fontStyle: 'italic', color: `${entityColors.character}55` }}>
                      No description available yet.
                    </Text>
                  )}
                </DocSection>

                {character.backstory && (
                  <DocSection no="02" title="Backstory" accent={entityColors.character}>
                    <TimelineSpoilerWrapper chapterNumber={character.firstAppearanceChapter ?? undefined}>
                      <Box style={{ lineHeight: 1.7, fontSize: 16 }}>
                        <EnhancedSpoilerMarkdown content={character.backstory} enableEntityEmbeds compactEntityCards={false} />
                      </Box>
                    </TimelineSpoilerWrapper>
                  </DocSection>
                )}

                <DocSection no={character.backstory ? '03' : '02'} title="Relationships" accent={entityColors.character}>
                  <CharacterRelationships characterId={character.id} characterName={character.name} />
                </DocSection>

                {character.organizations && character.organizations.length > 0 && (
                  <DocSection no={character.backstory ? '04' : '03'} title="Organizations" accent={entityColors.organization}>
                    <CharacterOrganizationMemberships characterId={character.id} characterName={character.name} />
                  </DocSection>
                )}
              </Box>

              {/* ── Aside: record sheet ── */}
              <RecordSheet
                accent={entityColors.character}
                details={[
                  ...(character.firstAppearanceChapter != null
                    ? [{ key: 'DEBUT', value: `Ch. ${character.firstAppearanceChapter}` }]
                    : []),
                  ...(character.organizations && character.organizations.length > 0
                    ? [{
                        key: 'ORGANIZATION',
                        value: character.organizations[0].name,
                        href: `/organizations/${character.organizations[0].id}`,
                        valueColor: entityColors.organization,
                      }]
                    : []),
                  { key: 'GAMBLES', value: gambles.length },
                  { key: 'ARCS', value: arcs.length },
                ]}
              >
                {arcs.length > 0 && (
                  <RecordBlock title="Story Arcs">
                    {arcs.slice(0, 4).map((arc) => (
                      <RecordLink key={arc.id} label={arc.name} href={`/arcs/${arc.id}`} dotColor={entityColors.arc} />
                    ))}
                  </RecordBlock>
                )}
                {gambles.length > 0 && (
                  <RecordBlock title="Gambles">
                    {gambles.slice(0, 4).map((g) => (
                      <RecordLink key={g.id} label={g.name} href={`/gambles/${g.id}`} dotColor={entityColors.gamble} />
                    ))}
                  </RecordBlock>
                )}
                {quotes && quotes.length > 0 && quotes[0].text && (
                  <RecordBlock title="Quotes">
                    <Box style={{ padding: '4px 18px 16px' }}>
                      <Box style={{ fontFamily: 'var(--font-editorial-serif)', fontStyle: 'italic', fontSize: 16, lineHeight: 1.5, color: '#fff' }}>
                        <span style={{ color: entityColors.quote, fontSize: 22 }}>&ldquo;</span>
                        {quotes[0].text?.slice(0, 160)}&rdquo;
                      </Box>
                    </Box>
                  </RecordBlock>
                )}
              </RecordSheet>
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
            <CinematicCard entityColor={entityColors.media} padding="md">
              <Group justify="space-between" align="center" mb={14}>
                <Box
                  style={{
                    fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase',
                    borderRadius: 4, padding: '3px 8px',
                    background: `${entityColors.media}18`, border: `1px solid ${entityColors.media}30`, color: entityColors.media,
                  }}
                >
                  Media Gallery
                </Box>
                <Box
                  component={Link}
                  href={`/media?ownerType=character&ownerId=${character.id}`}
                  style={{ fontSize: 11, color: `${entityColors.media}88`, textDecoration: 'none' }}
                >
                  View All →
                </Box>
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
            </CinematicCard>
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
      </div>
    </Stack>

    </Container>
    </Box>
  )
}
