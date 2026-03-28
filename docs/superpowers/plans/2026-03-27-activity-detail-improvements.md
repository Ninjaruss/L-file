# Activity Detail Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove duplicate activity section from the profile page, add All/Submissions/Edits filter tabs to all activity components, display changed field names inline on wiki edit entries, and ensure annotation/media links navigate to their parent entity.

**Architecture:** Frontend-only changes across 5 files. `ProfileFieldLog` absorbs wiki-edit data (previously handled by the now-removed `PublicActivityTimeline` instance on the profile page). A `formatChangedFields` helper is defined locally in each component that needs it. The `api.ts` type definitions are updated to expose `changedFields` that the server already returns.

**Tech Stack:** Next.js 15, React 19, TypeScript, Mantine UI, existing `api.ts` client

---

## File Map

| File | Change |
|---|---|
| `client/src/lib/api.ts` | Add `changedFields` to response types for `getRecentEdits` and `getWikiEditsByUser` |
| `client/src/app/profile/ProfilePageClient.tsx` | Remove `PublicActivityTimeline` render + import |
| `client/src/app/profile/ProfileFieldLog.tsx` | Add wiki edits fetch, filter tabs, `formatChangedFields`, wire up display |
| `client/src/components/PublicActivityTimeline.tsx` | Add filter tabs, `formatChangedFields`, wire up display |
| `client/src/app/changelog/ChangelogPageContent.tsx` | Add `changedFields` to `EditEntry` type, wire up display |

---

## Task 1: Expose `changedFields` in api.ts type definitions

The server already returns `changedFields` (it spreads the full `EditLog` entity). The client TypeScript types just don't declare it yet.

**Files:**
- Modify: `client/src/lib/api.ts`

- [ ] **Step 1: Add `changedFields` to `getRecentEdits` return type**

  In `client/src/lib/api.ts`, find the `getRecentEdits` method (around line 1104). The `data` array item currently ends at `user?: ...`. Add `changedFields` before closing `}>`:

  ```typescript
  // Before (line ~1104-1113):
  return this.get<{
    data: Array<{
      id: number
      action: string
      entityType: string
      entityId: number
      entityName?: string
      createdAt: string
      user?: { id: number; username: string; fluxerAvatar?: string; fluxerId?: string }
    }>
    total: number
    page: number
    totalPages: number
  }>(`/edit-log/recent${qs ? `?${qs}` : ''}`)

  // After:
  return this.get<{
    data: Array<{
      id: number
      action: string
      entityType: string
      entityId: number
      entityName?: string
      changedFields?: string[] | null
      createdAt: string
      user?: { id: number; username: string; fluxerAvatar?: string; fluxerId?: string }
    }>
    total: number
    page: number
    totalPages: number
  }>(`/edit-log/recent${qs ? `?${qs}` : ''}`)
  ```

- [ ] **Step 2: Add `changedFields` to `getWikiEditsByUser` return type**

  Find `getWikiEditsByUser` (around line 1147). Same change to the `data` array item:

  ```typescript
  // Before:
  return this.get<{
    data: Array<{
      id: number
      action: string
      entityType: string
      entityId: number
      entityName?: string
      createdAt: string
      user?: { id: number; username: string; fluxerAvatar?: string; fluxerId?: string }
    }>
    // ...
  }>(`/edit-log/user/${userId}${qs ? `?${qs}` : ''}`)

  // After:
  return this.get<{
    data: Array<{
      id: number
      action: string
      entityType: string
      entityId: number
      entityName?: string
      changedFields?: string[] | null
      createdAt: string
      user?: { id: number; username: string; fluxerAvatar?: string; fluxerId?: string }
    }>
    // ...
  }>(`/edit-log/user/${userId}${qs ? `?${qs}` : ''}`)
  ```

- [ ] **Step 3: Verify build compiles**

  ```bash
  cd /Users/ninjaruss/Documents/GitHub/usogui-fansite/client && yarn build 2>&1 | tail -20
  ```
  Expected: Build succeeds (or fails only on pre-existing unrelated issues).

- [ ] **Step 4: Commit**

  ```bash
  cd /Users/ninjaruss/Documents/GitHub/usogui-fansite && git add client/src/lib/api.ts && git commit -m "feat(api): expose changedFields in getRecentEdits and getWikiEditsByUser types"
  ```

---

## Task 2: Remove duplicate PublicActivityTimeline from profile page

**Files:**
- Modify: `client/src/app/profile/ProfilePageClient.tsx`

