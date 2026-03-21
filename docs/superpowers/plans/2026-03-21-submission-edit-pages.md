# Submission Edit Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `?edit=<id>` query-param edit pattern with dedicated `/[type]s/[id]/edit` routes, visually refresh submit pages, and add a distinct amber-signal edit-mode layout across all four submission types (guide, media, annotation, event).

**Architecture:** New dedicated edit routes each render a thin server `page.tsx` + a client content component. A shared `EditPageShell` component handles the edit identity header, breadcrumb, and status callout. Submit pages get backward-compat redirects and simplified create-only logic. `SubmissionCard` and profile links are updated to point to new routes.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Mantine UI, Lucide React, Motion (motion/react)

**Spec:** `docs/superpowers/specs/2026-03-21-submission-edit-pages-design.md`

---

## File Map

**New files:**
- `client/src/components/EditPageShell.tsx` — shared edit-mode wrapper (breadcrumb + amber header + status callout)
- `client/src/app/guides/[id]/edit/page.tsx` — guide edit route (server)
- `client/src/app/guides/[id]/edit/EditGuidePageContent.tsx` — guide edit form (client)
- `client/src/app/annotations/[id]/edit/page.tsx` — annotation edit route (server)
- `client/src/app/annotations/[id]/edit/EditAnnotationPageContent.tsx` — annotation edit form (client)
- `client/src/app/events/[id]/edit/page.tsx` — event edit route (server)
- `client/src/app/events/[id]/edit/EditEventPageContent.tsx` — event edit form (client)
- `client/src/app/media/[id]/edit/page.tsx` — media edit route (server, string ID)
- `client/src/app/media/[id]/edit/EditMediaPageContent.tsx` — media edit form (client, FormData)

**Modified files:**
- `client/src/lib/api.ts` — add `getMyEventSubmission(id: number)`
- `client/src/components/FormSection.tsx` — add `hasValue?: boolean` prop for pre-populated border styling
- `client/src/app/submit-guide/page.tsx` — async, redirect ?edit, preserve Suspense
- `client/src/app/submit-media/page.tsx` — async, redirect ?edit, preserve Suspense
- `client/src/app/submit-annotation/page.tsx` — async, redirect ?edit, preserve Suspense
- `client/src/app/submit-event/page.tsx` — async, redirect ?edit, preserve Suspense
- `client/src/app/submit-guide/SubmitGuidePageContent.tsx` — remove all edit-mode logic
- `client/src/app/submit-media/SubmitMediaPageContent.tsx` — remove all edit-mode logic
- `client/src/app/submit-annotation/SubmitAnnotationPageContent.tsx` — remove all edit-mode logic
- `client/src/app/submit-event/SubmitEventPageContent.tsx` — remove all edit-mode logic
- `client/src/components/SubmissionCard.tsx` — update `getEditLink` to new routes
- `client/src/app/profile/ProfileContentTabs.tsx` — update any hardcoded edit links to new routes

---

## Task 1: Foundation — api.ts + FormSection

**Files:**
- Modify: `client/src/lib/api.ts`
- Modify: `client/src/components/FormSection.tsx`

- [ ] **Step 1.1: Add `getMyEventSubmission` to api.ts**

  Open `client/src/lib/api.ts`. Search for `getMyGuideSubmission` (line ~700). Add the new method near the other `getMyXSubmission` methods:

  ```typescript
  async getMyEventSubmission(id: number) {
    return this.get<any>(`/events/${id}`)
  }
  ```

  Place it near `updateOwnEvent` (line ~1424) for grouping.

- [ ] **Step 1.2: Add `hasValue` prop to FormSection**

  Open `client/src/components/FormSection.tsx`. Update the interface and left border style:

  ```typescript
  interface FormSectionProps {
    title: string
    description?: string
    icon?: React.ReactNode
    accentColor: string
    required?: boolean
    stepNumber?: number
    hasValue?: boolean   // ← ADD: true when section contains pre-populated data
    children: React.ReactNode
  }

  export function FormSection({
    title,
    description,
    icon,
    accentColor,
    required,
    stepNumber,
    hasValue = false,   // ← ADD
    children
  }: FormSectionProps) {
    return (
      <Box
        style={{
          padding: rem(24),
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderRadius: rem(12),
          border: `1px solid ${accentColor}25`,
          borderLeft: hasValue
            ? `3px solid ${accentColor}90`   // ← brighter when pre-populated
            : `3px solid ${accentColor}60`,
          position: 'relative'
        }}
      >
        {/* rest unchanged */}
  ```

- [ ] **Step 1.3: Verify TypeScript compiles**

  ```bash
  cd client && yarn build 2>&1 | tail -20
  ```

  Expected: no new errors related to `FormSection` or `getMyEventSubmission`.

- [ ] **Step 1.4: Commit**

  ```bash
  git add client/src/lib/api.ts client/src/components/FormSection.tsx
  git commit -m "feat: add getMyEventSubmission to api, add hasValue prop to FormSection"
  ```

---

## Task 2: EditPageShell Component

**Files:**
- Create: `client/src/components/EditPageShell.tsx`

