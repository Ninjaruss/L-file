'use client'

import React, { useRef, useState } from 'react'
import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  NumberInput,
  Select,
  Stack,
  Text,
  Textarea,
  Title,
  useMantineTheme
} from '@mantine/core'
import { Upload, Image, Video, FileText, X } from 'lucide-react'

interface MediaUploadFormProps {
  onUpload: (file: File, data: {
    type: 'image' | 'video' | 'audio'
    description?: string
    ownerType: 'character' | 'arc' | 'event' | 'gamble' | 'organization' | 'user'
    ownerId: number
    chapterNumber?: number
    purpose?: 'gallery' | 'entity_display'
    usageType: 'character_image' | 'guide_image' | 'gallery_upload'
  }) => Promise<void>
  characters: Array<{ id: number; name: string }>
  arcs: Array<{ id: number; name: string }>
  events: Array<{ id: number; title: string }>
  gambles: Array<{ id: number; name: string }>
  organizations: Array<{ id: number; name: string }>
  users: Array<{ id: number; username: string }>
  loading?: boolean
  dataLoading?: boolean
  error?: string
  userRole?: 'user' | 'moderator' | 'admin'
}

export default function MediaUploadForm({
  onUpload,
  characters,
  arcs,
  events,
  gambles,
  organizations,
  users,
  loading = false,
  dataLoading = false,
  error,
  userRole = 'user'
}: MediaUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    type: 'image' as 'image' | 'video' | 'audio',
    description: '',
    ownerType: '' as 'character' | 'arc' | 'event' | 'gamble' | 'organization' | 'user' | '',
    ownerId: null as number | null,
    chapterNumber: null as number | null,
    purpose: 'gallery' as 'gallery' | 'entity_display',
    usageType: 'gallery_upload' as 'character_image' | 'guide_image' | 'gallery_upload',
  })
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const theme = useMantineTheme()

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return
    }

    // Validate file size (5MB limit - backend enforces this)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return
    }

    setSelectedFile(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleInputChange = (field: string, value: string | number | boolean | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return
    
    // Validate required fields
    if (!formData.ownerType || !formData.ownerId) {
      throw new Error('Please select an owner type and owner ID')
    }

    // Convert legacy organization to organization for backward compatibility
    let finalOwnerType = formData.ownerType
    if (finalOwnerType === 'organization' as any) {
      finalOwnerType = 'organization'
    }

    await onUpload(selectedFile, {
      type: formData.type,
      description: formData.description || undefined,
      ownerType: finalOwnerType,
      ownerId: formData.ownerId,
      chapterNumber: formData.chapterNumber || undefined,
      purpose: formData.purpose || 'gallery', // Default to gallery
      usageType: formData.usageType,
    })
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image size={20} />
      case 'video': return <Video size={20} />
      default: return <FileText size={20} />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const ownerSelectData = () => {
    if (dataLoading) {
      return [{ value: 'loading', label: 'Loading...', disabled: true }]
    }

    switch (formData.ownerType) {
      case 'character':
        return characters.map((character) => ({ value: String(character.id), label: character.name }))
      case 'arc':
        return arcs.map((arc) => ({ value: String(arc.id), label: arc.name }))
      case 'event':
        return events.map((event) => ({ value: String(event.id), label: event.title }))
      case 'gamble':
        return gambles.map((gamble) => ({ value: String(gamble.id), label: gamble.name }))
      case 'organization':
        return organizations.map((organization) => ({ value: String(organization.id), label: organization.name }))
      case 'user':
        return users.map((user) => ({ value: String(user.id), label: user.username }))
      default:
        return []
    }
  }

  return (
    <Box>
      {error && (
        <Alert
          variant="light"
          radius="md"
          mb="md"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            color: '#fca5a5'
          }}
        >
          <Text size="sm" c="#f87171">{error}</Text>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack gap="lg">
          <Stack gap="sm">
            <Title order={4}>File Upload</Title>

            <Box
              style={{
                border: `2px dashed ${dragActive ? '#a855f7' : 'rgba(168, 85, 247, 0.5)'}`,
                borderRadius: theme.radius.lg,
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                backgroundColor: dragActive ? 'rgba(168, 85, 247, 0.08)' : 'rgba(10, 10, 10, 0.6)',
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              hidden
              accept="image/jpeg,image/png,image/webp,image/gif"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
            
            <Upload size={48} color="#666" style={{ marginBottom: '16px' }} />
            
            {selectedFile ? (
              <Stack gap="xs" align="center">
                <Group gap="xs" align="center">
                  <Badge
                    radius="lg"
                    size="lg"
                    styles={{
                      root: {
                        backgroundColor: 'rgba(168, 85, 247, 0.15)',
                        color: '#a855f7',
                        border: '1px solid rgba(168, 85, 247, 0.3)'
                      }
                    }}
                  >
                    <Group gap={6} align="center">
                      {getFileIcon(formData.type)}
                      <span>{selectedFile.name} ({formatFileSize(selectedFile.size)})</span>
                    </Group>
                  </Badge>
                  <Button
                    variant="subtle"
                    color="gray"
                    size="xs"
                    leftSection={<X size={14} />}
                    onClick={(event) => {
                      event.stopPropagation()
                      setSelectedFile(null)
                    }}
                  >
                    Remove
                  </Button>
                </Group>
                <Text size="sm" c="dimmed">
                  Click to change file or drag and drop a new one
                </Text>
              </Stack>
            ) : (
              <Stack gap={4} align="center">
                <Title order={5}>
                  Drag and drop your file here
                </Title>
                <Text size="sm" c="dimmed">
                  or click to browse files
                </Text>
                <Text size="xs" c="dimmed">
                  Supported formats: JPEG, PNG, WebP, GIF • Max size: 5MB
                </Text>
              </Stack>
            )}
          </Box>
          </Stack>

          <Select
            label="Media Type"
            value={formData.type}
            onChange={(value) => value && handleInputChange('type', value)}
            data={[
              { value: 'image', label: 'Image' },
              { value: 'video', label: 'Video (Coming Soon)', disabled: true },
              { value: 'audio', label: 'Audio (Coming Soon)', disabled: true }
            ]}
            styles={{
              input: {
                backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                color: theme.colors.gray?.[0] ?? '#fff',
                borderColor: 'rgba(255,255,255,0.06)',
                '&:focus': {
                  borderColor: '#a855f7',
                  boxShadow: '0 0 0 2px rgba(168, 85, 247, 0.2)'
                }
              },
              dropdown: {
                backgroundColor: theme.colors.dark?.[7] ?? '#070707',
                borderColor: '#a855f7',
                border: '1px solid #a855f7'
              },
              option: {
                color: '#ffffff',
                backgroundColor: 'transparent',
                '&:hover': {
                  backgroundColor: '#a855f7',
                  color: '#000000'
                },
                '&[dataSelected="true"]': {
                  backgroundColor: '#9333ea',
                  color: '#ffffff'
                }
              },
              label: {
                color: '#a855f7',
                fontWeight: 600
              }
            }}
          />

          <Select
            label="Usage Type"
            description={
              formData.usageType === 'character_image'
                ? 'Character images require moderator or admin permissions'
                : 'Determines upload permissions and content category'
            }
            value={formData.usageType}
            onChange={(value) => value && handleInputChange('usageType', value)}
            data={[
              {
                value: 'gallery_upload',
                label: 'Gallery Upload',
                disabled: false
              },
              {
                value: 'guide_image',
                label: 'Guide Image',
                disabled: false
              },
              {
                value: 'character_image',
                label: 'Character Image (Moderator/Admin Only)',
                disabled: userRole !== 'moderator' && userRole !== 'admin'
              }
            ]}
            styles={{
              input: {
                backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                color: theme.colors.gray?.[0] ?? '#fff',
                borderColor: 'rgba(255,255,255,0.06)',
                '&:focus': {
                  borderColor: '#a855f7',
                  boxShadow: '0 0 0 2px rgba(168, 85, 247, 0.2)'
                }
              },
              dropdown: {
                backgroundColor: theme.colors.dark?.[7] ?? '#070707',
                borderColor: '#a855f7',
                border: '1px solid #a855f7'
              },
              option: {
                color: '#ffffff',
                backgroundColor: 'transparent',
                '&:hover': {
                  backgroundColor: '#a855f7',
                  color: '#000000'
                },
                '&[dataSelected="true"]': {
                  backgroundColor: '#9333ea',
                  color: '#ffffff'
                }
              },
              label: {
                color: '#a855f7',
                fontWeight: 600
              },
              description: {
                color: theme.colors.gray?.[6] ?? '#888'
              }
            }}
          />

          <Textarea
            label="Description"
            minRows={3}
            value={formData.description}
            onChange={(event) => handleInputChange('description', event.currentTarget.value)}
            placeholder="Describe this media, credit the artist if known, or provide context..."
            styles={{
              input: {
                backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                color: theme.colors.gray?.[0] ?? '#fff',
                borderColor: 'rgba(255,255,255,0.06)',
                '&:focus': {
                  borderColor: '#a855f7',
                  boxShadow: '0 0 0 2px rgba(168, 85, 247, 0.2)'
                }
              },
              label: {
                color: '#a855f7',
                fontWeight: 600
              }
            }}
          />

          <Select
            label="Related Entity"
            placeholder="Select entity type..."
            value={formData.ownerType}
            disabled={dataLoading}
            clearable
            searchable
            withAsterisk
            onChange={(value) => {
              handleInputChange('ownerType', (value as typeof formData.ownerType) || '')
              handleInputChange('ownerId', null)
            }}
            data={[
              { value: 'character', label: 'Character' },
              { value: 'arc', label: 'Arc' },
              { value: 'event', label: 'Event' },
              { value: 'gamble', label: 'Gamble' },
              { value: 'organization', label: 'Organization' }
            ]}
            nothingFoundMessage="No matches"
            styles={{
              input: {
                backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                color: theme.colors.gray?.[0] ?? '#fff',
                borderColor: 'rgba(255,255,255,0.06)',
                '&:focus': {
                  borderColor: '#a855f7',
                  boxShadow: '0 0 0 2px rgba(168, 85, 247, 0.2)'
                }
              },
              dropdown: {
                backgroundColor: theme.colors.dark?.[7] ?? '#070707',
                borderColor: '#a855f7',
                border: '1px solid #a855f7'
              },
              option: {
                color: '#ffffff',
                backgroundColor: 'transparent',
                '&:hover': {
                  backgroundColor: '#a855f7',
                  color: '#000000'
                },
                '&[dataSelected="true"]': {
                  backgroundColor: '#9333ea',
                  color: '#ffffff'
                }
              },
              label: {
                color: '#a855f7',
                fontWeight: 600
              }
            }}
          />

          {formData.ownerType && (
            <Select
              label="Specific Entity"
              placeholder={`Choose ${formData.ownerType}...`}
              disabled={dataLoading}
              value={formData.ownerId ? String(formData.ownerId) : null}
              onChange={(value) => handleInputChange('ownerId', value ? parseInt(value, 10) : null)}
              data={ownerSelectData()}
              searchable
              withAsterisk
              nothingFoundMessage={dataLoading ? 'Loading...' : 'No matches found'}
              styles={{
                input: {
                  backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                  color: theme.colors.gray?.[0] ?? '#fff',
                  borderColor: 'rgba(255,255,255,0.06)',
                  '&:focus': {
                    borderColor: '#a855f7',
                    boxShadow: '0 0 0 2px rgba(168, 85, 247, 0.2)'
                  }
                },
                dropdown: {
                  backgroundColor: theme.colors.dark?.[7] ?? '#070707',
                  borderColor: '#a855f7',
                  border: '1px solid #a855f7'
                },
                option: {
                  color: '#ffffff',
                  backgroundColor: 'transparent',
                  '&:hover': {
                    backgroundColor: '#a855f7',
                    color: '#000000'
                  },
                  '&[dataSelected="true"]': {
                    backgroundColor: '#9333ea',
                    color: '#ffffff'
                  }
                },
                label: {
                  color: '#a855f7',
                  fontWeight: 600
                }
              }}
            />
          )}

          {formData.ownerType && formData.ownerId && (
            <NumberInput
              label="Chapter Number (Optional)"
              value={formData.chapterNumber ?? undefined}
              onChange={(value) => handleInputChange('chapterNumber', typeof value === 'number' ? value : null)}
              placeholder="e.g. 45"
              min={1}
              description="Associate with a specific chapter if relevant"
              hideControls
              styles={{
                input: {
                  backgroundColor: theme.colors.dark?.[5] ?? '#0b0b0b',
                  color: theme.colors.gray?.[0] ?? '#fff',
                  borderColor: 'rgba(255,255,255,0.06)',
                  '&:focus': {
                    borderColor: '#a855f7',
                    boxShadow: '0 0 0 2px rgba(168, 85, 247, 0.2)'
                  }
                },
                label: {
                  color: '#a855f7',
                  fontWeight: 600
                }
              }}
            />
          )}

          <Button
            type="submit"
            size="lg"
            fullWidth
            disabled={!selectedFile || loading || !formData.ownerType || !formData.ownerId}
            leftSection={!loading ? <Upload size={18} /> : undefined}
            loading={loading}
            styles={{
              root: {
                backgroundColor: '#a855f7',
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: '#9333ea'
                },
                '&:disabled': {
                  backgroundColor: 'rgba(168, 85, 247, 0.3)',
                  color: 'rgba(255, 255, 255, 0.5)'
                }
              }
            }}
          >
            {loading ? 'Uploading...' : 'Upload Media'}
          </Button>
        </Stack>
      </form>
    </Box>
  )
}
