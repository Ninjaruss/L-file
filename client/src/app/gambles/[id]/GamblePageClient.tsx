'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Badge,
  Box,
  Card,
  Container,
  Group,
  Loader,
  Stack,
  Tabs,
  Text,
  useMantineTheme
} from '@mantine/core'
import { Users, Calendar, BookOpen, Image as ImageIcon, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import EnhancedSpoilerMarkdown from '../../../components/EnhancedSpoilerMarkdown'
import { motion } from 'motion/react'
import { pageEnter } from '../../../lib/motion-presets'
import { usePageView } from '../../../hooks/usePageView'
import TimelineSpoilerWrapper from '../../../components/TimelineSpoilerWrapper'
import GambleTimeline from '../../../components/GambleTimeline'
import MediaGallery from '../../../components/MediaGallery'
import ErrorBoundary from '../../../components/ErrorBoundary'
import { GambleStructuredData } from '../../../components/StructuredData'
import { BreadcrumbNav, createEntityBreadcrumbs } from '../../../components/Breadcrumb'
import { api } from '../../../lib/api'
import { AnnotationSection } from '../../../components/annotations'
import { useAuth } from '../../../providers/AuthProvider'
import { AnnotationOwnerType } from '../../../types'
import {
  getEntityThemeColor,
  textColors,
  getAlphaColor,
  setTabAccentColors,
  backgroundStyles,
} from '../../../lib/mantine-theme'
import { CinematicCard, CinematicSectionHeader } from '../../../components/layouts/CinematicCard'
import { DetailPageHeader } from '../../../components/layouts/DetailPageHeader'
import { RelatedContentSection } from '../../../components/layouts/RelatedContentSection'

interface GambleFactionMember {
  id: number
  characterId: number
  character: {
    id: number
    name: string
    description?: string
    alternateNames?: string[]
  }
  role?: 'leader' | 'member' | 'supporter' | 'observer' | null
  displayOrder: number
}

interface GambleFaction {
  id: number
  name?: string | null
  supportedGamblerId?: number | null
  supportedGambler?: {
    id: number
    name: string
  } | null
  members: GambleFactionMember[]
  displayOrder: number
}

interface Gamble {
  id: number
  name: string
  description?: string
  rules: string
  winCondition?: string
  explanation?: string
  chapterId: number
  participants?: Array<{
    id: number
    name: string
    description?: string
    alternateNames?: string[]
  }>
  factions?: GambleFaction[]
  chapter?: {
    id: number
    number: number
    title?: string
  }
  createdAt: string
  updatedAt: string
}

interface GamblePageClientProps {
  initialGamble: Gamble
}

interface GambleTimelineEvent {
  id: number
  title: string
  description: string | null
  chapterNumber: number
  type: 'gamble' | 'decision' | 'reveal' | 'shift' | 'resolution' | null
  arcId: number
  arcName: string
  isSpoiler?: boolean
  spoilerChapter?: number
  gambleId?: number
  characters?: Array<{ id: number; name: string }>
}

interface TimelineArc {
  id: number
  name: string
  description: string | null
  startChapter: number
  endChapter: number | null
}

export default function GamblePageClient({ initialGamble }: GamblePageClientProps) {
  const theme = useMantineTheme()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const mediaId = searchParams.get('mediaId') ?? undefined
  const gambleColor = getEntityThemeColor(theme, 'gamble')
  const characterColor = getEntityThemeColor(theme, 'character')
  const arcColor = getEntityThemeColor(theme, 'arc')
  const [timelineEvents, setTimelineEvents] = useState<GambleTimelineEvent[]>([])
  const [arcs, setArcs] = useState<TimelineArc[]>([])
  const [timelineLoading, setTimelineLoading] = useState(false)

  const gambleArc = arcs.find(a =>
    initialGamble.chapter &&
    a.startChapter <= initialGamble.chapter.number &&
    (a.endChapter === null || a.endChapter >= initialGamble.chapter.number)
  )

  const [activeTab, setActiveTab] = useState<string>('overview')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1)
      if (['overview', 'timeline', 'media', 'annotations'].includes(hash)) {
        setActiveTab(hash)
      } else if (hash.startsWith('annotation-')) {
        setActiveTab('annotations')
        setTimeout(() => {
          const el = document.getElementById(hash)
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 600)
      }
    }
  }, [])

  usePageView('gamble', initialGamble.id.toString(), true)

  useEffect(() => {
    setTabAccentColors('gamble')
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

  useEffect(() => {
    const fetchTimelineData = async () => {
      try {
        setTimelineLoading(true)
        const [eventsResponse, arcsResponse] = await Promise.all([
          api.getEvents({ limit: 100 }),
          api.getArcs({ limit: 100 })
        ])

        const gambleChapter = initialGamble.chapter?.number || initialGamble.chapterId
        const filteredEvents = eventsResponse.data.filter((event: GambleTimelineEvent) => {
          if (event.gambleId === initialGamble.id) return true
          if (event.chapterNumber === gambleChapter) return true
          return false
        })

        setTimelineEvents(filteredEvents)
        setArcs(arcsResponse.data || [])
      } catch (error: unknown) {
        console.error('Failed to fetch timeline data:', error)
      } finally {
        setTimelineLoading(false)
      }
    }

    fetchTimelineData()
  }, [initialGamble])

  return (
    <Box style={{
      backgroundColor: backgroundStyles.page(theme),
      minHeight: '100vh',
      color: textColors.primary
    }}>
    <Container size="lg" py="md" style={{ backgroundColor: backgroundStyles.container(theme) }}>
    <Stack gap={theme.spacing.md}>
      <GambleStructuredData
        gamble={{
          id: initialGamble.id,
          name: initialGamble.name,
          description: initialGamble.description
        }}
      />

      <BreadcrumbNav
        items={createEntityBreadcrumbs('gamble', initialGamble.name)}
        entityType="gamble"
      />

      {/* Enhanced Gamble Header */}
      <DetailPageHeader
        entityType="gamble"
        entityId={initialGamble.id}
        entityName={initialGamble.name}
        stats={[
          { value: initialGamble.participants?.length ?? 0, label: 'Players' },
          ...(initialGamble.chapter != null
            ? [{ value: `Ch. ${initialGamble.chapter.number}`, label: 'Start' }]
            : initialGamble.chapterId != null
            ? [{ value: `Ch. ${initialGamble.chapterId}`, label: 'Start' }]
            : []),
          ...(gambleArc != null
            ? [{ value: gambleArc.name, label: 'Arc' }]
            : []),
        ].slice(0, 3)}
        spoilerChapter={initialGamble.chapter?.number ?? initialGamble.chapterId}
      />

      <motion.div {...pageEnter}>
        <Card withBorder radius="lg" className="gambling-card" shadow="xl" style={{
          background: backgroundStyles.card,
          border: `1px solid ${getAlphaColor(gambleColor, 0.4)}`
        }}>
        <Tabs
          value={activeTab}
          onChange={(value) => value && setActiveTab(value)}
          keepMounted={false}
          variant="pills"
          className="gamble-tabs"
        >
          <Tabs.List>
            <Tabs.Tab value="overview" leftSection={<BookOpen size={16} />}>Overview</Tabs.Tab>
            {(timelineEvents.length > 0 || timelineLoading) && (
              <Tabs.Tab
                value="timeline"
                leftSection={<Calendar size={16} />}
                rightSection={timelineEvents.length > 0 ? <Badge size="xs" variant="light" c={gambleColor}>{timelineEvents.length}</Badge> : null}
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
              {/* Main column */}
              <Stack gap={theme.spacing.md}>
                {/* Gamble Description */}
                <CinematicCard entityColor={gambleColor}>
                  <CinematicSectionHeader label="About This Gamble" entityColor={gambleColor} />
                  {initialGamble.description ? (
                    <TimelineSpoilerWrapper chapterNumber={initialGamble.chapter?.number ?? initialGamble.chapterId}>
                      <Box style={{ fontSize: 14, lineHeight: 1.6 }}>
                        <EnhancedSpoilerMarkdown content={initialGamble.description} className="gamble-description" enableEntityEmbeds compactEntityCards={false} />
                      </Box>
                    </TimelineSpoilerWrapper>
                  ) : (
                    <Text size="sm" style={{ fontStyle: 'italic', textAlign: 'center', padding: '24px 0', color: `${gambleColor}55` }}>
                      No description available for this gamble yet.
                    </Text>
                  )}
                </CinematicCard>

                {/* Rules */}
                <CinematicCard entityColor={gambleColor}>
                  <CinematicSectionHeader label="Rules" entityColor={gambleColor} />
                  <Box style={{ fontSize: 14, lineHeight: 1.6 }}>
                    <EnhancedSpoilerMarkdown content={initialGamble.rules} className="gamble-rules" enableEntityEmbeds compactEntityCards={false} />
                  </Box>
                </CinematicCard>

                {/* Win Condition */}
                {initialGamble.winCondition && (
                  <CinematicCard entityColor={gambleColor}>
                    <CinematicSectionHeader label="Win Condition" entityColor={gambleColor} />
                    <Box
                      className="manga-panel-border"
                      style={{
                        position: 'relative',
                        padding: '1rem 1.25rem',
                        background: `${gambleColor}08`,
                        border: `1px solid ${gambleColor}30`,
                        borderRadius: '0.5rem',
                        marginTop: 12,
                        fontSize: 14,
                        lineHeight: 1.6,
                      }}
                    >
                      <EnhancedSpoilerMarkdown content={initialGamble.winCondition} className="gamble-win-condition" enableEntityEmbeds compactEntityCards={false} />
                    </Box>
                  </CinematicCard>
                )}

                {/* Explanation & Analysis */}
                {initialGamble.explanation && (
                  <CinematicCard entityColor={gambleColor}>
                    <CinematicSectionHeader label="Explanation & Analysis" entityColor={gambleColor} />
                    <Box style={{ fontSize: 14, lineHeight: 1.6 }}>
                      <EnhancedSpoilerMarkdown content={initialGamble.explanation} className="gamble-explanation" enableEntityEmbeds compactEntityCards={false} />
                    </Box>
                  </CinematicCard>
                )}

                {/* Participants - Factions (full detail view stays in main column) */}
                {initialGamble.factions && initialGamble.factions.length > 0 && (
                  <CinematicCard entityColor={gambleColor}>
                    <CinematicSectionHeader label="Participants" entityColor={gambleColor} />
                    {(() => {
                      const sorted = [...initialGamble.factions!].sort((a, b) => a.displayOrder - b.displayOrder)
                      const mainSides = sorted.filter(f => f.supportedGambler != null)
                      const thirdParties = sorted.filter(f => f.supportedGambler == null)

                      // Color palette for main sides (cycle through entity colors)
                      const sideColors = [gambleColor, characterColor, arcColor]

                      const renderMemberRow = (member: GambleFactionMember, factionAccent: string, isLast: boolean) => (
                        <Link key={member.id} href={`/characters/${member.character.id}`} style={{ textDecoration: 'none' }}>
                          <Box style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: isLast ? 'none' : '1px solid #161616', cursor: 'pointer' }}>
                            <Box style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${factionAccent}20`, border: `1px solid ${factionAccent}40`, fontSize: 9, fontWeight: 700, color: factionAccent }}>
                              {member.character.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                            </Box>
                            <Text style={{ fontSize: 12, fontWeight: 600, color: '#ddd' }}>{member.character.name}</Text>
                            {member.role && (
                              <Box style={{ marginLeft: 'auto', background: '#1a1a1a', border: '1px solid #252525', borderRadius: 20, padding: '2px 8px', fontSize: 10, color: '#555', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                                {member.role}
                              </Box>
                            )}
                          </Box>
                        </Link>
                      )

                      const renderFactionBlock = (faction: GambleFaction, factionAccent: string) => {
                        const factionName = faction.name || (faction.supportedGambler ? `${faction.supportedGambler.name}'s Side` : 'Faction')
                        const membersSorted = [...faction.members].sort((a, b) => a.displayOrder - b.displayOrder)
                        return (
                          <Box style={{ flex: 1, minWidth: 0, border: '1px solid #1e1e1e', borderRadius: 12, overflow: 'hidden' }}>
                            <Box style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, background: `${factionAccent}10`, borderBottom: `1px solid ${factionAccent}20` }}>
                              <Box style={{ width: 8, height: 8, borderRadius: '50%', background: factionAccent, flexShrink: 0 }} />
                              <Text style={{ fontSize: 13, fontWeight: 700, color: '#ddd' }}>{factionName}</Text>
                            </Box>
                            <Box style={{ padding: '6px 0', background: '#0e0e0e', paddingLeft: 12, paddingRight: 12 }}>
                              {membersSorted.map((member, mIdx) => renderMemberRow(member, factionAccent, mIdx === membersSorted.length - 1))}
                            </Box>
                          </Box>
                        )
                      }

                      return (
                        <Box style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {/* Main sides */}
                          {mainSides.length === 2 ? (
                            // VS layout
                            <Box style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
                              {renderFactionBlock(mainSides[0], sideColors[0])}
                              <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 6px', gap: 4, flexShrink: 0 }}>
                                <Box style={{ flex: 1, width: 1, minHeight: 30, background: 'linear-gradient(to bottom, transparent, #333 40%, #333 60%, transparent)' }} />
                                <Text style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', fontWeight: 800, color: '#e11d48', textShadow: '0 0 14px rgba(225,29,72,0.5)', letterSpacing: '0.05em' }}>VS</Text>
                                <Box style={{ flex: 1, width: 1, minHeight: 30, background: 'linear-gradient(to bottom, transparent, #333 40%, #333 60%, transparent)' }} />
                              </Box>
                              {renderFactionBlock(mainSides[1], sideColors[1])}
                            </Box>
                          ) : mainSides.length >= 3 ? (
                            // Equal-column grid
                            <Box style={{ display: 'grid', gridTemplateColumns: mainSides.map(() => '1fr').join(' '), gap: 8 }}>
                              {mainSides.map((faction, idx) => (
                                <React.Fragment key={faction.id}>
                                  {renderFactionBlock(faction, sideColors[idx % sideColors.length])}
                                </React.Fragment>
                              ))}
                            </Box>
                          ) : mainSides.length === 1 ? (
                            // Single main side — full width
                            renderFactionBlock(mainSides[0], sideColors[0])
                          ) : null}

                          {/* Third parties — full-width muted grey blocks */}
                          {thirdParties.map((faction) => {
                            const factionName = faction.name || 'Third Party'
                            const membersSorted = [...faction.members].sort((a, b) => a.displayOrder - b.displayOrder)
                            return (
                              <Box key={faction.id} style={{ border: '1px solid #282828', borderRadius: 12, overflow: 'hidden' }}>
                                <Box style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, background: '#181818', borderBottom: '1px solid #242424' }}>
                                  <Box style={{ width: 8, height: 8, borderRadius: '50%', background: '#444', flexShrink: 0 }} />
                                  <Text style={{ fontSize: 13, fontWeight: 700, color: '#888' }}>{factionName}</Text>
                                  <Box style={{ marginLeft: 'auto', background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 3, padding: '1px 6px', fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    Third Party
                                  </Box>
                                </Box>
                                <Box style={{ padding: '6px 12px', background: '#0d0d0d' }}>
                                  {membersSorted.map((member, mIdx) => (
                                    <Link key={member.id} href={`/characters/${member.character.id}`} style={{ textDecoration: 'none' }}>
                                      <Box style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: mIdx < membersSorted.length - 1 ? '1px solid #141414' : 'none' }}>
                                        <Box style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#252525', border: '1px solid #2e2e2e', fontSize: 9, fontWeight: 700, color: '#777' }}>
                                          {member.character.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                        </Box>
                                        <Text style={{ fontSize: 12, fontWeight: 600, color: '#888' }}>{member.character.name}</Text>
                                        {member.role && (
                                          <Box style={{ marginLeft: 'auto', background: '#1a1a1a', border: '1px solid #252525', borderRadius: 20, padding: '2px 8px', fontSize: 10, color: '#444', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                                            {member.role}
                                          </Box>
                                        )}
                                      </Box>
                                    </Link>
                                  ))}
                                </Box>
                              </Box>
                            )
                          })}
                        </Box>
                      )
                    })()}
                  </CinematicCard>
                )}
              </Stack>

              {/* Aside column */}
              <Stack gap={theme.spacing.sm}>
                {/* Details card */}
                <CinematicCard entityColor={gambleColor} padding="md">
                  <CinematicSectionHeader label="Details" entityColor={gambleColor} />
                  {(initialGamble.chapter != null || initialGamble.chapterId != null) && (
                    <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${gambleColor}14` }}>
                      <Box style={{ width: 5, height: 5, borderRadius: '50%', background: gambleColor, flexShrink: 0 }} />
                      <Text style={{ fontSize: 11, color: `${gambleColor}66`, flex: 1 }}>Start</Text>
                      <Text style={{ fontSize: 12, fontWeight: 700, color: gambleColor }}>Ch. {initialGamble.chapter?.number ?? initialGamble.chapterId}</Text>
                    </Box>
                  )}
                  {gambleArc != null && (
                    <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${gambleColor}14` }}>
                      <Box style={{ width: 5, height: 5, borderRadius: '50%', background: gambleColor, flexShrink: 0 }} />
                      <Text style={{ fontSize: 11, color: `${gambleColor}66`, flex: 1 }}>Arc</Text>
                      <Text component={Link} href={`/arcs/${gambleArc.id}`} style={{ fontSize: 12, fontWeight: 700, color: arcColor, textDecoration: 'none' }}>{gambleArc.name}</Text>
                    </Box>
                  )}
                  <Box style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                    <Box style={{ width: 5, height: 5, borderRadius: '50%', background: gambleColor, flexShrink: 0 }} />
                    <Text style={{ fontSize: 11, color: `${gambleColor}66`, flex: 1 }}>Players</Text>
                    <Text style={{ fontSize: 12, fontWeight: 700, color: gambleColor }}>{initialGamble.participants?.length ?? 0}</Text>
                  </Box>
                </CinematicCard>

                {/* Participants compact list (when no factions) */}
                {(!initialGamble.factions || initialGamble.factions.length === 0) && initialGamble.participants && initialGamble.participants.length > 0 && (
                  <RelatedContentSection
                    entityType="character"
                    title="Participants"
                    items={initialGamble.participants ?? []}
                    previewCount={4}
                    getKey={(p) => p.id}
                    variant="compact"
                    getLabel={(p) => p.name}
                    getHref={(p) => `/characters/${p.id}`}
                    itemDotColor={characterColor}
                  />
                )}

                {/* Factions compact list (when factions exist) */}
                {initialGamble.factions && initialGamble.factions.length > 0 && (
                  <RelatedContentSection
                    entityType="character"
                    title="Factions"
                    items={initialGamble.factions}
                    previewCount={4}
                    getKey={(f) => f.id}
                    variant="compact"
                    getLabel={(f) => f.name || (f.supportedGambler ? `${f.supportedGambler.name}'s Side` : 'Faction')}
                    getHref={() => `#`}
                    itemDotColor={gambleColor}
                  />
                )}
              </Stack>
            </Box>
          </Tabs.Panel>

          <Tabs.Panel value="timeline" pt="md">
            {timelineLoading ? (
              <Box style={{ display: 'flex', justifyContent: 'center', paddingBlock: '2rem' }}>
                <Loader c={gambleColor} />
              </Box>
            ) : (
              <GambleTimeline
                events={timelineEvents}
                arcs={arcs}
                gambleName={initialGamble.name}
                gambleChapter={initialGamble.chapter?.number ?? initialGamble.chapterId}
              />
            )}
          </Tabs.Panel>

          <Tabs.Panel value="media" pt={theme.spacing.md}>
            <Stack gap="md">
              <CinematicCard entityColor={gambleColor} padding="md">
                <Group justify="space-between" align="center" mb={14}>
                  <Box style={{ fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase', borderRadius: 4, padding: '3px 8px', background: `${gambleColor}18`, border: `1px solid ${gambleColor}30`, color: gambleColor }}>
                    Media Gallery
                  </Box>
                  <Box component={Link} href={`/media?ownerType=gamble&ownerId=${initialGamble.id}`} style={{ fontSize: 11, color: `${gambleColor}88`, textDecoration: 'none' }}>
                    View All →
                  </Box>
                </Group>
                <ErrorBoundary>
                  <MediaGallery
                    ownerType="gamble"
                    ownerId={initialGamble.id}
                    purpose="gallery"
                    limit={8}
                    showTitle={false}
                    compactMode
                    showFilters={false}
                    initialMediaId={mediaId}
                  />
                </ErrorBoundary>
              </CinematicCard>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="annotations" pt={theme.spacing.md}>
            <AnnotationSection
              ownerType={AnnotationOwnerType.GAMBLE}
              ownerId={initialGamble.id}
              userProgress={user?.userProgress}
              currentUserId={user?.id}
              isAuthenticated={!!user}
            />
          </Tabs.Panel>
        </Tabs>
      </Card>
      </motion.div>
    </Stack>

    </Container>
    </Box>
  )
}
