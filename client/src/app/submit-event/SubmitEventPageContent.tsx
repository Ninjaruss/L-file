'use client'

import React, { useState, useEffect, useDeferredValue, startTransition } from 'react'
import styles from './SubmitEventPageContent.module.css'
import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { setTabAccentColors } from '../../lib/mantine-theme'
import { Zap, Send, AlertTriangle, Plus } from 'lucide-react'
import Link from 'next/link'
import EventFormCard, { EventFormData } from './EventFormCard'
import EventTimeline from './EventTimeline'
import { useAuth } from '../../providers/AuthProvider'
import { api } from '../../lib/api'
import { motion } from 'motion/react'
import SubmissionGuidelines from '../../components/SubmissionGuidelines'
import SubmissionSuccess from '../../components/SubmissionSuccess'
import SubmitPageHeader from '../../components/SubmitPageHeader'
import { getDimmedInputStyles } from '../../lib/submitFormStyles'

const MIN_TITLE_LENGTH = 3
const MIN_DESCRIPTION_LENGTH = 10

export default function SubmitEventPageContent() {
  const theme = useMantineTheme()
  const { user, loading: authLoading } = useAuth()

  const [sharedArcId, setSharedArcId] = useState<number | null>(null)
  const [sharedGambleId, setSharedGambleId] = useState<number | null>(null)
  const deferredArcId = useDeferredValue(sharedArcId)
  const deferredGambleId = useDeferredValue(sharedGambleId)

  const [batchEvents, setBatchEvents] = useState<EventFormData[]>([
    { title: '', description: '', chapterNumber: '' as number | '', pageNumber: '' as number | '', type: '', spoilerChapter: '' as number | '', characterIds: [] }
  ])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [characters, setCharacters] = useState<Array<{ id: number; name: string }>>([])
  const [arcs, setArcs] = useState<Array<{ id: number; name: string }>>([])
  const [gambles, setGambles] = useState<Array<{ id: number; name: string }>>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => { setTabAccentColors('event') }, [])

  const accentColor = theme.other?.usogui?.event ?? theme.colors.yellow[6]
  const dimmedInputStyles = getDimmedInputStyles(theme)

  const validateBatchEvents = () => {
    for (let i = 0; i < batchEvents.length; i++) {
      const event = batchEvents[i]
      if (!event.title.trim() || event.title.trim().length < MIN_TITLE_LENGTH) return `Event ${i + 1}: Title must be at least ${MIN_TITLE_LENGTH} characters`
      if (!event.description.trim() || event.description.trim().length < MIN_DESCRIPTION_LENGTH) return `Event ${i + 1}: Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`
      if (!event.chapterNumber || event.chapterNumber < 1) return `Event ${i + 1}: Chapter number is required`
    }
    return null
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
          pageNumber: event.pageNumber ? Number(event.pageNumber) : undefined,
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
      setBatchEvents([{ title: '', description: '', chapterNumber: '' as number | '', pageNumber: '' as number | '', type: '', spoilerChapter: '' as number | '', characterIds: [] }])
    } else if (results.success > 0) {
      setShowSuccess(true)
      setError(`${results.failed} event${results.failed !== 1 ? 's' : ''} failed: ${results.errors.join('; ')}`)
    } else {
      setError(`All submissions failed: ${results.errors.join('; ')}`)
    }
  }

  const addEvent = () => {
    setBatchEvents([...batchEvents, { title: '', description: '', chapterNumber: '' as number | '', pageNumber: '' as number | '', type: '', spoilerChapter: '' as number | '', characterIds: [] }])
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

  const arcOptions = arcs.filter((a) => a.id != null && a.name).map((a) => ({ value: String(a.id), label: a.name }))
  const gambleOptions = gambles.filter((g) => g.id != null && g.name).map((g) => ({ value: String(g.id), label: g.name }))
  const characterOptions = characters.filter((c) => c.id != null && c.name).map((c) => ({ value: String(c.id), label: c.name }))

  const isBatchValid = !validateBatchEvents()
  const validEventCount = batchEvents.filter(e =>
    e.title.trim().length >= MIN_TITLE_LENGTH &&
    e.description.trim().length >= MIN_DESCRIPTION_LENGTH &&
    e.chapterNumber && e.chapterNumber >= 1
  ).length

  return (
    <Container size="md" py="xl">
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
          requiresApproval={false}
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