- [ ] **Step 2.1: Create EditPageShell**

  ```typescript
  // client/src/components/EditPageShell.tsx
  'use client'

  import React from 'react'
  import { Alert, Badge, Box, Group, Text, Title, rem } from '@mantine/core'
  import { AlertTriangle, ChevronLeft, Info, Pencil } from 'lucide-react'
  import Link from 'next/link'
  import { motion } from 'motion/react'

  const AMBER = '#f59e0b'

  const STATUS_BADGE: Record<string, { label: string; color: string }> = {
    pending:  { label: 'Pending Review', color: '#fbbf24' },
    approved: { label: 'Approved',       color: '#22c55e' },
    rejected: { label: 'Rejected',       color: '#f87171' },
  }

  export interface EditPageShellProps {
    type: 'guide' | 'media' | 'annotation' | 'event'
    accentColor: string
    submissionTitle: string
    status: 'pending' | 'approved' | 'rejected'
    submittedAt: string
    updatedAt?: string
    submissionId?: number | string   // optional — media uses UUID strings; omit to hide
    rejectionReason?: string | null
    children: React.ReactNode
  }

  export function EditPageShell({
    type,
    accentColor,
    submissionTitle,
    status,
    submittedAt,
    updatedAt,
    submissionId,
    rejectionReason,
    children,
  }: EditPageShellProps) {
    const statusInfo = STATUS_BADGE[status] ?? STATUS_BADGE.pending
    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1)

    const submittedDate = new Date(submittedAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
    const updatedDate = updatedAt
      ? new Date(updatedAt).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric',
        })
      : null

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Breadcrumb */}
        <Group gap="xs" mb="md" style={{ fontSize: rem(13), color: '#666' }}>
          <Link
            href="/profile"
            style={{
              color: '#888',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: rem(4),
            }}
          >
            <ChevronLeft size={14} />
            My Submissions
          </Link>
          <Text c="dimmed" size="sm">/</Text>
          <Text size="sm" c="dimmed">Edit {typeLabel}</Text>
        </Group>

        {/* Edit Identity Header */}
        <Box
          mb="md"
          style={{
            backgroundColor: '#111114',
            border: `1px solid ${accentColor}22`,
            borderRadius: rem(10),
            padding: rem(20),
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top gradient bar: amber → entity color → transparent */}
          <Box
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: rem(2),
              background: `linear-gradient(90deg, ${AMBER}, ${accentColor} 45%, transparent)`,
              opacity: 0.85,
            }}
          />
          {/* Left stripe: amber → entity color → transparent */}
          <Box
            style={{
              position: 'absolute',
              top: 0, left: 0, bottom: 0,
              width: rem(3),
              background: `linear-gradient(180deg, ${AMBER} 0%, ${accentColor} 60%, transparent 100%)`,
            }}
          />

          <Group gap="md" align="flex-start" mt={rem(4)} ml={rem(8)}>
            {/* Icon */}
            <Box
              style={{
                width: rem(42), height: rem(42),
                borderRadius: rem(9),
                backgroundColor: `${accentColor}12`,
                border: `1px solid ${accentColor}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: accentColor,
                flexShrink: 0,
              }}
            >
              <Pencil size={18} />
            </Box>

            <Box style={{ flex: 1 }}>
              {/* Badge row */}
              <Group gap="xs" mb={rem(4)}>
                <Text
                  size="xs"
                  style={{
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: accentColor,
                    fontWeight: 600,
                  }}
                >
                  {typeLabel} Submission
                </Text>
                <Badge
                  size="xs"
                  style={{
                    backgroundColor: `${AMBER}18`,
                    color: AMBER,
                    borderColor: `${AMBER}35`,
                  }}
                  variant="outline"
                >
                  ✎ Editing
                </Badge>
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
              </Group>

              {/* Submission title */}
              <Title
                order={2}
                style={{
                  fontFamily: 'var(--font-opti-goudy-text)',
                  fontSize: rem(22),
                  fontWeight: 400,
                  lineHeight: 1.2,
                  marginBottom: rem(6),
                }}
              >
                {submissionTitle}
              </Title>

              {/* Metadata */}
              <Text size="xs" c="dimmed">
                Submitted {submittedDate}
                {updatedDate && ` · Updated ${updatedDate}`}
                {submissionId != null && ` · ID #${submissionId}`}
              </Text>
            </Box>
          </Group>
        </Box>

        {/* Status Context Panel */}
        {status === 'rejected' && rejectionReason && (
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
            <Text size="sm" c="rgba(248, 113, 113, 0.85)">{rejectionReason}</Text>
          </Alert>
        )}

        {status === 'approved' && (
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

        {children}
      </motion.div>
    )
  }

  export default EditPageShell
  ```

- [ ] **Step 2.2: Verify TypeScript compiles**

  ```bash
  cd client && yarn build 2>&1 | grep -E "error|warning" | head -20
  ```

  Expected: no errors in `EditPageShell.tsx`.

- [ ] **Step 2.3: Commit**

  ```bash
  git add client/src/components/EditPageShell.tsx
  git commit -m "feat: add EditPageShell shared component for edit pages"
  ```

---

## Task 3: Submit Page Redirects (all 4 page.tsx files)

**Files:**
- Modify: `client/src/app/submit-guide/page.tsx`
- Modify: `client/src/app/submit-media/page.tsx`
- Modify: `client/src/app/submit-annotation/page.tsx`
- Modify: `client/src/app/submit-event/page.tsx`

In Next.js 15, `searchParams` is a `Promise` and must be awaited. Each page becomes `async` and redirects to the dedicated edit route when `?edit=<id>` is present.

- [ ] **Step 3.1: Update submit-guide/page.tsx**

  Replace the entire file:

  ```typescript
  import { Metadata } from 'next'
  import { redirect } from 'next/navigation'
  import { Suspense } from 'react'
  import { Center, Loader } from '@mantine/core'
  import SubmitGuidePageContent from './SubmitGuidePageContent'

  export async function generateMetadata(): Promise<Metadata> {
    return {
      title: 'Submit Guide',
      description: 'Submit your own guide to the L-file community. Share your knowledge about Usogui strategies, character analysis, and story insights.',
      openGraph: {
        title: 'Submit Guide',
        description: 'Submit your own guide to the L-file community. Share your knowledge about Usogui strategies, character analysis, and story insights.',
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title: 'Submit Guide',
        description: 'Submit your own guide to the L-file community. Share your knowledge about Usogui strategies, character analysis, and story insights.',
      },
    }
  }

  export default async function SubmitGuidePage({
    searchParams,
  }: {
    searchParams: Promise<{ edit?: string }>
  }) {
    const { edit } = await searchParams
    if (edit) redirect(`/guides/${edit}/edit`)

    return (
      <Suspense fallback={<Center py="xl"><Loader size="lg" /></Center>}>
        <SubmitGuidePageContent />
      </Suspense>
    )
  }
  ```

- [ ] **Step 3.2: Update submit-media/page.tsx**

  Replace the entire file:

  ```typescript
  import { Metadata } from 'next'
  import { redirect } from 'next/navigation'
  import { Suspense } from 'react'
  import { Center, Loader } from '@mantine/core'
  import SubmitMediaPageContent from './SubmitMediaPageContent'

  export async function generateMetadata(): Promise<Metadata> {
    return {
      title: 'Submit Media',
      description: 'Submit images, videos, and other media to the L-file community. Share fan art, memorable scenes, and other Usogui-related content.',
      openGraph: {
        title: 'Submit Media',
        description: 'Submit images, videos, and other media to the L-file community. Share fan art, memorable scenes, and other Usogui-related content.',
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title: 'Submit Media',
        description: 'Submit images, videos, and other media to the L-file community. Share fan art, memorable scenes, and other Usogui-related content.',
      },
    }
  }

  export default async function SubmitMediaPage({
    searchParams,
  }: {
    searchParams: Promise<{ edit?: string }>
  }) {
    const { edit } = await searchParams
    if (edit) redirect(`/media/${edit}/edit`)

    return (
      <Suspense fallback={<Center py="xl"><Loader size="lg" /></Center>}>
        <SubmitMediaPageContent />
      </Suspense>
    )
  }
  ```

- [ ] **Step 3.3: Update submit-annotation/page.tsx**

  Replace the entire file:

  ```typescript
  import { Metadata } from 'next'
  import { redirect } from 'next/navigation'
  import { Suspense } from 'react'
  import SubmitAnnotationPageContent from './SubmitAnnotationPageContent'

  export async function generateMetadata(): Promise<Metadata> {
    return {
      title: 'Submit Annotation',
      description: 'Submit an annotation to the L-file wiki. Share your insights, analysis, and commentary on characters, gambles, chapters, and story arcs.',
      openGraph: {
        title: 'Submit Annotation',
        description: 'Submit an annotation to the L-file wiki. Share your insights, analysis, and commentary on characters, gambles, chapters, and story arcs.',
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title: 'Submit Annotation',
        description: 'Submit an annotation to the L-file wiki. Share your insights, analysis, and commentary on characters, gambles, chapters, and story arcs.',
      },
    }
  }

  export default async function SubmitAnnotationPage({
    searchParams,
  }: {
    searchParams: Promise<{ edit?: string }>
  }) {
    const { edit } = await searchParams
    if (edit) redirect(`/annotations/${edit}/edit`)

    return (
      <Suspense fallback={<Center py="xl"><Loader size="lg" /></Center>}>
        <SubmitAnnotationPageContent />
      </Suspense>
    )
  }
  ```

- [ ] **Step 3.4: Update submit-event/page.tsx**

  Replace the entire file:

  ```typescript
  import { Metadata } from 'next'
  import { redirect } from 'next/navigation'
  import { Suspense } from 'react'
  import { Box, Container, Loader } from '@mantine/core'
  import SubmitEventPageContent from './SubmitEventPageContent'

  export async function generateMetadata(): Promise<Metadata> {
    return {
      title: 'Submit Event',
      description: 'Submit a story event to the L-file wiki. Help document key moments, decisions, and revelations from Usogui.',
      openGraph: {
        title: 'Submit Event',
        description: 'Submit a story event to the L-file wiki. Help document key moments, decisions, and revelations from Usogui.',
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title: 'Submit Event',
        description: 'Submit a story event to the L-file wiki. Help document key moments, decisions, and revelations from Usogui.',
      },
    }
  }

  function SubmitEventFallback() {
    return (
      <Container size="md" py="xl">
        <Box style={{ display: 'flex', justifyContent: 'center' }}>
          <Loader size="lg" />
        </Box>
      </Container>
    )
  }

  export default async function SubmitEventPage({
    searchParams,
  }: {
    searchParams: Promise<{ edit?: string }>
  }) {
    const { edit } = await searchParams
    if (edit) redirect(`/events/${edit}/edit`)

    return (
      <Suspense fallback={<SubmitEventFallback />}>
        <SubmitEventPageContent />
      </Suspense>
    )
  }
  ```

- [ ] **Step 3.5: Verify build**

  ```bash
  cd client && yarn build 2>&1 | grep -E "error" | head -20
  ```

  Expected: no errors.

- [ ] **Step 3.6: Commit**

  ```bash
  git add client/src/app/submit-guide/page.tsx \
          client/src/app/submit-media/page.tsx \
          client/src/app/submit-annotation/page.tsx \
          client/src/app/submit-event/page.tsx
  git commit -m "feat: add ?edit redirect to new dedicated edit routes in submit page.tsx files"
  ```

---

## Task 4: Guide Edit Page

**Files:**
- Create: `client/src/app/guides/[id]/edit/page.tsx`
- Create: `client/src/app/guides/[id]/edit/EditGuidePageContent.tsx`

This is the most complete example — the other three edit pages follow the same pattern with type-specific differences noted in their tasks.

- [ ] **Step 4.1: Create guides/[id]/edit/page.tsx**

  ```typescript
  // client/src/app/guides/[id]/edit/page.tsx
  import { Metadata } from 'next'
  import EditGuidePageContent from './EditGuidePageContent'

  export async function generateMetadata({
    params,
  }: {
    params: Promise<{ id: string }>
  }): Promise<Metadata> {
    const { id } = await params
    return {
      title: `Edit Guide #${id}`,
      description: 'Edit and resubmit your guide for review.',
    }
  }

  export default async function EditGuidePage({
    params,
  }: {
    params: Promise<{ id: string }>
  }) {
    const { id } = await params
    return <EditGuidePageContent id={Number(id)} />
  }
  ```

- [ ] **Step 4.2: Create EditGuidePageContent.tsx**

  ```typescript
  // client/src/app/guides/[id]/edit/EditGuidePageContent.tsx
  'use client'

  import React, { useState, useEffect } from 'react'
  import {
    Alert,
    Box,
    Button,
    Card,
    Container,
    Grid,
    Group,
    Loader,
    MultiSelect,
    Select,
    Stack,
    TagsInput,
    Text,
    TextInput,
    Textarea,
    rem,
    useMantineTheme,
  } from '@mantine/core'
  import { AlertTriangle, BookOpen, FileText, Send } from 'lucide-react'
  import { useRouter } from 'next/navigation'
  import { useAuth } from '@/providers/AuthProvider'
  import { FormProgressIndicator, FormStep } from '@/components/FormProgressIndicator'
  import { FormSection } from '@/components/FormSection'
  import { EditPageShell } from '@/components/EditPageShell'
  import { api } from '@/lib/api'
  import { motion } from 'motion/react'
  import RichMarkdownEditor from '@/components/RichMarkdownEditor'
  import SubmissionSuccess from '@/components/SubmissionSuccess'
  import { getEntityColor } from '@/lib/entityColors'
  import { getInputStyles, getMultiSelectStyles, getDimmedInputStyles } from '@/lib/submitFormStyles'
  import { setTabAccentColors } from '@/lib/mantine-theme'

  const MIN_TITLE_LENGTH = 5
  const MIN_DESCRIPTION_LENGTH = 20
  const MIN_CONTENT_LENGTH = 100

  const AMBER = '#f59e0b'

  interface ExistingGuide {
    id: number
    title: string
    description: string
    content: string
    characterIds?: number[]
    arcId?: number | null
    gambleIds?: number[]
    tags?: Array<{ id: number; name: string }>
    status: 'pending' | 'approved' | 'rejected'
    rejectionReason?: string | null
    createdAt?: string
    updatedAt?: string
  }

  interface EditGuidePageContentProps {
    id: number
  }

  export default function EditGuidePageContent({ id }: EditGuidePageContentProps) {
    const theme = useMantineTheme()
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const accentColor = getEntityColor('guide')

    useEffect(() => { setTabAccentColors('guide') }, [])

    const inputStyles = getInputStyles(theme, accentColor)
    const multiSelectStyles = getMultiSelectStyles(theme, accentColor)
    const dimmedInputStyles = getDimmedInputStyles(theme)

    const [existingGuide, setExistingGuide] = useState<ExistingGuide | null>(null)
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      content: '',
      characterIds: [] as number[],
      arcId: null as number | null,
      gambleIds: [] as number[],
      tags: [] as string[],
    })
    const [initialData, setInitialData] = useState<typeof formData | null>(null)
    const [loading, setLoading] = useState(false)
    const [loadingData, setLoadingData] = useState(true)
    const [error, setError] = useState('')
    const [showSuccess, setShowSuccess] = useState(false)
    const [characters, setCharacters] = useState<Array<{ id: number; name: string }>>([])
    const [arcs, setArcs] = useState<Array<{ id: number; name: string }>>([])
    const [gambles, setGambles] = useState<Array<{ id: number; name: string }>>([])
    const [tags, setTags] = useState<Array<{ id: number; name: string }>>([])

    const handleInputChange = (field: string, value: unknown) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const isDirty = (field: keyof typeof formData): boolean => {
      if (!initialData) return false
      return JSON.stringify(formData[field]) !== JSON.stringify(initialData[field])
    }

    const validateForm = () => {
      if (!formData.title.trim()) return 'Title is required'
      if (formData.title.trim().length < MIN_TITLE_LENGTH) return 'Please provide a more descriptive title'
      if (!formData.description.trim()) return 'Description is required'
      if (formData.description.trim().length < MIN_DESCRIPTION_LENGTH) return 'Please add more detail to your description'
      if (!formData.content.trim()) return 'Content is required'
      if (formData.content.trim().length < MIN_CONTENT_LENGTH) return 'Your guide content needs more detail'
      return null
    }

    const handleSubmit = async (event: React.FormEvent) => {
      event.preventDefault()
      setError('')
      const validationError = validateForm()
      if (validationError) { setError(validationError); return }

      setLoading(true)
      try {
        await api.updateGuide(id, {
          title: formData.title.trim(),
          description: formData.description.trim(),
          content: formData.content.trim(),
          characterIds: formData.characterIds.length ? formData.characterIds : undefined,
          arcId: formData.arcId ?? undefined,
          gambleIds: formData.gambleIds.length ? formData.gambleIds : undefined,
          tagNames: formData.tags.length ? formData.tags : undefined,
        })
        setShowSuccess(true)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to update guide. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    useEffect(() => {
      const load = async () => {
        try {
          const [guide, charactersRes, arcsRes, gamblesRes, tagsRes] = await Promise.all([
            api.getMyGuideSubmission(id),
            api.getCharacters({ limit: 500 }),
            api.getArcs({ limit: 200 }),
            api.getGambles({ limit: 500 }),
            api.getTags({ limit: 500 }),
          ])
          setExistingGuide(guide)
          const populated = {
            title: guide.title || '',
            description: guide.description || '',
            content: guide.content || '',
            characterIds: guide.characterIds || [],
            arcId: guide.arcId ?? null,
            gambleIds: guide.gambleIds || [],
            tags: guide.tags?.map((t: { name: string }) => t.name) || [],
          }
          setFormData(populated)
          setInitialData(populated)
          setCharacters(charactersRes.data || [])
          setArcs(arcsRes.data || [])
          setGambles(gamblesRes.data || [])
          setTags(tagsRes.data || [])
        } catch {
          setError('Failed to load guide. You may not have permission to edit this guide.')
        } finally {
          setLoadingData(false)
        }
      }
      load()
    }, [id])

    // Loading state
    if (authLoading || loadingData) {
      return (
        <Container size="md" py="xl">
          <Stack align="center" gap="md" py="xl">
            <Loader size="sm" color={accentColor} />
            <Text size="sm" c="dimmed">Loading guide…</Text>
          </Stack>
        </Container>
      )
    }

    // Auth gate
    if (!user) {
      return (
        <Container size="md" py="xl">
          <Alert icon={<AlertTriangle size={16} />}>
            You need to be logged in to edit this guide.
          </Alert>
        </Container>
      )
    }

    // Load error (guide not found / no permission)
    if (!existingGuide && error) {
      return (
        <Container size="md" py="xl">
          <Alert
            icon={<AlertTriangle size={16} />}
            style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)' }}
          >
            <Text size="sm" c="#f87171">{error}</Text>
          </Alert>
        </Container>
      )
    }

    if (!existingGuide) return null

    const isFormValid = !validateForm()

    const progressSteps: FormStep[] = [
      { label: 'Title', completed: formData.title.trim().length >= MIN_TITLE_LENGTH, required: true },
      { label: 'Description', completed: formData.description.trim().length >= MIN_DESCRIPTION_LENGTH, required: true },
      { label: 'Content', completed: formData.content.trim().length >= MIN_CONTENT_LENGTH, required: true },
    ]

    const characterOptions = characters.map((c) => ({ value: c.id.toString(), label: c.name }))
    const arcOptions = arcs.map((a) => ({ value: a.id.toString(), label: a.name }))
    const gambleOptions = gambles.map((g) => ({ value: g.id.toString(), label: g.name }))
    const tagOptions = tags.map((t) => t.name)

    return (
      <Container size="md" py="xl">
        <EditPageShell
          type="guide"
          accentColor={accentColor}
          submissionTitle={existingGuide.title}
          status={existingGuide.status}
          submittedAt={existingGuide.createdAt ?? new Date().toISOString()}
          updatedAt={existingGuide.updatedAt}
          submissionId={existingGuide.id}
          rejectionReason={existingGuide.rejectionReason}
        >
          {showSuccess ? (
            <SubmissionSuccess
              type="guide"
              isEdit
              accentColor={accentColor}
              onSubmitAnother={() => router.push('/profile')}
            />
          ) : (
            <>
              {error && (
                <Alert
                  icon={<AlertTriangle size={16} />}
                  mb="md"
                  style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)' }}
                >
                  <Text size="sm" c="#f87171">{error}</Text>
                </Alert>
              )}

              <FormProgressIndicator steps={progressSteps} accentColor={accentColor} />

              <Card
                shadow="lg"
                radius="md"
                withBorder
                style={{
                  backgroundColor: theme.colors.dark?.[7] ?? '#070707',
                  borderColor: `${accentColor}35`,
                  boxShadow: `0 4px 24px ${accentColor}12`,
                }}
              >
                <Box
                  style={{
                    height: rem(3),
                    background: `linear-gradient(90deg, ${accentColor}70, transparent)`,
                    borderRadius: `${rem(6)} ${rem(6)} 0 0`,
                    marginBottom: rem(-3),
                  }}
                />
                <form onSubmit={handleSubmit}>
                  <Stack gap="xl" p="xl">
                    <FormSection
                      title="Guide Details"
                      description="Update the title and description of your guide"
                      icon={<FileText size={18} color={accentColor} />}
                      accentColor={accentColor}
                      required
                      stepNumber={1}
                      hasValue={!!formData.title || !!formData.description}
                    >
                      <Stack gap="md">
                        <TextInput
                          label={
                            <span>
                              Guide Title
                              {isDirty('title') && (
                                <span style={{ fontSize: rem(10), background: 'rgba(245,158,11,0.1)', color: AMBER, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
                                  edited
                                </span>
                              )}
                            </span>
                          }
                          placeholder="e.g., 'Understanding the Rules of Air Poker'"
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.currentTarget.value)}
                          required
                          error={formData.title.length > 0 && formData.title.trim().length < MIN_TITLE_LENGTH ? 'Please provide a more descriptive title' : undefined}
                          styles={inputStyles}
                        />
                        <Textarea
                          label="Guide Description"
                          placeholder="Provide a brief summary of what your guide covers…"
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.currentTarget.value)}
                          required
                          minRows={3}
                          autosize
                          error={formData.description.length > 0 && formData.description.trim().length < MIN_DESCRIPTION_LENGTH ? 'Please add more detail to your description' : undefined}
                          styles={inputStyles}
                        />
                      </Stack>
                    </FormSection>

                    <FormSection
                      title="Guide Content"
                      description="Update your guide content using the rich editor"
                      icon={<BookOpen size={18} color={accentColor} />}
                      accentColor={accentColor}
                      required
                      stepNumber={2}
                      hasValue={formData.content.length > 0}
                    >
                      <RichMarkdownEditor
                        value={formData.content}
                        onChange={(md) => setFormData((prev) => ({ ...prev, content: md }))}
                        placeholder="Update your guide content here."
                        minHeight={300}
                        label="Guide content"
                      />
                    </FormSection>

                    <FormSection
                      title="Related Content"
                      description="Update linked characters, arcs, gambles, and tags"
                      icon={<BookOpen size={18} color={accentColor} />}
                      accentColor={accentColor}
                      stepNumber={3}
                      hasValue={formData.characterIds.length > 0 || formData.arcId !== null || formData.gambleIds.length > 0 || formData.tags.length > 0}
                    >
                      <Grid gutter="md">
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <MultiSelect label="Characters" placeholder="Select related characters" data={characterOptions} value={formData.characterIds.map(String)} onChange={(v) => handleInputChange('characterIds', v.map(Number))} searchable clearable nothingFoundMessage="No characters" styles={multiSelectStyles} />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <Select label="Arc" placeholder="Select related arc" data={arcOptions} value={formData.arcId !== null ? formData.arcId.toString() : null} onChange={(v) => handleInputChange('arcId', v ? Number(v) : null)} searchable clearable nothingFoundMessage="No arcs" styles={dimmedInputStyles} />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <MultiSelect label="Gambles" placeholder="Select related gambles" data={gambleOptions} value={formData.gambleIds.map(String)} onChange={(v) => handleInputChange('gambleIds', v.map(Number))} searchable clearable nothingFoundMessage="No gambles" styles={multiSelectStyles} />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <TagsInput label="Tags" placeholder="Type and press Enter" data={tagOptions} value={formData.tags} onChange={(v) => handleInputChange('tags', v)} clearable maxTags={5} styles={multiSelectStyles} />
                        </Grid.Col>
                      </Grid>
                    </FormSection>

                    {/* Action bar */}
                    <Group justify="space-between" align="center">
                      <Group gap="sm">
                        <Button
                          type="submit"
                          size="lg"
                          loading={loading}
                          disabled={!isFormValid}
                          leftSection={!loading && <Send size={18} />}
                          style={{
                            backgroundColor: isFormValid ? AMBER : undefined,
                            color: isFormValid ? '#000' : undefined,
                          }}
                        >
                          {loading ? 'Updating…' : 'Save & Resubmit'}
                        </Button>
                        <Button
                          variant="subtle"
                          size="lg"
                          onClick={() => router.back()}
                          style={{ color: 'rgba(255,255,255,0.4)' }}
                        >
                          Discard Changes
                        </Button>
                      </Group>
                      <Text size="xs" c="dimmed">Sent back to moderators for review</Text>
                    </Group>
                  </Stack>
                </form>
              </Card>
            </>
          )}
        </EditPageShell>
      </Container>
    )
  }
  ```

- [ ] **Step 4.3: Verify build**

  ```bash
  cd client && yarn build 2>&1 | grep -E "error" | head -20
  ```

- [ ] **Step 4.4: Smoke test in browser**

  Start dev server (`cd client && yarn dev`), navigate to `/guides/1/edit` (substitute a real guide ID). Verify:
  - Edit header shows with amber stripe + entity green
  - Submission title, status badge, metadata visible
  - Form pre-populated with existing guide data
  - "edited" chip appears when you change a field
  - "Discard Changes" navigates back
  - Valid form enables the amber "Save & Resubmit" button

- [ ] **Step 4.5: Commit**

  ```bash
  git add client/src/app/guides/
  git commit -m "feat: add /guides/[id]/edit dedicated route and EditGuidePageContent"
  ```

---

## Task 5: Annotation Edit Page

**Files:**
- Create: `client/src/app/annotations/[id]/edit/page.tsx`
- Create: `client/src/app/annotations/[id]/edit/EditAnnotationPageContent.tsx`

**Key difference from guide:** `ownerType` and `ownerId` are **read-only** — display as static text, not editable selects.

- [ ] **Step 5.1: Create annotations/[id]/edit/page.tsx**

  Note: this creates the `annotations/` directory tree for the first time.

  ```typescript
  // client/src/app/annotations/[id]/edit/page.tsx
  import { Metadata } from 'next'
  import EditAnnotationPageContent from './EditAnnotationPageContent'

  export async function generateMetadata({
    params,
  }: {
    params: Promise<{ id: string }>
  }): Promise<Metadata> {
    const { id } = await params
    return {
      title: `Edit Annotation #${id}`,
      description: 'Edit and resubmit your annotation for review.',
    }
  }

  export default async function EditAnnotationPage({
    params,
  }: {
    params: Promise<{ id: string }>
  }) {
    const { id } = await params
    return <EditAnnotationPageContent id={Number(id)} />
  }
  ```

- [ ] **Step 5.2: Create EditAnnotationPageContent.tsx**

  Model this on `EditGuidePageContent`. Key differences:
  - `accentColor = getEntityColor('annotation')` (`#9333ea`)
  - `setTabAccentColors('annotation')`
  - Fetch: `api.getMyAnnotationSubmission(id)`
  - Update: `api.updateAnnotation(id, data)`
  - Form fields: `title`, `content`, `sourceUrl`, `chapterReference`, `isSpoiler`, `spoilerChapter`
  - **ownerType + ownerId are read-only.** Render them as:

    ```tsx
    <FormSection title="Subject" accentColor={accentColor} stepNumber={1} hasValue>
      <Group gap="md">
        <Box>
          <Text size="xs" c="dimmed" mb={4}>Type</Text>
          <Text fw={500} style={{ textTransform: 'capitalize' }}>{existingAnnotation.ownerType}</Text>
        </Box>
        <Box>
          <Text size="xs" c="dimmed" mb={4}>Entity ID</Text>
          <Text fw={500}>#{existingAnnotation.ownerId}</Text>
        </Box>
      </Group>
      <Text size="xs" c="dimmed" mt="xs">Subject cannot be changed after creation.</Text>
    </FormSection>
    ```

  - Progress steps: `title` + `content` required
  - Min lengths: `MIN_TITLE_LENGTH = 3`, `MIN_CONTENT_LENGTH = 10`

