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
import { CinematicCard } from '../../../components/layouts/CinematicCard'
import { DetailPageHeader } from '../../../components/layouts/DetailPageHeader'
import { DocSection } from '../../../components/layouts/DocSection'
import { RecordSheet, RecordBlock, RecordLink } from '../../../components/layouts/RecordSheet'

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

  // Sequential §NN numbering for the DocSection main column, accounting for
  // sections that only render conditionally (Win Condition, Explanation, Participants).
  let sectionCounter = 2 // 01 = Description, 02 = Rules (always rendered)
  const winConditionSectionNo = initialGamble.winCondition ? String(++sectionCounter).padStart(2, '0') : undefined
  const explanationSectionNo = initialGamble.explanation ? String(++sectionCounter).padStart(2, '0') : undefined
  const participantsSectionNo = (initialGamble.factions && initialGamble.factions.length > 0)
    ? String(++sectionCounter).padStart(2, '0')
    : undefined

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

      <div>
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
                gridTemplateColumns: 'minmax(0, 1fr) 320px',
                gap: 44,
                alignItems: 'start',
              }}
              className="detail-editorial-grid"
            >
              {/* ── Main column: document ── */}
              <Box>
                <DocSection no="01" title="About This Gamble" accent={gambleColor}>
                  {initialGamble.description ? (
                    <TimelineSpoilerWrapper chapterNumber={initialGamble.chapter?.number ?? initialGamble.chapterId}>
                      <Box style={{ fontSize: 16, lineHeight: 1.7 }}>
                        <EnhancedSpoilerMarkdown content={initialGamble.description} className="gamble-description" enableEntityEmbeds compactEntityCards={false} />
                      </Box>
                    </TimelineSpoilerWrapper>
                  ) : (
                    <Text size="sm" style={{ fontStyle: 'italic', color: `${gambleColor}55` }}>
                      No description available for this gamble yet.
                    </Text>
                  )}
                </DocSection>

                <DocSection no="02" title="Rules" accent={gambleColor}>
                  <Box style={{ fontSize: 16, lineHeight: 1.7 }}>
                    <EnhancedSpoilerMarkdown content={initialGamble.rules} className="gamble-rules" enableEntityEmbeds compactEntityCards={false} />
                  </Box>
                </DocSection>

                {initialGamble.winCondition && (
                  <DocSection no={winConditionSectionNo!} title="Win Condition" accent={gambleColor}>
                    <Box
                      className="manga-panel-border"
                      style={{
                        position: 'relative',
                        padding: '1rem 1.25rem',
                        background: `${gambleColor}08`,
                        border: `1px solid ${gambleColor}30`,
                        borderRadius: '0.5rem',
                        fontSize: 14,
                        lineHeight: 1.6,
                      }}
                    >
                      <EnhancedSpoilerMarkdown content={initialGamble.winCondition} className="gamble-win-condition" enableEntityEmbeds compactEntityCards={false} />
                    </Box>
                  </DocSection>
                )}

                {initialGamble.explanation && (
                  <DocSection no={explanationSectionNo!} title="Explanation & Analysis" accent={gambleColor}>
                    <Box style={{ fontSize: 16, lineHeight: 1.7 }}>
                      <EnhancedSpoilerMarkdown content={initialGamble.explanation} className="gamble-explanation" enableEntityEmbeds compactEntityCards={false} />
                    </Box>
                  </DocSection>
                )}

                {initialGamble.factions && initialGamble.factions.length > 0 && (
                  <DocSection no={participantsSectionNo!} title="Participants" accent={gambleColor}>
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
                  </DocSection>
                )}
              </Box>

              {/* ── Aside: record sheet ── */}
              <RecordSheet
                accent={gambleColor}
                details={[
                  ...(initialGamble.chapter != null || initialGamble.chapterId != null
                    ? [{ key: 'START', value: `Ch. ${initialGamble.chapter?.number ?? initialGamble.chapterId}` }]
                    : []),
                  ...(gambleArc != null
                    ? [{
                        key: 'ARC',
                        value: gambleArc.name,
                        href: `/arcs/${gambleArc.id}`,
                        valueColor: arcColor,
                      }]
                    : []),
                  { key: 'PLAYERS', value: initialGamble.participants?.length ?? 0 },
                ]}
              >
                {(!initialGamble.factions || initialGamble.factions.length === 0) && initialGamble.participants && initialGamble.participants.length > 0 && (
                  <RecordBlock title="Participants">
                    {initialGamble.participants.slice(0, 4).map((p) => (
                      <RecordLink key={p.id} label={p.name} href={`/characters/${p.id}`} dotColor={characterColor} />
                    ))}
                  </RecordBlock>
                )}
                {initialGamble.factions && initialGamble.factions.length > 0 && (
                  <RecordBlock title="Factions">
                    {initialGamble.factions.slice(0, 4).map((f) => (
                      <RecordLink
                        key={f.id}
                        label={f.name || (f.supportedGambler ? `${f.supportedGambler.name}'s Side` : 'Faction')}
                        href="#"
                        dotColor={gambleColor}
                      />
                    ))}
                  </RecordBlock>
                )}
              </RecordSheet>
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
      </div>
    </Stack>

    </Container>
    </Box>
  )
}
