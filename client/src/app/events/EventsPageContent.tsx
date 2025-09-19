'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Accordion,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Grid,
  Group,
  Loader,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { CalendarSearch, Eye, Calendar, Search, BookOpen, Dice6, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { useRouter, useSearchParams } from 'next/navigation'
import EnhancedSpoilerMarkdown from '../../components/EnhancedSpoilerMarkdown'
import { api } from '../../lib/api'
import type { Arc, Event } from '../../types'
import { EventStatus } from '../../types'

const eventTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'gamble', label: 'Gamble' },
  { value: 'decision', label: 'Decision' },
  { value: 'reveal', label: 'Reveal' },
  { value: 'shift', label: 'Shift' },
  { value: 'resolution', label: 'Resolution' }
]

const eventStatusOptions = [
  { value: '', label: 'All Statuses' },
  { value: EventStatus.APPROVED, label: 'Approved' },
  { value: EventStatus.PENDING, label: 'Pending' },
  { value: EventStatus.REJECTED, label: 'Rejected' }
]

interface EventsPageContentProps {
  initialGroupedEvents: {
    arcs: Array<{ arc: Arc; events: Event[] }>
    noArc: Event[]
  }
  initialSearch: string
  initialType: string
  initialStatus: string
  initialError: string
}

export default function EventsPageContent({
  initialGroupedEvents,
  initialSearch,
  initialType,
  initialStatus,
  initialError
}: EventsPageContentProps) {
  const theme = useMantineTheme()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [groupedEvents, setGroupedEvents] = useState(initialGroupedEvents)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError)
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [selectedType, setSelectedType] = useState(initialType)
  const [selectedStatus, setSelectedStatus] = useState(initialStatus)
  const searchDebounceRef = useRef<number | null>(null)

  const updateUrl = useCallback(
    (search: string, type: string, status: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (search) params.set('search', search)
      else params.delete('search')
      if (type) params.set('type', type)
      else params.delete('type')
      if (status) params.set('status', status)
      else params.delete('status')
      const qs = params.toString()
      router.push(qs ? `/events?${qs}` : '/events', { scroll: false })
    },
    [router, searchParams]
  )

  const fetchEvents = useCallback(
    async (search: string, type: string, status: string) => {
      setLoading(true)
      try {
        if (search) {
          const params: Record<string, string | number> = { page: 1, limit: 100, title: search }
          if (type) params.type = type
          if (status) params.status = status
          const response = await api.getEvents(params)
          setGroupedEvents({ arcs: [], noArc: response.data || [] })
        } else {
          const params: Record<string, string> = {}
          if (type) params.type = type
          if (status) params.status = status
          const response = await api.getEventsGroupedByArc(params)
          setGroupedEvents(response)
        }
        setError('')
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch events'
        setError(message)
        notifications.show({ message, color: 'red' })
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (
      searchTerm !== initialSearch ||
      selectedType !== initialType ||
      selectedStatus !== initialStatus
    ) {
      fetchEvents(searchTerm, selectedType, selectedStatus)
    }
  }, [fetchEvents, searchTerm, selectedType, selectedStatus, initialSearch, initialType, initialStatus])

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current)
      }
    }
  }, [])

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    updateUrl(searchTerm, selectedType, selectedStatus)
    fetchEvents(searchTerm, selectedType, selectedStatus)
  }

  const handleTypeChange = (value: string | null) => {
    const nextType = value ?? ''
    setSelectedType(nextType)
    updateUrl(searchTerm, nextType, selectedStatus)
    fetchEvents(searchTerm, nextType, selectedStatus)
  }

  const handleStatusChange = (value: string | null) => {
    const nextStatus = value ?? ''
    setSelectedStatus(nextStatus)
    updateUrl(searchTerm, selectedType, nextStatus)
    fetchEvents(searchTerm, selectedType, nextStatus)
  }

  const handleSearchInput = (value: string) => {
    setSearchTerm(value)
    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current)
    }
    searchDebounceRef.current = window.setTimeout(() => {
      updateUrl(value, selectedType, selectedStatus)
      fetchEvents(value, selectedType, selectedStatus)
    }, 400)
  }

  const eventTypeColor = (type: string): string => {
    switch (type) {
      case 'gamble':
        return 'red'
      case 'decision':
        return 'yellow'
      case 'reveal':
        return 'blue'
      case 'shift':
        return 'violet'
      case 'resolution':
        return 'green'
      default:
        return 'gray'
    }
  }

  const statusColor = (status: string): string => {
    switch (status) {
      case EventStatus.APPROVED:
        return 'green'
      case EventStatus.PENDING:
        return 'yellow'
      case EventStatus.REJECTED:
        return 'red'
      default:
        return 'gray'
    }
  }

  const renderEventCard = (event: Event, index?: number) => (
    <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={event.id}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: (index ?? 0) * 0.05 }}
      >
        <Card withBorder radius="md" className="gambling-card" shadow="sm" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Stack gap="sm" style={{ flex: 1, padding: rem(16) }}>
            <Group justify="space-between" align="flex-start">
              <Text fw={600}>{event.title}</Text>
              <Badge color={eventTypeColor(event.type)} radius="sm">
                {event.type}
              </Badge>
            </Group>

            <Group gap="xs" wrap>
              <Badge radius="sm" variant="outline" leftSection={<Calendar size={14} />}>
                Ch. {event.chapterNumber}
              </Badge>
              {event.arc && (
                <Badge radius="sm" variant="outline" leftSection={<BookOpen size={14} />}>
                  {event.arc.name}
                </Badge>
              )}
              {event.gamble && (
                <Badge radius="sm" variant="outline" leftSection={<Dice6 size={14} />}>
                  {event.gamble.name}
                </Badge>
              )}
            </Group>

            <Box
              style={{
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 3
              }}
            >
              <EnhancedSpoilerMarkdown
                content={event.description}
                className="event-description-preview"
                enableEntityEmbeds={false}
                compactEntityCards
              />
            </Box>

            <Badge color={statusColor(event.status)} variant="light" radius="sm">
              {event.status}
            </Badge>

            <Button
              component={Link}
              href={`/events/${event.id}`}
              variant="outline"
              color="red"
              leftSection={<Eye size={16} />}
              fullWidth
            >
              View Details
            </Button>
          </Stack>
        </Card>
      </motion.div>
    </Grid.Col>
  )

  if (error && !loading) {
    return (
      <Alert color="red" radius="md">
        <Text size="sm">{error}</Text>
      </Alert>
    )
  }

  const totalEvents = groupedEvents.arcs.reduce((total, group) => total + group.events.length, 0) + groupedEvents.noArc.length
  const hasSearch = searchTerm.trim().length > 0

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Stack align="center" gap="xs" mb="xl">
        <CalendarSearch size={48} color={theme.other?.usogui?.event ?? theme.colors.orange?.[6]} />
        <Title order={1}>Events</Title>
        <Text size="lg" c="dimmed">
          Explore key moments in the Usogui story
        </Text>
      </Stack>

      <form onSubmit={handleSearchSubmit}>
        <Grid gutter="md" mb="lg" align="flex-end">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              placeholder="Search events by title..."
              value={searchTerm}
              onChange={(event) => handleSearchInput(event.currentTarget.value)}
              leftSection={<Search size={18} />}
              size="md"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Select
              label="Type"
              value={selectedType}
              onChange={handleTypeChange}
              data={eventTypeOptions}
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Select
              label="Status"
              value={selectedStatus}
              onChange={handleStatusChange}
              data={eventStatusOptions}
              clearable
            />
          </Grid.Col>
        </Grid>
      </form>

      {loading ? (
        <Box style={{ display: 'flex', justifyContent: 'center', paddingBlock: rem(64) }}>
          <Loader size="lg" color="red" />
        </Box>
      ) : (
        <>
          <Text size="sm" c="dimmed" mb="md">
            {totalEvents} event{totalEvents !== 1 ? 's' : ''} found
          </Text>

          {hasSearch ? (
            <Grid gutter="xl">
              {groupedEvents.noArc.map((event, index) => renderEventCard(event, index))}
            </Grid>
          ) : (
            <Stack gap="md">
              {groupedEvents.arcs.map(({ arc, events }) => (
                <Accordion key={arc.id} defaultValue={`arc-${arc.id}`}>
                  <Accordion.Item value={`arc-${arc.id}`}>
                    <Accordion.Control icon={<ChevronDown size={16} />}>
                      <Group gap="sm" align="center">
                        <Title order={4}>{arc.name}</Title>
                        <Badge color="red" variant="light" radius="sm">
                          {events.length} event{events.length !== 1 ? 's' : ''}
                        </Badge>
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Grid gutter="xl">
                        {events.map((event, index) => renderEventCard(event, index))}
                      </Grid>
                    </Accordion.Panel>
                  </Accordion.Item>
                </Accordion>
              ))}

              {groupedEvents.noArc.length > 0 && (
                <Accordion defaultValue="no-arc">
                  <Accordion.Item value="no-arc">
                    <Accordion.Control icon={<ChevronDown size={16} />}>
                      <Group gap="sm" align="center">
                        <Title order={4}>Other Events</Title>
                        <Badge color="violet" variant="light" radius="sm">
                          {groupedEvents.noArc.length} event{groupedEvents.noArc.length !== 1 ? 's' : ''}
                        </Badge>
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Grid gutter="xl">
                        {groupedEvents.noArc.map((event, index) => renderEventCard(event, index))}
                      </Grid>
                    </Accordion.Panel>
                  </Accordion.Item>
                </Accordion>
              )}
            </Stack>
          )}

          {totalEvents === 0 && !loading && (
            <Box style={{ textAlign: 'center', paddingBlock: rem(64) }}>
              <Title order={4} c="dimmed">
                No events found
              </Title>
              <Text size="sm" c="dimmed">
                Try adjusting your search terms or filters
              </Text>
            </Box>
          )}
        </>
      )}
    </motion.div>
  )
}
