'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Loader,
  Pagination,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
  Group,
  rem,
  useMantineTheme
} from '@mantine/core'
import { getEntityThemeColor, backgroundStyles, getHeroStyles, getCardStyles } from '../../lib/mantine-theme'
import { AlertCircle, Search, BookOpen, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { api } from '../../lib/api'
import { CardGridSkeleton } from '../../components/CardGridSkeleton'
import { useHoverModal } from '../../hooks/useHoverModal'

interface Chapter {
  id: number
  number: number
  title?: string | null
  summary?: string | null
  description?: string
  volume?: {
    id: number
    number: number
    title?: string
  }
}

interface VolumeGroup {
  volumeNumber: number | null
  volumeTitle?: string
  chapters: Chapter[]
}

interface Segment {
  group: VolumeGroup | null
  chapters: Chapter[]
}

interface ChaptersPageContentProps {
  initialChapters: Chapter[]
  initialTotalPages: number
  initialTotal: number
  initialPage: number
  initialSearch: string
  initialError: string
}

const PAGE_SIZE = 12

export default function ChaptersPageContent({
  initialChapters,
  initialPage,
  initialSearch,
  initialError
}: ChaptersPageContentProps) {
  const theme = useMantineTheme()
  const accentChapter = theme.other?.usogui?.chapter ?? theme.colors.green?.[6] ?? '#16a34a'
  const router = useRouter()
  const searchParams = useSearchParams()

  const [allChapters, setAllChapters] = useState<Chapter[]>(initialChapters)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError || null)
  const [searchQuery, setSearchQuery] = useState(initialSearch || '')
  const [currentPage, setCurrentPage] = useState<number>(initialPage)

  const {
    hoveredItem: hoveredChapter,
    hoverPosition: hoverModalPosition,
    handleMouseEnter: handleChapterMouseEnter,
    handleMouseLeave: handleChapterMouseLeave,
    handleModalMouseEnter,
    handleModalMouseLeave,
    handleTap: handleChapterTap,
    closeModal,
    isTouchDevice
  } = useHoverModal<Chapter>()

  const hasSearchQuery = searchQuery.trim().length > 0

  const loadAllChapters = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get<any>('/chapters?limit=1000')
      setAllChapters(response.data || [])
    } catch (err: any) {
      console.error('Error loading chapters:', err)
      if (err?.status === 429) {
        setError('Rate limit exceeded. Please wait a moment and try again.')
      } else {
        setError('Failed to load chapters. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return allChapters
    const query = searchQuery.toLowerCase().trim()
    return allChapters.filter(chapter => {
      if (!isNaN(Number(query))) {
        return chapter.number.toString().includes(query)
      }
      const title = chapter.title?.toLowerCase() || `chapter ${chapter.number}`
      const description = chapter.description?.toLowerCase() || ''
      const summary = chapter.summary?.toLowerCase() || ''
      return title.includes(query) || description.includes(query) || summary.includes(query)
    })
  }, [allChapters, searchQuery])

  const paginatedChapters = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    return filteredChapters.slice(startIndex, startIndex + PAGE_SIZE)
  }, [filteredChapters, currentPage])

  const totalPages = Math.ceil(filteredChapters.length / PAGE_SIZE)
  const total = filteredChapters.length

  // Build volume groups from ALL filtered chapters (for headers)
  const volumeGroups = useMemo((): VolumeGroup[] => {
    const groupMap = new Map<number | null, VolumeGroup>()
    const order: Array<number | null> = []
    for (const chapter of filteredChapters) {
      const volNum = chapter.volume?.number ?? null
      if (!groupMap.has(volNum)) {
        groupMap.set(volNum, {
          volumeNumber: volNum,
          volumeTitle: chapter.volume?.title,
          chapters: []
        })
        order.push(volNum)
      }
      groupMap.get(volNum)!.chapters.push(chapter)
    }
    return order.map(k => groupMap.get(k)!)
  }, [filteredChapters])

  // Build render segments from paginated chapters — inject volume headers at transitions
  const renderSegments = useMemo((): Segment[] => {
    if (hasSearchQuery) {
      return [{ group: null, chapters: paginatedChapters }]
    }
    const segments: Segment[] = []
    let lastVolNum: number | null | undefined = undefined
    let currentSegment: Segment | null = null

    for (const chapter of paginatedChapters) {
      const volNum = chapter.volume?.number ?? null
      if (volNum !== lastVolNum) {
        if (currentSegment) segments.push(currentSegment)
        const group = volumeGroups.find(g => g.volumeNumber === volNum) ?? null
        currentSegment = { group, chapters: [] }
        lastVolNum = volNum
      }
      currentSegment!.chapters.push(chapter)
    }
    if (currentSegment) segments.push(currentSegment)
    return segments
  }, [paginatedChapters, hasSearchQuery, volumeGroups])

  // Compute stats for hero
  const latestChapter = allChapters.length > 0 ? Math.max(...allChapters.map(c => c.number)) : 0
  const volumeCount = useMemo(() => {
    const vols = new Set(allChapters.map(c => c.volume?.number ?? null).filter(v => v !== null))
    return vols.size
  }, [allChapters])

  useEffect(() => {
    if (allChapters.length === 0 || (allChapters.length > 0 && allChapters.length < 500)) {
      loadAllChapters()
    }
  }, [allChapters.length, loadAllChapters])

  useEffect(() => {
    const urlPage = parseInt(searchParams.get('page') || '1', 10)
    const urlSearch = searchParams.get('search') || ''
    setCurrentPage(urlPage)
    setSearchQuery(urlSearch)
  }, [searchParams])

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = event.target.value
    setSearchQuery(newSearch)
    setCurrentPage(1)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (currentPage > 1) params.set('page', currentPage.toString())
    const newUrl = params.toString() ? `/chapters?${params.toString()}` : '/chapters'
    router.push(newUrl, { scroll: false })
  }, [searchQuery, currentPage, router])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setCurrentPage(1)
    router.push('/chapters', { scroll: false })
  }, [router])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  return (
    <Box style={{ backgroundColor: backgroundStyles.page(theme), minHeight: '100vh' }}>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

      {/* Editorial Hero Section */}
      <Box style={{ ...getHeroStyles(theme, accentChapter), paddingBlock: rem(48), paddingInline: rem(24) }}>
        <Box style={{
          maxWidth: rem(900),
          margin: '0 auto',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: rem(24),
          flexWrap: 'wrap'
        }}>
          {/* Left: Editorial title block */}
          <Box style={{ position: 'relative' }}>
            {/* Watermark number */}
            {allChapters.length > 0 && (
              <Text
                aria-hidden="true"
                style={{
                  fontFamily: 'var(--font-opti-goudy-text)',
                  fontSize: rem(88),
                  fontWeight: 400,
                  lineHeight: 1,
                  color: accentChapter,
                  opacity: 0.12,
                  position: 'absolute',
                  top: rem(-16),
                  left: rem(-8),
                  userSelect: 'none',
                  pointerEvents: 'none'
                }}
              >
                {allChapters.length}
              </Text>
            )}
            <Box style={{ position: 'relative' }}>
              <Text
                style={{
                  fontSize: rem(11),
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: accentChapter,
                  fontWeight: 700,
                  marginBottom: rem(6)
                }}
              >
                Chapters
              </Text>
              <Title order={1}
                style={{
                  fontFamily: 'var(--font-opti-goudy-text)',
                  fontSize: rem(32),
                  fontWeight: 400,
                  color: '#ffffff',
                  lineHeight: 1.1
                }}
              >
                Usogui Chapter Index
              </Title>
              <Text size="sm" c="dimmed" mt="xs">
                Explore the story chapter by chapter through the Usogui universe
              </Text>
            </Box>
          </Box>

          {/* Right: Stat block */}
          {allChapters.length > 0 && (
            <Box style={{ display: 'flex', gap: rem(24), flexShrink: 0 }}>
              {[
                { label: 'chapters', value: allChapters.length },
                { label: 'volumes', value: volumeCount },
                { label: 'latest', value: latestChapter }
              ].map(stat => (
                <Box
                  key={stat.label}
                  style={{
                    borderLeft: `3px solid ${accentChapter}`,
                    paddingLeft: rem(12)
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'var(--font-opti-goudy-text)',
                      fontSize: rem(28),
                      fontWeight: 400,
                      lineHeight: 1,
                      color: accentChapter
                    }}
                  >
                    {stat.value}
                  </Text>
                  <Text size="xs" c="dimmed" style={{ textTransform: 'lowercase', marginTop: rem(2) }}>
                    {stat.label}
                  </Text>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* Search Strip */}
      <Box py="sm" px="md" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Group justify="center" align="center" gap="sm">
          <Text size="xs" c="dimmed" style={{ letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            Filter chapters
          </Text>
          <Box style={{ maxWidth: rem(480), width: '100%' }}>
            <TextInput
              placeholder="Search by number or title..."
              value={searchQuery}
              onChange={handleSearchChange}
              leftSection={<Search size={16} />}
              size="md"
              radius="xl"
              disabled={loading}
              rightSection={
                hasSearchQuery ? (
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    onClick={handleClearSearch}
                    size="md"
                    title="Clear search"
                    aria-label="Clear search"
                    style={{ minWidth: 36, minHeight: 36 }}
                  >
                    <X size={14} />
                  </ActionIcon>
                ) : loading ? (
                  <Loader size="xs" />
                ) : null
              }
              styles={{
                input: { fontSize: rem(14) }
              }}
            />
          </Box>
          {hasSearchQuery && (
            <Text size="xs" c="dimmed">
              {total} of {allChapters.length} found
            </Text>
          )}
        </Group>
      </Box>

      {/* Error State */}
      {error && (
        <Alert
          style={{ color: getEntityThemeColor(theme, 'chapter') }}
          radius="md"
          mb="xl"
          icon={<AlertCircle size={16} />}
          title={error.includes('Rate limit') ? 'Rate Limited' : 'Error loading chapters'}
          variant={error.includes('Rate limit') ? 'light' : 'filled'}
          mx="md"
          mt="md"
        >
          {error}
          {error.includes('Rate limit') && (
            <Text size="sm" mt="xs" style={{ color: theme.colors.gray[6] }}>
              The server is receiving too many requests. Please wait a moment before trying again.
            </Text>
          )}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <Box pt="md">
          <CardGridSkeleton count={12} cardWidth={200} cardHeight={280} accentColor={accentChapter} />
        </Box>
      ) : (
        <>
          {/* Empty State */}
          {paginatedChapters.length === 0 ? (
            <Box style={{ textAlign: 'center', paddingBlock: rem(80) }}>
              <BookOpen size={64} color={theme.colors.gray[4]} style={{ marginBottom: rem(20) }} />
              <Title order={3} style={{ color: theme.colors.gray[6] }} mb="sm">
                {hasSearchQuery ? 'No chapters found' : 'No chapters available'}
              </Title>
              <Text size="lg" style={{ color: theme.colors.gray[6] }} mb="xl">
                {hasSearchQuery
                  ? 'Try adjusting your search terms'
                  : 'Check back later for new chapters'}
              </Text>
              {hasSearchQuery && (
                <Button variant="outline" style={{ color: getEntityThemeColor(theme, 'chapter') }} onClick={handleClearSearch}>
                  Clear search
                </Button>
              )}
            </Box>
          ) : (
            <>
              {/* Chapter Grid with Volume Headers */}
              <Box px="md" pt="md">
                {renderSegments.map((segment, si) => (
                  <Box key={`seg-${si}`}>
                    {/* Volume Header */}
                    {segment.group && (
                      <Box
                        style={{
                          marginTop: si === 0 ? rem(16) : rem(32),
                          marginBottom: rem(12),
                          borderLeft: `3px solid ${accentChapter}`,
                          paddingLeft: rem(12)
                        }}
                      >
                        <Text
                          style={{
                            fontSize: rem(10),
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            color: 'rgba(255,255,255,0.35)',
                            marginBottom: rem(2)
                          }}
                        >
                          Volume
                        </Text>
                        <Title
                          order={4}
                          style={{
                            fontFamily: 'var(--font-opti-goudy-text)',
                            fontSize: rem(18),
                            fontWeight: 400,
                            color: accentChapter,
                            lineHeight: 1.2
                          }}
                        >
                          {segment.group.volumeNumber !== null
                            ? `Vol. ${segment.group.volumeNumber}${segment.group.volumeTitle ? ` — ${segment.group.volumeTitle}` : ''}`
                            : 'Uncollected'
                          }
                        </Title>
                        <Text size="xs" c="dimmed">
                          {segment.group.chapters.length} chapter{segment.group.chapters.length !== 1 ? 's' : ''}
                        </Text>
                      </Box>
                    )}

                    {/* Chapter Cards Grid */}
                    <Box style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(min(110px, 42vw), 1fr))',
                      gap: rem(10)
                    }}>
                      {segment.chapters.map((chapter, index) => (
                        <motion.div
                          key={chapter.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.01 }}
                          style={{ width: '100%' }}
                        >
                          <Card
                            component={Link}
                            href={`/chapters/${chapter.id}`}
                            withBorder
                            radius="sm"
                            shadow="xs"
                            style={{
                              ...getCardStyles(theme, accentChapter),
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: rem(4),
                              padding: `${rem(8)} ${rem(6)}`,
                              minHeight: rem(80),
                              justifyContent: 'center'
                            }}
                            onClick={(e) => {
                              if (isTouchDevice) {
                                if (hoveredChapter?.id !== chapter.id) {
                                  e.preventDefault()
                                  handleChapterTap(chapter, e)
                                }
                              }
                            }}
                            onMouseEnter={(e) => {
                              if (isTouchDevice) return
                              e.currentTarget.style.transform = 'translateY(-4px)'
                              e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.2)'
                              handleChapterMouseEnter(chapter, e)
                            }}
                            onMouseLeave={(e) => {
                              if (isTouchDevice) return
                              e.currentTarget.style.transform = 'translateY(0)'
                              e.currentTarget.style.boxShadow = theme.shadows.xs
                              handleChapterMouseLeave()
                            }}
                          >
                            {/* Chapter number as primary typographic anchor */}
                            <Text
                              style={{
                                fontFamily: 'var(--font-opti-goudy-text)',
                                fontSize: rem(28),
                                fontWeight: 400,
                                lineHeight: 1,
                                color: accentChapter
                              }}
                            >
                              {chapter.number}
                            </Text>

                            <Text
                              size="xs"
                              c="dimmed"
                              lineClamp={2}
                              style={{ fontSize: rem(11), lineHeight: 1.2, wordBreak: 'break-word', textAlign: 'center' }}
                            >
                              {chapter.title || `Ch. ${chapter.number}`}
                            </Text>

                            {isTouchDevice && hoveredChapter?.id !== chapter.id && (
                              <Text
                                size="xs"
                                c="dimmed"
                                ta="center"
                                style={{ fontSize: rem(9), opacity: 0.6 }}
                              >
                                Tap to preview
                              </Text>
                            )}
                          </Card>
                        </motion.div>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>

              {/* Pagination */}
              <Box style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginTop: rem(48),
                gap: rem(12)
              }}>
                {allChapters.length > 0 && (
                  <Text size="sm" style={{ color: theme.colors.gray[6] }}>
                    Showing {paginatedChapters.length} of {total} chapters
                    {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
                  </Text>
                )}
                {totalPages > 1 && (
                  <Pagination
                    total={totalPages}
                    value={currentPage}
                    onChange={handlePageChange}
                    style={{ color: getEntityThemeColor(theme, 'chapter') }}
                    size="lg"
                    radius="xl"
                    withEdges
                  />
                )}
                {loading && <Loader size="sm" color={accentChapter} />}
              </Box>
            </>
          )}
        </>
      )}

      {/* Hover Modal */}
      <AnimatePresence>
        {hoveredChapter && hoverModalPosition && (
          <>
            {isTouchDevice && (
              <Box
                onClick={closeModal}
                style={{
                  position: 'fixed',
                  top: 0, left: 0, right: 0, bottom: 0,
                  zIndex: 1000,
                  backgroundColor: 'transparent'
                }}
              />
            )}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed',
                left: hoverModalPosition.x - 150,
                top: hoverModalPosition.y,
                zIndex: 1001,
                pointerEvents: 'auto'
              }}
              onMouseEnter={handleModalMouseEnter}
              onMouseLeave={handleModalMouseLeave}
            >
              <Paper
                shadow="xl"
                radius="lg"
                p="md"
                style={{
                  backgroundColor: theme.colors.dark?.[7] ?? theme.white,
                  border: `2px solid ${accentChapter}`,
                  backdropFilter: 'blur(10px)',
                  width: rem(300),
                  maxWidth: '90vw',
                  position: 'relative'
                }}
              >
                {isTouchDevice && (
                  <ActionIcon
                    onClick={closeModal}
                    size="xs"
                    variant="subtle"
                    color="gray"
                    style={{ position: 'absolute', top: rem(8), right: rem(8), zIndex: 10 }}
                  >
                    <X size={14} />
                  </ActionIcon>
                )}
                <Stack gap="sm">
                  <Text className="eyebrow-label" style={{ color: 'rgba(255,255,255,0.45)', marginBottom: 4, textAlign: 'center' }}>
                    Chapter
                  </Text>
                  <Title
                    order={4}
                    size="md"
                    fw={400}
                    ta="center"
                    lineClamp={2}
                    style={{ fontFamily: 'var(--font-opti-goudy-text)', fontSize: '1.4rem', color: accentChapter }}
                  >
                    {hoveredChapter.title || `Chapter ${hoveredChapter.number}`}
                  </Title>
                  <Group justify="center" gap="xs">
                    <Badge
                      variant="light"
                      c={getEntityThemeColor(theme, 'guide')}
                      size="sm"
                      fw={600}
                      style={{ backgroundColor: `${getEntityThemeColor(theme, 'guide')}20`, borderColor: getEntityThemeColor(theme, 'guide') }}
                    >
                      Chapter #{hoveredChapter.number}
                    </Badge>
                    {hoveredChapter.volume && (
                      <Badge
                        variant="filled"
                        c="white"
                        size="sm"
                        fw={600}
                        style={{ backgroundColor: getEntityThemeColor(theme, 'media') }}
                      >
                        Vol. {hoveredChapter.volume.number}
                      </Badge>
                    )}
                  </Group>
                  {(hoveredChapter.description || hoveredChapter.summary) && (
                    <Text
                      size="sm"
                      ta="center"
                      lineClamp={3}
                      style={{ color: theme.colors.gray[6], lineHeight: 1.4, maxHeight: rem(60) }}
                    >
                      {hoveredChapter.description || hoveredChapter.summary}
                    </Text>
                  )}
                </Stack>
              </Paper>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
    </Box>
  )
}
