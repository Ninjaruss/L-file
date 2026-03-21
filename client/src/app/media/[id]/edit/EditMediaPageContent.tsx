'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  Group,
  Loader,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  rem,
  useMantineTheme,
} from '@mantine/core'
import { AlertTriangle, Image, Link as LinkIcon, Send, Upload, Video } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import { FormSection } from '@/components/FormSection'
import { EditPageShell } from '@/components/EditPageShell'
import { api } from '@/lib/api'
import SubmissionSuccess from '@/components/SubmissionSuccess'
import { getEntityColor } from '@/lib/entityColors'
import { getInputStyles, getDimmedInputStyles } from '@/lib/submitFormStyles'
import { setTabAccentColors } from '@/lib/mantine-theme'

const AMBER = '#f59e0b'

type MediaOwnerType = 'character' | 'arc' | 'event' | 'gamble' | 'organization' | 'user'

interface ExistingMedia {
  id: string
  url: string
  type?: string
  mediaType?: string
  isUploaded?: boolean
  description?: string
  ownerType?: MediaOwnerType | ''
  ownerId?: number | null
  chapterNumber?: number | null
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string | null
  createdAt?: string
  updatedAt?: string
}

interface EditMediaFormState {
  url: string
  description: string
  ownerType: MediaOwnerType | ''
  ownerId: number | null
  chapterNumber: number | null
}

interface EditMediaPageContentProps {
  id: string
}