- [ ] **Step 1: Remove the import**

  Remove line 25:
  ```typescript
  // DELETE this line:
  import PublicActivityTimeline from '../../components/PublicActivityTimeline'
  ```

- [ ] **Step 2: Remove the JSX block**

  Remove lines 333–340 (the `PublicActivityTimeline` usage inside the `Stack`):
  ```tsx
  // DELETE these lines:
  {user?.id && (
    <PublicActivityTimeline
      userId={user.id}
      submissions={submissions.filter((s: any) =>
        ['guide', 'media', 'annotation', 'event'].includes(s.type) && s.status === 'approved'
      )}
    />
  )}
  ```

- [ ] **Step 3: Verify build**

  ```bash
  cd /Users/ninjaruss/Documents/GitHub/usogui-fansite/client && yarn build 2>&1 | tail -20
  ```

- [ ] **Step 4: Commit**

  ```bash
  cd /Users/ninjaruss/Documents/GitHub/usogui-fansite && git add client/src/app/profile/ProfilePageClient.tsx && git commit -m "fix(profile): remove duplicate PublicActivityTimeline from profile page"
  ```

---

## Task 3: Enhance ProfileFieldLog — wiki edits, filter tabs, changedFields

**Files:**
- Modify: `client/src/app/profile/ProfileFieldLog.tsx`

The entire file is replaced. The key additions are: `api` import, wiki-edit state + fetch, `id` on `FieldLogUser`, `formatChangedFields` helper, filter tabs (All / Submissions / Edits), wiki entries in `useMemo`, and changedFields rendered below each wiki entry title.

- [ ] **Step 1: Replace the full file content**

  ```tsx
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
    const [wikiEdits, setWikiEdits] = useState<any[]>([])

    useEffect(() => {
      if (!user?.id) return
      api.getWikiEditsByUser(user.id, { limit: 50 })
        .then((res: any) => setWikiEdits(res?.data ?? []))
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
      ? events.filter(e => e.kind !== 'wiki')
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
                        {formatChangedFields(ev.changedFields) && (
                          <Text style={{ fontSize: '11px', color: '#666', marginTop: '1px' }}>
                            {formatChangedFields(ev.changedFields)}
                          </Text>
                        )}
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
  ```

- [ ] **Step 2: Verify build**

  ```bash
  cd /Users/ninjaruss/Documents/GitHub/usogui-fansite/client && yarn build 2>&1 | tail -20
  ```

- [ ] **Step 3: Commit**

  ```bash
  cd /Users/ninjaruss/Documents/GitHub/usogui-fansite && git add client/src/app/profile/ProfileFieldLog.tsx && git commit -m "feat(profile): unified activity feed with wiki edits, filter tabs, and changedFields display"
  ```

---

## Task 4: Enhance PublicActivityTimeline — filter tabs, changedFields

**Files:**
- Modify: `client/src/components/PublicActivityTimeline.tsx`

- [ ] **Step 1: Add `FilterKind` type and filter state**

  Add after the existing imports (around line 8):
  ```typescript
  type FilterKind = 'all' | 'submissions' | 'edits'
  ```

  Add `changedFields` to the `TimelineEntry` interface (around line 55):
  ```typescript
  interface TimelineEntry {
    kind: 'submission' | 'wiki'
    type: string
    action?: string
    title: string
    href: string
    entityType?: string
    entityName?: string
    date: Date
    borderColor: string
    bgColor: string
    textColor: string
    changedFields?: string[] | null  // add this line
  }
  ```

- [ ] **Step 2: Add `formatChangedFields` helper**

  Add before the `PublicActivityTimeline` function definition:
  ```typescript
  function formatChangedFields(fields: string[] | null | undefined): string {
    if (!fields?.length) return ''
    const filtered = fields.filter(f => !f.startsWith('priorStatus:'))
    if (!filtered.length) return ''
    const shown = filtered.slice(0, 4).map(f => f.charAt(0).toUpperCase() + f.slice(1))
    const rest = filtered.length - 4
    return rest > 0 ? `${shown.join(', ')} +${rest} more` : shown.join(', ')
  }
  ```

- [ ] **Step 3: Add filter state inside the component**

  Inside `PublicActivityTimeline`, after `const [visibleCount, setVisibleCount] = useState(8)`, add:
  ```typescript
  const [filter, setFilter] = useState<FilterKind>('all')
  ```

