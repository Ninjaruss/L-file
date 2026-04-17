'use client'

import React from 'react'
import { Badge, Box, Card, Group, Stack, Text, rem, useMantineTheme } from '@mantine/core'
import Link from 'next/link'
import TimelineSpoilerWrapper from './TimelineSpoilerWrapper'
import type { TimelineEvent } from './types'
import {
  getEventColorHex,
  getEventColorKey,
  getEventIcon,
  getEventLabel,
} from '../../lib/timeline-constants'

interface TimelineEventCardProps {
  event: TimelineEvent
}

export default function TimelineEventCard({ event }: TimelineEventCardProps) {
  const theme = useMantineTheme()
  const eventColor = getEventColorHex(event.type)
  const EventIcon = getEventIcon(event.type)

  return (
    <TimelineSpoilerWrapper
      chapterNumber={event.chapterNumber}
      spoilerChapter={event.spoilerChapter}
    >
      <Card
        component={Link}
        href={`/events/${event.id}`}
        withBorder
        radius="md"
        shadow="sm"
        p="md"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: rem(12),
          textDecoration: 'none',
          color: 'inherit',
          background: theme.colors.dark[7] ?? '#161616',
          borderColor: 'rgba(255,255,255,0.08)',
          transition: 'background 0.15s, border-color 0.15s',
          width: '100%',
        }}
      >
        {/* Type icon circle */}
        <Box
          style={{
            width: rem(36),
            height: rem(36),
            borderRadius: rem(8),
            background: `${eventColor}1a`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: eventColor,
            marginTop: rem(1),
          }}
        >
          <EventIcon size={18} />
        </Box>

        {/* Content */}
        <Stack gap={rem(6)} style={{ flex: 1, minWidth: 0 }}>
          <Text fw={600} size="sm" style={{ lineHeight: 1.35 }}>
            {event.title}
          </Text>

          <Group gap={rem(6)} wrap="wrap">
            <Badge
              variant="outline"
              size="xs"
              style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }}
            >
              Ch. {event.chapterNumber}
              {event.pageNumber ? ` · p. ${event.pageNumber}` : ''}
            </Badge>
            {event.type && (
              <Badge
                color={getEventColorKey(event.type)}
                size="xs"
                radius="sm"
                leftSection={<EventIcon size={10} />}
              >
                {getEventLabel(event.type)}
              </Badge>
            )}
          </Group>

          {event.description && (
            <Text
              size="xs"
              c="dimmed"
              style={{
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {event.description}
            </Text>
          )}
        </Stack>
      </Card>
    </TimelineSpoilerWrapper>
  )
}
