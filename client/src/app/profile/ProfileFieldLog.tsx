'use client'

import { useEffect, useMemo, useState } from 'react'
import { Anchor, Box, Text, Group, Button, Badge } from '@mantine/core'
import Link from 'next/link'
import { api } from '../../lib/api'
import { textColors } from '../../lib/mantine-theme'

// ── Filter ────────────────────────────────────────────────────────────────────
type FilterKind = 'all' | 'submissions' | 'edits'

// ── Submission colors ─────────────────────────────────────────────────────────
const SUBMISSION_BORDER: Record<string, string> = {
  guide:      '#3a7a4a',
  media:      '#3a4a6a',
  annotation: '#5a4a7a',
  event:      '#7a6020',
  progress:   '#7a5030',
}

const SUBMISSION_BG: Record<string, string> = {
  guide:      'rgba(34,197,94,0.04)',
  media:      'rgba(59,130,246,0.04)',
  annotation: 'rgba(124,58,237,0.04)',
  event:      'rgba(245,158,11,0.04)',
  progress:   'rgba(249,115,22,0.04)',
}

const SUBMISSION_COLOR: Record<string, string> = {
  guide:      'rgba(34,197,94,0.8)',
  media:      'rgba(59,130,246,0.8)',
  annotation: 'rgba(124,58,237,0.8)',
  event:      'rgba(245,158,11,0.8)',
  progress:   'rgba(249,115,22,0.8)',
}

// ── Wiki entity colors ────────────────────────────────────────────────────────
const WIKI_COLOR: Record<string, string> = {
  character:    textColors.character,
  arc:          textColors.arc,
  gamble:       textColors.gamble,
  organization: textColors.organization,
  event:        textColors.event,
  chapter:      textColors.chapter,
}

const WIKI_ENTITY_TYPES = new Set(['character', 'arc', 'gamble', 'organization', 'event', 'chapter'])