- [ ] **Step 4: Map `changedFields` into wiki entries in `useMemo`**

  Inside the `useMemo`, in the `wikiEntries` mapping (around line 139), add `changedFields` to the returned object:
  ```typescript
  const wikiEntries: TimelineEntry[] = wikiEdits
    .filter((e) => wikiEntityTypes.has(e.entityType?.toLowerCase()))
    .map((e) => {
      const eType = e.entityType.toLowerCase() as WikiEntityType
      const color = WIKI_COLOR[eType] ?? textColors.secondary
      return {
        kind: 'wiki' as const,
        type: eType,
        action: e.action,
        title: e.entityName ?? `${eType} #${e.entityId}`,
        href: wikiHref(eType, e.entityId),
        date: new Date(e.createdAt),
        changedFields: e.changedFields ?? null,  // add this line
        borderColor: color,
        bgColor: `${color}0a`,
        textColor: color,
      }
    })
  ```

- [ ] **Step 5: Compute `filtered` from `events`**

  After the `const visible = events.slice(0, visibleCount)` line (around line 159), replace those two lines with:
  ```typescript
  const filtered = filter === 'edits'
    ? events.filter(e => e.kind === 'wiki')
    : filter === 'submissions'
    ? events.filter(e => e.kind !== 'wiki')
    : events

  const visible = filtered.slice(0, visibleCount)
  ```

- [ ] **Step 6: Replace the header `<Text>Activity</Text>` with header + filter tabs**

  Find (around line 163):
  ```tsx
  <Text style={{ fontSize: '17px', fontWeight: 600, color: '#d4d4d4', marginBottom: 12 }}>Activity</Text>
  ```

  Replace with:
  ```tsx
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
  ```

  Also update the empty state check from `events.length === 0` to `filtered.length === 0`:
  ```tsx
  {filtered.length === 0 ? (
  ```

  And update the "Show more" button count from `events.length > visibleCount` / `events.length - visibleCount` to use `filtered`:
  ```tsx
  {filtered.length > visibleCount && (
    <Button
      variant="subtle" size="xs" fullWidth mt={8}
      onClick={() => setVisibleCount((v) => v + 8)}
      styles={{ root: { color: '#666', fontSize: '12px' } }}
    >
      Show more ({filtered.length - visibleCount} remaining)
    </Button>
  )}
  ```

- [ ] **Step 7: Add changedFields display in the wiki entry render block**

  Find the wiki entry subtitle (around line 213):
  ```tsx
  {ev.kind === 'wiki' && (
    <Text style={{ fontSize: '11px', color: ev.textColor, marginTop: '1px', opacity: 0.7 }}>
      {ev.type.charAt(0).toUpperCase() + ev.type.slice(1)}
    </Text>
  )}
  ```

  Replace with:
  ```tsx
  {ev.kind === 'wiki' && (
    <>
      <Text style={{ fontSize: '11px', color: ev.textColor, marginTop: '1px', opacity: 0.7 }}>
        {ev.type.charAt(0).toUpperCase() + ev.type.slice(1)}
      </Text>
      {formatChangedFields(ev.changedFields) && (
        <Text style={{ fontSize: '11px', color: '#666', marginTop: '1px' }}>
          {formatChangedFields(ev.changedFields)}
        </Text>
      )}
    </>
  )}
  ```

- [ ] **Step 8: Verify build**

  ```bash
  cd /Users/ninjaruss/Documents/GitHub/usogui-fansite/client && yarn build 2>&1 | tail -20
  ```

- [ ] **Step 9: Commit**

  ```bash
  cd /Users/ninjaruss/Documents/GitHub/usogui-fansite && git add client/src/components/PublicActivityTimeline.tsx && git commit -m "feat(user-profile): add filter tabs and changedFields display to public activity timeline"
  ```

---

## Task 5: Add changedFields display to Changelog

**Files:**
- Modify: `client/src/app/changelog/ChangelogPageContent.tsx`

- [ ] **Step 1: Add `changedFields` to the `EditEntry` interface**

  Find the `EditEntry` interface (around line 27):
  ```typescript
  interface EditEntry {
    id: number
    kind: 'edit'
    action: string
    entityType: string
    entityId: number
    entityName?: string
    createdAt: string
    user?: { id: number; username: string; fluxerAvatar?: string; fluxerId?: string } | null
  }
  ```

  Add `changedFields` field:
  ```typescript
  interface EditEntry {
    id: number
    kind: 'edit'
    action: string
    entityType: string
    entityId: number
    entityName?: string
    changedFields?: string[] | null  // add this line
    createdAt: string
    user?: { id: number; username: string; fluxerAvatar?: string; fluxerId?: string } | null
  }
  ```

- [ ] **Step 2: Map `changedFields` when building `editEntries`**

  Find the `editEntries` mapping in the `load` callback (around line 172):
  ```typescript
  const editEntries: EditEntry[] = (edits?.data ?? []).map((e) => ({
    id: e.id, kind: 'edit' as const,
    action: e.action, entityType: e.entityType, entityId: e.entityId,
    entityName: e.entityName,
    createdAt: e.createdAt, user: e.user,
  }))
  ```

  Add `changedFields`:
  ```typescript
  const editEntries: EditEntry[] = (edits?.data ?? []).map((e) => ({
    id: e.id, kind: 'edit' as const,
    action: e.action, entityType: e.entityType, entityId: e.entityId,
    entityName: e.entityName,
    changedFields: e.changedFields ?? null,  // add this line
    createdAt: e.createdAt, user: e.user,
  }))
  ```

- [ ] **Step 3: Add `formatChangedFields` helper**

  Add before the `ChangelogPageContent` function (around line 141):
  ```typescript
  function formatChangedFields(fields: string[] | null | undefined): string {
    if (!fields?.length) return ''
    const filtered = fields.filter(f => !f.startsWith('priorStatus:'))
    if (!filtered.length) return ''
    const shown = filtered.slice(0, 4).map(f => f.charAt(0).toUpperCase() + f.slice(1))
    const rest = filtered.length - 4
    return rest > 0 ? `${shown.join(', ')} +${rest} more` : shown.join(', ')
  }
  ```

- [ ] **Step 4: Render changedFields in the edit entry block**

  Find the edit entry secondary row (around line 405):
  ```tsx
  <Group gap={4}>
    <Text size="xs" style={{ color: eColor, fontWeight: 600 }}>{entityTypeLabel}</Text>
    <Text size="xs" c="dimmed" style={{ opacity: 0.5 }}>·</Text>
    <Clock size={11} style={{ color: textColors.tertiary, opacity: 0.5 }} />
    <Text size="xs" c="dimmed" style={{ opacity: 0.5 }}>{relativeTime(entry.createdAt)}</Text>
  </Group>
  ```

  Replace with:
  ```tsx
  <Group gap={4}>
    <Text size="xs" style={{ color: eColor, fontWeight: 600 }}>{entityTypeLabel}</Text>
    <Text size="xs" c="dimmed" style={{ opacity: 0.5 }}>·</Text>
    <Clock size={11} style={{ color: textColors.tertiary, opacity: 0.5 }} />
    <Text size="xs" c="dimmed" style={{ opacity: 0.5 }}>{relativeTime(entry.createdAt)}</Text>
  </Group>
  {formatChangedFields(entry.changedFields) && (
    <Text size="xs" style={{ color: '#666', marginTop: '2px' }}>
      {formatChangedFields(entry.changedFields)}
    </Text>
  )}
  ```

- [ ] **Step 5: Verify build**

  ```bash
  cd /Users/ninjaruss/Documents/GitHub/usogui-fansite/client && yarn build 2>&1 | tail -20
  ```

- [ ] **Step 6: Commit**

  ```bash
  cd /Users/ninjaruss/Documents/GitHub/usogui-fansite && git add client/src/app/changelog/ChangelogPageContent.tsx && git commit -m "feat(changelog): display changed fields inline on wiki edit entries"
  ```

---

## Self-Review

**Spec coverage check:**
- ✅ Remove duplicate `PublicActivityTimeline` from profile page → Task 2
- ✅ Add filter tabs (All / Submissions / Edits) to profile activity → Task 3
- ✅ Add filter tabs to public user detail activity → Task 4
- ✅ Display changed fields inline on wiki edits (profile) → Task 3
- ✅ Display changed fields inline on wiki edits (user detail) → Task 4
- ✅ Display changed fields inline on wiki edits (changelog) → Task 5
- ✅ `changedFields` not in api.ts types → Task 1 fixes that
- ✅ Annotation/media submission links use parent entityType+entityId — already correct in existing code; no regression introduced

**Placeholder scan:** None found.

**Type consistency:**
- `formatChangedFields(fields: string[] | null | undefined): string` — signature consistent across Tasks 3, 4, 5
- `FilterKind = 'all' | 'submissions' | 'edits'` — consistent across Tasks 3 and 4
- `changedFields?: string[] | null` — added to `TimelineEntry` (Task 4), `EditEntry` (Task 5), and `FeedEvent` (Task 3) consistently
- `textColors` — already imported in `PublicActivityTimeline`; newly imported in `ProfileFieldLog` (Task 3)
