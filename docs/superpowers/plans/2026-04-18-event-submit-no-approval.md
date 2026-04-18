# Event Submit Flow — Remove Approval Messaging

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove approval-workflow messaging from the event submit and edit flows; events are now published immediately and have no moderation status.

**Architecture:** Add `requiresApproval?: boolean` (default `true`) to two shared components — `SubmissionSuccess` and `EditPageShell`. Event pages pass `false`; all other callers (guides, media, annotations) are untouched. Four files total, no new files created.

**Tech Stack:** Next.js 15, React 19, TypeScript, Mantine UI

---

## File Map

**Modify:**
- `client/src/components/SubmissionSuccess.tsx` — add `requiresApproval` prop; branch "what happens next" content
- `client/src/components/EditPageShell.tsx` — make `status` optional; add `requiresApproval` prop; hide status badge and approval alerts when false
- `client/src/app/submit-event/SubmitEventPageContent.tsx` — pass `requiresApproval={false}`; remove "Reviewed before publishing" text
- `client/src/app/events/[id]/edit/EditEventPageContent.tsx` — pass `requiresApproval={false}`; remove `status="approved"`; remove "Sent back to moderators for review" text

---

## Task 1: Update `SubmissionSuccess`

**Files:**
- Modify: `client/src/components/SubmissionSuccess.tsx`

