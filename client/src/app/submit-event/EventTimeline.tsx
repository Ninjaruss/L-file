'use client'

import React, { useEffect, useState, useMemo } from 'react'
import {
  Box,
  Card,
  Loader,
  Stack,
  Text,
  ThemeIcon,
  Timeline,
  Title,
  Badge,
  useMantineTheme
} from '@mantine/core'
import { Zap, Calendar, BookOpen, Dices } from 'lucide-react'
import { api } from '../../lib/api'

interface Event {
  id: number
  title: string
  chapterNumber: number
  type?: string
  description?: string
  arcId?: number
  arc?: { id: number; name: string }
}

interface EventTimelineProps {
  arcId: number | null
  gambleId: number | null
  arcName?: string
  gambleName?: string
  accentColor: string
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  gamble: 'Gamble',
  decision: 'Decision',
  reveal: 'Reveal',
  shift: 'Shift',
  resolution: 'Resolution'
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  gamble: '#f59e0b',
  decision: '#3b82f6',
  reveal: '#10b981',
  shift: '#8b5cf6',
  resolution: '#ef4444'
}

export default function EventTimeline({ arcId, gambleId, arcName, gambleName, accentColor }: EventTimelineProps) {
  const theme = useMantineTheme()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [source, setSource] = useState<'arc' | 'gamble' | 'both' | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      if (!arcId && !gambleId) {
        setEvents([])
        setSource(null)
        return
      }

      setLoading(true)
      try {
        let eventsData: Event[] = []

        // Helper to extract array from API response (returns { data: Event[] })
        const extractEvents = (response: unknown): Event[] => {
          if (Array.isArray(response)) return response
          const wrapped = response as { data?: Event[] }
          return Array.isArray(wrapped?.data) ? wrapped.data : []
        }

        if (gambleId && arcId) {
          // Intersection: fetch by gamble, filter by arc
          const gambleResponse = await api.getEventsByGamble(gambleId, { status: 'approved' })
          const allEvents = extractEvents(gambleResponse)
          eventsData = allEvents.filter(e => e.arc?.id === arcId || e.arcId === arcId)
          setSource('both')
        } else if (gambleId) {
          const response = await api.getEventsByGamble(gambleId, { status: 'approved' })
          eventsData = extractEvents(response)
          setSource('gamble')
        } else if (arcId) {
          const response = await api.getEventsByArc(arcId, { status: 'approved' })
          eventsData = extractEvents(response)
          setSource('arc')
        }

        setEvents(eventsData)
      } catch (error) {
        console.error('Error fetching events:', error)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [arcId, gambleId])

  const sortedEvents = useMemo(() => {
    const eventsArray = Array.isArray(events) ? events : []
    return [...eventsArray].sort((a, b) => a.chapterNumber - b.chapterNumber)
  }, [events])

  if (!arcId && !gambleId) {
    return (
      <Card
        withBorder
        radius="md"
        p="lg"
        style={{
          backgroundColor: theme.colors.dark?.[7] ?? '#070707',
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }}
      >
        <Stack align="center" gap="md" py="xl">
          <ThemeIcon size={48} radius="xl" variant="light" style={{ backgroundColor: 'rgba(250, 176, 5, 0.15)', color: accentColor }}>
            <BookOpen size={24} />
          </ThemeIcon>
          <Text c="dimmed" ta="center" size="sm">
            Select an arc or gamble to see existing events
          </Text>
        </Stack>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card
        withBorder
        radius="md"
        p="lg"
        style={{
          backgroundColor: theme.colors.dark?.[7] ?? '#070707',
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }}
      >
        <Stack align="center" gap="md" py="xl">
          <Loader size="md" color={accentColor} />
          <Text c="dimmed" size="sm">Loading events...</Text>
        </Stack>
      </Card>
    )
  }

  return (
    <Card
      withBorder
      radius="md"
      p="lg"
      style={{
        backgroundColor: theme.colors.dark?.[7] ?? '#070707',
        borderColor: `${accentColor}40`,
        maxHeight: '600px',
        overflow: 'auto'
      }}
    >
      <Stack gap="md">
        <Box>
          <Title order={4} c={accentColor} mb="xs">
            {source === 'both' ? (
              <><Dices size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />{gambleName} × {arcName}</>
            ) : source === 'gamble' ? (
              <><Dices size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />{gambleName || 'Gamble Events'}</>
            ) : (
              <><BookOpen size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />{arcName || 'Arc Events'}</>
            )}
          </Title>
          <Text size="xs" c="dimmed">
            {sortedEvents.length} existing event{sortedEvents.length !== 1 ? 's' : ''}
          </Text>
        </Box>

        {sortedEvents.length === 0 ? (
          <Text c="dimmed" ta="center" py="md" size="sm">
            {source === 'both'
              ? 'No events found matching both selections. Be the first to add one!'
              : `No events found for this ${source}. Be the first to add one!`}
          </Text>
        ) : (
          <Timeline
            active={-1}
            bulletSize={28}
            lineWidth={2}
            color={accentColor}
          >
            {sortedEvents.map((event) => (
              <Timeline.Item
                key={event.id}
                bullet={
                  <ThemeIcon
                    size={28}
                    radius="xl"
                    style={{
                      backgroundColor: event.type ? EVENT_TYPE_COLORS[event.type] ?? accentColor : accentColor
                    }}
                  >
                    <Zap size={14} />
                  </ThemeIcon>
                }
                title={
                  <Text size="sm" fw={600} lineClamp={1}>
                    {event.title}
                  </Text>
                }
              >
                <Stack gap={4}>
                  <Badge
                    size="xs"
                    variant="light"
                    leftSection={<Calendar size={10} />}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: 'rgba(255, 255, 255, 0.7)'
                    }}
                  >
                    Chapter {event.chapterNumber}
                  </Badge>
                  {event.type && (
                    <Badge
                      size="xs"
                      variant="light"
                      style={{
                        backgroundColor: `${EVENT_TYPE_COLORS[event.type] ?? accentColor}20`,
                        color: EVENT_TYPE_COLORS[event.type] ?? accentColor
                      }}
                    >
                      {EVENT_TYPE_LABELS[event.type] ?? event.type}
                    </Badge>
                  )}
                  {event.description && (
                    <Text size="xs" c="dimmed" lineClamp={2} mt={4}>
                      {event.description}
                    </Text>
                  )}
                </Stack>
              </Timeline.Item>
            ))}
          </Timeline>
        )}
      </Stack>
    </Card>
  )
}