- [ ] **Step 5.3: Verify build and smoke test**

  ```bash
  cd client && yarn build 2>&1 | grep -E "error" | head -20
  ```

  Navigate to `/annotations/1/edit`. Verify ownerType + ownerId show as read-only text.

- [ ] **Step 5.4: Commit**

  ```bash
  git add client/src/app/annotations/
  git commit -m "feat: add /annotations/[id]/edit dedicated route with locked ownerType/ownerId"
  ```

---

## Task 6: Event Edit Page

**Files:**
- Create: `client/src/app/events/[id]/edit/page.tsx`
- Create: `client/src/app/events/[id]/edit/EditEventPageContent.tsx`

**Key differences from guide:** Uses `getMyEventSubmission` (added in Task 1), `updateOwnEvent`, `accentColor = getEntityColor('event')` (`#ca8a04`), form fields match the event submit form.

- [ ] **Step 6.1: Create events/[id]/edit/page.tsx**

  ```typescript
  // client/src/app/events/[id]/edit/page.tsx
  import { Metadata } from 'next'
  import EditEventPageContent from './EditEventPageContent'

  export async function generateMetadata({
    params,
  }: {
    params: Promise<{ id: string }>
  }): Promise<Metadata> {
    const { id } = await params
    return {
      title: `Edit Event #${id}`,
      description: 'Edit and resubmit your event for review.',
    }
  }

  export default async function EditEventPage({
    params,
  }: {
    params: Promise<{ id: string }>
  }) {
    const { id } = await params
    return <EditEventPageContent id={Number(id)} />
  }
  ```

- [ ] **Step 6.2: Create EditEventPageContent.tsx**

  Model on `EditGuidePageContent`. Key differences:
  - `accentColor = getEntityColor('event')` (`#ca8a04`)
  - `setTabAccentColors('event')`
  - Fetch: `api.getMyEventSubmission(id)` (the new method from Task 1)
  - Update: `api.updateOwnEvent(id, data)`
  - Read the existing `SubmitEventPageContent.tsx` for the exact form fields used (title, description, eventType, arcId, characterIds, chapterReference, etc.) and replicate them in the edit form — pre-populated, with `hasValue` on `FormSection`.

