'use client'

import React from 'react'
import { Badge, Box, Group, Stack, Text, rem, useMantineTheme } from '@mantine/core'
import { getEventColorHex } from '../../lib/timeline-constants'
import TimelineEventCard from './TimelineEventCard'
import type { TimelineEvent } from './types'

interface TimelineSectionProps {
  label: string
  subtitle?: string
  accentColor: string
  events: TimelineEvent[]
}

export default function TimelineSection({
  label,
  subtitle,
  accentColor,
  events,
}: TimelineSectionProps) {
  const theme = useMantineTheme()

  return (
    <Stack gap={rem(4)}>
      {/* Section header */}
      <Group align="flex-start" gap={rem(12)} mb={rem(4)}>
        <Box
          style={{
            width: rem(3),
            borderRadius: rem(2),
            background: accentColor,
            alignSelf: 'stretch',
            minHeight: rem(36),
            flexShrink: 0,
          }}
        />
        <Stack gap={rem(2)} style={{ flex: 1 }}>
          <Group gap={rem(8)} align="center">
            <Text fw={700} size="sm" style={{ color: accentColor }}>
              {label}
            </Text>
            <Badge
              variant="outline"
              size="xs"
              style={{ color: accentColor, borderColor: `${accentColor}50`, opacity: 0.8 }}
            >
              {events.length} event{events.length !== 1 ? 's' : ''}
            </Badge>
          </Group>
          {subtitle && (
            <Text size="xs" c="dimmed">
              {subtitle}
            </Text>
          )}
        </Stack>
      </Group>

      {/* Rail with events */}
      <Box style={{ position: 'relative', paddingLeft: rem(20) }}>
        {/* Vertical rail line */}
        <Box
          style={{
            position: 'absolute',
            left: rem(7),
            top: rem(8),
            bottom: rem(8),
            width: rem(2),
            borderRadius: rem(1),
            background: `linear-gradient(to bottom, ${accentColor}, transparent)`,
            opacity: 0.2,
          }}
        />

        <Stack gap={rem(10)}>
          {events.map((event) => {
            const dotColor = getEventColorHex(event.type)
            return (
              <Box key={event.id} id={`event-${event.id}`} style={{ position: 'relative' }}>
                {/* Rail dot */}
                <Box
                  style={{
                    position: 'absolute',
                    left: rem(-13),
                    top: rem(14),
                    width: rem(14),
                    height: rem(14),
                    borderRadius: '50%',
                    background: dotColor,
                    border: `2px solid ${theme.colors.dark[7] ?? '#161616'}`,
                    boxShadow: `0 0 0 2px ${dotColor}`,
                    zIndex: 1,
                  }}
                />
                <TimelineEventCard event={event} />
              </Box>
            )
          })}
        </Stack>
      </Box>
    </Stack>
  )
}