export default function EditMediaPageContent({ id }: EditMediaPageContentProps) {
  const theme = useMantineTheme()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const accentColor = getEntityColor('media')

  useEffect(() => { setTabAccentColors('media') }, [])

  const inputStyles = getInputStyles(theme, accentColor)
  const dimmedInputStyles = getDimmedInputStyles(theme)

  const [existingMedia, setExistingMedia] = useState<ExistingMedia | null>(null)
  const [formData, setFormData] = useState<EditMediaFormState>({
    url: '',
    description: '',
    ownerType: '',
    ownerId: null,
    chapterNumber: null,
  })
  const [initialData, setInitialData] = useState<EditMediaFormState | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const [characters, setCharacters] = useState<Array<{ id: number; name: string }>>([])
  const [arcs, setArcs] = useState<Array<{ id: number; name: string }>>([])
  const [events, setEvents] = useState<Array<{ id: number; title: string }>>([])
  const [gambles, setGambles] = useState<Array<{ id: number; name: string }>>([])
  const [organizations, setOrganizations] = useState<Array<{ id: number; name: string }>>([])

  const handleInputChange = <K extends keyof EditMediaFormState>(field: K, value: EditMediaFormState[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const isDirty = (field: keyof EditMediaFormState): boolean => {
    if (!initialData) return false
    return JSON.stringify(formData[field]) !== JSON.stringify(initialData[field])
  }

  const isValidUrl = (url: string) => {
    try { new URL(url); return true } catch { return false }
  }

  const validateForm = () => {
    if (!formData.url.trim()) return 'Media URL is required'
    if (!isValidUrl(formData.url)) return 'Please enter a valid URL'
    if (!formData.ownerType) return 'Please select an entity type'
    if (!formData.ownerId) return 'Please select a specific entity'
    return null
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [media, charactersRes, arcsRes, eventsRes, gamblesRes, orgsRes] = await Promise.all([
          api.getMyMediaSubmission(id),
          api.getCharacters({ limit: 500 }),
          api.getArcs({ limit: 200 }),
          api.getEvents({ limit: 200 }),
          api.getGambles({ limit: 500 }),
          api.getOrganizations({ limit: 100 }),
        ])
        setExistingMedia(media)
        const populated: EditMediaFormState = {
          url: media.url || '',
          description: media.description || '',
          ownerType: media.ownerType || '',
          ownerId: media.ownerId || null,
          chapterNumber: media.chapterNumber || null,
        }
        setFormData(populated)
        setInitialData(populated)
        setCharacters(charactersRes.data || [])
        setArcs(arcsRes.data || [])
        setEvents(eventsRes.data || [])
        setGambles(gamblesRes.data || [])
        setOrganizations(orgsRes.data || [])
      } catch {
        setError('Failed to load media. You may not have permission to edit this submission.')
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [id])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    const validationError = validateForm()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('url', formData.url.trim())
      fd.append('ownerType', formData.ownerType)
      fd.append('ownerId', String(formData.ownerId!))
      if (formData.chapterNumber) fd.append('chapterNumber', String(formData.chapterNumber))
      if (formData.description.trim()) fd.append('description', formData.description.trim())
      await api.updateOwnMedia(id, fd)
      setShowSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update media. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const entityOptions = useMemo(() => {
    switch (formData.ownerType) {
      case 'character': return characters.map((i) => ({ value: String(i.id), label: i.name }))
      case 'arc': return arcs.map((i) => ({ value: String(i.id), label: i.name }))
      case 'event': return events.map((i) => ({ value: String(i.id), label: i.title }))
      case 'gamble': return gambles.map((i) => ({ value: String(i.id), label: i.name }))
      case 'organization': return organizations.map((i) => ({ value: String(i.id), label: i.name }))
      default: return []
    }
  }, [formData.ownerType, characters, arcs, events, gambles, organizations])

  // Determine existing media type for preview
  const existingMediaType = existingMedia?.type || existingMedia?.mediaType || 'image'

  // Loading state
  if (authLoading || loadingData) {
    return (
      <Container size="md" py="xl">
        <Stack align="center" gap="md" py="xl">
          <Loader size="sm" color={accentColor} />
          <Text size="sm" c="dimmed">Loading media…</Text>
        </Stack>
      </Container>
    )
  }

  // Auth gate
  if (!user) {
    return (
      <Container size="md" py="xl">
        <Alert icon={<AlertTriangle size={16} />}>
          You need to be logged in to edit this media submission.
        </Alert>
      </Container>
    )
  }

  // Load error
  if (!existingMedia && error) {
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

  if (!existingMedia) return null

  const isFormValid = !validateForm()
  const urlError = formData.url.length > 0 && !isValidUrl(formData.url) ? 'Please enter a valid URL' : null

  return (
    <Container size="md" py="xl">
      <EditPageShell
        type="media"
        accentColor={accentColor}
        submissionTitle={existingMedia.description || `Media Submission`}
        status={existingMedia.status}
        submittedAt={existingMedia.createdAt ?? new Date().toISOString()}
        updatedAt={existingMedia.updatedAt}
        rejectionReason={existingMedia.rejectionReason}
      >
        {showSuccess ? (
          <SubmissionSuccess
            type="media"
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
                  {/* Existing media preview */}
                  {existingMedia.url && (
                    <Box
                      style={{
                        backgroundColor: `${accentColor}08`,
                        border: `1px solid ${accentColor}22`,
                        borderRadius: rem(8),
                        padding: rem(16),
                      }}
                    >
                      <Text size="sm" c="dimmed" mb="xs">Current media</Text>
                      {existingMediaType === 'image' ? (
                        <img
                          src={existingMedia.url}
                          alt="Current media"
                          style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, display: 'block' }}
                        />
                      ) : (
                        <Text size="sm" style={{ color: accentColor, wordBreak: 'break-all' }}>
                          {existingMedia.url}
                        </Text>
                      )}
                      <Text size="xs" c="dimmed" mt="xs">
                        Update the URL below to replace it.
                      </Text>
                    </Box>
                  )}

                  {/* Media URL */}
                  <FormSection
                    title="Media Link"
                    description="Update the URL to a video, audio track, or media post"
                    icon={<LinkIcon size={18} color={accentColor} />}
                    accentColor={accentColor}
                    required
                    stepNumber={1}
                    hasValue={!!formData.url}
                  >
                    <TextInput
                      label={
                        <span>
                          Media URL
                          {isDirty('url') && (
                            <span style={{ fontSize: rem(10), background: 'rgba(245,158,11,0.1)', color: AMBER, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
                              edited
                            </span>
                          )}
                        </span>
                      }
                      placeholder="https://…"
                      value={formData.url}
                      onChange={(e) => handleInputChange('url', e.currentTarget.value)}
                      required
                      description={urlError ? undefined : 'YouTube, TikTok, Instagram, DeviantArt, Pixiv, SoundCloud, direct links, etc.'}
                      error={urlError}
                      leftSection={
                        <Box style={{ display: 'flex', alignItems: 'center' }}>
                          <LinkIcon size={16} />
                        </Box>
                      }
                      leftSectionPointerEvents="none"
                      styles={inputStyles}
                    />
                  </FormSection>

                  {/* Related Entity */}
                  <FormSection
                    title="Related Entity"
                    description="Link this media to a character, arc, gamble, or other entity"
                    icon={<Image size={18} color={accentColor} />}
                    accentColor={accentColor}
                    required
                    stepNumber={2}
                    hasValue={!!formData.ownerType && !!formData.ownerId}
                  >
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                      <Select
                        label={
                          <span>
                            Entity Type
                            {isDirty('ownerType') && (
                              <span style={{ fontSize: rem(10), background: 'rgba(245,158,11,0.1)', color: AMBER, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
                                edited
                              </span>
                            )}
                          </span>
                        }
                        placeholder="Select entity type…"
                        data={[
                          { value: 'character', label: 'Character' },
                          { value: 'arc', label: 'Arc' },
                          { value: 'event', label: 'Event' },
                          { value: 'gamble', label: 'Gamble' },
                          { value: 'organization', label: 'Organization' },
                        ]}
                        value={formData.ownerType || null}
                        onChange={(value) => {
                          handleInputChange('ownerType', (value ?? '') as MediaOwnerType | '')
                          handleInputChange('ownerId', null)
                        }}
                        searchable
                        clearable
                        withAsterisk
                        nothingFoundMessage="No matches"
                        styles={inputStyles}
                      />
                      <Select
                        label={
                          <span>
                            Specific Entity
                            {isDirty('ownerId') && (
                              <span style={{ fontSize: rem(10), background: 'rgba(245,158,11,0.1)', color: AMBER, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
                                edited
                              </span>
                            )}
                          </span>
                        }
                        placeholder={!formData.ownerType ? 'Select entity type first' : `Choose ${formData.ownerType}…`}
                        data={entityOptions}
                        value={formData.ownerId ? String(formData.ownerId) : null}
                        onChange={(value) => handleInputChange('ownerId', value ? Number(value) : null)}
                        disabled={!formData.ownerType}
                        searchable
                        withAsterisk
                        nothingFoundMessage="No matches found"
                        styles={inputStyles}
                      />
                    </SimpleGrid>
                  </FormSection>

                  {/* Additional Details */}
                  <FormSection
                    title="Additional Details"
                    description="Optional context and chapter reference"
                    icon={<Video size={18} color={accentColor} />}
                    accentColor={accentColor}
                    stepNumber={3}
                    hasValue={!!formData.chapterNumber || !!formData.description}
                  >
                    <Stack gap="md">
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
                        placeholder="e.g., 45"
                        value={formData.chapterNumber ?? ''}
                        onChange={(value) => handleInputChange('chapterNumber', typeof value === 'number' ? value : null)}
                        min={1}
                        description="Associate with a specific chapter if relevant"
                        hideControls
                        styles={dimmedInputStyles}
                      />
                      <Textarea
                        label={
                          <span>
                            Description
                            {isDirty('description') && (
                              <span style={{ fontSize: rem(10), background: 'rgba(245,158,11,0.1)', color: AMBER, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
                                edited
                              </span>
                            )}
                          </span>
                        }
                        placeholder="Describe this media, credit the artist if known, or provide context…"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.currentTarget.value)}
                        description="Please credit the original artist if known"
                        autosize
                        minRows={3}
                        styles={dimmedInputStyles}
                      />
                    </Stack>
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