- [ ] **Step 6.3: Verify build and smoke test**

  ```bash
  cd client && yarn build 2>&1 | grep -E "error" | head -20
  ```

- [ ] **Step 6.4: Commit**

  ```bash
  git add client/src/app/events/
  git commit -m "feat: add /events/[id]/edit dedicated route"
  ```

---

## Task 7: Media Edit Page

**Files:**
- Create: `client/src/app/media/[id]/edit/page.tsx`
- Create: `client/src/app/media/[id]/edit/EditMediaPageContent.tsx`

**Key differences:** Media IDs are **strings (UUIDs)**, not numbers. `updateOwnMedia` uses `FormData` (PATCH). Show existing media preview above the upload section.

- [ ] **Step 7.1: Create media/[id]/edit/page.tsx**

  ```typescript
  // client/src/app/media/[id]/edit/page.tsx
  import { Metadata } from 'next'
  import EditMediaPageContent from './EditMediaPageContent'

  export async function generateMetadata({
    params,
  }: {
    params: Promise<{ id: string }>
  }): Promise<Metadata> {
    const { id } = await params
    return {
      title: `Edit Media`,
      description: 'Edit and resubmit your media submission for review.',
    }
  }

  export default async function EditMediaPage({
    params,
  }: {
    params: Promise<{ id: string }>
  }) {
    const { id } = await params
    // NOTE: id is a UUID string — do NOT cast to Number
    return <EditMediaPageContent id={id} />
  }
  ```

