'use client'

import React, { useState, useEffect, useRef } from 'react'
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
  Tabs,
  TagsInput,
  Text,
  TextInput,
  Textarea,
  Title,
  rem,
  useMantineTheme
} from '@mantine/core'
import { setTabAccentColors } from '../../lib/mantine-theme'
import { FileText, Send, BookOpen, Eye, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '../../providers/AuthProvider'
import { FormProgressIndicator, FormStep } from '../../components/FormProgressIndicator'
import { FormSection } from '../../components/FormSection'
import { api } from '../../lib/api'
import { motion } from 'motion/react'
import EntityEmbedHelperWithSearch from '../../components/EntityEmbedHelperWithSearch'
import EnhancedSpoilerMarkdown from '../../components/EnhancedSpoilerMarkdown'
import SubmissionGuidelines from '../../components/SubmissionGuidelines'
import SubmissionSuccess from '../../components/SubmissionSuccess'
import SubmitPageHeader from '../../components/SubmitPageHeader'
import { getInputStyles, getMultiSelectStyles, getDimmedInputStyles } from '../../lib/submitFormStyles'

const MIN_TITLE_LENGTH = 5
const MIN_DESCRIPTION_LENGTH = 20
const MIN_CONTENT_LENGTH = 100

interface ExistingGuide {
  id: number
  title: string
  description: string
  content: string
  characterIds?: number[]
  arcId?: number | null
  gambleIds?: number[]
  tags?: Array<{ id: number; name: string }>
  status?: string
  rejectionReason?: string | null
}

export default function SubmitGuidePageContent() {
  const theme = useMantineTheme()
  const { user, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const editGuideId = searchParams.get('edit')
  const isEditMode = Boolean(editGuideId)
  const [existingGuide, setExistingGuide] = useState<ExistingGuide | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    characterIds: [] as number[],
    arcId: null as number | null,
    gambleIds: [] as number[],
    tags: [] as string[]
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [characters, setCharacters] = useState<Array<{ id: number; name: string }>>([])
  const [arcs, setArcs] = useState<Array<{ id: number; name: string }>>([])
  const [gambles, setGambles] = useState<Array<{ id: number; name: string }>>([])
  const [tags, setTags] = useState<Array<{ id: number; name: string }>>([])
  const [loadingData, setLoadingData] = useState(true)
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write')

  useEffect(() => { setTabAccentColors('guide') }, [])
  const contentRef = useRef<HTMLTextAreaElement | null>(null)

  const accentColor = theme.other?.usogui?.guide ?? theme.colors.green[6]
  const inputStyles = getInputStyles(theme, accentColor)
  const multiSelectStyles = getMultiSelectStyles(theme, accentColor)
  const dimmedInputStyles = getDimmedInputStyles(theme)

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
    setShowSuccess(false)

    const validationError = validateForm()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    try {
      const guideData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        content: formData.content.trim(),
        characterIds: formData.characterIds.length ? formData.characterIds : undefined,
        arcId: formData.arcId ?? undefined,
        gambleIds: formData.gambleIds.length ? formData.gambleIds : undefined,
        tagNames: formData.tags.length ? formData.tags : undefined
      }

      if (isEditMode && editGuideId) {
        await api.updateGuide(Number(editGuideId), guideData)
        setShowSuccess(true)
      } else {
        await api.createGuide({
          ...guideData,
          tags: formData.tags.length ? formData.tags : undefined
        })
        setShowSuccess(true)
        setFormData({ title: '', description: '', content: '', characterIds: [], arcId: null, gambleIds: [], tags: [] })
        setActiveTab('write')
      }
    } catch (submissionError: unknown) {
      setError(submissionError instanceof Error ? submissionError.message : (isEditMode ? 'Failed to update guide. Please try again.' : 'Failed to submit guide. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const handleInsertEmbed = (embedCode: string) => {
    const textarea = contentRef.current
    if (!textarea) {
      setFormData((prev) => ({ ...prev, content: prev.content + embedCode }))
      return
    }
    const currentValue = formData.content
    const cursorPosition = textarea.selectionStart ?? currentValue.length
    const newValue = `${currentValue.slice(0, cursorPosition)}${embedCode}${currentValue.slice(cursorPosition)}`
    setFormData((prev) => ({ ...prev, content: newValue }))
    requestAnimationFrame(() => {
      textarea.focus()
      const offset = cursorPosition + embedCode.length
      textarea.setSelectionRange(offset, offset)
    })
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [charactersRes, arcsRes, gamblesRes, tagsRes] = await Promise.all([
          api.getCharacters({ limit: 500 }),
          api.getArcs({ limit: 200 }),
          api.getGambles({ limit: 500 }),
          api.getTags({ limit: 500 })
        ])
        setCharacters(charactersRes.data || [])
        setArcs(arcsRes.data || [])
        setGambles(gamblesRes.data || [])
        setTags(tagsRes.data || [])
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
    if (isEditMode && editGuideId) {
      const fetchGuideData = async () => {
        try {
          const guide = await api.getMyGuideSubmission(Number(editGuideId))
          setExistingGuide(guide)
          setFormData({
            title: guide.title || '',
            description: guide.description || '',
            content: guide.content || '',
            characterIds: guide.characterIds || [],
            arcId: guide.arcId ?? null,
            gambleIds: guide.gambleIds || [],
            tags: guide.tags?.map((t: { name: string }) => t.name) || []
          })
        } catch (fetchError) {
          console.error('Error loading guide data:', fetchError)
          setError('Failed to load guide data for editing. You may not have permission to edit this guide.')
        }
      }
      fetchGuideData()
    }
  }, [isEditMode, editGuideId])

  if (authLoading || loadingData) {
    return (
      <Container size="md" py="xl">
        <Stack align="center" gap="md" py="xl">
          <Box style={{ color: accentColor }}><FileText size={32} /></Box>
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
          <Box mb="md" style={{ color: accentColor }}><FileText size={36} /></Box>
          <Title order={4} style={{ fontFamily: 'var(--font-opti-goudy-text)', fontWeight: 400 }} mb="xs">
            Sign in to submit a guide
          </Title>
          <Text size="sm" c="dimmed" mb="lg">
            You need to be logged in to share your knowledge.
          </Text>
          <Button component={Link} href="/login" style={{ backgroundColor: accentColor, color: '#fff' }}>
            Log In
          </Button>
        </Box>
      </Container>
    )
  }

  const isFormValid = !validateForm()

  const progressSteps: FormStep[] = [
    { label: 'Title', completed: formData.title.trim().length >= MIN_TITLE_LENGTH, required: true },
    { label: 'Description', completed: formData.description.trim().length >= MIN_DESCRIPTION_LENGTH, required: true },
    { label: 'Content', completed: formData.content.trim().length >= MIN_CONTENT_LENGTH, required: true }
  ]

  const characterOptions = characters.map((c) => ({ value: c.id.toString(), label: c.name }))
  const arcOptions = arcs.map((a) => ({ value: a.id.toString(), label: a.name }))
  const gambleOptions = gambles.map((g) => ({ value: g.id.toString(), label: g.name }))
  const tagOptions = tags.map((t) => t.name)

  return (
    <Container size="md" py="xl">
      <SubmitPageHeader
        label="Guide Submission"
        title={isEditMode ? 'Edit Guide' : 'Write a Guide'}
        description={isEditMode ? 'Update your guide and resubmit for review' : 'Share your knowledge and insights about Usogui with the community'}
        icon={<FileText size={22} />}
        accentColor={accentColor}
        editMode={isEditMode}
      />

      <SubmissionGuidelines type="guide" accentColor={accentColor} />

      {isEditMode && existingGuide?.status === 'rejected' && existingGuide?.rejectionReason && (
        <Alert
          variant="light"
          mb="md"
          icon={<AlertTriangle size={16} />}
          style={{
            backgroundColor: 'rgba(245, 124, 0, 0.08)',
            borderColor: 'rgba(245, 124, 0, 0.3)'
          }}
        >
          <Text size="sm" c="#ffb74d" fw={600} mb={4}>Rejection Reason</Text>
          <Text size="sm" c="#ffb74d">{existingGuide.rejectionReason}</Text>
        </Alert>
      )}

      {error && (
        <Alert
          variant="light"
          mb="md"
          icon={<AlertTriangle size={16} />}
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            borderColor: 'rgba(239, 68, 68, 0.3)'
          }}
        >
          <Text size="sm" c="#f87171">{error}</Text>
        </Alert>
      )}

      {showSuccess && (
        <SubmissionSuccess
          type="guide"
          isEdit={isEditMode}
          accentColor={accentColor}
          onSubmitAnother={() => {
            setShowSuccess(false)
            setFormData({ title: '', description: '', content: '', characterIds: [], arcId: null, gambleIds: [], tags: [] })
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      )}

      {!showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        >
          <FormProgressIndicator steps={progressSteps} accentColor={accentColor} />

          <Card
            shadow="lg"
            radius="md"
            withBorder
            style={{
              backgroundColor: theme.colors.dark?.[7] ?? '#070707',
              borderColor: `${accentColor}35`,
              boxShadow: `0 4px 24px ${accentColor}12`
            }}
          >
            <Box
              style={{
                height: rem(3),
                background: `linear-gradient(90deg, ${accentColor}70, transparent)`,
                borderRadius: `${rem(6)} ${rem(6)} 0 0`,
                marginBottom: rem(-3)
              }}
            />
            <form onSubmit={handleSubmit}>
              <Stack gap="xl" p="xl">
                <FormSection
                  title="Guide Details"
                  description="Provide a clear title and description for your guide"
                  icon={<FileText size={18} color={accentColor} />}
                  accentColor={accentColor}
                  required
                  stepNumber={1}
                >
                  <Stack gap="md">
                    <TextInput
                      label="Guide Title"
                      placeholder="e.g., 'Understanding the Rules of Air Poker'"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.currentTarget.value)}
                      required
                      error={formData.title.length > 0 && formData.title.trim().length < MIN_TITLE_LENGTH ? 'Please provide a more descriptive title' : undefined}
                      description="Choose a clear, descriptive title"
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
                      description="Write a compelling description that summarizes your guide"
                      styles={inputStyles}
                    />
                  </Stack>
                </FormSection>

                <FormSection
                  title="Guide Content"
                  description="Write your guide using Markdown. Use entity embeds to reference characters, arcs, gambles."
                  icon={<BookOpen size={18} color={accentColor} />}
                  accentColor={accentColor}
                  required
                  stepNumber={2}
                >
                  <Stack gap="md">
                    <EntityEmbedHelperWithSearch onInsertEmbed={handleInsertEmbed} />

                    <Box
                      style={{
                        backgroundColor: theme.colors.dark?.[6] ?? '#0a0a0a',
                        borderRadius: rem(10),
                        border: `1px solid ${accentColor}35`,
                        padding: rem(16)
                      }}
                    >
                      <Tabs
                        value={activeTab}
                        onChange={(value) => setActiveTab(value as 'write' | 'preview')}
                      >
                        <Tabs.List>
                          <Tabs.Tab value="write" leftSection={<FileText size={15} />}>Write</Tabs.Tab>
                          <Tabs.Tab value="preview" leftSection={<Eye size={15} />}>Preview</Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="write" p="md">
                          <Textarea
                            label="Guide Content"
                            placeholder="Write your guide here. Use Markdown for formatting and embed entities using {{entity_type:entity_id}} syntax."
                            value={formData.content}
                            onChange={(e) => handleInputChange('content', e.currentTarget.value)}
                            required
                            minRows={16}
                            autosize
                            error={formData.content.length > 0 && formData.content.trim().length < MIN_CONTENT_LENGTH ? 'Your guide content needs more detail' : undefined}
                            description={`${formData.content.length}/${MIN_CONTENT_LENGTH}+ characters`}
                            ref={contentRef}
                            styles={{
                              input: { ...inputStyles.input, padding: rem(12), fontSize: rem(14) },
                              label: inputStyles.label
                            }}
                          />
                        </Tabs.Panel>

                        <Tabs.Panel value="preview" p="md">
                          <Stack gap="md">
                            <Title order={5} c="dimmed">Preview</Title>
                            <Box
                              style={{
                                border: `1px solid rgba(255,255,255,0.06)`,
                                borderRadius: rem(10),
                                padding: rem(16),
                                minHeight: rem(280),
                                backgroundColor: theme.colors.dark?.[7] ?? '#0a0a0a'
                              }}
                            >
                              {formData.content ? (
                                <EnhancedSpoilerMarkdown content={formData.content} compactEntityCards={false} />
                              ) : (
                                <Text c="dimmed" fs="italic" size="sm">Start writing your guide to see the preview…</Text>
                              )}
                            </Box>
                          </Stack>
                        </Tabs.Panel>
                      </Tabs>
                    </Box>
                  </Stack>
                </FormSection>

                <FormSection
                  title="Related Content"
                  description="Optionally link your guide to relevant characters, arcs, gambles, and tags"
                  icon={<BookOpen size={18} color={accentColor} />}
                  accentColor={accentColor}
                  stepNumber={3}
                >
                  <Grid gutter="md">
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <MultiSelect
                        label="Characters"
                        placeholder="Select related characters"
                        data={characterOptions}
                        value={formData.characterIds.map(String)}
                        onChange={(values) => handleInputChange('characterIds', values.map(Number))}
                        searchable
                        clearable
                        nothingFoundMessage="No characters"
                        description="Link characters featured in your guide"
                        styles={multiSelectStyles}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <Select
                        label="Arc"
                        placeholder="Select related arc"
                        data={arcOptions}
                        value={formData.arcId !== null ? formData.arcId.toString() : null}
                        onChange={(value) => handleInputChange('arcId', value ? Number(value) : null)}
                        searchable
                        clearable
                        nothingFoundMessage="No arcs"
                        description="Link to the story arc your guide covers"
                        styles={dimmedInputStyles}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <MultiSelect
                        label="Gambles"
                        placeholder="Select related gambles"
                        data={gambleOptions}
                        value={formData.gambleIds.map(String)}
                        onChange={(values) => handleInputChange('gambleIds', values.map(Number))}
                        searchable
                        clearable
                        nothingFoundMessage="No gambles"
                        description="Link gambles analyzed in your guide"
                        styles={multiSelectStyles}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TagsInput
                        label="Tags"
                        placeholder="Type and press Enter to add tags"
                        data={tagOptions}
                        value={formData.tags}
                        onChange={(values) => handleInputChange('tags', values)}
                        clearable
                        maxTags={5}
                        description="Add tags to categorize your guide (max 5)"
                        styles={multiSelectStyles}
                      />
                    </Grid.Col>
                  </Grid>
                </FormSection>

                <Group justify="space-between" align="center">
                  <Button
                    type="submit"
                    size="lg"
                    loading={loading}
                    disabled={!isFormValid}
                    leftSection={!loading && <Send size={18} />}
                    style={{
                      backgroundColor: isFormValid ? accentColor : undefined,
                      color: isFormValid ? '#fff' : undefined
                    }}
                  >
                    {loading ? (isEditMode ? 'Updating…' : 'Submitting…') : (isEditMode ? 'Update & Resubmit' : 'Submit Guide')}
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
