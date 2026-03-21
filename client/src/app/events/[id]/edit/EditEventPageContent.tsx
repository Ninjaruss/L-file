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
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  rem,
  useMantineTheme,
} from '@mantine/core'
import { AlertTriangle, BookOpen, FileText, Send, Users, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import { FormProgressIndicator, FormStep } from '@/components/FormProgressIndicator'
import { FormSection } from '@/components/FormSection'
import { EditPageShell } from '@/components/EditPageShell'
import { api } from '@/lib/api'
import SubmissionSuccess from '@/components/SubmissionSuccess'
import { getEntityColor } from '@/lib/entityColors'
import { getInputStyles, getMultiSelectStyles, getDimmedInputStyles } from '@/lib/submitFormStyles'
import { setTabAccentColors } from '@/lib/mantine-theme'

const MIN_TITLE_LENGTH = 3
const MIN_DESCRIPTION_LENGTH = 10

const AMBER = '#f59e0b'

const EVENT_TYPE_OPTIONS = [
  { value: 'gamble', label: 'Gamble' },
  { value: 'decision', label: 'Decision' },
  { value: 'reveal', label: 'Reveal' },
  { value: 'shift', label: 'Shift' },
  { value: 'resolution', label: 'Resolution' },
]

interface ExistingEvent {
  id: number
  title: string
  description: string
  chapterNumber: number
  type?: string | null
  arcId?: number | null
  gambleId?: number | null
  spoilerChapter?: number | null
  characters?: Array<{ id: number; name: string }>
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string | null
  createdAt?: string
  updatedAt?: string
}

interface EditEventPageContentProps {
  id: number
}

export default function EditEventPageContent({ id }: EditEventPageContentProps) {
  const theme = useMantineTheme()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const accentColor = getEntityColor('event')

  useEffect(() => { setTabAccentColors('event') }, [])

  const inputStyles = getInputStyles(theme, accentColor)
  const multiSelectStyles = getMultiSelectStyles(theme, accentColor)
  const dimmedInputStyles = getDimmedInputStyles(theme)

  const [existingEvent, setExistingEvent] = useState<ExistingEvent | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    chapterNumber: 1 as number | '',
    type: '' as string,
    arcId: null as number | null,
    gambleId: null as number | null,
    spoilerChapter: '' as number | '',
    characterIds: [] as number[],
  })
  const [initialData, setInitialData] = useState<typeof formData | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [characters, setCharacters] = useState<Array<{ id: number; name: string }>>([])
  const [arcs, setArcs] = useState<Array<{ id: number; name: string }>>([])
  const [gambles, setGambles] = useState<Array<{ id: number; name: string }>>([])

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const isDirty = (field: keyof typeof formData): boolean => {
    if (!initialData) return false
    return JSON.stringify(formData[field]) !== JSON.stringify(initialData[field])
  }

  const validateForm = () => {
    if (!formData.title.trim()) return 'Title is required'
    if (formData.title.trim().length < MIN_TITLE_LENGTH) return `Title must be at least ${MIN_TITLE_LENGTH} characters long`
    if (!formData.description.trim()) return 'Description is required'
    if (formData.description.trim().length < MIN_DESCRIPTION_LENGTH) return `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters long`
    if (!formData.chapterNumber || formData.chapterNumber < 1) return 'Chapter number is required and must be at least 1'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const validationError = validateForm()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    try {
      await api.updateOwnEvent(id, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        chapterNumber: formData.chapterNumber as number,
        type: formData.type || undefined,
        arcId: formData.arcId ?? undefined,
        gambleId: formData.gambleId ?? undefined,
        spoilerChapter: formData.spoilerChapter || undefined,
        characterIds: formData.characterIds.length ? formData.characterIds : undefined,
      })
      setShowSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update event. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [event, charactersRes, arcsRes, gamblesRes] = await Promise.all([
          api.getMyEventSubmission(id),
          api.getCharacters({ limit: 500 }),
          api.getArcs({ limit: 200 }),
          api.getGambles({ limit: 500 }),
        ])
        setExistingEvent(event)
        const populated = {
          title: event.title || '',
          description: event.description || '',
          chapterNumber: event.chapterNumber || 1,
          type: event.type || '',
          arcId: event.arcId ?? null,
          gambleId: event.gambleId ?? null,
          spoilerChapter: event.spoilerChapter || ('' as number | ''),
          characterIds: event.characters?.map((c: { id: number }) => c.id) || [],
        }
        setFormData(populated)
        setInitialData(populated)
        setCharacters(charactersRes.data || [])
        setArcs(arcsRes.data || [])
        setGambles(gamblesRes.data || [])
      } catch {
        setError('Failed to load event. You may not have permission to edit this event.')
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
          <Box style={{ color: accentColor }}><Zap size={32} /></Box>
          <Loader size="sm" color={accentColor} />
          <Text size="sm" c="dimmed">Loading event…</Text>
        </Stack>
      </Container>
    )
  }

  // Auth gate
  if (!user) {
    return (
      <Container size="md" py="xl">
        <Alert icon={<AlertTriangle size={16} />}>
          You need to be logged in to edit this event.
        </Alert>
      </Container>
    )
  }

  // Load error
  if (!existingEvent && error) {
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

  if (!existingEvent) return null

  const isFormValid = !validateForm()

  const progressSteps: FormStep[] = [
    { label: 'Title', completed: formData.title.trim().length >= MIN_TITLE_LENGTH, required: true },
    { label: 'Description', completed: formData.description.trim().length >= MIN_DESCRIPTION_LENGTH, required: true },
    { label: 'Chapter Number', completed: !!formData.chapterNumber && (formData.chapterNumber as number) >= 1, required: true },
  ]

  const characterOptions = characters.filter((c) => c.id != null && c.name).map((c) => ({ value: String(c.id), label: c.name }))
  const arcOptions = arcs.filter((a) => a.id != null && a.name).map((a) => ({ value: String(a.id), label: a.name }))
  const gambleOptions = gambles.filter((g) => g.id != null && g.name).map((g) => ({ value: String(g.id), label: g.name }))

  return (
    <Container size="md" py="xl">
      <EditPageShell
        type="event"
        accentColor={accentColor}
        submissionTitle={existingEvent.title}
        status={existingEvent.status}
        submittedAt={existingEvent.createdAt ?? new Date().toISOString()}
        updatedAt={existingEvent.updatedAt}
        submissionId={existingEvent.id}
        rejectionReason={existingEvent.rejectionReason}
      >
        {showSuccess ? (
          <SubmissionSuccess
            type="event"
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
                    title="Basic Information"
                    description="Core details about the event"
                    icon={<FileText size={18} color={accentColor} />}
                    accentColor={accentColor}
                    required
                    stepNumber={1}
                    hasValue={!!formData.title || !!formData.description || !!formData.chapterNumber}
                  >
                    <Stack gap="md">
                      <TextInput
                        label={
                          <span>
                            Event Title
                            {isDirty('title') && (
                              <span style={{ fontSize: rem(10), background: 'rgba(245,158,11,0.1)', color: AMBER, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
                                edited
                              </span>
                            )}
                          </span>
                        }
                        placeholder="e.g., 'Baku reveals the winning card'"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.currentTarget.value)}
                        required
                        error={formData.title.length > 0 && formData.title.trim().length < MIN_TITLE_LENGTH ? `Title must be at least ${MIN_TITLE_LENGTH} characters long` : undefined}
                        styles={inputStyles}
                      />
                      <Textarea
                        label={
                          <span>
                            Event Description
                            {isDirty('description') && (
                              <span style={{ fontSize: rem(10), background: 'rgba(245,158,11,0.1)', color: AMBER, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
                                edited
                              </span>
                            )}
                          </span>
                        }
                        placeholder="Describe what happens in this event."
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.currentTarget.value)}
                        required
                        minRows={4}
                        autosize
                        error={formData.description.length > 0 && formData.description.trim().length < MIN_DESCRIPTION_LENGTH ? `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters long` : undefined}
                        styles={inputStyles}
                      />
                      <NumberInput
                        label={
                          <span>
                            Chapter Number
                            {isDirty('chapterNumber') && (
                              <span style={{ fontSize: rem(10), background: 'rgba(245,158,11,0.1)', color: AMBER, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
                                edited
                              </span>
                            )}
                          </span>
                        }
                        placeholder="Enter chapter number"
                        value={formData.chapterNumber}
                        onChange={(value) => handleInputChange('chapterNumber', value)}
                        required
                        min={1}
                        styles={inputStyles}
                      />
                    </Stack>
                  </FormSection>

                  <FormSection
                    title="Event Classification"
                    description="Categorize and link to related content"
                    icon={<BookOpen size={18} color={accentColor} />}
                    accentColor={accentColor}
                    stepNumber={2}
                    hasValue={!!formData.type || formData.arcId !== null || formData.gambleId !== null}
                  >
                    <Grid gutter="md">
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Select
                          label={
                            <span>
                              Event Type
                              {isDirty('type') && (
                                <span style={{ fontSize: rem(10), background: 'rgba(245,158,11,0.1)', color: AMBER, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
                                  edited
                                </span>
                              )}
                            </span>
                          }
                          placeholder="Select event type"
                          value={formData.type || null}
                          onChange={(value) => handleInputChange('type', value || '')}
                          data={EVENT_TYPE_OPTIONS}
                          clearable
                          styles={dimmedInputStyles}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Select
                          label={
                            <span>
                              Story Arc
                              {isDirty('arcId') && (
                                <span style={{ fontSize: rem(10), background: 'rgba(245,158,11,0.1)', color: AMBER, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
                                  edited
                                </span>
                              )}
                            </span>
                          }
                          placeholder="Select arc"
                          value={formData.arcId?.toString() || null}
                          onChange={(value) => handleInputChange('arcId', value ? parseInt(value) : null)}
                          data={arcOptions}
                          clearable
                          searchable
                          nothingFoundMessage="No arcs found"
                          styles={dimmedInputStyles}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Select
                          label={
                            <span>
                              Related Gamble
                              {isDirty('gambleId') && (
                                <span style={{ fontSize: rem(10), background: 'rgba(245,158,11,0.1)', color: AMBER, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
                                  edited
                                </span>
                              )}
                            </span>
                          }
                          placeholder="Select gamble"
                          value={formData.gambleId?.toString() || null}
                          onChange={(value) => handleInputChange('gambleId', value ? parseInt(value) : null)}
                          data={gambleOptions}
                          clearable
                          searchable
                          nothingFoundMessage="No gambles found"
                          styles={dimmedInputStyles}
                        />
                      </Grid.Col>
                    </Grid>
                  </FormSection>

                  <FormSection
                    title="Characters Involved"
                    description="Select characters who appear in this event"
                    icon={<Users size={18} color={accentColor} />}
                    accentColor={accentColor}
                    stepNumber={3}
                    hasValue={formData.characterIds.length > 0}
                  >
                    <MultiSelect
                      label={
                        <span>
                          Characters
                          {isDirty('characterIds') && (
                            <span style={{ fontSize: rem(10), background: 'rgba(245,158,11,0.1)', color: AMBER, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
                              edited
                            </span>
                          )}
                        </span>
                      }
                      placeholder="Select characters"
                      value={formData.characterIds.map(String)}
                      onChange={(values) => handleInputChange('characterIds', values.map((v) => parseInt(v)))}
                      data={characterOptions}
                      searchable
                      clearable
                      nothingFoundMessage="No characters found"
                      styles={multiSelectStyles}
                    />
                  </FormSection>

                  <FormSection
                    title="Spoiler Settings"
                    description="Mark if this event contains story spoilers"
                    icon={<AlertTriangle size={18} color={accentColor} />}
                    accentColor={accentColor}
                    stepNumber={4}
                    hasValue={!!formData.spoilerChapter}
                  >
                    <NumberInput
                      label={
                        <span>
                          Spoiler Chapter
                          {isDirty('spoilerChapter') && (
                            <span style={{ fontSize: rem(10), background: 'rgba(245,158,11,0.1)', color: AMBER, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
                              edited
                            </span>
                          )}
                        </span>
                      }
                      placeholder="Enter chapter number"
                      value={formData.spoilerChapter}
                      onChange={(value) => handleInputChange('spoilerChapter', value)}
                      min={1}
                      description="Specify the chapter readers should have reached before seeing this event"
                      styles={dimmedInputStyles}
                    />
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