- [ ] **Step 7.2: Create EditMediaPageContent.tsx**

  Key differences from the guide edit content:
  - `id` prop is `string`, not `number`
  - `accentColor = getEntityColor('media')` (`#db2777`)
  - `setTabAccentColors('media')`
  - Fetch: `api.getMyMediaSubmission(id)` (id is string — no cast needed)
  - The form includes the `MediaUploadForm` component
  - Show existing media preview at the top of the upload section:

    ```tsx
    {existingMedia?.url && (
      <Box mb="md">
        <Text size="sm" c="dimmed" mb="xs">Current media</Text>
        {existingMedia.type === 'image' ? (
          <img src={existingMedia.url} alt="Current media" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
        ) : (
          <Text size="sm" style={{ color: accentColor }}>{existingMedia.url}</Text>
        )}
        <Text size="xs" c="dimmed" mt="xs">Upload a new file or enter a URL below to replace it.</Text>
      </Box>
    )}
    ```

  - The `EditPageShell` `submissionId` prop is optional (`number | string | undefined`). For media, **omit the `submissionId` prop entirely** — the shell will skip rendering the `ID #...` segment when it is undefined.

- [ ] **Step 7.3: Verify build and smoke test**

  ```bash
  cd client && yarn build 2>&1 | grep -E "error" | head -20
  ```

  Navigate to a media edit URL. Verify the existing media preview shows, and the form pre-populates.

