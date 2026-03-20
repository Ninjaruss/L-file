'use client'

import { useMemo, useState } from 'react'
import { Box, Text, Group, Button } from '@mantine/core'

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

const TYPE_LABEL: Record<PublicEventType, string> = {
  guide:      'Guide published',
  media:      'Media contributed',
  annotation: 'Annotation added',
  event:      'Event contributed',
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
        title: TYPE_LABEL[s.type as PublicEventType] ?? s.type,
        detail: (s.title ?? '') as string,
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
                  <Text style={{ fontSize: '13px', color: '#e5e5e5', fontWeight: 600, lineHeight: 1.3 }}>
                    {ev.title}
                  </Text>
                  {ev.detail && (
                    <Text style={{ fontSize: '11px', color: '#888', marginTop: '2px' }} lineClamp={1}>
                      {ev.detail}
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
