'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Loader,
  Pagination,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { getEntityThemeColor, backgroundStyles, getHeroStyles, getPlayingCardStyles } from '../../lib/mantine-theme'
import { Search, FileText, Eye, Calendar, ThumbsUp, Heart, X, Users, BookOpen, Dice6, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { api } from '../../lib/api'
import { usePaged } from '../../hooks/usePagedCache'
import { pagedCacheConfig } from '../../config/pagedCacheConfig'
import { useAuth } from '../../providers/AuthProvider'
import AuthorProfileImage from '../../components/AuthorProfileImage'
import { UserRoleDisplay } from '../../components/BadgeDisplay'

type GuideEntity = {
  id: number
  name: string
}

interface Guide {
  id: number
  title: string
  content: string
  description: string
  tags: GuideEntity[]
  author: {
    id: number
    username: string
    role?: string
    customRole?: string
    profilePictureType?: 'discord' | 'character_media' | null
    selectedCharacterMediaId?: number | null
    selectedCharacterMedia?: {
      id: number
      url: string
      fileName?: string
      description?: string
    } | null
    discordId?: string | null
    discordAvatar?: string | null
  }
  characters?: GuideEntity[]
  arc?: GuideEntity
  gambles?: GuideEntity[]
  likeCount: number
  userHasLiked?: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
}

interface GuidesPageContentProps {
  initialGuides: Guide[]
  initialTotalPages: number
  initialTotal: number
  initialPage: number
  initialSearch: string
  initialAuthorId?: string
  initialAuthorName?: string
  initialError: string
}

export default function GuidesPageContent({
  initialGuides,
  initialTotalPages,
  initialTotal,
  initialPage,
  initialSearch,
  initialAuthorId,
  initialAuthorName,
  initialError
}: GuidesPageContentProps) {
  const { user } = useAuth()
  const theme = useMantineTheme()
  const router = useRouter()

  const [guides, setGuides] = useState<Guide[]>(initialGuides)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [total, setTotal] = useState(initialTotal)
  const [liking, setLiking] = useState<number | null>(null)
  const [authorFilter, setAuthorFilter] = useState<string | null>(initialAuthorId || null)
  const [authorName, setAuthorName] = useState<string | null>(initialAuthorName || null)

  // Hover modal state
  const [hoveredGuide, setHoveredGuide] = useState<Guide | null>(null)
  const [hoverModalPosition, setHoverModalPosition] = useState<{ x: number; y: number } | null>(null)
  const hoverTimeoutRef = useRef<number | null>(null)
  const hoveredElementRef = useRef<HTMLElement | null>(null)

  const fetcher = useCallback(async (page: number) => {
    const params: any = { page, limit: 12, status: 'approved' }
    if (searchQuery) params.title = searchQuery
    if (authorFilter) params.authorId = authorFilter
    const resAny = await api.getGuides(params)
    return { data: resAny.data || [], total: resAny.total || 0, page: resAny.page || page, perPage: 12, totalPages: resAny.totalPages || Math.max(1, Math.ceil((resAny.total || 0) / 12)) }
  }, [searchQuery, authorFilter])

  const { data: pageData, loading: pageLoading, error: pageError, prefetch, refresh, invalidate } = usePaged<Guide>('guides', currentPage, fetcher, { title: searchQuery, authorId: authorFilter }, { ttlMs: pagedCacheConfig.lists.guides.ttlMs, persist: pagedCacheConfig.defaults.persist, maxEntries: pagedCacheConfig.lists.guides.maxEntries })

  useEffect(() => {
    if (pageData) {
      setGuides(pageData.data || [])
      setTotalPages(pageData.totalPages || 1)
      setTotal(pageData.total || 0)
    }
    setLoading(!!pageLoading)
  }, [pageData, pageLoading])

  const updateUrl = useCallback((page: number, search: string, authorId?: string, authorNameParam?: string) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (authorId) params.set('author', authorId)
    if (authorNameParam) params.set('authorName', authorNameParam)
    if (page > 1) params.set('page', page.toString())

    const newUrl = params.toString() ? `/guides?${params.toString()}` : '/guides'
    router.push(newUrl, { scroll: false })
  }, [router])

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = event.target.value
    setSearchQuery(newSearch)
    setCurrentPage(1)
  }, [])

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateUrl(currentPage, searchQuery, authorFilter || undefined, authorName || undefined)
      // trigger usePaged refresh (stale-while-revalidate)
      refresh(false).catch(() => {})
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    updateUrl(page, searchQuery, authorFilter || undefined, authorName || undefined)
    prefetch(page)
  }, [searchQuery, authorFilter, authorName, updateUrl, prefetch])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setCurrentPage(1)
    setAuthorFilter(null)
    setAuthorName(null)
    updateUrl(1, '')
  }, [updateUrl])

  const clearAuthorFilter = () => {
    setAuthorFilter(null)
    setAuthorName(null)
    setCurrentPage(1)
    updateUrl(1, searchQuery)
  }

  const getContentPreview = (content: string, maxLength = 150) => {
    if (!content) return 'No content available'
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength).replace(/\s+\S*$/, '') + '...'
  }

  const handleLikeToggle = async (guideId: number) => {
    if (!user || liking === guideId) return

    setLiking(guideId)
    try {
      const response = await api.toggleGuideLike(guideId)
      setGuides((previous) =>
        previous.map((guide) =>
          guide.id === guideId
            ? { ...guide, likeCount: response.likeCount, userHasLiked: response.liked }
            : guide
        )
      )
    } catch (toggleError: unknown) {
      console.error('Error toggling like:', toggleError)
    } finally {
      setLiking(null)
    }
  }

  // Function to update modal position based on hovered element
  const updateModalPosition = useCallback((guide?: Guide) => {
    const currentGuide = guide || hoveredGuide
    if (hoveredElementRef.current && currentGuide) {
      const rect = hoveredElementRef.current.getBoundingClientRect()
      const modalWidth = 300 // rem(300) from the modal width
      const modalHeight = 180 // Approximate modal height
      const navbarHeight = 60 // Height of the sticky navbar
      const buffer = 10 // Additional buffer space

      let x = rect.left + rect.width / 2
      let y = rect.top - modalHeight - buffer

      // Check if modal would overlap with navbar
      if (y < navbarHeight + buffer) {
        // Position below the card instead
        y = rect.bottom + buffer
      }

      // Ensure modal doesn't go off-screen horizontally
      const modalLeftEdge = x - modalWidth / 2
      const modalRightEdge = x + modalWidth / 2

      if (modalLeftEdge < buffer) {
        x = modalWidth / 2 + buffer
      } else if (modalRightEdge > window.innerWidth - buffer) {
        x = window.innerWidth - modalWidth / 2 - buffer
      }

      setHoverModalPosition({ x, y })
    }
  }, [hoveredGuide])

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  // Add scroll and resize listeners to update modal position
  useEffect(() => {
    if (hoveredGuide && hoveredElementRef.current) {
      const handleScroll = () => {
        updateModalPosition()
      }

      const handleResize = () => {
        updateModalPosition()
      }

      window.addEventListener('scroll', handleScroll)
      document.addEventListener('scroll', handleScroll)
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('scroll', handleScroll)
        document.removeEventListener('scroll', handleScroll)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [hoveredGuide, updateModalPosition])

  // Hover modal handlers
  const handleGuideMouseEnter = (guide: Guide, event: React.MouseEvent) => {
    const element = event.currentTarget as HTMLElement
    hoveredElementRef.current = element

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredGuide(guide)
      updateModalPosition(guide) // Pass guide directly to ensure position calculation works immediately
    }, 500) // 500ms delay before showing
  }

  const handleGuideMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    // Small delay before hiding to allow moving to modal
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredGuide(null)
      setHoverModalPosition(null)
      hoveredElementRef.current = null
    }, 200)
  }

  const handleModalMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
  }

  const handleModalMouseLeave = () => {
    setHoveredGuide(null)
    setHoverModalPosition(null)
    hoveredElementRef.current = null
  }

  const accentGuide = theme.other?.usogui?.guide ?? theme.colors.green?.[5] ?? '#4ade80'
  const hasSearchQuery = searchQuery.trim().length > 0

  return (
    <Box style={{ backgroundColor: backgroundStyles.page(theme), minHeight: '100vh' }}>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {/* Hero Section */}
      <Box
        style={getHeroStyles(theme, accentGuide)}
        p="md"
      >
        <Stack align="center" gap="xs">
          <Box
            style={{
              background: `linear-gradient(135deg, ${accentGuide}, ${accentGuide}CC)`,
              borderRadius: '50%',
              width: rem(40),
              height: rem(40),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 16px ${accentGuide}40`
            }}
          >
            <FileText size={20} color="white" />
          </Box>

          <Stack align="center" gap="xs">
            <Title order={1} size="1.5rem" fw={700} ta="center" c={accentGuide}>
              Community Guides
            </Title>
            <Text size="md" style={{ color: theme.colors.gray[6] }} ta="center" maw={400}>
              In-depth analysis and insights from the Usogui community
            </Text>

            {total > 0 && (
              <Badge size="md" variant="light" c={accentGuide} radius="xl" mt="xs">
                {total} guide{total !== 1 ? 's' : ''} published
              </Badge>
            )}
          </Stack>

          <Button
            component={Link}
            href="/submit-guide"
            size="md"
            leftSection={<FileText size={16} />}
            radius="md"
            variant="gradient"
            gradient={{ from: accentGuide, to: theme.other?.usogui?.red ?? theme.colors.red?.[6] ?? '#e11d48' }}
          >
            Write Guide
          </Button>
        </Stack>
      </Box>

      {/* Search and Filters */}
      <Box mb="xl" px="md">
        <Group justify="center" mb="md">
          <Box style={{ maxWidth: rem(600), width: '100%' }}>
            <TextInput
              placeholder="Search guides..."
              value={searchQuery}
              onChange={handleSearchChange}
              leftSection={<Search size={20} />}
              size="lg"
              radius="xl"
              rightSection={
                hasSearchQuery ? (
                  <ActionIcon variant="subtle" color="gray" onClick={handleClearSearch} size="sm">
                    <X size={16} />
                  </ActionIcon>
                ) : null
              }
              styles={{
                input: {
                  fontSize: rem(16),
                  paddingLeft: rem(50),
                  paddingRight: hasSearchQuery ? rem(50) : rem(20)
                }
              }}
            />
          </Box>
        </Group>

        {authorFilter && authorName && (
          <Group justify="center" gap="sm">
            <Badge
              size="md"
              c="white"
              variant="filled"
              style={{ backgroundColor: getEntityThemeColor(theme, 'gamble') }}
            >
              Author: {authorName}
            </Badge>
            <Button
              variant="subtle"
              size="xs"
              style={{ color: getEntityThemeColor(theme, 'gamble') }}
              leftSection={<X size={14} />}
              onClick={clearAuthorFilter}
            >
              Clear
            </Button>
          </Group>
        )}
      </Box>

      {/* Error State */}
      {error && (
        <Box px="md">
          <Alert
            color="red"
            radius="md"
            mb="xl"
            icon={<AlertCircle size={16} />}
            title="Error loading guides"
          >
            {error}
          </Alert>
        </Box>
      )}

      {/* Loading State */}
      {loading ? (
        <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBlock: rem(80) }}>
          <Loader size="xl" color={accentGuide} mb="md" />
          <Text size="lg" style={{ color: theme.colors.gray[6] }}>Loading guides...</Text>
        </Box>
      ) : (
        <>
          {/* Empty State */}
          {guides.length === 0 ? (
            <Box style={{ textAlign: 'center', paddingBlock: rem(80) }}>
              <FileText size={64} color={theme.colors.gray[4]} style={{ marginBottom: rem(20) }} />
              <Title order={3} style={{ color: theme.colors.gray[6] }} mb="sm">
                {hasSearchQuery ? 'No guides found' : 'No guides available'}
              </Title>
              <Text size="lg" style={{ color: theme.colors.gray[6] }} mb="xl">
                {hasSearchQuery
                  ? 'Try adjusting your search terms or filters'
                  : 'Check back later for new guides'}
              </Text>
              {hasSearchQuery && (
                <Button variant="outline" c={accentGuide} onClick={handleClearSearch}>
                  Clear search
                </Button>
              )}
            </Box>
          ) : (
            <>
              {/* Results Grid */}
              <Box
                px="md"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: rem(16),
                  justifyItems: 'center'
                }}
              >
                {guides.map((guide: Guide, index: number) => (
                  <motion.div
                    key={guide.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    style={{
                      width: '200px',
                      height: '280px' // Playing card aspect ratio: 200px * 1.4 = 280px
                    }}
                  >
                    <Card
                      component={Link}
                      href={`/guides/${guide.id}`}
                      withBorder={false}
                      radius="lg"
                      shadow="sm"
                      style={getPlayingCardStyles(theme, accentGuide)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.25)'
                        handleGuideMouseEnter(guide, e)
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = theme.shadows.sm
                        handleGuideMouseLeave()
                      }}
                    >
                      {/* Author Badge at Top Left */}
                      <Badge
                        variant="filled"
                        radius="sm"
                        size="sm"
                        c="white"
                        style={{
                          position: 'absolute',
                          top: rem(8),
                          left: rem(8),
                          backgroundColor: accentGuide,
                          fontSize: rem(10),
                          fontWeight: 700,
                          zIndex: 10,
                          backdropFilter: 'blur(4px)',
                          maxWidth: 'calc(100% - 16px)'
                        }}
                      >
                        by {guide.author.username}
                      </Badge>

                      {/* Main Content Section */}
                      <Stack
                        style={{
                          position: 'relative',
                          flex: 1,
                          minHeight: 0,
                          padding: rem(8),
                          paddingTop: rem(36), // Account for author badge
                          justifyContent: 'space-between',
                          height: '100%'
                        }}
                        gap={rem(6)}
                      >
                        {/* Title */}
                        <Title
                          order={3}
                          size="lg"
                          lineClamp={4}
                          c={accentGuide}
                          style={{
                            fontSize: rem(18),
                            fontWeight: 700,
                            lineHeight: 1.2,
                            textAlign: 'center'
                          }}
                        >
                          {guide.title}
                        </Title>

                        {/* Tags */}
                        <Group gap={3} justify="center" wrap="wrap" mt="auto">
                          {guide.tags?.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag.id}
                              size="xs"
                              c={getEntityThemeColor(theme, 'organization')}
                              variant="outline"
                              style={{
                                borderColor: getEntityThemeColor(theme, 'organization'),
                                fontSize: rem(8),
                                height: rem(16)
                              }}
                            >
                              #{tag.name}
                            </Badge>
                          ))}
                          {guide.tags && guide.tags.length > 2 && (
                            <Badge
                              size="xs"
                              c={getEntityThemeColor(theme, 'organization')}
                              variant="outline"
                              style={{
                                borderColor: getEntityThemeColor(theme, 'organization'),
                                fontSize: rem(8),
                                height: rem(16)
                              }}
                            >
                              +{guide.tags.length - 2}
                            </Badge>
                          )}
                        </Group>

                        {/* Stats and Like Button */}
                        <Group
                          justify="space-between"
                          align="center"
                          style={{
                            marginTop: rem(4)
                          }}
                        >
                          <Group gap={6} align="center">
                            <Group gap={2} align="center">
                              <Heart size={10} color={guide.userHasLiked ? theme.other?.usogui?.red ?? theme.colors.red?.[6] : theme.colors.gray[5]} />
                              <Text size="xs" c="dimmed" style={{ fontSize: rem(9) }}>{guide.likeCount}</Text>
                            </Group>
                            <Group gap={2} align="center">
                              <Eye size={10} color={theme.colors.gray[5]} />
                              <Text size="xs" c="dimmed" style={{ fontSize: rem(9) }}>{guide.viewCount}</Text>
                            </Group>
                          </Group>

                          <Button
                            size="xs"
                            variant={guide.userHasLiked ? 'filled' : 'outline'}
                            style={{
                              color: accentGuide,
                              height: rem(18),
                              fontSize: rem(8),
                              padding: `0 ${rem(6)}`
                            }}
                            leftSection={<ThumbsUp size={8} />}
                            loading={liking === guide.id}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleLikeToggle(guide.id)
                            }}
                          >
                            {guide.userHasLiked ? 'Liked' : 'Like'}
                          </Button>
                        </Group>
                      </Stack>
                    </Card>
                  </motion.div>
                ))}
              </Box>

              {/* Pagination Info & Controls */}
              <Box
                px="md"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  marginTop: rem(48),
                  gap: rem(12)
                }}>
                {/* Always show pagination info when we have guides */}
                {total > 0 && (
                  <Text size="sm" style={{ color: theme.colors.gray[6] }}>
                    Showing {guides.length} of {total} guides
                    {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
                  </Text>
                )}

                {/* Show pagination controls when we have multiple pages */}
                {totalPages > 1 && (
                  <Pagination
                    total={totalPages}
                    value={currentPage}
                    onChange={handlePageChange}
                    color="guide"
                    size="lg"
                    radius="xl"
                    withEdges
                  />
                )}

                {loading && <Loader size="sm" color={accentGuide} />}
              </Box>
            </>
          )}
        </>
      )}

      {/* Hover Modal */}
      <AnimatePresence>
        {hoveredGuide && hoverModalPosition && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              left: hoverModalPosition.x - 150, // Center horizontally (300px width / 2)
              top: hoverModalPosition.y, // Use calculated position directly
              zIndex: 1001, // Higher than navbar (which is 1000)
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
                backgroundColor: backgroundStyles.modal,
                border: `2px solid ${accentGuide}`,
                backdropFilter: 'blur(10px)',
                width: rem(300),
                maxWidth: '90vw'
              }}
            >
              <Stack gap="sm">
                {/* Guide Title */}
                <Title
                  order={4}
                  size="md"
                  fw={700}
                  c={accentGuide}
                  ta="center"
                  lineClamp={2}
                >
                  {hoveredGuide.title}
                </Title>

                {/* Author Info */}
                <Group justify="center" gap="sm" align="center">
                  <AuthorProfileImage author={hoveredGuide.author} size={24} showFallback />
                  <Stack gap={2}>
                    <Text size="sm" c="dimmed" ta="center">
                      by {hoveredGuide.author.username}
                    </Text>
                    <UserRoleDisplay
                      userRole={(hoveredGuide.author.role as 'admin' | 'moderator' | 'user') || 'user'}
                      customRole={hoveredGuide.author.customRole}
                      size="small"
                    />
                  </Stack>
                </Group>

                {/* Description */}
                <Text
                  size="sm"
                  ta="center"
                  lineClamp={3}
                  style={{
                    color: theme.colors.gray[6],
                    lineHeight: 1.4,
                    maxHeight: rem(60)
                  }}
                >
                  {getContentPreview(hoveredGuide.description || hoveredGuide.content, 120)}
                </Text>

                {/* Related Entities */}
                {(hoveredGuide.characters?.length || hoveredGuide.arc || hoveredGuide.gambles?.length) && (
                  <Stack gap={6}>
                    {hoveredGuide.characters && hoveredGuide.characters.length > 0 && (
                      <Group justify="center" gap={4} wrap="wrap">
                        <Users size={12} />
                        {hoveredGuide.characters.slice(0, 2).map((character) => (
                          <Badge
                            key={character.id}
                            size="xs"
                            c={getEntityThemeColor(theme, 'character')}
                            variant="light"
                            style={{ backgroundColor: `${getEntityThemeColor(theme, 'character')}20` }}
                          >
                            {character.name}
                          </Badge>
                        ))}
                        {hoveredGuide.characters.length > 2 && (
                          <Badge size="xs" variant="light">+{hoveredGuide.characters.length - 2}</Badge>
                        )}
                      </Group>
                    )}

                    {hoveredGuide.arc && (
                      <Group justify="center" gap={4}>
                        <BookOpen size={12} />
                        <Badge
                          size="xs"
                          c={getEntityThemeColor(theme, 'arc')}
                          variant="light"
                          style={{ backgroundColor: `${getEntityThemeColor(theme, 'arc')}20` }}
                        >
                          {hoveredGuide.arc.name}
                        </Badge>
                      </Group>
                    )}

                    {hoveredGuide.gambles && hoveredGuide.gambles.length > 0 && (
                      <Group justify="center" gap={4} wrap="wrap">
                        <Dice6 size={12} />
                        {hoveredGuide.gambles.slice(0, 2).map((gamble) => (
                          <Badge
                            key={gamble.id}
                            size="xs"
                            c={getEntityThemeColor(theme, 'gamble')}
                            variant="light"
                            style={{ backgroundColor: `${getEntityThemeColor(theme, 'gamble')}20` }}
                          >
                            {gamble.name}
                          </Badge>
                        ))}
                        {hoveredGuide.gambles.length > 2 && (
                          <Badge size="xs" variant="light">+{hoveredGuide.gambles.length - 2}</Badge>
                        )}
                      </Group>
                    )}
                  </Stack>
                )}

                {/* Stats */}
                <Group justify="center" gap="lg">
                  <Group gap={4} align="center">
                    <Heart size={14} color={hoveredGuide.userHasLiked ? theme.other?.usogui?.red : theme.colors.gray[5]} />
                    <Text size="sm">{hoveredGuide.likeCount}</Text>
                  </Group>
                  <Group gap={4} align="center">
                    <Eye size={14} color={theme.colors.gray[5]} />
                    <Text size="sm">{hoveredGuide.viewCount}</Text>
                  </Group>
                  <Group gap={4} align="center">
                    <Calendar size={14} color={theme.colors.gray[5]} />
                    <Text size="sm">{new Date(hoveredGuide.createdAt).toLocaleDateString()}</Text>
                  </Group>
                </Group>
              </Stack>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </Box>
  )
}
