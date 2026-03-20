# Reading Progress & Activity Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify reading progress into one shared component used on both pages, redesign the activity timeline with a colored left-border card layout, and add an activity feed to the user detail page.

**Architecture:** New `ReadingProgressBar` shared component replaces both the old `ProfileProgressReport` and the inline progress block in `UserProfileClient`. `ProfileFieldLog` is restyled in place. A new `PublicActivityTimeline` component is added to `UserProfileClient` for approved-only activity.

**Tech Stack:** Next.js 15, React 19, TypeScript, Mantine UI, Tailwind CSS 4

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `client/src/components/ReadingProgressBar.tsx` | **Create** | Shared visual: gradient bar + glowing dot + arc pills |
| `client/src/components/PublicActivityTimeline.tsx` | **Create** | Public-only activity feed for user detail page |
| `client/src/app/profile/ProfileProgressReport.tsx` | **Delete** | Merged into ReadingProgressBar |
| `client/src/app/profile/ProfileFieldLog.tsx` | **Restyle** | Left-border card timeline, visibleCount state |
| `client/src/app/profile/ProfilePageClient.tsx` | **Update** | Swap ProfileProgressReport import for ReadingProgressBar |
| `client/src/app/users/[id]/UserProfileClient.tsx` | **Update** | Replace right-column Box with Stack, add ReadingProgressBar + PublicActivityTimeline |

---

## Task 1: Create `ReadingProgressBar` shared component

**Files:**
- Create: `client/src/components/ReadingProgressBar.tsx`

Arc milestones from `constants.ts`:
- Babel ch.1, Face Poker ch.18, Old Maid ch.48, Liar's Dice ch.88, Chess ch.140, Blind Man's Bluff ch.195, Mahjong ch.270, Final ch.360

- [ ] **Step 1: Create the component file**

