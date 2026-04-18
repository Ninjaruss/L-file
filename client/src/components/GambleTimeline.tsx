'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { Badge, Box, Button, Card, Divider, Group, Stack, Text, rem, useMantineTheme } from '@mantine/core'
import { Eye, EyeOff, X } from 'lucide-react'
import { getEntityThemeColor } from '../lib/mantine-theme'
import { getEventColorKey, getEventIcon, getEventLabel, getPhaseColor } from '../lib/timeline-constants'
import { TimelineSection } from './timeline'
import type { TimelineEvent, TimelineArc } from './timeline'

interface GambleTimelineProps {
  events: TimelineEvent[]
  arcs: TimelineArc[]
  gambleName: string
  gambleChapter: number
}

interface Phase {
  key: string
  title: string
  description: string
  events: TimelineEvent[]
}

export default React.memo(function GambleTimeline({ events, arcs: _arcs, gambleName, gambleChapter }: GambleTimelineProps) {
  const theme = useMantineTheme()
  const [selectedEventTypes, setSelectedEventTypes] = useState<Set<string>>(new Set())
  const [showAll, setShowAll] = useState(false)

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

  const phases = useMemo((): Phase[] => {
    const result: Phase[] = []
    const pre = filteredEvents.filter((e) => e.chapterNumber < gambleChapter)
    if (pre.length > 0) result.push({ key: 'setup', title: 'Setup & Lead-up', description: 'Events leading to the gamble', events: pre })
    const main = filteredEvents.find((e) => e.type === 'gamble' && e.chapterNumber === gambleChapter)
    if (main) result.push({ key: 'gamble', title: 'The Gamble', description: gambleName, events: [main] })
    const post = filteredEvents.filter((e) => e.chapterNumber > gambleChapter)
    if (post.length > 0) {
      const reveals = post.filter((e) => e.type === 'reveal' || e.type === 'shift')
      const resolutions = post.filter((e) => e.type === 'resolution')
      const others = post.filter((e) => !reveals.includes(e) && !resolutions.includes(e))
      if (reveals.length > 0 || others.length > 0) {
        result.push({ key: 'reveals', title: 'Reveals & Developments', description: 'Unfolding consequences and revelations', events: [...reveals, ...others].sort((a, b) => a.chapterNumber - b.chapterNumber) })
      }
      if (resolutions.length > 0) result.push({ key: 'resolution', title: 'Resolution', description: 'Final outcome and conclusions', events: resolutions })
    }
    return result
  }, [filteredEvents, gambleName, gambleChapter])

  const visiblePhases = useMemo(() => (showAll ? phases : phases.slice(0, 3)), [phases, showAll])

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
          <Text fw={600}>Gamble Timeline</Text>
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

        {visiblePhases.length === 0 ? (
          <Box style={{ textAlign: 'center', paddingBlock: rem(24) }}>
            <Text c="dimmed">No timeline events found for this gamble.</Text>
          </Box>
        ) : (
          <Stack gap="xl">
            {visiblePhases.map((phase, i) => (
              <Box key={phase.key}>
                {i > 0 && <Divider color="rgba(255,255,255,0.06)" variant="dashed" mb="xl" />}
                <TimelineSection label={phase.title} subtitle={phase.description} accentColor={getPhaseColor(theme, phase.key)} events={phase.events} />
              </Box>
            ))}
          </Stack>
        )}

        {phases.length > visiblePhases.length && (
          <Box style={{ textAlign: 'center' }}>
            <Button leftSection={showAll ? <EyeOff size={14} /> : <Eye size={14} />} variant="light" color="gray" size="xs" onClick={() => setShowAll((v) => !v)}>
              {showAll ? 'Show Less' : `Show All (${phases.length} phases)`}
            </Button>
          </Box>
        )}
      </Stack>
    </Card>
  )
})
