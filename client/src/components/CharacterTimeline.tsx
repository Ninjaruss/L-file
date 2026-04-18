'use client'

import React, { useState, useMemo, useCallback } from 'react'
import {
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Stack,
  Text,
  rem,
  useMantineTheme,
} from '@mantine/core'
import { getEntityThemeColor } from '../lib/mantine-theme'
import { getEventColorKey, getEventIcon, getEventLabel } from '../lib/timeline-constants'
import { Calendar, BookOpen, Eye, EyeOff, X } from 'lucide-react'
import Link from 'next/link'
import { TimelineSection } from './timeline'
import type { TimelineEvent, TimelineArc } from './timeline'

interface CharacterTimelineProps {
  events: TimelineEvent[]
  arcs: TimelineArc[]
  characterName: string
  firstAppearanceChapter: number
}

const CharacterTimeline = React.memo(function CharacterTimeline({
  events,
  arcs,
  characterName,
  firstAppearanceChapter,
}: CharacterTimelineProps) {
  const theme = useMantineTheme()
  const [selectedEventTypes, setSelectedEventTypes] = useState<Set<string>>(new Set())
  const [showAllEvents, setShowAllEvents] = useState(false)

  const uniqueEventTypes = useMemo(() => {
    const types = new Set<string>()
    events.forEach((e) => { if (e.type) types.add(e.type) })
    return Array.from(types)
  }, [events])

  const filteredEvents = useMemo(() => {
    const sorted = [...events].sort((a, b) =>
      a.chapterNumber !== b.chapterNumber
        ? a.chapterNumber - b.chapterNumber
        : (a.pageNumber ?? 0) - (b.pageNumber ?? 0)
    )
    if (selectedEventTypes.size === 0) return sorted
    return sorted.filter((e) => e.type && selectedEventTypes.has(e.type))
  }, [events, selectedEventTypes])

  const timelineSections = useMemo(() => {
    const arcLookup = new Map(arcs.map((arc) => [arc.id, arc]))
    const arcEvents = new Map<number, TimelineEvent[]>()
    filteredEvents.forEach((event) => {
      if (!event.arcId || !arcLookup.has(event.arcId)) return
      if (!arcEvents.has(event.arcId)) arcEvents.set(event.arcId, [])
      arcEvents.get(event.arcId)!.push(event)
    })
    return Array.from(arcEvents.entries())
      .map(([arcId, arcEventsList]) => ({ arc: arcLookup.get(arcId)!, events: arcEventsList }))
      .sort((a, b) => a.arc.startChapter - b.arc.startChapter)
  }, [filteredEvents, arcs])

  const visibleSections = useMemo(
    () => (showAllEvents ? timelineSections : timelineSections.slice(0, 3)),
    [timelineSections, showAllEvents]
  )

  const uniqueChapters = useMemo(
    () => Array.from(new Set(filteredEvents.map((e) => e.chapterNumber))).sort((a, b) => a - b).slice(0, 10),
    [filteredEvents]
  )

  const scrollToArc = useCallback((arcId: number) => {
    requestAnimationFrame(() => {
      document.getElementById(`timeline-arc-${arcId}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    })
  }, [])

  const scrollToChapter = useCallback((chapterNumber: number) => {
    const target = filteredEvents.find((e) => e.chapterNumber === chapterNumber)
    if (!target) return
    requestAnimationFrame(() => {
      const el = document.getElementById(`event-${target.id}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('timeline-event-highlight')
        setTimeout(() => el.classList.remove('timeline-event-highlight'), 2500)
      }
    })
  }, [filteredEvents])

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
        <Group justify="space-between" align="flex-start" gap="md">
          <Group gap="sm" align="center">
            <Calendar size={20} />
            <Text fw={600}>{characterName} Timeline</Text>
          </Group>
          <Button component={Link} href={`/events?characterId=${encodeURIComponent(characterName)}`} size="xs" variant="outline" style={{ color: getEntityThemeColor(theme, 'gamble') }}>
            View All Events
          </Button>
        </Group>

        {firstAppearanceChapter > 0 && (
          <Badge variant="filled" leftSection={<BookOpen size={14} />} radius="sm" onClick={() => scrollToChapter(firstAppearanceChapter)} style={{ color: getEntityThemeColor(theme, 'media'), cursor: 'pointer', alignSelf: 'flex-start' }}>
            First Appearance: Chapter {firstAppearanceChapter}
          </Badge>
        )}

        {uniqueEventTypes.length > 0 && (
          <Stack gap="xs">
            <Text size="sm" c="dimmed">Filter by Event Type</Text>
            <Group gap={8} wrap="wrap">
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
          </Stack>
        )}

        {filteredEvents.length > 0 && (
          <Stack gap="xs">
            <Divider color="rgba(255,255,255,0.08)" />
            <Text size="sm" c="dimmed">Quick Navigation</Text>
            {timelineSections.length > 1 && (
              <Stack gap={4}>
                <Text size="xs" c="dimmed">Jump to Arc</Text>
                <Group gap={6} wrap="wrap">
                  {timelineSections.slice(0, 5).map((s) => (
                    <Badge key={s.arc.id} variant="outline" style={{ color: getEntityThemeColor(theme, 'gamble'), cursor: 'pointer' }} radius="sm" onClick={() => scrollToArc(s.arc.id)}>{s.arc.name}</Badge>
                  ))}
                </Group>
              </Stack>
            )}
            {uniqueChapters.length > 0 && (
              <Stack gap={4}>
                <Text size="xs" c="dimmed">Jump to Chapter</Text>
                <Group gap={6} wrap="wrap">
                  {uniqueChapters.map((ch) => (
                    <Badge key={ch} variant="outline" style={{ color: getEntityThemeColor(theme, 'media'), cursor: 'pointer' }} radius="sm" onClick={() => scrollToChapter(ch)}>Ch. {ch}</Badge>
                  ))}
                </Group>
              </Stack>
            )}
          </Stack>
        )}

        <Divider color="rgba(255,255,255,0.08)" />

        {filteredEvents.length === 0 && (
          <Box style={{ textAlign: 'center', paddingBlock: rem(24) }}>
            <Text size="sm" c="dimmed">No events found{selectedEventTypes.size > 0 ? ' matching your filters' : ''}.</Text>
          </Box>
        )}

        {timelineSections.length > 3 && (
          <Box style={{ textAlign: 'center' }}>
            <Button leftSection={showAllEvents ? <EyeOff size={14} /> : <Eye size={14} />} size="xs" variant="light" color="gray" onClick={() => setShowAllEvents((v) => !v)}>
              {showAllEvents ? 'Show Less' : `Show All ${timelineSections.length} Arcs`}
            </Button>
          </Box>
        )}

        {visibleSections.length > 0 && (
          <Stack gap="xl">
            {visibleSections.map((section, i) => (
              <Box key={section.arc.id} id={`timeline-arc-${section.arc.id}`}>
                {i > 0 && <Divider color="rgba(255,255,255,0.08)" variant="dashed" mb="xl" />}
                <TimelineSection
                  label={section.arc.name}
                  subtitle={`Chapters ${section.arc.startChapter}${section.arc.endChapter && section.arc.endChapter !== section.arc.startChapter ? `–${section.arc.endChapter}` : ''}`}
                  accentColor={getEntityThemeColor(theme, 'event')}
                  events={section.events}
                />
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    </Card>
  )
})

export default CharacterTimeline
export type { TimelineEvent, TimelineArc }