- [ ] **Step 7.4: Commit**

  ```bash
  git add client/src/app/media/
  git commit -m "feat: add /media/[id]/edit dedicated route (string UUID ID, media preview)"
  ```

---

## Task 8: Update SubmissionCard + Profile Links

**Files:**
- Modify: `client/src/components/SubmissionCard.tsx`
- Modify: `client/src/app/profile/ProfileContentTabs.tsx`

- [ ] **Step 8.1: Update getEditLink in SubmissionCard.tsx**

  Find `getEditLink` (line 86) and replace:

  ```typescript
  function getEditLink(submission: SubmissionItem): string | null {
    if (submission.type === 'guide') return `/guides/${submission.id}/edit`
    if (submission.type === 'event') return `/events/${submission.id}/edit`
    if (submission.type === 'annotation') return `/annotations/${submission.id}/edit`
    if (submission.type === 'media') return `/media/${submission.id}/edit`
    return null
  }
  ```

- [ ] **Step 8.2: Check ProfileContentTabs for hardcoded edit links**

  Open `client/src/app/profile/ProfileContentTabs.tsx`. Search for any hardcoded `/submit-guide?edit`, `/submit-media?edit`, etc. patterns. Update each to the new route format using the same mapping as above.

  If `ProfileContentTabs` uses `SubmissionCard` (and thus delegates to `getEditLink`), no changes may be needed beyond Step 8.1.

