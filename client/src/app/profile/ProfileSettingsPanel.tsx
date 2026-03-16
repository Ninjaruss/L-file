'use client'

import React, { useState } from 'react'
import {
  Box, Text, Group, Stack, Button, TextInput, PasswordInput, Divider, Alert, useMantineTheme,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { getEntityThemeColor } from '../../lib/mantine-theme'
import { api } from '../../lib/api'


interface SettingsPanelUser {
  id?: number
  email?: string | null
  fluxerId?: string | null
  fluxerUsername?: string | null
  customRole?: string | null
  role?: string
}

interface ProfileSettingsPanelProps {
  user: SettingsPanelUser
  hasActiveSupporterBadge: boolean
  customRole: string
  initialCustomRole: string
  savingCustomRole: boolean
  onCustomRoleChange: (role: string) => void
  onSaveCustomRole: () => Promise<void>
  onLinkFluxer: () => void
  onUnlinkFluxer: () => Promise<void>
  onRefreshUser: () => Promise<void>
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <Box style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '4px', padding: '16px' }}>
      {children}
    </Box>
  )
}

export default function ProfileSettingsPanel({
  user,
  hasActiveSupporterBadge,
  customRole,
  initialCustomRole,
  savingCustomRole,
  onCustomRoleChange,
  onSaveCustomRole,
  onLinkFluxer,
  onUnlinkFluxer,
  onRefreshUser,
}: ProfileSettingsPanelProps) {
  const theme = useMantineTheme()
  const [unlinkingFluxer, setUnlinkingFluxer] = useState(false)
  const [changeEmailForm, setChangeEmailForm] = useState({ newEmail: '', currentPassword: '' })
  const [changingEmail, setChangingEmail] = useState(false)
  const [changePasswordForm, setChangePasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [changingPassword, setChangingPassword] = useState(false)

  const handleUnlinkFluxer = async () => {
    setUnlinkingFluxer(true)
    try {
      await onUnlinkFluxer()
      notifications.show({ title: 'Account Unlinked', message: 'Fluxer account has been unlinked', color: 'green' })
    } catch (err: any) {
      notifications.show({ title: 'Unlink Failed', message: err?.message || 'Failed to unlink', color: 'red' })
    } finally {
      setUnlinkingFluxer(false)
    }
  }

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!changeEmailForm.newEmail) return
    setChangingEmail(true)
    try {
      await api.changeEmail(changeEmailForm.newEmail, changeEmailForm.currentPassword || undefined)
      setChangeEmailForm({ newEmail: '', currentPassword: '' })
      await onRefreshUser()
      notifications.show({ title: 'Email updated', message: 'A verification link has been sent to your new email.', color: 'green' })
    } catch (err: any) {
      notifications.show({ title: 'Failed to update email', message: err?.message || 'Check your password and try again.', color: 'red' })
    } finally {
      setChangingEmail(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const { currentPassword, newPassword, confirmPassword } = changePasswordForm
    if (newPassword !== confirmPassword) {
      notifications.show({ title: 'Passwords do not match', message: 'New password and confirmation must be identical.', color: 'red' })
      return
    }
    const pwRules = [
      { ok: newPassword.length >= 8,   msg: 'Password must be at least 8 characters.' },
      { ok: newPassword.length <= 128,  msg: 'Password must not exceed 128 characters.' },
      { ok: /[A-Z]/.test(newPassword),  msg: 'Password must contain at least one uppercase letter.' },
      { ok: /[a-z]/.test(newPassword),  msg: 'Password must contain at least one lowercase letter.' },
      { ok: /\d/.test(newPassword),     msg: 'Password must contain at least one number.' },
    ]
    const failed = pwRules.find(r => !r.ok)
    if (failed) {
      notifications.show({ title: 'Invalid password', message: failed.msg, color: 'red' })
      return
    }
    setChangingPassword(true)
    try {
      await api.changePassword(newPassword, currentPassword || undefined)
      setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      notifications.show({ title: 'Password updated', message: 'Your password has been changed successfully.', color: 'green' })
    } catch (err: any) {
      notifications.show({ title: 'Failed to update password', message: err?.message || 'Check your current password.', color: 'red' })
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <Stack gap="lg">
      {/* Linked Accounts */}
      <SectionCard>
        <Text fw={600} size="sm" mb={4}>Linked Accounts</Text>
        <Text size="xs" c="dimmed" mb="md">Manage connected accounts.</Text>
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <Box style={{ width: 32, height: 32, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Text size="xs" fw={700} c="white">Fx</Text>
            </Box>
            <Stack gap={2}>
              <Text size="sm" fw={500}>Fluxer</Text>
              <Text size="xs" c="dimmed">
                {user?.fluxerId ? `@${user.fluxerUsername || user.fluxerId}` : 'Not linked'}
              </Text>
            </Stack>
          </Group>
          {user?.fluxerId ? (
            <Button size="xs" variant="light" color="red" onClick={handleUnlinkFluxer} loading={unlinkingFluxer}>
              Unlink
            </Button>
          ) : (
            <Button size="xs" variant="light" color="violet" onClick={onLinkFluxer}>
              Link Fluxer
            </Button>
          )}
        </Group>
      </SectionCard>

      {/* Custom Role */}
      <SectionCard>
        <Text fw={600} size="sm" mb="md">Custom Role</Text>
        {!hasActiveSupporterBadge ? (
          <Alert style={{ color: getEntityThemeColor(theme, 'character') }} variant="light">
            <Stack gap="xs">
              <Text size="sm" fw={500}>Custom roles are exclusive to active supporters!</Text>
              <Text size="sm">Support us on Ko-fi to unlock this feature.</Text>
              <Button component="a" href="https://ko-fi.com/ninjaruss" target="_blank" rel="noopener noreferrer" size="sm">
                ☕ Support on Ko-fi
              </Button>
            </Stack>
          </Alert>
        ) : (
          <Stack gap="xs">
            <Text size="sm" c="dimmed">Customize how your role appears to other users</Text>
            <TextInput
              placeholder="e.g., 'Gambling Expert'"
              value={customRole}
              onChange={(e) => onCustomRoleChange(e.target.value)}
              maxLength={50}
            />
            <Group gap="xs">
              <Button
                onClick={onSaveCustomRole}
                loading={savingCustomRole}
                disabled={savingCustomRole || customRole === initialCustomRole}
                size="sm"
                variant="filled"
                style={{ backgroundColor: getEntityThemeColor(theme, 'character') }}
              >
                Save Custom Role
              </Button>
              {customRole !== initialCustomRole && (
                <Button onClick={() => onCustomRoleChange(initialCustomRole)} size="sm" variant="subtle" color="gray">
                  Cancel
                </Button>
              )}
            </Group>
          </Stack>
        )}
      </SectionCard>

      {/* Account Security */}
      <SectionCard>
        <Text fw={600} size="sm" mb="md">Account Security</Text>

        {/* Change Email */}
        <Stack gap="xs" mb="lg">
          <Text fw={500} size="sm">Change Email</Text>
          <Text size="xs" c="dimmed">
            {user?.email ? <>Current: <strong>{user.email}</strong></> : 'No email address set.'}
          </Text>
          <form onSubmit={handleChangeEmail}>
            <Stack gap="xs">
              <TextInput label="New Email Address" type="email" placeholder="you@example.com" value={changeEmailForm.newEmail} onChange={(e) => setChangeEmailForm(p => ({ ...p, newEmail: e.currentTarget.value }))} required disabled={changingEmail} />
              {user?.email && (
                <PasswordInput label="Current Password" placeholder="Confirm with your current password" value={changeEmailForm.currentPassword} onChange={(e) => setChangeEmailForm(p => ({ ...p, currentPassword: e.currentTarget.value }))} required disabled={changingEmail} />
              )}
              <Button type="submit" size="sm" loading={changingEmail} disabled={changingEmail || !changeEmailForm.newEmail || (!!user?.email && !changeEmailForm.currentPassword)} style={{ alignSelf: 'flex-start' }}>
                Update Email
              </Button>
            </Stack>
          </form>
        </Stack>

        <Divider mb="lg" />

        {/* Change Password */}
        <Stack gap="xs">
          <Text fw={500} size="sm">{user?.email ? 'Change Password' : 'Set a Password'}</Text>
          {!user?.email && <Text size="xs" c="dimmed">Add a password to log in with email as well as Fluxer.</Text>}
          <form onSubmit={handleChangePassword}>
            <Stack gap="xs">
              {user?.email && (
                <PasswordInput label="Current Password" placeholder="Your current password" value={changePasswordForm.currentPassword} onChange={(e) => setChangePasswordForm(p => ({ ...p, currentPassword: e.currentTarget.value }))} required disabled={changingPassword} />
              )}
              <PasswordInput label="New Password" placeholder="At least 8 characters, uppercase, lowercase, number" value={changePasswordForm.newPassword} onChange={(e) => setChangePasswordForm(p => ({ ...p, newPassword: e.currentTarget.value }))} required disabled={changingPassword} description="8–128 chars · uppercase · lowercase · number" />
              <PasswordInput
                label="Confirm New Password"
                placeholder="Repeat your new password"
                value={changePasswordForm.confirmPassword}
                onChange={(e) => setChangePasswordForm(p => ({ ...p, confirmPassword: e.currentTarget.value }))}
                required
                disabled={changingPassword}
                error={changePasswordForm.confirmPassword && changePasswordForm.newPassword !== changePasswordForm.confirmPassword ? 'Passwords do not match' : undefined}
              />
              <Button type="submit" size="sm" loading={changingPassword} disabled={changingPassword || !changePasswordForm.newPassword || !changePasswordForm.confirmPassword || (!!user?.email && !changePasswordForm.currentPassword)} style={{ alignSelf: 'flex-start' }}>
                {user?.email ? 'Change Password' : 'Set Password'}
              </Button>
            </Stack>
          </form>
        </Stack>
      </SectionCard>
    </Stack>
  )
}
