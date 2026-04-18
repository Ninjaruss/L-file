'use client'

import React, { useMemo, useState, useCallback } from 'react'
import { Badge, Box, Button, Card, Divider, Group, Stack, Text, rem, useMantineTheme } from '@mantine/core'
import { getEntityThemeColor } from '../lib/mantine-theme'
import { getEventColorKey, getEventIcon, getEventLabel } from '../lib/timeline-constants'
import { BookOpen, X } from 'lucide-react'
import { TimelineSection } from './timeline'
import type { TimelineEvent } from './timeline'

interface ArcTimelineProps {
  events: TimelineEvent[]
  arcName: string
  startChapter: number
  endChapter: number
  accentColor?: string
}

const ArcTimeline = React.memo(function ArcTimeline({ events, arcName, startChapter, endChapter, accentColor }: ArcTimelineProps) {
  const theme = useMantineTheme()
  const sectionColor = accentColor ?? getEntityThemeColor(theme, 'arc')
  const [selectedEventTypes, setSelectedEventTypes] = useState<Set<string>>(new Set())

  const uniqueEventTypes = useMemo(() => {
    const types = new Set<string>()
    events.forEach((e) => { if (e.type) types.add(e.type) })
    return Array.from(types)
  }, [events])

  const filteredEvents = useMemo(() => {
    const sorted = [...events].sort((a, b) =>
      a.chapterNumber !== b.chapterNumber ? a.chapterNumber - b.chapterNumber : (a.pageNumber ?? 0) - (b.pageNumber ?? 0)
    )
    if (selectedEventTypes.size === 0) return sorted
    return sorted.filter((e) => e.type && selectedEventTypes.has(e.type))
  }, [events, selectedEventTypes])

  const toggleEventType = useCallback((type: string) => {
    setSelectedEventTypes((prev) => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }, [])

  return (
    <Card className="gambling-card" withBorder radius="md" shadow="lg" p="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
          <Group gap="sm" align="center">
            <BookOpen size={20} />
            <Text fw={600}>{arcName} — Events</Text>
          </Group>
          <Badge variant="outline" style={{ color: sectionColor, borderColor: `${sectionColor}40` }}>
            Chapters {startChapter}{endChapter && endChapter !== startChapter ? `–${endChapter}` : ''}
          </Badge>
        </Group>

        {uniqueEventTypes.length > 0 && (
          <Group gap={8} wrap="wrap">
            <Text size="sm" c="dimmed" style={{ marginRight: rem(4) }}>Filter:</Text>
            {uniqueEventTypes.map((type) => {
              const isSelected = selectedEventTypes.has(type)
              const EventIcon = getEventIcon(type)
              return (
                <Badge key={type} color={getEventColorKey(type)} variant={isSelected ? 'filled' : 'outline'} radius="sm" leftSection={<EventIcon size={12} />} onClick={() => toggleEventType(type)} style={{ cursor: 'pointer', opacity: isSelected ? 1 : 0.6 }}>
                  {getEventLabel(type)}
                </Badge>
              )
            })}
            {selectedEventTypes.size > 0 && (
              <Button leftSection={<X size={14} />} size="xs" variant="light" color="gray" onClick={() => setSelectedEventTypes(new Set())}>Clear</Button>
            )}
          </Group>
        )}

        <Divider color="rgba(255,255,255,0.08)" />

        {filteredEvents.length === 0 ? (
          <Box style={{ textAlign: 'center', paddingBlock: rem(24) }}>
            <Text size="sm" c="dimmed">No events found{selectedEventTypes.size > 0 ? ' matching your filters' : ''}.</Text>
          </Box>
        ) : (
          <TimelineSection label={arcName} subtitle="All events in this arc · sorted by chapter" accentColor={sectionColor} events={filteredEvents} />
        )}
      </Stack>
    </Card>
  )
})

export default ArcTimeline