- [ ] **Step 8.3: Verify build**

  ```bash
  cd client && yarn build 2>&1 | grep -E "error" | head -20
  ```

- [ ] **Step 8.4: Commit**

  ```bash
  git add client/src/components/SubmissionCard.tsx \
          client/src/app/profile/ProfileContentTabs.tsx
  git commit -m "feat: update SubmissionCard and profile to use new /[type]/[id]/edit routes"
  ```

---

## Task 9: Clean Up Submit Content Components

Remove the now-dead edit-mode logic from all four submit page content components. This simplifies each file back to create-only.

**Files:**
- Modify: `client/src/app/submit-guide/SubmitGuidePageContent.tsx`
- Modify: `client/src/app/submit-media/SubmitMediaPageContent.tsx`
- Modify: `client/src/app/submit-annotation/SubmitAnnotationPageContent.tsx`
- Modify: `client/src/app/submit-event/SubmitEventPageContent.tsx`

- [ ] **Step 9.1: Clean SubmitGuidePageContent.tsx**

  Remove:
  - `useSearchParams` import and call
  - `editGuideId` and `isEditMode` variables
  - `ExistingGuide` interface
  - `existingGuide` state
  - The `useEffect` that calls `api.getMyGuideSubmission`
  - All `isEditMode` conditionals in JSX (titles, descriptions, button text)
  - The `?? (isEditMode ? '...' : '...')` patterns in error messages and submit handler
  - The `if (isEditMode && editGuideId)` branch in `handleSubmit`

  After cleanup, `handleSubmit` always calls `api.createGuide(...)`.
  The `SubmitPageHeader` always shows "Write a Guide" with `editMode={false}`.

