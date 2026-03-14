'use client'

import React, { useState, useEffect, useDeferredValue, startTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import styles from './SubmitEventPageContent.module.css'
import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  Group,
  Loader,
  MultiSelect,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { setTabAccentColors } from '../../lib/mantine-theme'
import { Zap, Send, FileText, BookOpen, Users, AlertTriangle, Plus } from 'lucide-react'
import Link from 'next/link'
import EventFormCard, { EventFormData } from './EventFormCard'
import EventTimeline from './EventTimeline'
import { useAuth } from '../../providers/AuthProvider'
import { FormProgressIndicator, FormStep } from '../../components/FormProgressIndicator'
import { FormSection } from '../../components/FormSection'
import { api } from '../../lib/api'
import { motion } from 'motion/react'
import SubmissionGuidelines from '../../components/SubmissionGuidelines'
import SubmissionSuccess from '../../components/SubmissionSuccess'
import SubmitPageHeader from '../../components/SubmitPageHeader'
import { getInputStyles, getDimmedInputStyles, getMultiSelectStyles } from '../../lib/submitFormStyles'

const MIN_TITLE_LENGTH = 3
const MIN_DESCRIPTION_LENGTH = 10

const EVENT_TYPE_OPTIONS = [
  { value: 'gamble', label: 'Gamble' },
  { value: 'decision', label: 'Decision' },
  { value: 'reveal', label: 'Reveal' },
  { value: 'shift', label: 'Shift' },
  { value: 'resolution', label: 'Resolution' }
]

export default function SubmitEventPageContent() {
  const theme = useMantineTheme()
  const { user, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const editEventId = searchParams.get('edit')
  const isEditMode = Boolean(editEventId)

  const [sharedArcId, setSharedArcId] = useState<number | null>(null)
  const [sharedGambleId, setSharedGambleId] = useState<number | null>(null)
  const deferredArcId = useDeferredValue(sharedArcId)
  const deferredGambleId = useDeferredValue(sharedGambleId)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    chapterNumber: 1 as number | '',
    type: '' as string,
    arcId: null as number | null,
    gambleId: null as number | null,
    spoilerChapter: '' as number | '',
    characterIds: [] as number[]
  })
  const [batchEvents, setBatchEvents] = useState<EventFormData[]>([
    { title: '', description: '', chapterNumber: '' as number | '', type: '', spoilerChapter: '' as number | '', characterIds: [] }
  ])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [characters, setCharacters] = useState<Array<{ id: number; name: string }>>([])
  const [arcs, setArcs] = useState<Array<{ id: number; name: string }>>([])
  const [gambles, setGambles] = useState<Array<{ id: number; name: string }>>([])
  const [loadingData, setLoadingData] = useState(true)
  const [existingEvent, setExistingEvent] = useState<any>(null)

  useEffect(() => { setTabAccentColors('event') }, [])

  const accentColor = theme.other?.usogui?.event ?? theme.colors.yellow[6]
  const inputStyles = getInputStyles(theme, accentColor)
  const dimmedInputStyles = getDimmedInputStyles(theme)
  const multiSelectStyles = getMultiSelectStyles(theme, accentColor)

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateSingleForm = () => {
    if (!formData.title.trim()) return 'Title is required'
    if (formData.title.trim().length < MIN_TITLE_LENGTH) return `Title must be at least ${MIN_TITLE_LENGTH} characters long`
    if (!formData.description.trim()) return 'Description is required'
    if (formData.description.trim().length < MIN_DESCRIPTION_LENGTH) return `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters long`
    if (!formData.chapterNumber || formData.chapterNumber < 1) return 'Chapter number is required and must be at least 1'
    return null
  }

  const validateBatchEvents = () => {
    for (let i = 0; i < batchEvents.length; i++) {
      const event = batchEvents[i]
      if (!event.title.trim() || event.title.trim().length < MIN_TITLE_LENGTH) return `Event ${i + 1}: Title must be at least ${MIN_TITLE_LENGTH} characters`
      if (!event.description.trim() || event.description.trim().length < MIN_DESCRIPTION_LENGTH) return `Event ${i + 1}: Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`
      if (!event.chapterNumber || event.chapterNumber < 1) return `Event ${i + 1}: Chapter number is required`
    }
    return null
  }

  const handleSingleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    const validationError = validateSingleForm()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    try {
      const eventPayload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        chapterNumber: formData.chapterNumber as number,
        type: formData.type || undefined,
        arcId: formData.arcId ?? undefined,
        gambleId: formData.gambleId ?? undefined,
        spoilerChapter: formData.spoilerChapter || undefined,
        characterIds: formData.characterIds.length ? formData.characterIds : undefined
      }

      if (isEditMode && editEventId) {
        await api.updateOwnEvent(parseInt(editEventId), eventPayload)
      } else {
        await api.createEvent(eventPayload)
        setFormData({ title: '', description: '', chapterNumber: 1, type: '', arcId: null, gambleId: null, spoilerChapter: '', characterIds: [] })
      }
      setShowSuccess(true)
    } catch (submissionError: unknown) {
      setError(submissionError instanceof Error ? submissionError.message : (isEditMode ? 'Failed to update event. Please try again.' : 'Failed to submit event. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const handleBatchSubmit = async () => {
    setError('')

    const validationError = validateBatchEvents()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    const results = { success: 0, failed: 0, errors: [] as string[] }

    for (const event of batchEvents) {
      try {
        await api.createEvent({
          title: event.title.trim(),
          description: event.description.trim(),
          chapterNumber: event.chapterNumber as number,
          type: event.type || undefined,
          arcId: sharedArcId ?? undefined,
          gambleId: sharedGambleId ?? undefined,
          spoilerChapter: event.spoilerChapter || undefined,
          characterIds: event.characterIds.length ? event.characterIds : undefined
        })
        results.success++
      } catch (err: any) {
        results.failed++
        results.errors.push(`"${event.title || 'Untitled'}": ${err.message || 'Unknown error'}`)
      }
    }

    setLoading(false)

    if (results.failed === 0) {
      setShowSuccess(true)
      setBatchEvents([{ title: '', description: '', chapterNumber: '' as number | '', type: '', spoilerChapter: '' as number | '', characterIds: [] }])
    } else if (results.success > 0) {
      setShowSuccess(true)
      setError(`${results.failed} event${results.failed !== 1 ? 's' : ''} failed: ${results.errors.join('; ')}`)
    } else {
      setError(`All submissions failed: ${results.errors.join('; ')}`)
    }
  }

  const addEvent = () => {
    setBatchEvents([...batchEvents, { title: '', description: '', chapterNumber: '' as number | '', type: '', spoilerChapter: '' as number | '', characterIds: [] }])
  }
  const removeEvent = (index: number) => {
    if (batchEvents.length > 1) setBatchEvents(batchEvents.filter((_, i) => i !== index))
  }
  const updateEvent = (index: number, data: EventFormData) => {
    const newEvents = [...batchEvents]
    newEvents[index] = data
    setBatchEvents(newEvents)
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [charactersRes, arcsRes, gamblesRes] = await Promise.all([
          api.getCharacters({ limit: 500 }),
          api.getArcs({ limit: 200 }),
          api.getGambles({ limit: 500 })
        ])
        setCharacters(charactersRes.data || [])
        setArcs(arcsRes.data || [])
        setGambles(gamblesRes.data || [])
      } catch (loadError) {
        console.error('Error loading data:', loadError)
        setError('Failed to load form data. Please refresh the page.')
      } finally {
        setLoadingData(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (isEditMode && editEventId) {
      const fetchEventData = async () => {
        try {
          const eventData = await api.getEvent(parseInt(editEventId))
          setExistingEvent(eventData)
          setFormData({
            title: eventData.title || '',
            description: eventData.description || '',
            chapterNumber: eventData.chapterNumber || 1,
            type: eventData.type || '',
            arcId: eventData.arcId || null,
            gambleId: eventData.gambleId || null,
            spoilerChapter: eventData.spoilerChapter || '',
            characterIds: eventData.characters?.map((c: any) => c.id) || []
          })
        } catch (fetchError) {
          console.error('Error fetching event:', fetchError)
          setError('Failed to load event data. You may not have permission to edit this event.')
        }
      }
      fetchEventData()
    }
  }, [isEditMode, editEventId])

  if (authLoading || loadingData) {
    return (
      <Container size="md" py="xl">
        <Stack align="center" gap="md" py="xl">
          <Box style={{ color: accentColor }}><Zap size={32} /></Box>
          <Loader size="sm" color={accentColor} />
          <Text size="sm" c="dimmed">Loading…</Text>
        </Stack>
      </Container>
    )
  }

  if (!user) {
    return (
      <Container size="md" py="xl">
        <Box
          style={{
            backgroundColor: `${accentColor}0d`,
            border: `1px solid ${accentColor}35`,
            borderRadius: rem(12),
            padding: rem(32),
            textAlign: 'center'
          }}
        >
          <Box mb="md" style={{ color: accentColor }}><Zap size={36} /></Box>
          <Title order={4} style={{ fontFamily: 'var(--font-opti-goudy-text)', fontWeight: 400 }} mb="xs">
            Sign in to submit an event
          </Title>
          <Text size="sm" c="dimmed" mb="lg">You need to be logged in to document story events.</Text>
          <Button component={Link} href="/login" style={{ backgroundColor: accentColor, color: '#000' }}>
            Log In
          </Button>
        </Box>
      </Container>
    )
  }

  const characterOptions = characters.filter((c) => c.id != null && c.name).map((c) => ({ value: String(c.id), label: c.name }))
  const arcOptions = arcs.filter((a) => a.id != null && a.name).map((a) => ({ value: String(a.id), label: a.name }))
  const gambleOptions = gambles.filter((g) => g.id != null && g.name).map((g) => ({ value: String(g.id), label: g.name }))

  // Edit mode: single event form
  if (isEditMode) {
    const isFormValid = !validateSingleForm()
    const progressSteps: FormStep[] = [
      { label: 'Title', completed: formData.title.trim().length >= MIN_TITLE_LENGTH, required: true },
      { label: 'Description', completed: formData.description.trim().length >= MIN_DESCRIPTION_LENGTH, required: true },
      { label: 'Chapter Number', completed: !!formData.chapterNumber && formData.chapterNumber >= 1, required: true }
    ]

    return (
      <Container size="md" py="xl">
        <SubmitPageHeader
          label="Event Submission"
          title="Edit Event"
          description="Update your event submission details"
          icon={<Zap size={22} />}
          accentColor={accentColor}
          editMode
        />

        {error && (
          <Alert variant="light" mb="md" icon={<AlertTriangle size={16} />}
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
          >
            <Text size="sm" c="#f87171">{error}</Text>
          </Alert>
        )}

        {showSuccess && (
          <SubmissionSuccess
            type="event"
            isEdit
            accentColor={accentColor}
            onSubmitAnother={() => { setShowSuccess(false) }}
          />
        )}

        {!showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
          >
            <FormProgressIndicator steps={progressSteps} accentColor={accentColor} />

            <Card shadow="lg" radius="md" withBorder style={{ backgroundColor: theme.colors.dark?.[7] ?? '#070707', borderColor: `${accentColor}35`, boxShadow: `0 4px 24px ${accentColor}12` }}>
              <Box style={{ height: rem(3), background: `linear-gradient(90deg, ${accentColor}70, transparent)`, borderRadius: `${rem(6)} ${rem(6)} 0 0`, marginBottom: rem(-3) }} />
              <form onSubmit={handleSingleSubmit}>
                <Stack gap="xl" p="xl">
                  <FormSection title="Basic Information" description="Core details about the event" icon={<FileText size={18} color={accentColor} />} accentColor={accentColor} required stepNumber={1}>
                    <Stack gap="md">
                      <TextInput label="Event Title" placeholder="e.g., 'Baku reveals the winning card'" value={formData.title} onChange={(e) => handleInputChange('title', e.currentTarget.value)} required error={formData.title.length > 0 && formData.title.trim().length < MIN_TITLE_LENGTH ? `Title must be at least ${MIN_TITLE_LENGTH} characters long` : undefined} styles={inputStyles} />
                      <Textarea label="Event Description" placeholder="Describe what happens in this event." value={formData.description} onChange={(e) => handleInputChange('description', e.currentTarget.value)} required minRows={4} autosize error={formData.description.length > 0 && formData.description.trim().length < MIN_DESCRIPTION_LENGTH ? `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters long` : undefined} styles={inputStyles} />
                      <NumberInput label="Chapter Number" placeholder="Enter chapter number" value={formData.chapterNumber} onChange={(value) => handleInputChange('chapterNumber', value)} required min={1} styles={inputStyles} />
                    </Stack>
                  </FormSection>

                  <FormSection title="Event Classification" description="Categorize and link to related content" icon={<BookOpen size={18} color={accentColor} />} accentColor={accentColor} stepNumber={2}>
                    <Stack gap="md">
                      <Select label="Event Type" placeholder="Select event type" value={formData.type} onChange={(value) => handleInputChange('type', value || '')} data={EVENT_TYPE_OPTIONS} clearable styles={dimmedInputStyles} classNames={{ option: styles.selectOption }} />
                      <Select label="Story Arc" placeholder="Select arc" value={formData.arcId?.toString() || null} onChange={(value) => handleInputChange('arcId', value ? parseInt(value) : null)} data={arcOptions} clearable searchable nothingFoundMessage="No arcs found" styles={dimmedInputStyles} classNames={{ option: styles.selectOption }} />
                      <Select label="Related Gamble" placeholder="Select gamble" value={formData.gambleId?.toString() || null} onChange={(value) => handleInputChange('gambleId', value ? parseInt(value) : null)} data={gambleOptions} clearable searchable nothingFoundMessage="No gambles found" styles={dimmedInputStyles} classNames={{ option: styles.selectOption }} />
                    </Stack>
                  </FormSection>

                  <FormSection title="Characters Involved" description="Select characters who appear in this event" icon={<Users size={18} color={accentColor} />} accentColor={accentColor} stepNumber={3}>
                    <MultiSelect label="Characters" placeholder="Select characters" value={formData.characterIds.map(String)} onChange={(values) => handleInputChange('characterIds', values.map((v) => parseInt(v)))} data={characterOptions} searchable clearable nothingFoundMessage="No characters found" styles={multiSelectStyles} classNames={{ option: styles.selectOption }} />
                  </FormSection>

                  <FormSection title="Spoiler Settings" description="Mark if this event contains story spoilers" icon={<AlertTriangle size={18} color={accentColor} />} accentColor={accentColor} stepNumber={4}>
                    <NumberInput label="Spoiler Chapter" placeholder="Enter chapter number" value={formData.spoilerChapter} onChange={(value) => handleInputChange('spoilerChapter', value)} min={1} description="Specify the chapter readers should have reached before seeing this event" styles={dimmedInputStyles} />
                  </FormSection>

                  <Group justify="space-between" align="center">
                    <Button type="submit" size="lg" loading={loading} disabled={!isFormValid} leftSection={<Send size={18} />} style={{ backgroundColor: isFormValid ? accentColor : undefined, color: isFormValid ? '#000' : undefined }}>
                      {loading ? 'Updating…' : 'Update Event'}
                    </Button>
                    <Text size="xs" c="dimmed">Reviewed by a moderator before publishing</Text>
                  </Group>
                </Stack>
              </form>
            </Card>
          </motion.div>
        )}
      </Container>
    )
  }

  // Batch create mode
  const isBatchValid = !validateBatchEvents()
  const validEventCount = batchEvents.filter(e =>
    e.title.trim().length >= MIN_TITLE_LENGTH &&
    e.description.trim().length >= MIN_DESCRIPTION_LENGTH &&
    e.chapterNumber && e.chapterNumber >= 1
  ).length

  return (
    <Container size="xl" py="xl">
      <SubmitPageHeader
        label="Event Submission"
        title="Submit Events"
        description="Document key moments, decisions, and revelations from the Usogui story"
        icon={<Zap size={22} />}
        accentColor={accentColor}
      />

      <SubmissionGuidelines type="event" accentColor={accentColor} />

      {error && (
        <Alert variant="light" mb="md" icon={<AlertTriangle size={16} />}
          style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
        >
          <Text size="sm" c="#f87171">{error}</Text>
        </Alert>
      )}

      {showSuccess && (
        <SubmissionSuccess
          type="event"
          accentColor={accentColor}
          onSubmitAnother={() => { setShowSuccess(false) }}
        />
      )}

      {!showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        >
          {/* Shared Context Card */}
          <Card shadow="lg" radius="md" withBorder mb="xl" style={{ backgroundColor: theme.colors.dark?.[7] ?? '#070707', borderColor: `${accentColor}35`, borderLeft: `3px solid ${accentColor}60` }}>
            <Stack gap="md" p="lg">
              <Text fw={600} c={accentColor} size="sm">Shared Context — applies to all events</Text>
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <Select
                  label="Story Arc"
                  placeholder="Select arc for all events"
                  value={sharedArcId?.toString() || null}
                  onChange={(value) => { startTransition(() => { setSharedArcId(value ? parseInt(value) : null) }) }}
                  data={arcOptions}
                  clearable
                  styles={dimmedInputStyles}
                  classNames={{ option: styles.selectOption }}
                />
                <Select
                  label="Related Gamble"
                  placeholder="Select gamble for all events"
                  value={sharedGambleId?.toString() || null}
                  onChange={(value) => { startTransition(() => { setSharedGambleId(value ? parseInt(value) : null) }) }}
                  data={gambleOptions}
                  clearable
                  styles={dimmedInputStyles}
                  classNames={{ option: styles.selectOption }}
                />
              </SimpleGrid>
            </Stack>
          </Card>

          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
            {/* Left: Event Forms */}
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Title order={3} style={{ fontFamily: 'var(--font-opti-goudy-text)', fontWeight: 400 }} c={accentColor}>
                  Events ({batchEvents.length})
                </Title>
                <Button variant="light" color="yellow" leftSection={<Plus size={16} />} onClick={addEvent} size="sm">
                  Add Event
                </Button>
              </Group>

              {batchEvents.map((event, index) => (
                <EventFormCard
                  key={index}
                  index={index}
                  data={event}
                  onChange={(data) => updateEvent(index, data)}
                  onRemove={() => removeEvent(index)}
                  canRemove={batchEvents.length > 1}
                  characterOptions={characterOptions}
                  accentColor={accentColor}
                />
              ))}

              <Card shadow="lg" radius="md" withBorder p="lg" style={{ backgroundColor: theme.colors.dark?.[7] ?? '#070707', borderColor: `${accentColor}35` }}>
                <Stack gap="md">
                  <Text size="sm" c="dimmed">{validEventCount} of {batchEvents.length} event{batchEvents.length !== 1 ? 's' : ''} ready</Text>
                  <Group justify="space-between" align="center">
                    <Button
                      size="lg"
                      loading={loading}
                      disabled={!isBatchValid}
                      onClick={handleBatchSubmit}
                      leftSection={<Send size={18} />}
                      style={{ backgroundColor: isBatchValid ? accentColor : undefined, color: isBatchValid ? '#000' : undefined }}
                    >
                      {loading ? 'Submitting…' : `Submit ${batchEvents.length} Event${batchEvents.length !== 1 ? 's' : ''}`}
                    </Button>
                    <Text size="xs" c="dimmed">Reviewed before publishing</Text>
                  </Group>
                </Stack>
              </Card>
            </Stack>

            {/* Right: Timeline */}
            <Box>
              <Title order={3} style={{ fontFamily: 'var(--font-opti-goudy-text)', fontWeight: 400 }} c={accentColor} mb="md">
                Existing Events
              </Title>
              <EventTimeline
                arcId={deferredArcId}
                gambleId={deferredGambleId}
                arcName={arcs.find(a => a.id === deferredArcId)?.name}
                gambleName={gambles.find(g => g.id === deferredGambleId)?.name}
                accentColor={accentColor}
              />
            </Box>
          </SimpleGrid>
        </motion.div>
      )}
    </Container>
  )
}
