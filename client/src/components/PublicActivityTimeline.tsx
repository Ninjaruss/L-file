'use client'

import { useMemo, useState } from 'react'
import { Anchor, Box, Text, Group, Button, Badge } from '@mantine/core'
import Link from 'next/link'

type PublicEventType = 'guide' | 'media' | 'annotation' | 'event'

const TYPE_BORDER: Record<PublicEventType, string> = {
  guide:      '#3a7a4a',
  media:      '#3a4a6a',
  annotation: '#5a4a7a',
  event:      '#7a6020',
}

const TYPE_BG: Record<PublicEventType, string> = {
  guide:      'rgba(34,197,94,0.04)',
  media:      'rgba(59,130,246,0.04)',
  annotation: 'rgba(124,58,237,0.04)',
  event:      'rgba(245,158,11,0.04)',
}

const TYPE_COLOR: Record<PublicEventType, string> = {
  guide:      'rgba(34,197,94,0.8)',
  media:      'rgba(59,130,246,0.8)',
  annotation: 'rgba(124,58,237,0.8)',
  event:      'rgba(245,158,11,0.8)',
}

const TYPE_LABEL: Record<PublicEventType, string> = {
  guide:      'Guide published',
  media:      'Media contributed',
  annotation: 'Annotation added',
  event:      'Event contributed',
}

const ENTITY_LINK_MAP: Record<string, string> = {
  character: '/characters',
  gamble: '/gambles',
  arc: '/arcs',
  organization: '/organizations',
  event: '/events',
  guide: '/guides',
  media: '/media',
}

function submissionHref(type: string, id: number, entityType?: string, entityId?: number): string {
  if (type === 'guide') return `/guides/${id}`
  if (entityType && entityId) {
    return `${ENTITY_LINK_MAP[entityType.toLowerCase()] ?? '#'}/${entityId}`
  }
  return '#'
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return `${Math.floor(days / 7)}w`
}

interface PublicActivityTimelineProps {
  // from api.getPublicUserSubmissions — approved-only, all types including guides
  submissions: any[]
}

export default function PublicActivityTimeline({ submissions }: PublicActivityTimelineProps) {
  const [visibleCount, setVisibleCount] = useState(8)

  const events = useMemo(() => {
    return submissions
      .filter((s) => TYPE_BORDER[s.type as PublicEventType])
      .map((s) => ({
        type: s.type as PublicEventType,
        title: (s.title ?? TYPE_LABEL[s.type as PublicEventType] ?? s.type) as string,
        entityType: s.entityType as string | undefined,
        entityName: s.entityName as string | undefined,
        href: submissionHref(s.type, s.id, s.entityType, s.entityId),
        date: new Date(s.createdAt),
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [submissions])

  const visible = events.slice(0, visibleCount)

  return (
    <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '12px' }}>
      <Text style={{ fontSize: '17px', fontWeight: 600, color: '#d4d4d4', marginBottom: 12 }}>Activity</Text>

      {events.length === 0 ? (
        <Text style={{ fontSize: '15px', color: '#666', fontStyle: 'italic' }}>No public contributions yet.</Text>
      ) : (
        <Box>
          {visible.map((ev, i) => (
            <Group
              key={i}
              gap={10}
              align="stretch"
              style={{ marginBottom: i < visible.length - 1 ? '6px' : 0 }}
            >
              {/* Colored left border */}
              <Box style={{ width: '2px', background: TYPE_BORDER[ev.type], borderRadius: '1px', flexShrink: 0 }} />

              {/* Card body */}
              <Box
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  background: TYPE_BG[ev.type],
                  borderRadius: '3px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Group gap={6} wrap="nowrap" mb={2}>
                    <Badge
                      size="xs"
                      variant="dot"
                      style={{ color: TYPE_COLOR[ev.type], borderColor: TYPE_BORDER[ev.type], background: 'transparent', flexShrink: 0 }}
                    >
                      {ev.type}
                    </Badge>
                    <Anchor
                      component={Link}
                      href={ev.href}
                      style={{ fontSize: '13px', color: '#e5e5e5', fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {ev.title}
                    </Anchor>
                  </Group>
                  {ev.entityName && ev.entityType && (
                    <Text style={{ fontSize: '11px', color: '#888', marginTop: '1px' }} lineClamp={1}>
                      {ev.entityType.charAt(0).toUpperCase() + ev.entityType.slice(1).toLowerCase()}: {ev.entityName}
                    </Text>
                  )}
                </Box>
                <Text style={{ fontSize: '10px', color: '#555', fontFamily: 'monospace', flexShrink: 0, paddingTop: '1px' }}>
                  {timeAgo(ev.date)}
                </Text>
              </Box>
            </Group>
          ))}

          {events.length > visibleCount && (
            <Button
              variant="subtle"
              size="xs"
              fullWidth
              mt={8}
              onClick={() => setVisibleCount((v) => v + 8)}
              styles={{ root: { color: '#666', fontSize: '12px' } }}
            >
              Show more ({events.length - visibleCount} remaining)
            </Button>
          )}
        </Box>
      )}
    </Box>
  )
}