- [ ] **Step 1: Add `requiresApproval` prop and branch the "what happens next" content**

  Replace the full file contents with:

  ```tsx
  'use client'

  import React from 'react'
  import { Box, Button, Group, List, Stack, Text, ThemeIcon, Title, rem } from '@mantine/core'
  import { Check } from 'lucide-react'
  import { useRouter } from 'next/navigation'
  import { motion } from 'motion/react'

  interface SubmissionSuccessProps {
    type: 'guide' | 'media' | 'event' | 'annotation'
    isEdit?: boolean
    accentColor?: string
    requiresApproval?: boolean
    onSubmitAnother: () => void
  }

  const DEFAULT_ACCENT = '#22c55e'

  export default function SubmissionSuccess({
    type,
    isEdit = false,
    accentColor = DEFAULT_ACCENT,
    requiresApproval = true,
    onSubmitAnother
  }: SubmissionSuccessProps) {
    const router = useRouter()

    const typeLabels: Record<string, string> = {
      guide: 'Guide',
      media: 'Media',
      event: 'Event',
      annotation: 'Annotation'
    }

    const label = typeLabels[type]
    const action = isEdit ? 'Resubmitted' : 'Submitted'

    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <Box
          mb="lg"
          style={{
            backgroundColor: `${accentColor}0d`,
            border: `1px solid ${accentColor}40`,
            borderRadius: rem(12),
            padding: rem(24),
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Top accent line */}
          <Box
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: rem(2),
              background: `linear-gradient(90deg, ${accentColor}, transparent)`,
              borderRadius: `${rem(12)} ${rem(12)} 0 0`
            }}
          />

          <Stack gap="md">
            <Group align="center" gap="sm">
              <ThemeIcon
                radius="xl"
                size="lg"
                style={{
                  backgroundColor: `${accentColor}20`,
                  color: accentColor,
                  border: `1px solid ${accentColor}40`
                }}
              >
                <Check size={18} />
              </ThemeIcon>
              <Title
                order={4}
                style={{
                  fontFamily: 'var(--font-opti-goudy-text)',
                  fontWeight: 400,
                  color: '#fff'
                }}
              >
                {label} {action} Successfully
              </Title>
            </Group>

            <Text size="sm" c="dimmed" fw={500}>
              What happens next
            </Text>

            {requiresApproval ? (
              <>
                <List
                  size="sm"
                  spacing="xs"
                  styles={{ item: { color: 'rgba(255,255,255,0.7)' } }}
                >
                  <List.Item>Moderators will review your submission within 48 hours</List.Item>
                  <List.Item>Check the status on your Profile page</List.Item>
                  <List.Item>Your {label.toLowerCase()} will appear publicly once approved</List.Item>
                  {isEdit && <List.Item>Your submission is now pending review again</List.Item>}
                </List>

                <Group gap="sm" mt="xs">
                  <Button
                    onClick={() => router.push('/profile')}
                    variant="light"
                    size="sm"
                    style={{
                      backgroundColor: `${accentColor}18`,
                      color: accentColor,
                      border: `1px solid ${accentColor}35`
                    }}
                  >
                    View My Submissions
                  </Button>
                  <Button
                    onClick={onSubmitAnother}
                    variant="subtle"
                    size="sm"
                    style={{ color: 'rgba(255,255,255,0.6)' }}
                  >
                    Submit Another {label}
                  </Button>
                </Group>
              </>
            ) : (
              <>
                <List
                  size="sm"
                  spacing="xs"
                  styles={{ item: { color: 'rgba(255,255,255,0.7)' } }}
                >
                  <List.Item>Your {label.toLowerCase()} is now live and publicly visible.</List.Item>
                </List>

                <Group gap="sm" mt="xs">
                  <Button
                    onClick={onSubmitAnother}
                    variant="light"
                    size="sm"
                    style={{
                      backgroundColor: `${accentColor}18`,
                      color: accentColor,
                      border: `1px solid ${accentColor}35`
                    }}
                  >
                    Submit Another {label}
                  </Button>
                </Group>
              </>
            )}
          </Stack>
        </Box>
      </motion.div>
    )
  }
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  cd client && yarn build 2>&1 | grep -E "SubmissionSuccess|error TS" | head -20
  ```

  Expected: no errors from `SubmissionSuccess.tsx`. (Other files may error until Tasks 3–4 are done — that's fine.)

- [ ] **Step 3: Commit**

  ```bash
  cd client
  git add src/components/SubmissionSuccess.tsx
  git commit -m "refactor(submit): add requiresApproval prop to SubmissionSuccess"
  ```

---

## Task 2: Update `EditPageShell`

**Files:**
- Modify: `client/src/components/EditPageShell.tsx`

- [ ] **Step 1: Make `status` optional and add `requiresApproval` prop**

  Replace the `EditPageShellProps` interface (lines 17–27) with:

  ```tsx
  export interface EditPageShellProps {
    type: 'guide' | 'media' | 'annotation' | 'event'
    accentColor: string
    submissionTitle: string
    status?: 'pending' | 'approved' | 'rejected'
    submittedAt: string
    updatedAt?: string
    submissionId?: number | string
    rejectionReason?: string | null
    requiresApproval?: boolean
    children: React.ReactNode
  }
  ```

- [ ] **Step 2: Update the destructure and status badge logic**

  Replace the function signature and the `statusInfo` line (lines 29–41) with:

  ```tsx
  export function EditPageShell({
    type,
    accentColor,
    submissionTitle,
    status,
    submittedAt,
    updatedAt,
    submissionId,
    rejectionReason,
    requiresApproval = true,
    children,
  }: EditPageShellProps) {
    const statusInfo = status ? (STATUS_BADGE[status] ?? STATUS_BADGE.pending) : null
    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1)
  ```

- [ ] **Step 3: Conditionally render the status badge**

  Find the status `<Badge>` block (lines 141–152):

  ```tsx
              <Badge
                size="xs"
                style={{
                  backgroundColor: `${statusInfo.color}14`,
                  color: statusInfo.color,
                  borderColor: `${statusInfo.color}35`,
                }}
                variant="outline"
              >
                {statusInfo.label}
              </Badge>
  ```

  Replace it with:

  ```tsx
              {requiresApproval && statusInfo && (
                <Badge
                  size="xs"
                  style={{
                    backgroundColor: `${statusInfo.color}14`,
                    color: statusInfo.color,
                    borderColor: `${statusInfo.color}35`,
                  }}
                  variant="outline"
                >
                  {statusInfo.label}
                </Badge>
              )}
  ```

- [ ] **Step 4: Conditionally render the Status Context Panel**

  Find the two alert blocks (lines 179–211):

  ```tsx
        {status === 'rejected' && (
          <Alert ...>...</Alert>
        )}

        {status === 'approved' && (
          <Alert ...>...</Alert>
        )}
  ```

  Wrap both in `{requiresApproval && (`:

  ```tsx
        {requiresApproval && status === 'rejected' && (
          <Alert
            mb="md"
            icon={<AlertTriangle size={16} />}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.06)',
              borderColor: 'rgba(239, 68, 68, 0.22)',
              borderLeft: '3px solid rgba(239, 68, 68, 0.6)',
            }}
          >
            <Text size="sm" c="#f87171" fw={700} mb={4} style={{ letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: rem(10) }}>
              Moderator Feedback
            </Text>
            <Text size="sm" c="rgba(248, 113, 113, 0.85)">
              {rejectionReason || 'No reason provided.'}
            </Text>
          </Alert>
        )}

        {requiresApproval && status === 'approved' && (
          <Alert
            mb="md"
            icon={<Info size={16} />}
            style={{
              backgroundColor: `${accentColor}08`,
              borderColor: `${accentColor}25`,
            }}
          >
            <Text size="sm" style={{ color: accentColor }}>
              This submission is approved and live. Editing will send it back for moderator re-review.
            </Text>
          </Alert>
        )}
  ```

- [ ] **Step 5: Verify TypeScript compiles**

  ```bash
  cd client && yarn build 2>&1 | grep -E "EditPageShell|error TS" | head -20
  ```

  Expected: no errors from `EditPageShell.tsx`.

- [ ] **Step 6: Commit**

  ```bash
  cd client
  git add src/components/EditPageShell.tsx
  git commit -m "refactor(edit): make status optional, add requiresApproval prop to EditPageShell"
  ```

---

## Task 3: Update Submit Event Page

**Files:**
- Modify: `client/src/app/submit-event/SubmitEventPageContent.tsx`

- [ ] **Step 1: Pass `requiresApproval={false}` to `SubmissionSuccess`**

  Find (around line 217):
  ```tsx
          <SubmissionSuccess
            type="event"
            accentColor={accentColor}
            onSubmitAnother={() => { setShowSuccess(false) }}
          />
  ```

  Replace with:
  ```tsx
          <SubmissionSuccess
            type="event"
            accentColor={accentColor}
            requiresApproval={false}
            onSubmitAnother={() => { setShowSuccess(false) }}
          />
  ```

- [ ] **Step 2: Remove "Reviewed before publishing" text**

  Find (around line 298):
  ```tsx
                    <Text size="xs" c="dimmed">Reviewed before publishing</Text>
  ```

  Delete that line entirely.

- [ ] **Step 3: Verify TypeScript compiles**

  ```bash
  cd client && yarn build 2>&1 | grep -E "SubmitEventPageContent|submit-event|error TS" | head -20
  ```

  Expected: no errors.

- [ ] **Step 4: Commit**

  ```bash
  cd client
  git add src/app/submit-event/SubmitEventPageContent.tsx
  git commit -m "refactor(events): remove approval messaging from event submit page"
  ```

---

## Task 4: Update Edit Event Page

**Files:**
- Modify: `client/src/app/events/[id]/edit/EditEventPageContent.tsx`

- [ ] **Step 1: Replace `status="approved"` with `requiresApproval={false}`**

  Find (around line 234):
  ```tsx
        <EditPageShell
          type="event"
          accentColor={accentColor}
          submissionTitle={existingEvent.title}
          status="approved"
          submittedAt={existingEvent.createdAt ?? new Date().toISOString()}
          updatedAt={existingEvent.updatedAt}
          submissionId={existingEvent.id}
        >
  ```

  Replace with:
  ```tsx
        <EditPageShell
          type="event"
          accentColor={accentColor}
          submissionTitle={existingEvent.title}
          requiresApproval={false}
          submittedAt={existingEvent.createdAt ?? new Date().toISOString()}
          updatedAt={existingEvent.updatedAt}
          submissionId={existingEvent.id}
        >
  ```

- [ ] **Step 2: Pass `requiresApproval={false}` to `SubmissionSuccess`**

  Find (around line 244):
  ```tsx
          <SubmissionSuccess
            type="event"
            isEdit
            accentColor={accentColor}
            onSubmitAnother={() => router.push('/profile')}
          />
  ```

  Replace with:
  ```tsx
          <SubmissionSuccess
            type="event"
            isEdit
            accentColor={accentColor}
            requiresApproval={false}
            onSubmitAnother={() => router.push('/profile')}
          />
  ```

- [ ] **Step 3: Remove "Sent back to moderators for review" text**

  Find (around line 530):
  ```tsx
                    <Text size="xs" c="dimmed">Sent back to moderators for review</Text>
  ```

  Delete that line entirely.

- [ ] **Step 4: Verify full build passes**

  ```bash
  cd client && yarn build 2>&1 | tail -20
  ```

  Expected: clean build, no TypeScript errors, sitemap generation completes.

- [ ] **Step 5: Commit**

  ```bash
  cd client
  git add "src/app/events/[id]/edit/EditEventPageContent.tsx"
  git commit -m "refactor(events): remove approval messaging from event edit page"
  ```
