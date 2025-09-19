'use client'

import React, { useState, useEffect } from 'react'
import {
  Alert,
  Badge,
  Box,
  Card,
  CloseButton,
  Container,
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
import { Search, Quote } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'motion/react'
import api from '@/lib/api'

interface Quote {
  id: number
  text: string
  speaker: string
  context?: string
  tags: string[]
  chapter?: number
  volume?: number
  updatedAt: string
}

export default function QuotesPageContent() {
  const theme = useMantineTheme()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [characterName, setCharacterName] = useState<string | null>(null)

  const fetchQuotes = async (page = 1, search = '', characterId?: string | null) => {
    setLoading(true)
    try {
      const data = await api.getQuotes({
        page,
        limit: 12,
        search: search || undefined,
        characterId: characterId && !isNaN(Number(characterId)) ? Number(characterId) : undefined
      })

      // Transform the API response to match the expected format
      const transformedQuotes = data.data.map((quote: any) => ({
        id: quote.id,
        text: quote.text,
        speaker: quote.character?.name || 'Unknown',
        context: quote.description || quote.context,
        tags: quote.tags ? (Array.isArray(quote.tags) ? quote.tags : [quote.tags]) : [],
        chapter: quote.chapterNumber,
        volume: quote.volumeNumber,
        updatedAt: quote.updatedAt
      }))

      setQuotes(transformedQuotes)
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / 12))
    } catch (error: unknown) {
      console.error('Error fetching quotes:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch quotes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const characterIdFilter = searchParams.get('characterId')
    fetchQuotes(currentPage, searchQuery, characterIdFilter)

    // Fetch character name for display
    if (characterIdFilter && !characterName && !isNaN(Number(characterIdFilter))) {
      const numericId = Number(characterIdFilter)
      if (numericId > 0) {
        api.getCharacter(numericId)
          .then(character => setCharacterName(character.name))
          .catch(() => setCharacterName('Unknown'))
      }
    } else if (!characterIdFilter) {
      setCharacterName(null)
    }
  }, [currentPage, searchQuery, searchParams, characterName])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const clearCharacterFilter = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('characterId')
    const next = params.toString()
    router.push(next ? `/quotes?${next}` : '/quotes')
  }

  return (
    <Container size="lg" py="xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Stack ta="center" gap="lg">
          <Box style={{ display: 'flex', justifyContent: 'center' }}>
            <Quote size={48} color={theme.other?.usogui?.red ?? theme.colors.red[5]} />
          </Box>
          <Title order={2} component="h1">
            Memorable Quotes
          </Title>
          <Text size="lg" c="dimmed">
            Iconic lines and wisdom from the world of Usogui
          </Text>
        </Stack>

        <Stack gap="md" mt="xl" mb="lg" align="center">
          <TextInput
            size="md"
            placeholder="Search quotes, speakers, or tags..."
            value={searchQuery}
            onChange={handleSearchChange}
            leftSection={<Search size={18} />}
            style={{ maxWidth: rem(500) }}
          />
          {searchParams.get('characterId') && (
            <Badge
              variant="filled"
              color="red"
              size="lg"
              rightSection={<CloseButton size="sm" onClick={clearCharacterFilter} />}
            >
              Filtered by character: {characterName || 'Loading...'}
            </Badge>
          )}
        </Stack>

        {error && (
          <Alert color="red" variant="light" mb="md">
            {error}
          </Alert>
        )}

        {loading ? (
          <Box style={{ display: 'flex', justifyContent: 'center', paddingBlock: theme.spacing.xl }}>
            <Loader size="lg" />
          </Box>
        ) : (
          <>
            <Text size="lg" fw={600} mb="md">
              {total} quote{total !== 1 ? 's' : ''} found
            </Text>

            <Grid gutter="xl">
              {quotes.map((quote, index) => (
                <Grid.Col span={{ base: 12, md: 6, lg: 4 }} key={quote.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  >
                    <Card
                      className="gambling-card h-full"
                      shadow="lg"
                      radius="md"
                      withBorder
                      style={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s' }}
                    >
                      <Stack gap="md" p="xl" style={{ flex: 1 }}>
                        <Box style={{ display: 'flex', justifyContent: 'center' }}>
                          <Quote size={24} color={theme.other?.usogui?.red ?? theme.colors.red[5]} />
                        </Box>

                        <Text
                          size="lg"
                          fs="italic"
                          ta="center"
                          style={{ lineHeight: 1.6 }}
                        >
                          &ldquo;{quote.text}&rdquo;
                        </Text>

                        <Text ta="center" fw={700} c={theme.other?.usogui?.red ?? theme.colors.red[5]}>
                          — {quote.speaker}
                        </Text>

                        {quote.context && (
                          <Text size="sm" c="dimmed" ta="center" fs="italic">
                            {quote.context}
                          </Text>
                        )}

                        {(quote.chapter || quote.volume) && (
                          <Text size="sm" c="dimmed" ta="center">
                            {quote.volume && `Volume ${quote.volume}`}
                            {quote.volume && quote.chapter && ', '}
                            {quote.chapter && `Chapter ${quote.chapter}`}
                          </Text>
                        )}

                        {quote.tags?.length > 0 && (
                          <Group gap={6} justify="center" wrap="wrap">
                            {quote.tags.map((tag, tagIndex) => (
                              <Badge key={`${quote.id}-tag-${tagIndex}`} variant="outline" color="purple">
                                {tag}
                              </Badge>
                            ))}
                          </Group>
                        )}
                      </Stack>
                    </Card>
                  </motion.div>
                </Grid.Col>
              ))}
            </Grid>

            {quotes.length === 0 && !loading && (
              <Stack align="center" gap="sm" py="xl">
                <Quote size={64} color="rgba(255, 255, 255, 0.4)" />
                <Title order={4} c="dimmed">
                  No quotes found
                </Title>
                <Text size="sm" c="dimmed">
                  {searchQuery ? 'Try adjusting your search terms.' : 'Be the first to submit a memorable quote!'}
                </Text>
              </Stack>
            )}

            {totalPages > 1 && (
              <Box style={{ display: 'flex', justifyContent: 'center', marginTop: theme.spacing.xl }}>
                <Pagination total={totalPages} value={currentPage} onChange={handlePageChange} size="lg" color="red" />
              </Box>
            )}
          </>
        )}
      </motion.div>
    </Container>
  )
}