```tsx
// client/src/components/ReadingProgressBar.tsx
'use client'

import React from 'react'
import { Box, Text, Group } from '@mantine/core'
import { MAX_CHAPTER, PROFILE_ARC_MILESTONES } from '../lib/constants'

interface ReadingProgressBarProps {
  userProgress: number
  markerLabel?: string // "you" on profile; omit on public user detail page (dot still shows)
}

export default function ReadingProgressBar({ userProgress, markerLabel }: ReadingProgressBarProps) {
  const readPercent = Math.min(Math.round((userProgress / MAX_CHAPTER) * 100), 100)
  const dotPercent = Math.min((userProgress / MAX_CHAPTER) * 100, 100)

  // Find the current arc index (last arc whose startChapter <= userProgress)
  const currentArcIndex = PROFILE_ARC_MILESTONES.reduce((acc, arc, i) => {
    if (userProgress >= arc.startChapter) return i
    return acc
  }, 0)

  return (
    <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '16px' }}>
      <Group justify="space-between" mb={10}>
        <Text style={{ fontSize: '13px', color: '#aaa' }}>
          Chapter <span style={{ color: '#e5e5e5', fontWeight: 700 }}>{userProgress}</span> of {MAX_CHAPTER}
        </Text>
        <Text style={{ fontSize: '13px', color: '#e11d48', fontWeight: 700 }}>{readPercent}%</Text>
      </Group>

      {/* Progress bar with glowing dot */}
      <Box style={{ position: 'relative', marginBottom: markerLabel ? '24px' : '16px' }}>
        {/* Marker label above dot (only when markerLabel provided) */}
        {markerLabel && (
          <Box
            style={{
              position: 'absolute',
              left: `${dotPercent}%`,
              bottom: '100%',
              transform: 'translateX(-50%)',
              marginBottom: '4px',
              whiteSpace: 'nowrap',
            }}
          >
            <Text style={{ fontSize: '9px', color: 'rgba(225,29,72,0.7)', fontFamily: 'monospace' }}>
              {markerLabel}
            </Text>
          </Box>
        )}

        {/* Track */}
        <Box style={{ height: '6px', background: '#111', borderRadius: '3px', position: 'relative' }}>
          {/* Gradient fill */}
          <Box
            style={{
              width: `${dotPercent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #e11d48, #7c3aed)',
              borderRadius: '3px',
            }}
          />
          {/* Glowing dot — always rendered */}
          <Box
            style={{
              position: 'absolute',
              left: `${dotPercent}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '10px',
              height: '10px',
              background: '#e11d48',
              borderRadius: '50%',
              border: '2px solid #0d0d0d',
              boxShadow: '0 0 6px rgba(225,29,72,0.6)',
            }}
          />
        </Box>
      </Box>

      {/* Arc pills */}
      <Box style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
        {PROFILE_ARC_MILESTONES.map((arc, i) => {
          const isCompleted = i < currentArcIndex
          const isCurrent = i === currentArcIndex

          const bg = isCurrent
            ? 'rgba(124,58,237,0.15)'
            : isCompleted
            ? 'rgba(225,29,72,0.1)'
            : '#111'
          const border = isCurrent
            ? 'rgba(124,58,237,0.35)'
            : isCompleted
            ? 'rgba(225,29,72,0.2)'
            : '#1a1a1a'
          const color = isCurrent ? '#a78bfa' : isCompleted ? '#e11d48' : '#333'
          const label = isCurrent
            ? `${arc.name} ← now`
            : isCompleted
            ? `${arc.name} ✓`
            : arc.name

          return (
            <Box
              key={arc.name}
              style={{
                fontSize: '9px',
                padding: '2px 6px',
                background: bg,
                border: `1px solid ${border}`,
                color,
                borderRadius: '2px',
                fontWeight: isCurrent ? 600 : 400,
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </Box>
          )
        })}
      </Box>

      <Text style={{ fontSize: '10px', color: '#555' }}>
        Currently in:{' '}
        <span style={{ color: '#888' }}>{PROFILE_ARC_MILESTONES[currentArcIndex]?.name}</span>
      </Text>
    </Box>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | head -30
```

Expected: no errors related to `ReadingProgressBar.tsx`

- [ ] **Step 3: Commit**

```bash
git add client/src/components/ReadingProgressBar.tsx
git commit -m "feat: add shared ReadingProgressBar component with arc pills"
```

---

## Task 2: Replace `ProfileProgressReport` with `ReadingProgressBar`

**Files:**
- Delete: `client/src/app/profile/ProfileProgressReport.tsx`
- Modify: `client/src/app/profile/ProfilePageClient.tsx` line 24 (import) and line 331 (usage)

- [ ] **Step 1: Delete `ProfileProgressReport.tsx`**

```bash
rm client/src/app/profile/ProfileProgressReport.tsx
```

- [ ] **Step 2: Update the import in `ProfilePageClient.tsx`**

Find line 24:
```tsx
import ProfileProgressReport from './ProfileProgressReport'
```
Replace with:
```tsx
import ReadingProgressBar from '../../components/ReadingProgressBar'
```

- [ ] **Step 3: Update the usage in `ProfilePageClient.tsx`**

Find (around line 330–332):
```tsx
<Box style={{ gridColumn: '1 / -1' }}>
  <ProfileProgressReport userProgress={user?.userProgress ?? 0} />
</Box>
```
Replace with:
```tsx
<Box style={{ gridColumn: '1 / -1' }}>
  <ReadingProgressBar userProgress={user?.userProgress ?? 0} markerLabel="you" />
</Box>
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | head -30
```

Expected: no errors, no remaining references to `ProfileProgressReport`

- [ ] **Step 5: Commit**

```bash
git add client/src/app/profile/ProfilePageClient.tsx
git rm client/src/app/profile/ProfileProgressReport.tsx
git commit -m "feat: replace ProfileProgressReport with shared ReadingProgressBar"
```

---

## Task 3: Restyle `ProfileFieldLog` with left-border card timeline

**Files:**
- Modify: `client/src/app/profile/ProfileFieldLog.tsx`

Key changes:
- Add `useState` for `visibleCount` (starts at 8)
- Change `useMemo` to sort only (remove `.slice(0, 5)`)
- Replace the flat `Group` row layout with a left-border card layout (2px colored border + `#0f0f0f` card bg)
- Remove the right-side type badge box
- Add "Show more" button

- [ ] **Step 1: Replace the full file**

```tsx
// client/src/app/profile/ProfileFieldLog.tsx
'use client'

import React, { useMemo, useState } from 'react'
import { Box, Text, Group, Button } from '@mantine/core'

type EventType = 'guide' | 'media' | 'annotation' | 'event' | 'progress'

interface FeedEvent {
  type: EventType
  title: string
  detail: string
  date: Date
}

const TYPE_BORDER: Record<EventType, string> = {
  guide:      '#3a7a4a',
  media:      '#3a4a6a',
  annotation: '#5a4a7a',
  event:      '#7a6020',
  progress:   '#7a5030',
}

const TYPE_BG: Record<EventType, string> = {
  guide:      'rgba(34,197,94,0.04)',
  media:      'rgba(59,130,246,0.04)',
  annotation: 'rgba(124,58,237,0.04)',
  event:      'rgba(245,158,11,0.04)',
  progress:   'rgba(249,115,22,0.04)',
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
}

interface FieldLogUser {
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

export default function ProfileFieldLog({ guides, submissions, user, submissionEdits }: ProfileFieldLogProps) {
  const [visibleCount, setVisibleCount] = useState(8)

  const events = useMemo<FeedEvent[]>(() => {
    const items: FeedEvent[] = []

    // Guides — use updatedAt so status changes surface correctly
    for (const guide of guides) {
      const actionMap: Record<string, string> = {
        pending: 'Guide submitted',
        approved: 'Guide approved',
        rejected: 'Guide rejected',
      }
      items.push({
        type: 'guide',
        title: actionMap[guide.status] ?? 'Guide updated',
        detail: guide.title,
        date: new Date(guide.updatedAt || guide.createdAt),
      })
    }

    // Submissions (media, events, annotations)
    for (const sub of submissions) {
      const type = sub.type as EventType
      if (!TYPE_BORDER[type]) continue

      const titleMap: Record<string, Record<string, string>> = {
        media:      { pending: 'Media submitted', approved: 'Media approved', rejected: 'Media rejected' },
        event:      { pending: 'Event submitted', approved: 'Event approved', rejected: 'Event rejected' },
        annotation: { pending: 'Annotation added', approved: 'Annotation approved', rejected: 'Annotation rejected' },
      }
      items.push({
        type,
        title: titleMap[type]?.[sub.status] ?? `${type} updated`,
        detail: sub.title ?? '',
        date: new Date(sub.createdAt),
      })
    }

    // Reading progress — single entry if progress > 0
    if (user?.userProgress && user.userProgress > 0 && user.updatedAt) {
      items.push({
        type: 'progress',
        title: 'Reading progress',
        detail: `Chapter ${user.userProgress} reached`,
        date: new Date(user.updatedAt),
      })
    }

    // Submission edits
    for (const edit of (submissionEdits ?? [])) {
      const type = edit.entityType as EventType
      const priorStatusField = (edit.changedFields ?? []).find(
        (f) => f.startsWith('priorStatus:')
      )
      const priorStatus = priorStatusField?.split(':')[1]
      const action = priorStatus === 'REJECTED' ? 'resubmitted' : 'edited'
      const resolvedType: EventType = TYPE_BORDER[type] ? type : 'event'
      items.push({
        type: resolvedType,
        title: `${edit.entityType.charAt(0).toUpperCase() + edit.entityType.slice(1)} ${action}`,
        detail: edit.entityName ?? '',
        date: new Date(edit.createdAt),
      })
    }

    // Sort descending — no slice here; visibleCount controls rendering
    return items.sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [guides, submissions, user, submissionEdits])

  const visible = events.slice(0, visibleCount)

  return (
    <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '12px' }}>
      <Text style={{ fontSize: '17px', fontWeight: 600, color: '#d4d4d4', marginBottom: 12 }}>Activity</Text>

      {events.length === 0 ? (
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | head -30
```

Expected: no errors in `ProfileFieldLog.tsx`

- [ ] **Step 3: Commit**

```bash
git add client/src/app/profile/ProfileFieldLog.tsx
git commit -m "feat: restyle ProfileFieldLog with left-border card timeline"
```

---

## Task 4: Create `PublicActivityTimeline` component

**Files:**
- Create: `client/src/components/PublicActivityTimeline.tsx`

Data source: `submissions` prop comes from `api.getPublicUserSubmissions(userId)` — already filtered to approved-only and includes all types (guide, media, annotation, event).

- [ ] **Step 1: Create the component file**

```tsx
// client/src/components/PublicActivityTimeline.tsx
'use client'

import React, { useMemo, useState } from 'react'
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | head -30
```

Expected: no errors in `PublicActivityTimeline.tsx`

- [ ] **Step 3: Commit**

```bash
git add client/src/components/PublicActivityTimeline.tsx
git commit -m "feat: add PublicActivityTimeline component for user detail page"
```

---

## Task 5: Update `UserProfileClient.tsx` — wire in new components

**Files:**
- Modify: `client/src/app/users/[id]/UserProfileClient.tsx`

Three changes:
1. Add imports for `ReadingProgressBar` and `PublicActivityTimeline`
2. Remove the `Progress` import from Mantine (no longer used)
3. Replace the right-column `<Box>` (lines 371–399) with a bare `<Stack gap="md">` containing `<ReadingProgressBar>` and `<PublicActivityTimeline>`

- [ ] **Step 1: Update imports at the top of `UserProfileClient.tsx`**

Find the current Mantine import line (line 5–18):
```tsx
import {
  Anchor,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Group,
  Progress,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  useMantineTheme
} from '@mantine/core'
```

Replace with (remove `Progress`, keep everything else):
```tsx
import {
  Anchor,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Group,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  useMantineTheme
} from '@mantine/core'
```

Then add two new import lines after the existing component imports (after line 30 `import { MAX_CHAPTER } from '../../../lib/constants'`):
```tsx
import ReadingProgressBar from '../../../components/ReadingProgressBar'
import PublicActivityTimeline from '../../../components/PublicActivityTimeline'
```

- [ ] **Step 2: Remove the `readPercent` variable and replace the right column**

Find `readPercent` computed variable (line 169):
```tsx
const readPercent = Math.min(Math.round((user.userProgress / MAX_CHAPTER) * 100), 100)
```
Delete this line — it's now computed inside `ReadingProgressBar`.

Also remove `MAX_CHAPTER` from the import on line 30 if it's no longer used anywhere else in the file. Check first:
```bash
grep -n "MAX_CHAPTER\|readPercent" client/src/app/users/\[id\]/UserProfileClient.tsx
```
If `MAX_CHAPTER` is still used in the stat strip (line ~246: `{ value: \`${readPercent}%\`, label: 'Read', accent: false }`), keep the import but update the stat strip to compute inline:
```tsx
{ value: `${Math.min(Math.round((user.userProgress / MAX_CHAPTER) * 100), 100)}%`, label: 'Read', accent: false },
```
Or keep `readPercent` and just remove its dependency on the old Progress component. Either approach is fine — pick whichever leaves less diff.

- [ ] **Step 3: Replace the right-column `<Box>` (lines 371–399) with new Stack**

Find the right-column block (the `<Box>` starting at line 372 with `background: '#0d0d0d', border: '1px solid #1a1a1a'...` that contains the Reading Progress heading and Mantine `<Progress>` bar):

```tsx
          {/* Right column: Reading Progress */}
          <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '16px' }}>
            <Stack gap="md">
              <Text fw={700}>Reading Progress</Text>

              <Group justify="space-between" align="flex-end">
                <Stack gap={2}>
                  <Text size="xs" c="dimmed">Chapter</Text>
                  <Text style={{ fontFamily: 'var(--font-opti-goudy-text)', fontSize: '1.5rem', color: arcColor, lineHeight: 1 }}>
                    {user.userProgress}
                  </Text>
                </Stack>
                <Stack gap={2} style={{ textAlign: 'right' }}>
                  <Text size="xs" c="dimmed">Total</Text>
                  <Text style={{ fontFamily: 'var(--font-opti-goudy-text)', fontSize: '1.5rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1 }}>
                    {MAX_CHAPTER}
                  </Text>
                </Stack>
              </Group>

              <Progress value={readPercent} color={arcColor} size="lg" radius="md" striped animated />

              <Group justify="space-between">
                <Text size="xs" c="dimmed">0%</Text>
                <Text size="sm" fw={600} c={arcColor}>{readPercent}%</Text>
                <Text size="xs" c="dimmed">100%</Text>
              </Group>
            </Stack>
          </Box>
```

Replace entirely with:
```tsx
          {/* Right column: Reading Progress + Activity */}
          <Stack gap="md">
            <ReadingProgressBar userProgress={user.userProgress} />
            <PublicActivityTimeline submissions={submissions} />
          </Stack>
```

- [ ] **Step 4: Remove unused variables**

After the replacement, `arcColor` may still be referenced elsewhere (in the stat strip). Check:
```bash
grep -n "arcColor" client/src/app/users/\[id\]/UserProfileClient.tsx
```
If `arcColor` is only used in the deleted block, remove both the variable declaration (`const arcColor = getEntityThemeColor(theme, 'arc')`) and check if `getEntityThemeColor` or `useMantineTheme` are still needed elsewhere in the file. Remove any imports that become unused.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | head -50
```

Expected: clean build, no TypeScript errors

- [ ] **Step 6: Commit**

```bash
git add client/src/app/users/\[id\]/UserProfileClient.tsx
git commit -m "feat: wire ReadingProgressBar and PublicActivityTimeline into user detail page"
```

---

## Task 6: Visual verification

- [ ] **Step 1: Start both dev servers**

```bash
# Terminal 1
cd server && yarn start:dev

# Terminal 2
cd client && yarn dev
```

- [ ] **Step 2: Check profile page** (`http://localhost:3000/profile`)

Verify:
- Reading progress shows gradient bar + glowing rose dot + arc pills below
- "you" label appears above the dot
- Arc pills: completed arcs in rose with ✓, current arc in purple with ← now, upcoming arcs dim
- Activity section shows left-border card rows (no more dark badges)
- "Show more" button appears if there are more than 8 events

- [ ] **Step 3: Check a user detail page** (`http://localhost:3000/users/[any-id]`)

Verify:
- Right column now shows `ReadingProgressBar` (same design as profile, but no "you" label — dot only) and `PublicActivityTimeline` stacked
- Activity shows approved-only entries ("Guide published", "Media contributed", etc.)
- No pending/rejected statuses visible
- "Show more" button appears if there are more than 8 items

- [ ] **Step 4: Final commit (if any last-minute fixes)**

```bash
git add -p
git commit -m "fix: reading progress and activity visual tweaks"
```