// ── Entity link map ───────────────────────────────────────────────────────────
const ENTITY_LINK_MAP: Record<string, string> = {
  character:    '/characters',
  gamble:       '/gambles',
  arc:          '/arcs',
  organization: '/organizations',
  event:        '/events',
  guide:        '/guides',
  media:        '/media',
  chapter:      '/chapters',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
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

function formatChangedFields(fields: string[] | null | undefined): string {
  if (!fields?.length) return ''
  const filtered = fields.filter(f => !f.startsWith('priorStatus:'))
  if (!filtered.length) return ''
  const shown = filtered.slice(0, 4).map(f => f.charAt(0).toUpperCase() + f.slice(1))
  const rest = filtered.length - 4
  return rest > 0 ? `${shown.join(', ')} +${rest} more` : shown.join(', ')
}

function actionColor(action: string): string {
  if (action === 'create') return 'green'
  if (action === 'delete') return 'red'
  return 'blue'
}

function actionLabel(action: string): string {
  if (action === 'create') return 'created'
  if (action === 'delete') return 'deleted'
  return 'edited'
}

// ── Wiki edit type ────────────────────────────────────────────────────────────
type WikiEditItem = {
  id: number
  action: string
  entityType: string
  entityId: number
  entityName?: string
  changedFields?: string[] | null
  createdAt: string
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface FeedEvent {
  kind: 'submission' | 'wiki' | 'progress'
  type: string
  title: string
  detail: string
  href: string
  date: Date
  action?: string
  changedFields?: string[] | null
  borderColor: string
  bgColor: string
  textColor: string
}

interface UserGuide {
  id: number
  title: string
  status: string
  createdAt: string
  updatedAt: string
}

interface SubmissionItem {
  id: number | string
  type: string
  title?: string
  status: string
  createdAt: string
  entityType?: string
  entityId?: number
}

interface FieldLogUser {
  id?: number
  userProgress?: number
  updatedAt?: string
}

interface SubmissionEditItem {
  id: number
  entityType: string
  entityId: number
  entityName?: string
  changedFields: string[] | null
  createdAt: string | Date
}

interface ProfileFieldLogProps {
  guides: UserGuide[]
  submissions: SubmissionItem[]
  user: FieldLogUser
  submissionEdits?: SubmissionEditItem[]
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ProfileFieldLog({ guides, submissions, user, submissionEdits }: ProfileFieldLogProps) {
  const [visibleCount, setVisibleCount] = useState(8)
  const [filter, setFilter] = useState<FilterKind>('all')
  const [wikiEdits, setWikiEdits] = useState<WikiEditItem[]>([])

  useEffect(() => {
    if (!user?.id) return
    api.getWikiEditsByUser(user.id, { limit: 50 })
      .then((res) => setWikiEdits(res?.data ?? []))
      .catch(() => {})
  }, [user?.id])

  const events = useMemo<FeedEvent[]>(() => {
    const items: FeedEvent[] = []

    // Guides — use updatedAt so status changes surface correctly
    for (const guide of guides) {
      const actionMap: Record<string, string> = {
        pending:  'Guide submitted',
        approved: 'Guide approved',
        rejected: 'Guide rejected',
      }
      items.push({
        kind: 'submission',
        type: 'guide',
        title: actionMap[guide.status] ?? 'Guide updated',
        detail: guide.title,
        href: `/guides/${guide.id}`,
        date: new Date(guide.updatedAt || guide.createdAt),
        borderColor: SUBMISSION_BORDER.guide,
        bgColor: SUBMISSION_BG.guide,
        textColor: SUBMISSION_COLOR.guide,
      })
    }

    // Submissions (media, events, annotations)
    for (const sub of submissions) {
      if (!SUBMISSION_BORDER[sub.type]) continue
      const titleMap: Record<string, Record<string, string>> = {
        media:      { pending: 'Media submitted',      approved: 'Media approved',      rejected: 'Media rejected' },
        event:      { pending: 'Event submitted',      approved: 'Event approved',      rejected: 'Event rejected' },
        annotation: { pending: 'Annotation added',     approved: 'Annotation approved', rejected: 'Annotation rejected' },
      }
      const entityHref = sub.entityType && sub.entityId
        ? `${ENTITY_LINK_MAP[sub.entityType.toLowerCase()] ?? '#'}/${sub.entityId}`
        : '#'
      items.push({
        kind: 'submission',
        type: sub.type,
        title: titleMap[sub.type]?.[sub.status] ?? `${sub.type} updated`,
        detail: sub.title ?? '',
        href: sub.type === 'guide' ? `/guides/${sub.id}` : entityHref,
        date: new Date(sub.createdAt),
        borderColor: SUBMISSION_BORDER[sub.type] ?? '#555',
        bgColor: SUBMISSION_BG[sub.type] ?? 'rgba(255,255,255,0.02)',
        textColor: SUBMISSION_COLOR[sub.type] ?? '#888',
      })
    }

    // Reading progress — single entry if progress > 0
    if (user?.userProgress && user.userProgress > 0 && user.updatedAt) {
      items.push({
        kind: 'progress',
        type: 'progress',
        title: 'Reading progress',
        detail: `Chapter ${user.userProgress} reached`,
        href: '/profile',
        date: new Date(user.updatedAt),
        borderColor: SUBMISSION_BORDER.progress,
        bgColor: SUBMISSION_BG.progress,
        textColor: SUBMISSION_COLOR.progress,
      })
    }

    // Submission edits (resubmits / edits to own guides/media/annotations)
    for (const edit of (submissionEdits ?? [])) {
      const type = edit.entityType.toLowerCase()
      const priorStatusField = (edit.changedFields ?? []).find(f => f.startsWith('priorStatus:'))
      const priorStatus = priorStatusField?.split(':')[1]
      const verb = priorStatus === 'REJECTED' ? 'resubmitted' : 'edited'
      const editHref = edit.entityType && edit.entityId
        ? `${ENTITY_LINK_MAP[type] ?? '#'}/${edit.entityId}`
        : '#'
      items.push({
        kind: 'submission',
        type: type in SUBMISSION_BORDER ? type : 'event',
        title: `${edit.entityType.charAt(0).toUpperCase() + edit.entityType.slice(1)} ${verb}`,
        detail: edit.entityName ?? '',
        href: editHref,
        date: new Date(edit.createdAt),
        borderColor: SUBMISSION_BORDER[type] ?? '#555',
        bgColor: SUBMISSION_BG[type] ?? 'rgba(255,255,255,0.02)',
        textColor: SUBMISSION_COLOR[type] ?? '#888',
      })
    }

    // Wiki edits
    for (const e of wikiEdits) {
      const eType = e.entityType?.toLowerCase()
      if (!WIKI_ENTITY_TYPES.has(eType)) continue
      const color = WIKI_COLOR[eType] ?? textColors.secondary
      items.push({
        kind: 'wiki',
        type: eType,
        title: e.entityName ?? `${eType} #${e.entityId}`,
        detail: '',
        href: `${ENTITY_LINK_MAP[eType] ?? '#'}/${e.entityId}`,
        date: new Date(e.createdAt),
        action: e.action,
        changedFields: e.changedFields ?? null,
        borderColor: color,
        bgColor: `${color}0a`,
        textColor: color,
      })
    }

    return items.sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [guides, submissions, user, submissionEdits, wikiEdits])

  const filtered = filter === 'edits'
    ? events.filter(e => e.kind === 'wiki')
    : filter === 'submissions'
    ? events.filter(e => e.kind === 'submission')
    : events

  const visible = filtered.slice(0, visibleCount)

  return (
    <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '12px' }}>
      <Group justify="space-between" align="center" mb={10}>
        <Text style={{ fontSize: '17px', fontWeight: 600, color: '#d4d4d4' }}>Activity</Text>
        <Group gap={4}>
          {(['all', 'submissions', 'edits'] as FilterKind[]).map(f => (
            <Button
              key={f}
              size="xs"
              onClick={() => { setFilter(f); setVisibleCount(8) }}
              style={{
                backgroundColor: filter === f ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: `1px solid ${filter === f ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
                color: filter === f ? '#e5e5e5' : '#666',
                borderRadius: '3px',
                fontSize: '11px',
                height: '22px',
                padding: '0 8px',
                textTransform: 'capitalize',
              }}
            >
              {f}
            </Button>
          ))}
        </Group>
      </Group>

      {filtered.length === 0 ? (
        <Text style={{ fontSize: '15px', color: '#666', fontStyle: 'italic' }}>No activity yet.</Text>
      ) : (
        <Box>
          {visible.map((ev, i) => (
            <Group
              key={i}
              gap={10}
              align="stretch"
              style={{ marginBottom: i < visible.length - 1 ? '6px' : 0 }}
            >
              <Box style={{ width: '2px', background: ev.borderColor, borderRadius: '1px', flexShrink: 0 }} />
              <Box
                style={{
                  flex: 1, padding: '7px 10px',
                  background: ev.bgColor, borderRadius: '3px',
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'flex-start', gap: '8px',
                }}
              >
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Group gap={6} wrap="nowrap" mb={2}>
                    {ev.kind === 'wiki' && ev.action ? (
                      <Badge size="xs" color={actionColor(ev.action)} variant="light" style={{ flexShrink: 0 }}>
                        {actionLabel(ev.action)}
                      </Badge>
                    ) : (
                      <Badge
                        size="xs"
                        variant="dot"
                        style={{ color: ev.textColor, borderColor: ev.borderColor, background: 'transparent', flexShrink: 0 }}
                      >
                        {ev.type}
                      </Badge>
                    )}
                    <Anchor
                      component={Link}
                      href={ev.href}
                      style={{ fontSize: '13px', color: '#e5e5e5', fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {ev.title}
                    </Anchor>
                  </Group>
                  {ev.kind === 'wiki' && (
                    <>
                      <Text style={{ fontSize: '11px', color: ev.textColor, marginTop: '1px', opacity: 0.7 }}>
                        {ev.type.charAt(0).toUpperCase() + ev.type.slice(1)}
                      </Text>
                      {(() => {
                        const fieldsLabel = formatChangedFields(ev.changedFields)
                        return fieldsLabel ? (
                          <Text style={{ fontSize: '11px', color: '#666', marginTop: '1px' }}>
                            {fieldsLabel}
                          </Text>
                        ) : null
                      })()}
                    </>
                  )}
                  {ev.kind !== 'wiki' && ev.detail && (
                    <Text style={{ fontSize: '11px', color: '#888', marginTop: '1px' }} lineClamp={1}>
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

          {filtered.length > visibleCount && (
            <Button
              variant="subtle" size="xs" fullWidth mt={8}
              onClick={() => setVisibleCount(v => v + 8)}
              styles={{ root: { color: '#666', fontSize: '12px' } }}
            >
              Show more ({filtered.length - visibleCount} remaining)
            </Button>
          )}
        </Box>
      )}
    </Box>
  )
}
