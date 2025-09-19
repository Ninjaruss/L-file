'use client'

import React, { useEffect, useState } from 'react'
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Center,
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
import { Eye, Users, Dices, Search, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'motion/react'
import EnhancedSpoilerMarkdown from '../../components/EnhancedSpoilerMarkdown'
import MediaThumbnail from '../../components/MediaThumbnail'
import { api } from '../../lib/api'

type Participant = {
  id: number
  name: string
  description?: string
  alternateNames?: string[]
}

interface Gamble {
  id: number
  name: string
  description?: string
  rules: string
  winCondition?: string
  chapterId: number
  participants?: Participant[]
  createdAt: string
  updatedAt: string
}

interface GamblesPageContentProps {
  initialGambles: Gamble[]
  initialTotalPages: number
  initialTotal: number
  initialPage: number
  initialSearch: string
  initialCharacterFilter: string
  initialError: string
}

const sectionSpacing = rem(24)

export default function GamblesPageContent({
  initialGambles,
  initialTotalPages,
  initialTotal,
  initialPage,
  initialSearch,
  initialCharacterFilter,
  initialError
}: GamblesPageContentProps) {
  const theme = useMantineTheme()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [gambles, setGambles] = useState<Gamble[]>(initialGambles)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [total, setTotal] = useState(initialTotal)
  const [characterFilter, setCharacterFilter] = useState<string | null>(initialCharacterFilter || null)

  const updateURL = (newSearch: string, newPage: number, newCharacter?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newSearch) params.set('search', newSearch)
    else params.delete('search')

    if (newPage > 1) params.set('page', newPage.toString())
    else params.delete('page')

    if (newCharacter) params.set('character', newCharacter)
    else params.delete('character')

    router.push(`/gambles${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const fetchGambles = async (page = 1, search = '', characterName?: string) => {
    setLoading(true)
    try {
      let response

      if (characterName) {
        const charactersResponse = await api.getCharacters({ name: characterName, limit: 1 })
        if (charactersResponse.data.length > 0) {
          const characterId = charactersResponse.data[0].id
          const characterGamblesResponse = await api.getCharacterGambles(characterId, { limit: 1000 })
          const allGambles = characterGamblesResponse.data || []
          const startIndex = (page - 1) * 12
          const endIndex = startIndex + 12
          response = {
            data: allGambles.slice(startIndex, endIndex),
            total: allGambles.length,
            totalPages: Math.ceil(allGambles.length / 12),
            page
          }
        } else {
          response = { data: [], total: 0, totalPages: 1, page: 1 }
        }
      } else {
        const params: { page: number; limit: number; gambleName?: string } = { page, limit: 12 }
        if (search) params.gambleName = search
        response = await api.getGambles(params)
      }

      setGambles(response.data)
      setTotalPages(response.totalPages)
      setTotal(response.total)
      setError('')
    } catch (fetchError: unknown) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch gambles')
      setGambles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (
      currentPage !== initialPage ||
      searchQuery !== initialSearch ||
      characterFilter !== (initialCharacterFilter || null)
    ) {
      fetchGambles(currentPage, searchQuery, characterFilter || undefined)
    }
  }, [currentPage, searchQuery, characterFilter, initialPage, initialSearch, initialCharacterFilter])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = event.currentTarget.value
    setSearchQuery(newSearch)
    setCurrentPage(1)
    updateURL(newSearch, 1, characterFilter || undefined)
    fetchGambles(1, newSearch, characterFilter || undefined)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateURL(searchQuery, page, characterFilter || undefined)
    fetchGambles(page, searchQuery, characterFilter || undefined)
  }

  const clearCharacterFilter = () => {
    setCharacterFilter(null)
    setCurrentPage(1)
    updateURL(searchQuery, 1)
    fetchGambles(1, searchQuery)
  }

  const accentGamble = theme.other?.usogui?.gamble ?? theme.colors.red?.[6] ?? '#d32f2f'

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Stack gap="xl">
        <Stack gap="xs" align="center" mb={sectionSpacing}>
          <Dices size={48} color={accentGamble} />
          <Title order={2}>Gambles</Title>
          <Text size="sm" c="dimmed">
            {characterFilter
              ? `Gambles featuring ${characterFilter}`
              : 'Discover the high-stakes games and psychological battles of Usogui'}
          </Text>
        </Stack>

        <Box maw={500} mx="auto" w="100%">
          <TextInput
            size="md"
            radius="md"
            placeholder="Search gambles..."
            value={searchQuery}
            onChange={handleSearchChange}
            leftSection={<Search size={16} />}
          />
        </Box>

        {characterFilter && (
          <Group justify="center" gap="sm">
            <Badge size="md" color="red" variant="filled">
              Character: {characterFilter}
            </Badge>
            <Button
              variant="subtle"
              size="xs"
              color="red"
              leftSection={<X size={14} />}
              onClick={clearCharacterFilter}
            >
              Clear
            </Button>
          </Group>
        )}

        {error && (
          <Alert color="red" variant="light">
            {error}
          </Alert>
        )}

        {loading ? (
          <Center py="xl">
            <Loader size="lg" />
          </Center>
        ) : (
          <Stack gap="xl">
            <Text size="sm" c="dimmed">
              {total} gamble{total !== 1 ? 's' : ''} cataloged
            </Text>

            <Grid gutter="xl">
              {gambles.map((gamble, index) => (
                <Grid.Col span={{ base: 12, md: 6 }} key={gamble.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <Card withBorder radius="lg" shadow="sm" padding="lg" h="100%">
                      <Stack gap="md" h="100%">
                        <Group justify="space-between" align="flex-start">
                          <Stack gap={4}>
                            <Title order={4}>{gamble.name}</Title>
                            <Group gap="xs">
                              <Badge color="red" variant="light">
                                Gamble
                              </Badge>
                              <Badge color="gray" variant="light">
                                Chapter {gamble.chapterId}
                              </Badge>
                            </Group>
                          </Stack>
                          <Box w={64} h={64}>
                            <MediaThumbnail
                              entityType="gamble"
                              entityId={gamble.id}
                              entityName={gamble.name}
                              maxWidth={64}
                              maxHeight={64}
                              allowCycling={false}
                            />
                          </Box>
                        </Group>

                        {gamble.description && (
                          <Text size="sm" c="dimmed">
                            {gamble.description}
                          </Text>
                        )}

                        <Stack gap="xs">
                          <Text fw={600} size="sm">
                            Rules
                          </Text>
                          <EnhancedSpoilerMarkdown content={gamble.rules} compact />
                        </Stack>

                        {gamble.winCondition && (
                          <Stack gap={4}>
                            <Text fw={600} size="sm">
                              Win Condition
                            </Text>
                            <Text size="sm" c="dimmed">
                              {gamble.winCondition}
                            </Text>
                          </Stack>
                        )}

                        {gamble.participants && gamble.participants.length > 0 && (
                          <Stack gap={4}>
                            <Group gap={6} align="center">
                              <Users size={14} />
                              <Text fw={600} size="sm">
                                Participants
                              </Text>
                            </Group>
                            <Group gap={6} wrap="wrap">
                              {gamble.participants.map((participant) => (
                                <Badge key={participant.id} size="sm" color="gray" variant="outline">
                                  {participant.name}
                                </Badge>
                              ))}
                            </Group>
                          </Stack>
                        )}

                        <Group justify="space-between" mt="auto" align="center">
                          <Group gap={6} align="center">
                            <Eye size={16} />
                            <Text size="sm" c="dimmed">
                              Chapter {gamble.chapterId}
                            </Text>
                          </Group>
                          <Button
                            component={Link}
                            href={`/gambles/${gamble.id}`}
                            size="xs"
                            variant="light"
                            color="red"
                            leftSection={<Dices size={14} />}
                          >
                            View Details
                          </Button>
                        </Group>
                      </Stack>
                    </Card>
                  </motion.div>
                </Grid.Col>
              ))}
            </Grid>

            {totalPages > 1 && (
              <Group justify="center">
                <Pagination total={totalPages} value={currentPage} onChange={handlePageChange} color="red" radius="md" />
              </Group>
            )}
          </Stack>
        )}
      </Stack>
    </motion.div>
  )
}
