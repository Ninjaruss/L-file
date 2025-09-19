'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Badge,
  Box,
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
import { Search, Book, Hash } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '../../lib/api'
import { motion } from 'motion/react'
import MediaThumbnail from '../../components/MediaThumbnail'

interface Volume {
  id: number
  number: number
  title?: string
  description?: string
  coverUrl?: string
  startChapter: number
  endChapter: number
}

interface VolumesPageContentProps {
  initialVolumes: Volume[]
  initialTotalPages: number
  initialTotal: number
  initialPage: number
  initialSearch: string
  initialError: string
}

export default function VolumesPageContent({
  initialVolumes,
  initialTotalPages,
  initialTotal,
  initialPage,
  initialSearch,
  initialError
}: VolumesPageContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const theme = useMantineTheme()
  
  const [volumes, setVolumes] = useState<Volume[]>(initialVolumes)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [page, setPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [total, setTotal] = useState(initialTotal)
  const searchTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  // Update URL params when search or page changes
  const updateURL = (newSearch: string, newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newSearch) {
      params.set('search', newSearch)
    } else {
      params.delete('search')
    }
    if (newPage > 1) {
      params.set('page', newPage.toString())
    } else {
      params.delete('page')
    }
    router.push(`/volumes?${params.toString()}`)
  }

  const fetchVolumes = async (searchValue: string, pageValue: number) => {
    try {
      setLoading(true)
      const params: { page: number; limit: number; search?: string } = { page: pageValue, limit: 12 }
      if (searchValue.trim()) {
        params.search = searchValue
      }
      
      const response = await api.getVolumes(params)
      setVolumes(response.data)
      setTotalPages(response.totalPages)
      setTotal(response.total)
      setError('')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = event.target.value
    setSearchTerm(newSearch)
    setPage(1)
    updateURL(newSearch, 1)

    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      fetchVolumes(newSearch, 1)
    }, 300)
  }

  const handlePageChange = (value: number) => {
    setPage(value)
    updateURL(searchTerm, value)
    fetchVolumes(searchTerm, value)
  }

  if (error) {
    return (
      <Alert color="red" radius="md">
        <Text size="sm">{error}</Text>
      </Alert>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Stack align="center" gap="xs" mb="xl">
        <Book size={48} style={{ marginBottom: rem(8) }} />
        <Title order={1}>Volumes</Title>
        <Text size="lg" c="dimmed">
          Explore the complete collection of Usogui volumes
        </Text>
      </Stack>

      <Box mb="lg">
        <TextInput
          placeholder="Search volumes by number..."
          value={searchTerm}
          onChange={handleSearchChange}
          size="md"
          leftSection={<Search size={18} />}
        />
      </Box>

      {loading ? (
        <Box style={{ display: 'flex', justifyContent: 'center', paddingBlock: rem(64) }}>
          <Loader size="lg" color="red" />
        </Box>
      ) : (
        <>
          <Box mb="sm">
            <Text size="sm" c="dimmed">
              {total} volumes found
            </Text>
          </Box>

          <Grid gutter="xl">
            {volumes.map((volume) => (
              <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }} key={volume.id}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    withBorder
                    radius="md"
                    padding="md"
                    className="gambling-card"
                    style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 200ms ease, box-shadow 200ms ease',
                      boxShadow: theme.shadows.sm
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.transform = 'translateY(-4px)'
                      event.currentTarget.style.boxShadow = theme.shadows.lg
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.transform = 'none'
                      event.currentTarget.style.boxShadow = theme.shadows.sm
                    }}
                  >
                    <Box style={{ position: 'relative' }}>
                      <MediaThumbnail
                        entityType="volume"
                        entityId={volume.id}
                        entityName={`Volume ${volume.number}`}
                        maxWidth="100%"
                        maxHeight="200px"
                        allowCycling={false}
                      />
                    </Box>
                    
                    <Stack gap="sm" style={{ flex: 1, marginTop: rem(12) }}>
                      <Group justify="space-between" align="flex-start">
                        <Text
                          component={Link}
                          href={`/volumes/${volume.id}`}
                          fw={600}
                          size="lg"
                          className="hover:underline"
                          style={{
                            color: theme.colors.red?.[5] ?? '#e11d48',
                            textDecoration: 'none'
                          }}
                        >
                          Volume {volume.number}
                        </Text>
                        <Badge variant="outline" color="red" radius="sm">
                          Vol. {volume.number}
                        </Badge>
                      </Group>

                      {volume.title && (
                        <Text size="md" fw={500} c="dimmed">
                          {volume.title}
                        </Text>
                      )}

                      <Badge variant="outline" color="violet" radius="sm">
                        <Group gap={6} align="center">
                          <Hash size={14} />
                          <span>Ch. {volume.startChapter}-{volume.endChapter}</span>
                        </Group>
                      </Badge>

                      {volume.description && (
                        <Text size="sm" c="dimmed" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {volume.description}
                        </Text>
                      )}

                      <Box style={{ marginTop: rem(12), paddingTop: rem(8), borderTop: `1px solid rgba(255, 255, 255, 0.08)` }}>
                        <Text size="xs" c="dimmed">
                          {volume.endChapter - volume.startChapter + 1} chapters
                        </Text>
                      </Box>
                    </Stack>
                  </Card>
                </motion.div>
              </Grid.Col>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box style={{ display: 'flex', justifyContent: 'center', marginTop: theme.spacing.xl }}>
              <Pagination
                total={totalPages}
                value={page}
                onChange={handlePageChange}
                color="red"
                size="md"
              />
            </Box>
          )}

          {volumes.length === 0 && !loading && (
            <Box style={{ textAlign: 'center', paddingBlock: rem(64) }}>
              <Text size="lg" c="dimmed">
                No volumes found
              </Text>
            </Box>
          )}
        </>
      )}
    </motion.div>
  )
}
