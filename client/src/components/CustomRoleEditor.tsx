'use client'

import React, { useState } from 'react'
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Tooltip,
  useMantineTheme
} from '@mantine/core'
import { getEntityThemeColor, semanticColors, textColors } from '../lib/mantine-theme'
import { Edit, Save, X, Star } from 'lucide-react'
import { api } from '../lib/api'

interface CustomRoleEditorProps {
  currentRole: string | null;
  isActiveSupporterUser: boolean;
  onUpdate: (newRole: string | null) => void;
}

export default function CustomRoleEditor({
  currentRole,
  isActiveSupporterUser,
  onUpdate
}: CustomRoleEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedRole, setEditedRole] = useState(currentRole || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const theme = useMantineTheme()

  const handleSave = async () => {
    if (editedRole.trim().length > 50) {
      setError('Custom role must be 50 characters or less')
      return
    }

    setLoading(true)
    setError('')

    try {
      const roleToSave = editedRole.trim() || null
      
      if (roleToSave) {
        await api.updateCustomRole(roleToSave)
      } else {
        await api.removeCustomRole()
      }

      onUpdate(roleToSave)
      setIsEditing(false)
    } catch (err: any) {
      setError(err.message || 'Failed to update custom role')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditedRole(currentRole || '')
    setIsEditing(false)
    setError('')
  }

  const handleRemove = async () => {
    setLoading(true)
    setError('')

    try {
      await api.removeCustomRole()
      onUpdate(null)
      setConfirmDialogOpen(false)
    } catch (err: any) {
      setError(err.message || 'Failed to remove custom role')
    } finally {
      setLoading(false)
    }
  }

  if (!isActiveSupporterUser) {
    return (
      <Box style={{ marginBottom: theme.spacing.md }}>
        <Alert style={{ color: getEntityThemeColor(theme, 'character') }} radius="md">
          <Text size="sm">
            Custom cosmetic roles are available for Active Supporter badge holders. Support the project to unlock this feature!
          </Text>
        </Alert>
      </Box>
    )
  }

  return (
    <Box style={{ marginBottom: theme.spacing.md }}>
      <Group align="center" gap="xs" mb="xs">
        <Star size={18} color="#9c27b0" />
        <Text size="sm" c="red" fw={700}>
          Custom Cosmetic Role
        </Text>
      </Group>

      {!isEditing ? (
        <Group align="center" gap="xs" wrap="wrap">
          {currentRole ? (
            <Box
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(124, 58, 237, 0.12)',
                color: '#c084fc',
                paddingInline: '0.75rem',
                paddingBlock: '0.4rem',
                borderRadius: theme.radius.xl,
                border: '1px solid rgba(192, 132, 252, 0.5)',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            >
              <Star size={14} />
              {currentRole}
            </Box>
          ) : (
            <Text size="sm" c="dimmed" style={{ fontStyle: 'italic' }}>
              No custom role set
            </Text>
          )}
          
          <Tooltip label="Edit custom role" openDelay={200}>
            <ActionIcon size="sm" variant="light" color="grape" onClick={() => setIsEditing(true)}>
              <Edit size={16} />
            </ActionIcon>
          </Tooltip>

          {currentRole && (
            <Tooltip label="Remove custom role" openDelay={200}>
              <ActionIcon
                size="sm"
                variant="light"
                style={{ color: getEntityThemeColor(theme, 'gamble') }}
                onClick={() => setConfirmDialogOpen(true)}
              >
                <X size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      ) : (
        <Stack gap="sm">
          <TextInput
            value={editedRole}
            onChange={(event) => setEditedRole(event.currentTarget.value)}
            placeholder="Enter your custom cosmetic role..."
            size="md"
            maxLength={50}
            description={`${editedRole.length}/50 characters`}
          />
          
          <Group gap="sm">
            <Button
              onClick={handleSave}
              disabled={loading}
              leftSection={<Save size={16} />}
              style={{ color: getEntityThemeColor(theme, 'media') }}
            >
              Save
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              color="gray"
            >
              Cancel
            </Button>
          </Group>
        </Stack>
      )}

      {error && (
        <Alert style={{ color: getEntityThemeColor(theme, 'gamble') }} radius="md" mt="sm">
          <Text size="sm">{error}</Text>
        </Alert>
      )}

      <Modal
        opened={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        title={<Text fw={600}>Remove Custom Role</Text>}
        centered
        radius="md"
      >
        <Text size="sm" mb="md">
          Are you sure you want to remove your custom cosmetic role? This action cannot be undone.
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="subtle" color="gray" onClick={() => setConfirmDialogOpen(false)}>
            Cancel
          </Button>
          <Button style={{ color: getEntityThemeColor(theme, 'gamble') }} onClick={handleRemove} disabled={loading}>
            Remove
          </Button>
        </Group>
      </Modal>
    </Box>
  )
}
