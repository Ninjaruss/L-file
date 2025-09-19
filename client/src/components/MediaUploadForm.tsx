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
  error 
}: MediaUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    type: 'image' as 'image' | 'video' | 'audio',
    description: '',
    ownerType: '' as 'character' | 'arc' | 'event' | 'gamble' | 'organization' | 'user' | '',
    ownerId: null as number | null,
    chapterNumber: null as number | null,
    purpose: 'gallery' as 'gallery' | 'entity_display',
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

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024
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
        <Alert color="red" radius="md" mb="md">
          <Text size="sm">{error}</Text>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack gap="lg">
          <Stack gap="sm">
            <Title order={4}>File Upload</Title>

            <Box
              style={{
                border: `2px dashed ${theme.colors.red?.[6] ?? '#e11d48'}`,
                borderRadius: theme.radius.lg,
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                backgroundColor: dragActive ? 'rgba(225, 29, 72, 0.08)' : 'rgba(10, 10, 10, 0.6)',
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
                  <Badge radius="lg" color="red" size="lg">
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
                  Supported formats: JPEG, PNG, WebP, GIF • Max size: 10MB
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
          />

          <Textarea
            label="Description"
            minRows={3}
            value={formData.description}
            onChange={(event) => handleInputChange('description', event.currentTarget.value)}
            placeholder="Describe this media, credit the artist if known, or provide context..."
          />

          <Select
            label="Related Entity (Optional)"
            placeholder="Select entity type"
            value={formData.ownerType}
            disabled={dataLoading}
            clearable
            onChange={(value) => {
              handleInputChange('ownerType', (value as typeof formData.ownerType) || '')
              handleInputChange('ownerId', null)
            }}
            data={[
              { value: 'character', label: 'Character' },
              { value: 'arc', label: 'Arc' },
              { value: 'event', label: 'Event' },
              { value: 'gamble', label: 'Gamble' },
              { value: 'organization', label: 'Organization' },
              { value: 'user', label: 'User' }
            ]}
          />

          {formData.ownerType && (
            <Select
              label="Specific Entity"
              placeholder={`Choose ${formData.ownerType}...`}
              disabled={dataLoading}
              value={formData.ownerId ? String(formData.ownerId) : null}
              onChange={(value) => handleInputChange('ownerId', value ? parseInt(value, 10) : null)}
              data={ownerSelectData()}
            />
          )}

          {formData.ownerType && formData.ownerId && (
            <NumberInput
              label="Chapter Number (Optional)"
              value={formData.chapterNumber ?? undefined}
              onChange={(value) => handleInputChange('chapterNumber', typeof value === 'number' ? value : null)}
              placeholder="e.g. 45"
              min={1}
            />
          )}

          <Button
            type="submit"
            size="lg"
            fullWidth
            disabled={!selectedFile || loading}
            leftSection={<Upload size={18} />}
            loading={loading}
          >
            {loading ? 'Uploading...' : 'Upload Media'}
          </Button>
        </Stack>
      </form>
    </Box>
  )
}