- [ ] **Step 9.2: Clean SubmitMediaPageContent.tsx**

  Same pattern — remove `editMediaId`, `isEditMode`, `existingMedia` state, the fetch effect for edit mode, and the edit-mode conditionals.

- [ ] **Step 9.3: Clean SubmitAnnotationPageContent.tsx**

  Remove `editAnnotationId`, `editingAnnotation`, `loadingEdit`, the fetch effect for edit mode, and edit-mode conditionals.

- [ ] **Step 9.4: Clean SubmitEventPageContent.tsx**

  Remove the same edit-mode variables and logic from the event submit form.

- [ ] **Step 9.5: Verify build**

  ```bash
  cd client && yarn build 2>&1 | grep -E "error" | head -20
  ```

  Expected: clean build. If TypeScript catches any leftover references to removed variables, fix them.

- [ ] **Step 9.6: Lint**

  ```bash
  cd client && yarn lint 2>&1 | grep -E "error|warn" | head -30
  ```

- [ ] **Step 9.7: Commit**

  ```bash
  git add client/src/app/submit-guide/SubmitGuidePageContent.tsx \
          client/src/app/submit-media/SubmitMediaPageContent.tsx \
          client/src/app/submit-annotation/SubmitAnnotationPageContent.tsx \
          client/src/app/submit-event/SubmitEventPageContent.tsx
  git commit -m "refactor: remove edit-mode logic from submit content components (now handled by dedicated edit routes)"
  ```

---

## Task 10: SubmitPageHeader Visual Refresh

The spec lists `SubmitPageHeader` as modified with an "updated visual treatment (no amber)." The current component already has the correct structure (top accent gradient, icon box, eyebrow, title, description). The update is cosmetic: ensure `editMode` prop is removed from all call sites (since edit pages now use `EditPageShell`), and verify the header renders cleanly for create-only mode.

**Files:**
- Modify: `client/src/components/SubmitPageHeader.tsx`

- [ ] **Step 10.1: Remove editMode prop from SubmitPageHeader**

  The `editMode` prop in `SubmitPageHeader` was used to show the "Editing" badge. Since edit pages now use `EditPageShell`, this prop is no longer needed. Remove it:

  - Delete the `editMode?: boolean` prop from the interface
  - Delete the `{editMode && <Badge ...>Editing</Badge>}` JSX
  - Remove `editMode = false` from the destructured props

- [ ] **Step 10.2: Remove editMode from all call sites**

  Search for `editMode` usage in submit content components:

  ```bash
  grep -rn "editMode" client/src/app/submit-*/
  ```

  Remove `editMode={isEditMode}` (or any `editMode` prop) from all `<SubmitPageHeader />` calls. By this point (after Task 9 cleanup), the submit pages no longer have `isEditMode`, so this should already be gone.

- [ ] **Step 10.3: Verify build**

  ```bash
  cd client && yarn build 2>&1 | grep -E "error" | head -20
  ```

- [ ] **Step 10.4: Commit**

  ```bash
  git add client/src/components/SubmitPageHeader.tsx
  git commit -m "refactor: remove editMode prop from SubmitPageHeader (edit pages use EditPageShell)"
  ```

---

## Task 12: Final Verification

- [ ] **Step 10.1: Full build**

  ```bash
  cd client && yarn build
  ```

  Expected: 0 TypeScript errors, 0 ESLint errors that block the build.

- [ ] **Step 10.2: End-to-end smoke test**

  Start dev: `cd client && yarn dev`

  Test each flow:
  1. `/submit-guide?edit=<id>` → redirects to `/guides/<id>/edit` ✓
  2. `/submit-media?edit=<id>` → redirects to `/media/<id>/edit` ✓
  3. `/submit-annotation?edit=<id>` → redirects to `/annotations/<id>/edit` ✓
  4. `/submit-event?edit=<id>` → redirects to `/events/<id>/edit` ✓
  5. `/guides/<id>/edit` → Edit header with amber stripe, form pre-populated ✓
  6. `/media/<id>/edit` → Existing media preview shown ✓
  7. `/annotations/<id>/edit` → ownerType/ownerId read-only ✓
  8. `/events/<id>/edit` → Form pre-populated ✓
  9. Profile page edit buttons → Navigate to new routes ✓
  10. `/submit-guide` (no ?edit) → Normal create form, no edit-mode logic ✓

- [ ] **Step 10.3: Final commit (if any cleanup needed)**

  ```bash
  git add -A
  git commit -m "chore: final cleanup after submission edit pages implementation"
  ```
