'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Grid,
  Group,
  Loader,
  Pagination,
  Stack,
  Text,
  TextInput,
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { Search, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { api } from '../../lib/api'
import { motion } from 'motion/react'
import { useRouter, useSearchParams } from 'next/navigation'

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

interface ChaptersPageContentProps {
  initialChapters: Chapter[]
  initialTotalPages: number
  initialTotal: number
  initialPage: number
  initialSearch: string
  initialError: string
}

const PAGE_SIZE = 20

export default function ChaptersPageContent({
  initialChapters,
  initialTotalPages,
  initialTotal,
  initialPage,
  initialSearch,
  initialError
}: ChaptersPageContentProps) {
  const theme = useMantineTheme()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [chapters, setChapters] = useState<Chapter[]>(initialChapters)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [page, setPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [total, setTotal] = useState(initialTotal)
  const debounceRef = useRef<number | null>(null)

  const updateURL = useCallback(
    (newSearch: string, newPage: number) => {
      const params = new URLSearchParams(searchParams.toString())
      if (newSearch) params.set('search', newSearch)
      else params.delete('search')
      if (newPage > 1) params.set('page', newPage.toString())
      else params.delete('page')
      const href = params.toString() ? `/chapters?${params.toString()}` : '/chapters'
      router.push(href, { scroll: false })
    },
    [router, searchParams]
  )

  const fetchChapters = useCallback(
    async (searchValue: string, pageValue: number) => {
      try {
        setLoading(true)
        const params: Record<string, string | number> = { page: pageValue, limit: PAGE_SIZE }
        if (searchValue.trim()) {
          if (!isNaN(Number(searchValue))) {
            params.number = Number(searchValue)
          } else {
            params.title = searchValue
          }
        }
        const response = await api.getChapters(params)
        setChapters(response.data)
        setTotalPages(response.totalPages)
        setTotal(response.total)
        setError('')
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch chapters'
        setError(message)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (page !== initialPage || searchTerm !== initialSearch) {
      fetchChapters(searchTerm, page)
    }
  }, [fetchChapters, page, searchTerm, initialPage, initialSearch])

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setPage(1)
    updateURL(value, 1)

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
    }

    debounceRef.current = window.setTimeout(() => {
      fetchChapters(value, 1)
    }, 300)
  }

  const handlePageChange = (pageValue: number) => {
    setPage(pageValue)
    updateURL(searchTerm, pageValue)
    fetchChapters(searchTerm, pageValue)
  }

  if (error && !loading) {
    return (
      <Alert color="red" radius="md">
        <Text size="sm">{error}</Text>
      </Alert>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Stack align="center" gap="xs" mb="xl">
        <BookOpen size={48} color={theme.other?.usogui?.guide ?? theme.colors.green?.[6]} />
        <Title order={1}>Chapters</Title>
        <Text size="lg" c="dimmed">
          Explore the story chapter by chapter
        </Text>
      </Stack>

      <Box mb="lg" style={{ maxWidth: rem(520), marginInline: 'auto', width: '100%' }}>
        <TextInput
          placeholder="Search chapters by number or title..."
          value={searchTerm}
          onChange={(event) => handleSearchChange(event.currentTarget.value)}
          leftSection={<Search size={18} />}
          size="md"
        />
      </Box>

      {loading ? (
        <Box style={{ display: 'flex', justifyContent: 'center', paddingBlock: rem(64) }}>
          <Loader size="lg" color="red" />
        </Box>
      ) : (
        <>
          <Text size="sm" c="dimmed" mb="md">
            {total} chapter{total !== 1 ? 's' : ''} found
          </Text>

          <Grid gutter="xl">
            {chapters.map((chapter, index) => (
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={chapter.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card withBorder radius="md" className="gambling-card" shadow="sm">
                    <Stack gap="sm" p="lg">
                      <Group justify="space-between" align="flex-start">
                        <Text component={Link} href={`/chapters/${chapter.id}`} fw={600} size="lg" style={{ textDecoration: 'none', color: theme.colors.red?.[5] ?? '#e11d48' }}>
                          Chapter {chapter.number}
                        </Text>
                        <Badge color="red" variant="outline" radius="sm">
                          #{chapter.number}
                        </Badge>
                      </Group>

                      {chapter.title && (
                        <Text size="sm" c="dimmed" fw={500}>
                          {chapter.title}
                        </Text>
                      )}

                      {chapter.volume && (
                        <Badge
                          component={Link}
                          href={`/volumes/${chapter.volume.id}`}
                          color="violet"
                          variant="outline"
                          radius="sm"
                          style={{ textDecoration: 'none' }}
                        >
                          Vol. {chapter.volume.number}
                        </Badge>
                      )}

                      {(chapter.description || chapter.summary) && (
                        <Text size="sm" c="dimmed" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {chapter.description || chapter.summary}
                        </Text>
                      )}

                      <Button
                        component={Link}
                        href={`/chapters/${chapter.id}`}
                        variant="outline"
                        color="red"
                        fullWidth
                      >
                        View Details
                      </Button>
                    </Stack>
                  </Card>
                </motion.div>
              </Grid.Col>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box style={{ display: 'flex', justifyContent: 'center', marginTop: rem(32) }}>
              <Pagination total={totalPages} value={page} onChange={handlePageChange} color="red" size="md" />
            </Box>
          )}

          {chapters.length === 0 && !loading && (
            <Box style={{ textAlign: 'center', paddingBlock: rem(64) }}>
              <Title order={4} c="dimmed">
                No chapters found
              </Title>
              <Text size="sm" c="dimmed">
                Try adjusting your search terms
              </Text>
            </Box>
          )}
        </>
      )}
    </motion.div>
  )
}
